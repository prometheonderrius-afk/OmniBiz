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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`;
    
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
                voiceName: "Schedar"
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
    const pcmBuffer = Buffer.from(base64Audio, 'base64');
    
    // Create a 44-byte WAV header
    const dataSize = pcmBuffer.length;
    const header = Buffer.alloc(44);
    
    header.write('RIFF', 0);
    header.writeUInt32LE(dataSize + 36, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size
    header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    header.writeUInt16LE(1, 22); // NumChannels (1 = Mono)
    header.writeUInt32LE(24000, 24); // SampleRate
    header.writeUInt32LE(24000 * 2, 28); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    header.writeUInt16LE(2, 32); // BlockAlign (NumChannels * BitsPerSample/8)
    header.writeUInt16LE(16, 34); // BitsPerSample
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);
    
    const wavBuffer = Buffer.concat([header, pcmBuffer]);

    res.setHeader('Content-Type', 'audio/wav');
    res.status(200).send(wavBuffer);
  } catch (error) {
    console.error("TTS Server Error:", error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
