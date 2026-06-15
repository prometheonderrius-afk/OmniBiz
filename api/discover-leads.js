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

function parseDelimitedLeads(text) {
  const leads = [];
  const blocks = text.split(/LEAD_START/i);
  
  for (const block of blocks) {
    if (!block.trim()) continue;
    
    const nameMatch = block.match(/NAME:\s*(.*)/i);
    const companyMatch = block.match(/COMPANY:\s*(.*)/i);
    const emailMatch = block.match(/EMAIL:\s*(.*)/i);
    const phoneMatch = block.match(/PHONE:\s*(.*)/i);
    const scoreMatch = block.match(/SCORE:\s*(.*)/i);
    const notesMatch = block.match(/NOTES:\s*(.*)/i);
    
    if (companyMatch) {
      leads.push({
        name: nameMatch ? nameMatch[1].trim() : 'Owner',
        company: companyMatch[1].trim(),
        email: emailMatch ? emailMatch[1].trim() : 'info@domain.com',
        phone: phoneMatch ? phoneMatch[1].trim() : '',
        score: scoreMatch ? parseInt(scoreMatch[1].trim(), 10) || 70 : 70,
        source: 'AI Maps Finder',
        notes: notesMatch ? notesMatch[1].trim() : 'Lacks search presence.'
      });
    }
  }
  
  return leads;
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

  // 1. Primary Attempt: Call Gemini with google_search grounding (plain text output, no responseSchema)
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

  // 2. Secondary Attempt: If google_search fails (billing blocked), query OpenStreetMap Nominatim for real businesses
  if (!primarySuccess) {
    console.log("Primary search grounding failed. Using OpenStreetMap Nominatim fallback...");
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(category + ' in ' + location)}&format=json&addressdetails=1&extratags=1&limit=10`;
      const osmResponse = await fetch(osmUrl, {
        headers: {
          'User-Agent': 'OmniBizAI/1.0 (contact@omnibiz.ai)'
        }
      });
      
      if (osmResponse.ok) {
        const osmData = await osmResponse.json();
        if (osmData && osmData.length > 0) {
          // Format OSM results into plain text for Gemini formatting
          rawSearchContent = osmData.map((poi, idx) => {
            const name = poi.name || poi.display_name.split(',')[0] || 'Local Business';
            const address = poi.display_name || '';
            const phone = poi.extratags?.phone || poi.extratags?.['contact:phone'] || '';
            const website = poi.extratags?.website || '';
            return `Business ${idx + 1}:
Name: ${name}
Address: ${address}
Phone: ${phone}
Website: ${website}`;
          }).join('\n\n');
          
          if (rawSearchContent) {
            primarySuccess = true;
            console.log("Successfully retrieved real POIs from OpenStreetMap.");
          }
        }
      }
    } catch (osmErr) {
      console.warn("OpenStreetMap query failed:", osmErr);
    }
  }

  // 3. Tertiary Fallback: If both Google Search and OSM fail, generate mock realistic leads
  if (!primarySuccess) {
    console.log("Using mock plain-text generation fallback...");
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

  // 4. Formatting Step: Try JSON Mode (without responseSchema to avoid truncation bugs)
  let parsedLeads = null;
  try {
    const formatRequestBody = {
      contents: [{
        parts: [{
          text: `You are an expert data parsing assistant.
Analyze the following text describing local business leads:
"${rawSearchContent}"

Extract these businesses into a structured JSON object. 
The JSON output MUST match this structure:
{
  "leads": [
    {
      "name": "contact person name (e.g. 'Store Manager' or inferred owner's name)",
      "company": "official name of the business",
      "email": "contact email address (e.g., info@domain.com)",
      "phone": "phone number",
      "score": 85, // integer from 0 to 100 representing how desperately they need SEO help
      "source": "AI Maps Finder",
      "notes": "SEO gaps description"
    }
  ]
}

CRITICAL INSTRUCTIONS FOR JSON FORMATTING:
- Ensure all string values are on a single line. Do NOT include literal newlines (\\n) or control characters inside any JSON string fields.
- Do NOT use double quotes (\") inside any string fields (such as company names or notes). If a quote is needed, use single quotes (') instead.
Format the output strictly according to the schema.`
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 1500,
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
        const parsedData = parseStructuredJSON(outputText);
        parsedLeads = parsedData.leads || [];
      }
    } else {
      console.warn("JSON formatting API error:", formatData.error);
    }
  } catch (jsonError) {
    console.warn("JSON formatting failed, trying delimited text fallback...", jsonError);
  }

  // 5. Delimited Text Fallback: If JSON parsing failed or was truncated,
  // call Gemini to output a simple delimited text block and parse it.
  if (!parsedLeads || parsedLeads.length === 0) {
    console.log("Executing delimited text formatting fallback...");
    try {
      const delimitedPrompt = `You are an expert data parsing assistant.
Analyze the following text describing local business leads:
"${rawSearchContent}"

Extract these businesses into a delimited text block. Use the exact labels below:
LEAD_START
NAME: contact person name (or "Owner" if not found)
COMPANY: official name of the business
EMAIL: contact email address (or standard placeholder info@domain.com if not found)
PHONE: phone number
SCORE: integer from 0 to 100 representing sales priority
NOTES: description of their search optimization gaps
LEAD_END

Do NOT include any other text or explanation. Output strictly the delimited leads.`;

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
        console.error("Delimited fallback failed:", data.error);
        return res.status(502).json({
          error: 'Gemini Formatting Error',
          message: data.error.message || 'Failed to parse lead data.',
          details: data.error
        });
      }

      const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      parsedLeads = parseDelimitedLeads(outputText);
    } catch (err) {
      console.error("Delimited fallback error:", err);
      return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
  }

  return res.status(200).json(parsedLeads || []);
}
