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

  const { uid, to, body } = req.body;
  if (!uid || !to || !body) {
    return res.status(400).json({ error: 'Missing parameters: uid, to, and body are required.' });
  }

  const projectId = "wacom-canvas";

  try {
    // 1. Fetch user business settings from Firestore REST API
    const userDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
    const userResponse = await fetch(userDocUrl);
    
    if (!userResponse.ok) {
      return res.status(404).json({ error: 'Business profile not found or database error.' });
    }

    const userDoc = await userResponse.json();
    const fields = userDoc.fields || {};
    
    let twilioAccountSid = '';
    let twilioApiKeySid = '';
    let twilioApiKeySecret = '';
    let twilioPhoneNumber = '';

    if (fields.businessData?.mapValue?.fields) {
      const bFields = fields.businessData.mapValue.fields;
      twilioAccountSid = bFields.twilioAccountSid?.stringValue || '';
      twilioApiKeySid = bFields.twilioApiKeySid?.stringValue || '';
      twilioApiKeySecret = bFields.twilioApiKeySecret?.stringValue || '';
      twilioPhoneNumber = bFields.twilioPhoneNumber?.stringValue || '';
    }

    if (!twilioAccountSid || !twilioApiKeySid || !twilioApiKeySecret || !twilioPhoneNumber) {
      return res.status(400).json({ 
        error: 'Missing Twilio Configuration',
        message: 'Please navigate to Settings & Integrations in the dashboard and save your Twilio credentials first.' 
      });
    }

    // 2. Dispatch SMS message via Twilio REST API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const params = new URLSearchParams();
    params.append('From', twilioPhoneNumber);
    params.append('To', to);
    params.append('Body', body);

    // Basic Auth header using API Key SID and API Key Secret
    const authString = Buffer.from(`${twilioApiKeySid}:${twilioApiKeySecret}`).toString('base64');

    const twilioRes = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`
      },
      body: params.toString()
    });

    const twilioData = await twilioRes.json();

    if (!twilioRes.ok) {
      console.error('Twilio API responded with error:', twilioData);
      return res.status(502).json({ 
        error: 'Twilio API Error', 
        message: twilioData.message || 'Failed to dispatch SMS through Twilio.',
        details: twilioData 
      });
    }

    return res.status(200).json({ success: true, sid: twilioData.sid });

  } catch (error) {
    console.error('SMS sending error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
