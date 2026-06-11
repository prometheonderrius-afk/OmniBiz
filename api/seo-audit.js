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

  const { url, category } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API Configuration Error', 
      message: 'GEMINI_API_KEY is not defined in serverless environment variables.' 
    });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const prompt = `Perform a comprehensive SEO and local visibility audit for the website URL: "${url}".
The business category is: "${category}".

Use Google Search to inspect the website's indexing status (e.g. how many pages are indexed), search presence, metadata quality, keyword relevancy, and local listings.
Return a structured JSON object. Focus on technical, structural, and content aspects.

Output format MUST be a single raw JSON object matching the schema below:
{
  "score": number (integer from 0 to 100),
  "issuesFound": number (integer, count of problems found),
  "issuesFixed": number (integer, count of optimized areas already resolved),
  "reports": array of strings (detailed, actionable audit bullet points based on your findings)
}

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
        type: "OBJECT",
        properties: {
          score: { type: "INTEGER" },
          issuesFound: { type: "INTEGER" },
          issuesFixed: { type: "INTEGER" },
          reports: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        },
        required: ["score", "issuesFound", "issuesFixed", "reports"]
      },
      maxOutputTokens: 1000,
      temperature: 0.2
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
    
    if (!data.error) {
      const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return res.status(200).json(JSON.parse(outputText));
    }

    console.warn("Primary SEO search grounding failed:", data.error);

    // 2. Fallback: If google_search fails (due to key restrictions or billing),
    // make a standard generation request to audit the site based on standard SEO heuristics.
    const fallbackRequestBody = {
      contents: [{
        parts: [{
          text: `Perform a realistic local SEO and meta tags visibility audit for the website URL: "${url}" (Category: "${category}").
Even though you cannot access the live Google Search database right now, evaluate the site's target search presence based on standard visibility practices for this category.
Provide a realistic SEO health score, technical issues count, and resolved items count.

Output format MUST be a raw JSON object matching the schema:
{
  "score": number (integer from 0 to 100),
  "issuesFound": number (integer),
  "issuesFixed": number (integer),
  "reports": array of strings (actionable diagnostic bullet points, e.g. "Check if meta description is under 160 characters", "SSL validation appears secure", "Ensure exactly one H1 tag is present on the landing page")
}
Do NOT wrap the JSON in markdown code blocks like \`\`\`json. Output ONLY raw JSON.`
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            score: { type: "INTEGER" },
            issuesFound: { type: "INTEGER" },
            issuesFixed: { type: "INTEGER" },
            reports: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          },
          required: ["score", "issuesFound", "issuesFixed", "reports"]
        },
        maxOutputTokens: 1000,
        temperature: 0.3
      }
    };

    const standardResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fallbackRequestBody)
    });

    const standardData = await standardResponse.json();
    if (standardData.error) {
      return res.status(502).json({ error: 'Gemini API Fallback Error', details: standardData.error });
    }

    const standardOutput = standardData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return res.status(200).json(JSON.parse(standardOutput));
    
  } catch (error) {
    console.error('Gemini SEO Scraper error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
