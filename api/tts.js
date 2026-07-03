export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, apiKey: clientApiKey } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Missing text' });
  }

  const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: 'Missing Gemini API Key' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash:generateContent?key=${apiKey}`;
    
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "algieba"
              }
            }
          }
        }
      })
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error("Gemini TTS Error:", err);
      return res.status(geminiRes.status).json({ error: err });
    }

    const data = await geminiRes.json();
    
    // Extract base64 audio
    const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part || !part.inlineData) {
      throw new Error("No audio data returned from Gemini");
    }

    const base64Audio = part.inlineData.data;
    const mimeType = part.inlineData.mimeType || 'audio/wav';

    const buffer = Buffer.from(base64Audio, 'base64');
    res.setHeader('Content-Type', mimeType);
    res.status(200).send(buffer);
  } catch (error) {
    console.error("TTS Server Error:", error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
