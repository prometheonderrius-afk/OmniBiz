import { generateContentVertex } from './_utils/gcp.js';

export default async function handler(req, res) {
  // Return TwiML XML response for Twilio Voice Webhooks
  res.setHeader('Content-Type', 'text/xml');

  const { uid, SpeechResult, From } = req.query;
  const projectId = "wacom-canvas";
  const userDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid || ''}`;
  const callLogsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid || 'default'}/voiceCalls`;

  let businessName = 'our company';
  let category = 'Local Business';
  let ownerName = 'Owner';

  // Lookup business data via Firestore REST API if UID provided
  if (uid) {
    try {
      const userRes = await fetch(userDocUrl);
      if (userRes.ok) {
        const userDoc = await userRes.json();
        const bFields = userDoc.fields?.businessData?.mapValue?.fields || {};
        businessName = bFields.name?.stringValue || businessName;
        category = bFields.category?.stringValue || category;
        ownerName = bFields.ownerName?.stringValue || ownerName;
      }
    } catch (e) {}
  }

  // Initial Call Greeting vs Speech Conversation
  if (!SpeechResult) {
    const initialXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Thank you for calling ${businessName}. I am your automated AI virtual assistant. How can I help you today?</Say>
    <Gather input="speech" timeout="5" action="/api/twilio-voice-agent?uid=${uid || ''}">
        <Say voice="Polly.Joanna">Please state your inquiry, or let me know if you would like to book an appointment.</Say>
    </Gather>
    <Say voice="Polly.Joanna">We didn't catch that. Please visit our website or call back anytime. Goodbye!</Say>
</Response>`;
    return res.status(200).send(initialXml);
  }

  // Generate Conversational Reply via Vertex AI Gemini
  let aiReplyText = `Thanks for calling ${businessName}! I've logged your request regarding "${SpeechResult}". An associate will confirm your appointment shortly. Have a great day!`;

  try {
    const prompt = `A customer said over the phone: "${SpeechResult}". Formulate a brief, extremely polite 20-word spoken voice response confirming how we can help or locking in their booking. Do not use symbols, emojis, or markdown.`;
    const systemInstruction = `You are the AI Voice Receptionist for "${businessName}" (Category: "${category}", Owner: "${ownerName}"). Speak naturally and concisely.`;
    
    const vertexOutput = await generateContentVertex(prompt, systemInstruction, { maxTokens: 60, temperature: 0.7 });
    if (vertexOutput) {
      aiReplyText = vertexOutput.replace(/[*_#]/g, '').trim();
    }
  } catch (err) {
    console.warn("Voice AI response fallback used:", err);
  }

  // Log Voice Call Transcript to Firestore REST API
  if (uid) {
    try {
      await fetch(callLogsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            caller: { stringValue: From || 'Unknown Caller' },
            customerSpeech: { stringValue: SpeechResult },
            aiReply: { stringValue: aiReplyText },
            timestamp: { integerValue: Date.now().toString() }
          }
        })
      });
    } catch (e) {}
  }

  const responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">${aiReplyText}</Say>
    <Hangup/>
</Response>`;

  return res.status(200).send(responseXml);
}
