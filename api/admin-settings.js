export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const projectId = process.env.GCP_PROJECT_ID || "zany-passkey-d9st9";
  const firestoreRestUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/system/adminSettings`;

  // GET: Fetch Admin Settings
  if (req.method === 'GET') {
    try {
      const fetchRes = await fetch(firestoreRestUrl);
      if (fetchRes.ok) {
        const docData = await fetchRes.json();
        const fields = docData.fields || {};
        return res.status(200).json({
          twilioAccountSid: fields.twilioAccountSid?.stringValue || '',
          twilioApiKeySid: fields.twilioApiKeySid?.stringValue || '',
          twilioApiKeySecret: fields.twilioApiKeySecret?.stringValue || '',
          twilioPhoneNumber: fields.twilioPhoneNumber?.stringValue || ''
        });
      } else {
        return res.status(200).json({
          twilioAccountSid: '',
          twilioApiKeySid: '',
          twilioApiKeySecret: '',
          twilioPhoneNumber: ''
        });
      }
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      return res.status(200).json({
        twilioAccountSid: '',
        twilioApiKeySid: '',
        twilioApiKeySecret: '',
        twilioPhoneNumber: ''
      });
    }
  }

  // POST: Save Admin Settings
  if (req.method === 'POST') {
    try {
      let bodyData = req.body || {};
      if (typeof bodyData === 'string') {
        try { bodyData = JSON.parse(bodyData); } catch (e) {}
      }

      const twilioAccountSid = bodyData.twilioAccountSid || '';
      const twilioApiKeySid = bodyData.twilioApiKeySid || '';
      const twilioApiKeySecret = bodyData.twilioApiKeySecret || '';
      const twilioPhoneNumber = bodyData.twilioPhoneNumber || '';

      const restPayload = {
        fields: {
          twilioAccountSid: { stringValue: twilioAccountSid },
          twilioApiKeySid: { stringValue: twilioApiKeySid },
          twilioApiKeySecret: { stringValue: twilioApiKeySecret },
          twilioPhoneNumber: { stringValue: twilioPhoneNumber },
          updatedAt: { integerValue: Date.now().toString() }
        }
      };

      // Write via Firestore REST API (works on Vercel without GCP certs)
      const patchRes = await fetch(firestoreRestUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restPayload)
      });

      if (!patchRes.ok) {
        // Fallback: try POST if PATCH failed (e.g. document creating first time)
        const parentUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/system?documentId=adminSettings`;
        await fetch(parentUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(restPayload)
        });
      }

      return res.status(200).json({ success: true, message: 'Provider settings saved successfully.' });

    } catch (error) {
      console.error('Error saving admin settings:', error);
      return res.status(500).json({ error: 'Failed to save settings', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
