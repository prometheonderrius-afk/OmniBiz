import { dbAdmin, generateContentVertex } from './utils/gcp.js';

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

  const { uid } = req.query;
  const { From, CallStatus, CallSid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'uid query parameter is required.' });
  }

  console.log(`Received Missed Call webhook - SID: ${CallSid}, From: ${From}, Status: ${CallStatus}`);

  // Twilio call failure/missed statuses
  const missedStatuses = ["no-answer", "busy", "failed"];
  if (CallStatus && !missedStatuses.includes(CallStatus.toLowerCase())) {
    return res.status(200).json({ status: 'ignored', reason: 'call was not missed' });
  }

  try {
    // 1. Fetch user business profile using Firebase Admin SDK
    const userRef = dbAdmin.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const userData = userDoc.data();
    const businessData = userData.businessData || {};
    const { twilioAccountSid, twilioApiKeySid, twilioApiKeySecret, twilioPhoneNumber } = businessData;

    if (!twilioAccountSid || !twilioApiKeySid || !twilioApiKeySecret || !twilioPhoneNumber) {
      return res.status(400).json({ error: 'Twilio credentials not configured in settings.' });
    }

    // 2. Log the missed call event to Firestore smsLog
    const smsLogRef = userRef.collection('smsLog');
    await smsLogRef.add({
      sender: 'Client',
      text: `📞 Missed Call from ${From || 'Unknown Caller'}`,
      isUser: false,
      createdAt: Date.now()
    });

    // 3. Run Vertex AI Gemini to formulate a short missed-call reply
    let draftText = `Hi there! Sorry we missed your call. This is the AI assistant for ${businessData.name || 'our company'}. How can we help you today?`;

    try {
      const staffString = businessData.employees?.map(e => `${e.name} (${e.role})`).join(', ') || 'none';
      const prompt = `We just missed a phone call from a customer. Draft an immediate, extremely friendly text-back response. Ask how we can help. Mention that we missed their call. Keep it under 40 words. Do not use placeholders or markdown formatting.`;
      
      const systemInstruction = `You are the AI virtual receptionist for "${businessData.name || 'our company'}" (Category: "${businessData.category || 'Local Business'}").
Owner name: "${businessData.ownerName || 'Owner'}".
Active Staff: ${staffString}.`;

      // Use GCP Vertex AI to generate content securely using their credits
      const output = await generateContentVertex(prompt, systemInstruction, { maxTokens: 100, temperature: 0.7 });
      
      if (output) {
        draftText = output.trim();
      }
    } catch (geminiErr) {
      console.warn('Vertex AI prompt generation failed. Using default template.', geminiErr);
    }

    // 4. Send the SMS using Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const params = new URLSearchParams();
    params.append('From', twilioPhoneNumber);
    params.append('To', From);
    params.append('Body', draftText);

    const authString = Buffer.from(`${twilioApiKeySid}:${twilioApiKeySecret}`).toString('base64');

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`
      },
      body: params.toString()
    });

    if (twilioResponse.ok) {
      // 5. Save the outbound textback to Firestore smsLog
      await smsLogRef.add({
        sender: 'OmniBiz AI (Auto)',
        text: draftText,
        isUser: true,
        createdAt: Date.now()
      });

      // 6. Write system notification
      await userRef.collection('notifications').add({
        text: `Live Call Callback: Missed call textback sent to ${From}.`,
        type: 'callback',
        createdAt: Date.now()
      });
    }

    return res.status(200).json({ success: true, textback: draftText });

  } catch (error) {
    console.error('Missed call callback error (GCP Version):', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
