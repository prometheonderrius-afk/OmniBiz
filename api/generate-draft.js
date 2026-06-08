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

  const { prompt, type } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API Configuration Error', 
      message: 'GEMINI_API_KEY is not defined in serverless environment variables.' 
    });
  }

  try {
    // Call Gemini 1.5 Flash REST API directly to avoid dependencies
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are OmniBiz AI, a professional small business marketing and operations automated assistant.
Keep your response under 100 words. Format it as plain text without markdown, quotes, or conversational headers. 
Goal: Generate a professional draft for the type: ${type || 'general'}.
Input: ${prompt}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 250,
          temperature: 0.7
        }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(502).json({ error: 'Gemini API Error', details: data.error });
    }

    const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ draft: outputText.trim() });
    
  } catch (error) {
    console.error('Gemini call error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
