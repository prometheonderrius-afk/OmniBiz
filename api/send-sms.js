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

  let bodyData = req.body || {};
  if (typeof bodyData === 'string') {
    try { bodyData = JSON.parse(bodyData); } catch (e) {}
  }
  const { uid, to, body } = bodyData;

  if (!uid || !to || !body) {
    return res.status(400).json({ error: 'Missing parameters: uid, to, and body are required.' });
  }

  const projectId = "wacom-canvas";
  const adminSettingsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/system/adminSettings`;
  const apiLogsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/apiLogs`;

  try {
    // 1. Resolve Twilio Credentials (Vercel Env first, fallback to Firestore REST API adminSettings)
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
        error: 'Missing Twilio Configuration',
        message: 'Master Twilio credentials are not configured in Admin Settings.' 
      });
    }

    // 2. Dispatch SMS message via Twilio REST API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const params = new URLSearchParams();
    params.append('From', twilioPhoneNumber);
    params.append('To', to);
    params.append('Body', body);

    const authString = Buffer.from(`${twilioApiKeySid}:${twilioApiKeySecret}`).toString('base64');

    const twilioRes = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`
      },
      body: params.toString()
    });

    const twilioData = await twilioRes.json().catch(() => ({}));

    if (!twilioRes.ok) {
      console.error('Twilio API responded with error:', twilioData);

      try {
        await fetch(apiLogsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              timestamp: { integerValue: Date.now().toString() },
              apiName: { stringValue: '/api/send-sms' },
              status: { stringValue: 'failed' },
              error: { stringValue: twilioData.message || 'Failed to dispatch SMS through Twilio API.' }
            }
          })
        });
      } catch (e) {}

      return res.status(502).json({ 
        error: 'Twilio API Error', 
        message: twilioData.message || 'Failed to dispatch SMS through Twilio.',
        details: twilioData 
      });
    }

    // Log success in diagnostic logger
    try {
      await fetch(apiLogsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            timestamp: { integerValue: Date.now().toString() },
            apiName: { stringValue: '/api/send-sms' },
            status: { stringValue: 'success' },
            details: { stringValue: `Successfully sent message to ${to} (SID: ${twilioData.sid})` }
          }
        })
      });
    } catch (e) {}

    return res.status(200).json({ success: true, sid: twilioData.sid });

  } catch (error) {
    console.error('SMS sending error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
