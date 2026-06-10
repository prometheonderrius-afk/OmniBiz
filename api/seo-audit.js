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

  try {
    // Call Gemini 2.5 Flash REST API with Google Search grounding
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

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
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
      })
    });

    const data = await response.json();
    
    if (data.error) {
      // Fallback: If google_search tool is rejected for any reason on this model, try with google_search_retrieval
      if (data.error.message && data.error.message.includes('google_search')) {
        const fallbackResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            tools: [
              {
                google_search_retrieval: {
                  dynamic_retrieval_config: {
                    mode: "MODE_DYNAMIC",
                    dynamic_threshold: 0.3
                  }
                }
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
          })
        });
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.error) {
          return res.status(502).json({ error: 'Gemini API Fallback Error', details: fallbackData.error });
        }
        const fallbackOutput = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        return res.status(200).json(JSON.parse(fallbackOutput));
      }
      return res.status(502).json({ error: 'Gemini API Error', details: data.error });
    }

    const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return res.status(200).json(JSON.parse(outputText));
    
  } catch (error) {
    console.error('Gemini SEO Scraper error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
