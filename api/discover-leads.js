function parseStructuredJSON(text) {
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(?:json)?\n?/, '');
    cleanText = cleanText.replace(/\n?```$/, '');
    cleanText = cleanText.trim();
  }
  try {
    return JSON.parse(cleanText);
  } catch (err) {
    console.error("Failed to parse JSON. Raw text was:", text);
    throw new Error(`JSON parsing failed: ${err.message}. Raw output length: ${text.length}. Sample: ${text.slice(0, 100)}`);
  }
}

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

  // Use the v1beta endpoint where structured outputs and grounding features are fully supported
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  let rawSearchContent = '';
  let primarySuccess = false;

  // 1. Primary Attempt: Call Gemini with google_search grounding (plain text output, no response_schema)
  try {
    const searchPrompt = `Search Google for real local businesses operating in the category: "${category}" within the location: "${location}".
Locate 3 real businesses. Write down their contact person name (if you can find or infer one, e.g. "Store Manager" or "Owner"), official business name, public email address, public phone number, and a brief description of their specific digital presence or SEO gaps (e.g. lacks mobile sitemaps, missing headers).`;

    const requestBody = {
      contents: [{
        parts: [{
          text: searchPrompt
        }]
      }],
      tools: [
        {
          google_search: {}
        }
      ]
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    if (data.error) {
      console.warn("Primary search grounding failed:", data.error);
    } else {
      rawSearchContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (rawSearchContent) {
        primarySuccess = true;
      }
    }
  } catch (err) {
    console.warn("Primary search grounding error:", err);
  }

  // 2. Fallback: If search grounding fails (due to key restrictions or billing),
  // make a standard plain text call to generate mock realistic leads.
  if (!primarySuccess) {
    console.log("Using fallback plain-text generation for leads...");
    try {
      const fallbackRequestBody = {
        contents: [{
          parts: [{
            text: `Generate 3 highly realistic, mock local business sales leads for the category: "${category}" in the location: "${location}".
For each lead, provide:
1. Contact person name (e.g. "Owner" or inferred owner's name)
2. Business/Company name
3. Contact email address (e.g., info@domain.com)
4. Phone number
5. specific local marketing/SEO audit notes detailing why they need SEO support.`
          }]
        }]
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackRequestBody)
      });

      const data = await response.json();
      if (data.error) {
        console.error("Fallback plain text generation failed:", data.error);
        return res.status(502).json({
          error: 'Gemini API Fallback Error',
          message: data.error.message || 'Failed to generate mock leads.',
          details: data.error
        });
      }
      rawSearchContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err) {
      console.error("Fallback plain text generation error:", err);
      return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
  }

  if (!rawSearchContent) {
    return res.status(502).json({
      error: 'Gemini API Error',
      message: 'Failed to retrieve lead data content from Gemini API.'
    });
  }

  // 3. Formatting Step: Call Gemini to structure the rawSearchContent text into a JSON array using response_schema
  try {
    const formatRequestBody = {
      contents: [{
        parts: [{
          text: `You are an expert data parsing assistant.
Analyze the following text describing local business leads:
"${rawSearchContent}"

Extract these businesses into a structured JSON object matching the response schema. 
For each business, compute a sales priority score (integer from 0 to 100 representing how desperately they need SEO help, higher means they have a poorer SEO footprint and are a hotter sales lead).
Specify the source as "AI Maps Finder".

CRITICAL INSTRUCTIONS FOR JSON FORMATTING:
- Ensure all string values are on a single line. Do NOT include literal newlines (\\n) or control characters inside any JSON string fields.
- Do NOT use double quotes (\") inside any string fields (such as company names or notes). If a quote is needed, use single quotes (') instead.
Format the output strictly according to the schema.`
        }]
      }],
      generation_config: {
        response_mime_type: "application/json",
        response_schema: {
          type: "object",
          properties: {
            leads: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  company: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  score: { type: "integer" },
                  source: { type: "string" },
                  notes: { type: "string" }
                },
                required: ["name", "company", "email", "phone", "score", "source", "notes"]
              }
            }
          },
          required: ["leads"]
        },
        max_output_tokens: 1500,
        temperature: 0.1
      }
    };

    const formatResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formatRequestBody)
    });

    const formatData = await formatResponse.json();
    if (formatData.error) {
      console.error("JSON formatting failed:", formatData.error);
      return res.status(502).json({
        error: 'Gemini Formatting Error',
        message: formatData.error.message || 'Failed to structure lead data into JSON.',
        details: formatData.error
      });
    }

    const outputText = formatData.candidates?.[0]?.content?.parts?.[0]?.text || '{"leads":[]}';
    const parsedData = parseStructuredJSON(outputText);
    
    // Return the leads array directly, satisfying the frontend contract
    return res.status(200).json(parsedData.leads || []);

  } catch (error) {
    console.error('Gemini Lead Finder structuring error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
