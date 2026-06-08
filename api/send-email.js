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

  const { to, subject, body } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing parameters: to, subject, and body are required.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API Configuration Error', 
      message: 'RESEND_API_KEY is not defined in serverless environment variables.' 
    });
  }

  try {
    // Call Resend API directly to avoid dependencies
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'OmniBiz AI <onboarding@resend.dev>', // Resend free tier sends from this by default
        to: [to],
        subject: subject,
        text: body
      })
    });

    const data = await response.json();

    if (response.status !== 200) {
      return res.status(502).json({ error: 'Resend API Response Error', details: data });
    }

    return res.status(200).json({ success: true, id: data.id });
    
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
