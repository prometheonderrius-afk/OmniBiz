import { dbAdmin } from './_utils/gcp.js';

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

  try {
    // 1. Resolve Twilio Credentials (Vercel Env first, fallback to Firestore Secure adminSettings)
    let twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || '';
    let twilioApiKeySid = process.env.TWILIO_API_KEY_SID || '';
    let twilioApiKeySecret = process.env.TWILIO_API_KEY_SECRET || '';
    let twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!twilioAccountSid) {
      const adminDoc = await dbAdmin.collection('system').doc('adminSettings').get();
      if (adminDoc.exists) {
        const adminData = adminDoc.data();
        twilioAccountSid = adminData.twilioAccountSid || '';
        twilioApiKeySid = adminData.twilioApiKeySid || '';
        twilioApiKeySecret = adminData.twilioApiKeySecret || '';
        twilioPhoneNumber = adminData.twilioPhoneNumber || '';
      }
    }

    if (!twilioAccountSid || !twilioApiKeySid || !twilioApiKeySecret || !twilioPhoneNumber) {
      // Log failure to diagnostics logger
      await dbAdmin.collection('apiLogs').add({
        timestamp: Date.now(),
        apiName: '/api/send-sms',
        status: 'failed',
        error: 'Missing Twilio Configuration. Please save credentials in Admin Settings.'
      });

      return res.status(400).json({ 
        error: 'Missing Twilio Configuration',
        message: 'Master Twilio credentials are not configured by the system administrator.' 
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

    const twilioData = await twilioRes.json();

    if (!twilioRes.ok) {
      console.error('Twilio API responded with error:', twilioData);
      
      // Log failure to database
      await dbAdmin.collection('apiLogs').add({
        timestamp: Date.now(),
        apiName: '/api/send-sms',
        status: 'failed',
        error: twilioData.message || 'Failed to dispatch SMS through Twilio API.'
      });

      return res.status(502).json({ 
        error: 'Twilio API Error', 
        message: twilioData.message || 'Failed to dispatch SMS through Twilio.',
        details: twilioData 
      });
    }

    // Log success in diagnostic logger
    await dbAdmin.collection('apiLogs').add({
      timestamp: Date.now(),
      apiName: '/api/send-sms',
      status: 'success',
      details: `Successfully sent message to ${to} (SID: ${twilioData.sid})`
    });

    return res.status(200).json({ success: true, sid: twilioData.sid });

  } catch (error) {
    console.error('SMS sending error:', error);

    // Log unexpected errors
    try {
      await dbAdmin.collection('apiLogs').add({
        timestamp: Date.now(),
        apiName: '/api/send-sms',
        status: 'failed',
        error: error.message || 'Internal Server Error'
      });
    } catch (e) {
      console.error("Logger writing crash:", e);
    }

    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
