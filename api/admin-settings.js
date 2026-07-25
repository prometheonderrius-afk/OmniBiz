import { dbAdmin } from './_utils/gcp.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Fetch Admin Credentials
  if (req.method === 'GET') {
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

  // POST: Save Admin Credentials
  if (req.method === 'POST') {
    try {
      const { twilioAccountSid, twilioApiKeySid, twilioApiKeySecret, twilioPhoneNumber } = req.body;

      await dbAdmin.collection('system').doc('adminSettings').set({
        twilioAccountSid: twilioAccountSid || '',
        twilioApiKeySid: twilioApiKeySid || '',
        twilioApiKeySecret: twilioApiKeySecret || '',
        twilioPhoneNumber: twilioPhoneNumber || '',
        updatedAt: Date.now()
      }, { merge: true });

      // Log success in diagnostic logger
      await dbAdmin.collection('apiLogs').add({
        timestamp: Date.now(),
        apiName: '/api/admin-settings',
        status: 'success',
        details: 'Updated global provider credentials securely via Admin SDK.'
      });

      return res.status(200).json({ success: true, message: 'Settings saved successfully.' });
    } catch (error) {
      console.error('Error saving admin settings:', error);
      try {
        await dbAdmin.collection('apiLogs').add({
          timestamp: Date.now(),
          apiName: '/api/admin-settings',
          status: 'failed',
          error: error.message || 'Failed to save admin settings.'
        });
      } catch (e) {}
      return res.status(500).json({ error: 'Failed to save settings', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
