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

  const projectId = "wacom-canvas";

  try {
    // 1. Fetch user business profile from Firestore REST API
    const userDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
    const userResponse = await fetch(userDocUrl);
    
    if (!userResponse.ok) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const userDoc = await userResponse.json();
    const fields = userDoc.fields || {};
    
    let businessData = {};
    if (fields.businessData?.mapValue?.fields) {
      const bFields = fields.businessData.mapValue.fields;
      businessData = {
        name: bFields.name?.stringValue || 'our company',
        category: bFields.category?.stringValue || 'Local Business',
        location: bFields.location?.stringValue || '',
        ownerName: bFields.ownerName?.stringValue || 'Owner',
        employees: bFields.employees?.arrayValue?.values?.map(v => ({
          name: v.mapValue?.fields?.name?.stringValue || '',
          role: v.mapValue?.fields?.role?.stringValue || ''
        })) || [],
        twilioAccountSid: bFields.twilioAccountSid?.stringValue || '',
        twilioApiKeySid: bFields.twilioApiKeySid?.stringValue || '',
        twilioApiKeySecret: bFields.twilioApiKeySecret?.stringValue || '',
        twilioPhoneNumber: bFields.twilioPhoneNumber?.stringValue || ''
      };
    }

    const { twilioAccountSid, twilioApiKeySid, twilioApiKeySecret, twilioPhoneNumber } = businessData;

    if (!twilioAccountSid || !twilioApiKeySid || !twilioApiKeySecret || !twilioPhoneNumber) {
      return res.status(400).json({ error: 'Twilio credentials not configured in settings.' });
    }

    // 2. Log the missed call event to Firestore smsLog
    const smsLogUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/smsLog`;
    
    const callLogBody = {
      fields: {
        sender: { stringValue: 'Client' },
        text: { stringValue: `📞 Missed Call from ${From || 'Unknown Caller'}` },
        isUser: { booleanValue: false },
        createdAt: { integerValue: Date.now().toString() }
      }
    };

    await fetch(smsLogUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(callLogBody)
    });

    // 3. Run Gemini to formulate a short missed-call reply
    const apiKey = process.env.GEMINI_API_KEY;
    let draftText = `Hi there! Sorry we missed your call. This is the AI assistant for ${businessData.name}. How can we help you today?`;

    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const staffString = businessData.employees?.map(e => `${e.name} (${e.role})`).join(', ') || 'none';
        
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are the AI virtual receptionist for "${businessData.name}" (Category: "${businessData.category}").
Owner name: "${businessData.ownerName}".
Active Staff: ${staffString}.
We just missed a phone call from a customer.
Draft an immediate, extremely friendly text-back response. Ask how we can help. Mention that we missed their call. Keep it under 40 words. Do not use placeholders or markdown formatting.`
              }]
            }],
            generationConfig: {
              maxOutputTokens: 100,
              temperature: 0.7
            }
          })
        });

        const geminiData = await response.json();
        const output = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (output) {
          draftText = output.trim();
        }
      } catch (geminiErr) {
        console.warn('Gemini prompt generation failed. Using default template.', geminiErr);
      }
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
      const responseLogBody = {
        fields: {
          sender: { stringValue: 'OmniBiz AI (Auto)' },
          text: { stringValue: draftText },
          isUser: { booleanValue: true },
          createdAt: { integerValue: Date.now().toString() }
        }
      };

      await fetch(smsLogUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseLogBody)
      });

      // 6. Write system notification
      const notifyUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/notifications`;
      const notifyBody = {
        fields: {
          text: { stringValue: `Live Call Callback: Missed call textback sent to ${From}.` },
          type: { stringValue: 'callback' },
          createdAt: { integerValue: Date.now().toString() }
        }
      };

      await fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifyBody)
      });
    }

    return res.status(200).json({ success: true, textback: draftText });

  } catch (error) {
    console.error('Missed call callback error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
