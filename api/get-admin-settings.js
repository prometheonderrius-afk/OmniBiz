import { dbAdmin } from './_utils/gcp.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const adminDoc = await dbAdmin.collection('system').doc('adminSettings').get();
    if (adminDoc.exists) {
      return res.status(200).json(adminDoc.data());
    } else {
      return res.status(200).json({
        twilioAccountSid: '',
        twilioApiKeySid: '',
        twilioApiKeySecret: '',
        twilioPhoneNumber: ''
      });
    }
  } catch (error) {
    console.error('Error reading admin settings:', error);
    return res.status(500).json({ error: 'Failed to read settings', message: error.message });
  }
}
