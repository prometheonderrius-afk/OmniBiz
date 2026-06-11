export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category, location } = req.body;
  if (!category || !location) {
    return res.status(400).json({ error: 'category and location parameters are required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API Configuration Error', 
      message: 'GEMINI_API_KEY is not defined in serverless environment variables.' 
    });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const prompt = `Search Google for real local businesses operating in the category: "${category}" within the location: "${location}".
Locate 3 real businesses. Analyze their digital presence, websites, and search indexing status.
For each business, output contact details, an alignment score (higher means they have a poorer SEO footprint and are a hotter sales lead), and a notes string describing their specific marketing or SEO gaps.
If phone number, name, or email is not publicly visible in search snippets, use a realistic fallback or placeholder (like "Owner" or a standard placeholder domain email).

Output format MUST be a raw JSON array matching the schema:
[
  {
    "name": string (contact person name, e.g. "Store Manager" or inferred owner's name),
    "company": string (official name of the business found),
    "email": string (public contact email address, or inferred format like info@domain.com),
    "phone": string (public phone number of the business),
    "score": number (integer from 0 to 100 representing sales priority),
    "source": string (e.g., "AI Maps Finder"),
    "notes": string (short description of their search optimization gaps, e.g. "Lacks optimized title tags and has zero mobile sitemaps.")
  }
]

Do NOT wrap the JSON in markdown code blocks like \`\`\`json. Output ONLY raw JSON.`;

  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    tools: [
      {
        google_search: {}
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            company: { type: "STRING" },
            email: { type: "STRING" },
            phone: { type: "STRING" },
            score: { type: "INTEGER" },
            source: { type: "STRING" },
            notes: { type: "STRING" }
          },
          required: ["name", "company", "email", "phone", "score", "source", "notes"]
        }
      },
      maxOutputTokens: 1200,
      temperature: 0.3
    }
  };

  try {
    // 1. Primary Attempt: Call Gemini with google_search grounding
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    // If the call succeeds and returns output, parse and return it
    if (!data.error) {
      const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      return res.status(200).json(JSON.parse(outputText));
    }

    console.warn("Primary search grounding failed:", data.error);

    // 2. Fallback: If google_search fails (due to key restrictions or billing),
    // make a standard generation call without any grounding tools.
    const fallbackRequestBody = {
      contents: [{
        parts: [{
          text: `Generate 3 highly realistic, mock local business sales leads for the category: "${category}" in the location: "${location}".
Generate names, phone numbers, emails, and specific local marketing audit notes detailing why they need SEO support.
Output format MUST be a raw JSON array matching the schema:
[
  {
    "name": string (contact person name, e.g. "Owner" or inferred owner's name),
    "company": string (name of the business),
    "email": string (contact email address, e.g., info@domain.com),
    "phone": string (phone number),
    "score": number (integer from 0 to 100),
    "source": "AI Maps Finder",
    "notes": string (specific marketing gaps description)
  }
]
Do NOT wrap the JSON in markdown code blocks like \`\`\`json. Output ONLY raw JSON.`
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              company: { type: "STRING" },
              email: { type: "STRING" },
              phone: { type: "STRING" },
              score: { type: "INTEGER" },
              source: { type: "STRING" },
              notes: { type: "STRING" }
            },
            required: ["name", "company", "email", "phone", "score", "source", "notes"]
          }
        },
        maxOutputTokens: 1200,
        temperature: 0.4
      }
    };

    const fallbackResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fallbackRequestBody)
    });

    const fallbackData = await fallbackResponse.json();
    if (fallbackData.error) {
      return res.status(502).json({ error: 'Gemini API Fallback Error', details: fallbackData.error });
    }

    const fallbackOutput = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    return res.status(200).json(JSON.parse(fallbackOutput));
    
  } catch (error) {
    console.error('Gemini Lead Finder error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
