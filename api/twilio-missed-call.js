import { generateContentVertex } from './_utils/gcp.js';

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
  
  let bodyData = req.body || {};
  if (typeof bodyData === 'string') {
    try { bodyData = JSON.parse(bodyData); } catch (e) {}
  }
  const { From, CallStatus, CallSid } = bodyData;

  if (!uid) {
    return res.status(400).json({ error: 'uid query parameter is required.' });
  }

  console.log(`Received Missed Call webhook - SID: ${CallSid}, From: ${From}, Status: ${CallStatus}`);

  // Twilio call failure/missed statuses
  const missedStatuses = ["no-answer", "busy", "failed"];
  if (CallStatus && !missedStatuses.includes(CallStatus.toLowerCase())) {
    return res.status(200).json({ status: 'ignored', reason: 'call was not missed' });
  }

  const projectId = process.env.GCP_PROJECT_ID || "zany-passkey-d9st9";
  const adminSettingsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/system/adminSettings`;
  const userDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
  const smsLogUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/smsLog`;
  const apiLogsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/apiLogs`;

  try {
    // 1. Resolve Twilio Credentials (Vercel Env first, fallback to Firestore Secure adminSettings)
    let twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || '';
    let twilioApiKeySid = process.env.TWILIO_API_KEY_SID || '';
    let twilioApiKeySecret = process.env.TWILIO_API_KEY_SECRET || '';
    let twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!twilioAccountSid) {
      try {
        const adminRes = await fetch(adminSettingsUrl);
        if (adminRes.ok) {
          const adminDoc = await adminRes.json();
          const fields = adminDoc.fields || {};
          twilioAccountSid = fields.twilioAccountSid?.stringValue || '';
          twilioApiKeySid = fields.twilioApiKeySid?.stringValue || '';
          twilioApiKeySecret = fields.twilioApiKeySecret?.stringValue || '';
          twilioPhoneNumber = fields.twilioPhoneNumber?.stringValue || '';
        }
      } catch (adminErr) {
        console.warn("Failed reading adminSettings from REST API:", adminErr);
      }
    }

    if (!twilioAccountSid || !twilioApiKeySid || !twilioApiKeySecret || !twilioPhoneNumber) {
      return res.status(400).json({ 
        error: 'Twilio credentials not configured.',
        message: 'Please set your master provider keys in the Admin Settings tab.' 
      });
    }

    // 2. Fetch user business profile using Firestore REST API
    let businessData = {};
    try {
      const userRes = await fetch(userDocUrl);
      if (userRes.ok) {
        const userDoc = await userRes.json();
        const bFields = userDoc.fields?.businessData?.mapValue?.fields || {};
        businessData = {
          name: bFields.name?.stringValue || 'our company',
          category: bFields.category?.stringValue || 'Local Business',
          ownerName: bFields.ownerName?.stringValue || 'Owner',
          employees: bFields.employees?.arrayValue?.values?.map(v => ({
            name: v.mapValue?.fields?.name?.stringValue || '',
            role: v.mapValue?.fields?.role?.stringValue || ''
          })) || []
        };
      }
    } catch (userErr) {
      console.warn("User profile lookup failed:", userErr);
    }

    // 3. Log the missed call event to Firestore smsLog
    try {
      await fetch(smsLogUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            sender: { stringValue: 'Client' },
            text: { stringValue: `📞 Missed Call from ${From || 'Unknown Caller'}` },
            isUser: { booleanValue: false },
            createdAt: { integerValue: Date.now().toString() }
          }
        })
      });
    } catch (logErr) {}

    // 4. Run Vertex AI Gemini to formulate a short missed-call reply
    let draftText = `Hi there! Sorry we missed your call. This is the AI assistant for ${businessData.name || 'our company'}. How can we help you today?`;

    try {
      const staffString = businessData.employees?.map(e => `${e.name} (${e.role})`).join(', ') || 'none';
      const prompt = `We just missed a phone call from a customer. Draft an immediate, extremely friendly text-back response. Ask how we can help. Mention that we missed their call. Keep it under 40 words. Do not use placeholders or markdown formatting.`;
      
      const systemInstruction = `You are the AI virtual receptionist for "${businessData.name || 'our company'}" (Category: "${businessData.category || 'Local Business'}").
Owner name: "${businessData.ownerName || 'Owner'}".
Active Staff: ${staffString}.`;

      const output = await generateContentVertex(prompt, systemInstruction, { maxTokens: 100, temperature: 0.7 });
      if (output) {
        draftText = output.trim();
      }
    } catch (geminiErr) {
      console.warn('Vertex AI prompt generation failed. Using default template.', geminiErr);
    }

    // 5. Send the SMS using Twilio REST API
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

    const twilioResult = await twilioResponse.json().catch(() => ({}));

    if (twilioResponse.ok) {
      // Save outbound textback to Firestore smsLog
      try {
        await fetch(smsLogUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              sender: { stringValue: 'OmniBiz AI (Auto)' },
              text: { stringValue: draftText },
              isUser: { booleanValue: true },
              createdAt: { integerValue: Date.now().toString() }
            }
          })
        });

        // Write telemetry log
        await fetch(apiLogsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              timestamp: { integerValue: Date.now().toString() },
              apiName: { stringValue: '/api/twilio-missed-call' },
              status: { stringValue: 'success' },
              details: { stringValue: `Missed call auto-reply sent to ${From} for client ${businessData.name || uid}.` }
            }
          })
        });
      } catch (e) {}

      return res.status(200).json({ success: true, textback: draftText });
    } else {
      console.error("Twilio API error:", twilioResult);
      return res.status(502).json({ 
        error: 'Twilio API Error', 
        message: twilioResult.message || 'Failed to dispatch SMS through Twilio.' 
      });
    }

  } catch (error) {
    console.error('Missed call callback error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
