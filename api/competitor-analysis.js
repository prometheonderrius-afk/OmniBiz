import fetch from 'node-fetch'; // Ensure you import fetch if running outside of Next.js environment

export default async function handler(req, res) {
  // 1. CORS Headers Setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle Preflight request (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', message: 'Only POST requests are accepted.' });
  }

  // Destructure and validate body input
  const businessData = req.body; 
  const apiKey = process.env.GEMINI_API_KEY;

  // 2. API Key Check (Early Exit)
  if (!apiKey) {
    console.error('Gemini API Key is missing.');
    return res.status(503).json({ error: 'Service Unavailable', message: 'The required Gemini API key is not configured.' });
  }

  // Main try block for the external service call
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const promptText = `You are a local SEO and business competitor analyst. 
Based on this client business:
Name: ${businessData?.name || 'Local Business'}
Category: ${businessData?.category || 'Services'}
Location: ${businessData?.location || 'Local Area'}

Identify exactly 3 typical theoretical or real local competitors in that specific area and category. For each, provide a structured analysis highlighting their strengths and their weaknesses (which our client can exploit).
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
        config: { // Renamed generationConfig to config for clarity (though both work)
          responseMimeType: "application/json",
          temperature: 0.6,
          maxOutputTokens: 1000
        }
      })
    });

    // Check HTTP status code from the API response
    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`Gemini API call failed with status ${response.status}: ${errorBody.error?.message || 'Unknown API error'}`);
    }

    const data = await response.json();
    
    // Extract the text content from the nested structure
    const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!outputText) {
        throw new Error("Could not retrieve structured text from the API response.");
    }


    let competitors = [];
    try {
      // Attempt to parse the JSON string provided by Gemini
      competitors = JSON.parse(outputText);
    } catch (e) {
      console.error('JSON Parsing Error:', e, 'Raw Output:', outputText);
      // If parsing fails, we still throw a specific error rather than silently failing
      throw new Error("API returned invalid data format (could not parse JSON array). Please check the prompt or service status.");
    }

    // Final structural validation
    if (!Array.isArray(competitors) || competitors.length < 3) {
        console.warn(`Received non-array or incomplete list of competitors:`, competitors);
        throw new Error("Failed to retrieve a valid array of 3 competitor objects from the AI service.");
    }

    // Success response
    return res.status(200).json({ success: true, data: competitors });

  } catch (error) {
    console.error('--- Execution Error ---', error);
    
    // 3. Improved Fallback/Failure Response
    // Instead of providing dummy data, we inform the client that a service failure occurred.
    return res.status(500).json({ 
      success: false, 
      error: 'AI Analysis Failed', 
      message: error.message || 'An unexpected error occurred during competitor analysis.',
      // Optionally include the input data so the client knows what was attempted
      context_data: {
          name: businessData?.name,
          category: businessData?.category,
          location: businessData?.location,
      }
    });
  }
}
