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
    throw new Error(`JSON parsing failed: ${err.message}`);
  }
}

function parseDelimitedAudit(text) {
  const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
  const issuesFoundMatch = text.match(/ISSUES_FOUND:\s*(\d+)/i);
  const issuesFixedMatch = text.match(/ISSUES_FIXED:\s*(\d+)/i);
  
  const reports = [];
  const lines = text.split('\n');
  let readingReports = false;
  
  for (const line of lines) {
    if (line.toUpperCase().includes('REPORT_START')) {
      readingReports = true;
      continue;
    }
    if (line.toUpperCase().includes('REPORT_END')) {
      readingReports = false;
      continue;
    }
    if (readingReports && line.trim()) {
      // Remove leading dash, bullet, or numbers if any
      const cleaned = line.replace(/^\s*[-*•\d+.]\s*/, '').trim();
      if (cleaned) {
        reports.push(cleaned);
      }
    }
  }
  
  return {
    score: scoreMatch ? parseInt(scoreMatch[1], 10) || 70 : 70,
    issuesFound: issuesFoundMatch ? parseInt(issuesFoundMatch[1], 10) || 0 : 0,
    issuesFixed: issuesFixedMatch ? parseInt(issuesFixedMatch[1], 10) || 0 : 0,
    reports: reports.length > 0 ? reports : ["Check website metadata and search indexation status."]
  };
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

  // Use the v1beta endpoint where structured outputs and grounding features are fully supported
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.4
      }
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
        }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.4
        }
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

  // 3. Formatting Step: Try JSON Mode (without responseSchema to avoid truncation bugs)
  let parsedAudit = null;
  try {
    const formatRequestBody = {
      contents: [{
        parts: [{
          text: `You are an expert data parsing assistant.
Analyze the following text describing an SEO and website visibility audit:
"${rawAuditContent}"

Extract the audit into a structured JSON object matching this schema:
- score: integer from 0 to 100 representing the overall SEO score
- issuesFound: integer representing the count of issues/problems identified
- issuesFixed: integer representing the count of optimized areas already resolved
- reports: array of strings containing detailed, actionable diagnostic bullet points based on the findings

CRITICAL INSTRUCTIONS FOR JSON FORMATTING:
- Ensure all string values are on a single line. Do NOT include literal newlines (\\n) or control characters inside any JSON string fields.
- Do NOT use double quotes (\") inside any string fields (such as audit reports). If a quote is needed, use single quotes (') instead.
Format the output strictly according to the schema.`
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
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
    if (!formatData.error) {
      const outputText = formatData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (outputText) {
        parsedAudit = parseStructuredJSON(outputText);
      }
    } else {
      console.warn("JSON formatting for SEO API error:", formatData.error);
    }
  } catch (jsonError) {
    console.warn("JSON formatting for SEO failed, trying delimited text fallback...", jsonError);
  }

  // 4. Delimited Text Fallback: If JSON parsing failed
  if (!parsedAudit || typeof parsedAudit.score !== 'number') {
    console.log("Executing delimited text formatting fallback for SEO audit...");
    try {
      const delimitedPrompt = `You are an expert data parsing assistant.
Analyze the following text describing an SEO and website visibility audit:
"${rawAuditContent}"

Extract the audit details into a delimited text block. Use the exact labels below:
SCORE: integer from 0 to 100
ISSUES_FOUND: integer
ISSUES_FIXED: integer
REPORT_START
List each actionable SEO audit recommendation bullet point on a new line
REPORT_END

Do NOT include any other text or explanation. Output strictly the delimited audit.`;

      const requestBody = {
        contents: [{
          parts: [{
            text: delimitedPrompt
          }]
        }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.1
        }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (data.error) {
        console.error("Delimited SEO fallback failed:", data.error);
        return res.status(502).json({
          error: 'Gemini Formatting Error',
          message: data.error.message || 'Failed to parse SEO audit.',
          details: data.error
        });
      }

      const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      parsedAudit = parseDelimitedAudit(outputText);
    } catch (err) {
      console.error("Delimited SEO fallback error:", err);
      return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
  }

  return res.status(200).json(parsedAudit);
}
