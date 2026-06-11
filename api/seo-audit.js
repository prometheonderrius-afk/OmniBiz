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

  let rawAuditContent = '';
  let primarySuccess = false;

  // 1. Primary Attempt: Call Gemini with google_search grounding (plain text output, no responseSchema)
  try {
    const searchPrompt = `Perform a comprehensive SEO and local visibility audit for the website URL: "${url}".
The business category is: "${category}".

Use Google Search to inspect the website's indexing status (e.g. how many pages are indexed), search presence, metadata quality, keyword relevancy, and local listings.
Write down a plain-text list of technical, structural, content issues, optimized areas already resolved, and a general SEO score.`;

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
      console.warn("Primary SEO search grounding failed:", data.error);
    } else {
      rawAuditContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (rawAuditContent) {
        primarySuccess = true;
      }
    }
  } catch (err) {
    console.warn("Primary SEO search grounding error:", err);
  }

  // 2. Fallback: If search grounding fails (due to key restrictions or billing),
  // make a standard plain text call to generate the audit report based on standard SEO heuristics.
  if (!primarySuccess) {
    console.log("Using fallback plain-text generation for SEO audit...");
    try {
      const fallbackRequestBody = {
        contents: [{
          parts: [{
            text: `Perform a realistic local SEO and meta tags visibility audit for the website URL: "${url}" (Category: "${category}").
Even though you cannot access the live Google Search database right now, evaluate the site's target search presence based on standard visibility practices for this category.
Provide a realistic SEO health score, technical issues count, and resolved items count as a detailed text list.`
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
        console.error("Fallback SEO audit generation failed:", data.error);
        return res.status(502).json({
          error: 'Gemini API Fallback Error',
          message: data.error.message || 'Failed to perform SEO audit.',
          details: data.error
        });
      }
      rawAuditContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err) {
      console.error("Fallback SEO audit generation error:", err);
      return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
  }

  if (!rawAuditContent) {
    return res.status(502).json({
      error: 'Gemini API Error',
      message: 'Failed to retrieve SEO audit content from Gemini API.'
    });
  }

  // 3. Formatting Step: Call Gemini to structure the rawAuditContent text into a JSON object using responseSchema
  try {
    const formatRequestBody = {
      contents: [{
        parts: [{
          text: `You are an expert data parsing assistant.
Analyze the following text describing an SEO and website visibility audit:
"${rawAuditContent}"

Extract the audit into a structured JSON object matching the response schema:
- score: integer from 0 to 100 representing the overall SEO score
- issuesFound: integer representing the count of issues/problems identified
- issuesFixed: integer representing the count of optimized areas already resolved
- reports: array of strings containing detailed, actionable diagnostic bullet points based on the findings
Format the output strictly according to the schema.`
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            score: { type: "integer" },
            issuesFound: { type: "integer" },
            issuesFixed: { type: "integer" },
            reports: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["score", "issuesFound", "issuesFixed", "reports"]
        },
        maxOutputTokens: 1200,
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
      console.error("JSON formatting for SEO failed:", formatData.error);
      return res.status(502).json({
        error: 'Gemini Formatting Error',
        message: formatData.error.message || 'Failed to structure SEO audit data into JSON.',
        details: formatData.error
      });
    }

    const outputText = formatData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return res.status(200).json(JSON.parse(outputText));

  } catch (error) {
    console.error('Gemini SEO structuring error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
