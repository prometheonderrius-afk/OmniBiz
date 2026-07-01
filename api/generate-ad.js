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

  const { businessData, platform, budget, objective } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API Configuration Error', 
      message: 'GEMINI_API_KEY is not defined in serverless environment variables.' 
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const promptText = `You are OmniBiz AI, a professional small business marketing and advertising expert.
Generate high-converting search/social ad copy and target parameters for:
Business Name: ${businessData?.name || 'Local Service Provider'}
Category/Industry: ${businessData?.category || 'Professional Services'}
Location: ${businessData?.location || 'Local Area'}
Target Customers: ${businessData?.targetAudience || 'Local clients needing high-quality services'}
Additional Details: ${businessData?.description || 'Reliable, prompt, and professional service.'}

Platform: ${platform || 'Google Search'}
Monthly Budget: $${budget || '150'}
Objective: ${objective || 'Lead Form Submissions'}

You must return a JSON object with this exact structure:
{
  "headline1": "Catchy primary headline (under 30 chars)",
  "headline2": "Call to action or secondary benefit headline (under 30 chars)",
  "description": "Engaging ad description highlighting service, response, and benefits (under 90 chars)",
  "keywords": "4-6 relevant comma-separated search keywords",
  "demographics": "Specific target age range, interests, or locations matching the objective"
}
Ensure all text is highly professional, relevant to the business category, and optimized for high click-through rates.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 500
        }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(502).json({ error: 'Gemini API Error', details: data.error });
    }

    const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let adData = {};
    try {
      adData = JSON.parse(outputText);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError, outputText);
      // Fallback
      adData = {
        headline1: `${businessData?.name || 'Quality Service'} | Local Experts`,
        headline2: `Reliable & Professional - Book Now`,
        description: `Get outstanding ${businessData?.category || 'service'} from our dedicated local team. Fast booking and response.`,
        keywords: `local ${businessData?.category || 'service'}, best ${businessData?.category || 'service'}, local business`,
        demographics: `Age: 25-65+ | Location: ${businessData?.location || 'Local area'}`
      };
    }

    return res.status(200).json(adData);
    
  } catch (error) {
    console.error('Gemini call error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
