export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { businessData } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Configuration Error' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const promptText = `You are a local SEO and business competitor analyst. 
Based on this client business:
Name: ${businessData?.name || 'Local Business'}
Category: ${businessData?.category || 'Services'}
Location: ${businessData?.location || 'Local Area'}

Identify 3 typical theoretical or real local competitors in that specific area and category. For each, provide a structured analysis highlighting their strengths and their weaknesses (which our client can exploit).
You MUST return ONLY a JSON array containing 3 objects with the following keys:
- name: (String) competitor name
- rating: (Number) estimated rating out of 5.0
- strengths: (String) what they do well
- weaknesses: (String) their main vulnerability our client can attack
- actionPlan: (String) brief 1-sentence recommendation for our client to beat them`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.6,
          maxOutputTokens: 1000
        }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'Gemini error');

    const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    let competitors = [];
    try {
      competitors = JSON.parse(outputText);
    } catch(e) {
      competitors = [];
    }

    if (!Array.isArray(competitors) || competitors.length === 0) {
      throw new Error("Invalid format");
    }

    return res.status(200).json(competitors);
  } catch (error) {
    console.error(error);
    const fallback = [
      { name: `Advanced ${businessData?.category || 'Service'} Group`, rating: 4.8, strengths: "High volume of reviews", weaknesses: "Poor website performance", actionPlan: "Improve mobile site speed to capture their bounced traffic." },
      { name: `${businessData?.location || 'Local'} ${businessData?.category || 'Service'} Pros`, rating: 4.2, strengths: "Cheap pricing", weaknesses: "Low quality customer service", actionPlan: "Promote premium, high-quality automated chat support." },
      { name: "National Franchise Corp", rating: 3.9, strengths: "Large ad budget", weaknesses: "Lack of local connection and slow response times", actionPlan: "Use Missed Call Textbacks to respond instantly while they put clients on hold." }
    ];
    return res.status(200).json(fallback);
  }
}
