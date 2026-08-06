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

  const { leadEmail, leadName, leadCompany } = req.body;
  if (!leadEmail || !leadName) {
    return res.status(400).json({ error: 'Missing parameters: leadEmail and leadName are required.' });
  }

  // Generate unique trial credentials
  const trialId = Math.random().toString(36).substring(2, 9).toUpperCase();
  const trialPassword = `Trial_${Math.random().toString(36).substring(2, 7)}!`;
  const trialLoginUrl = `https://omnibiz-ai.vercel.app/login?trial_token=${trialId}`;
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 14);
  const formattedExpiry = expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const subject = `Welcome to OmniBiz AI! Your 14-Day Risk-Free Trial Access Details`;
  const body = `Hi ${leadName.split(' ')[0]},

Great news! We've activated your 14-Day Risk-Free Trial for ${leadCompany || 'your business'}.

Here are your exclusive login details to get started right away:

------------------------------------------------
Portal Access URL: ${trialLoginUrl}
Temporary Username: ${leadEmail}
Trial Access Code: ${trialId}
Temporary Password: ${trialPassword}
Trial Expiration Date: ${formattedExpiry} (14 Days Full Access)
------------------------------------------------

What's included in your trial:
- Autonomous AI Voice Agent & SMS Lead Capture
- Local SEO & Google Business Optimization Suite
- AI Competitor Intelligence & Automated Ad Manager
- Zero credit card required during your 14-day period.

If you have any questions or need onboarding help, simply reply directly to this email and our team will assist you.

Welcome aboard!

The OmniBiz AI Automation Team
https://omnibiz.ai`;

  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          from: 'OmniBiz AI <onboarding@resend.dev>',
          to: [leadEmail],
          subject: subject,
          text: body
        })
      });

      const data = await response.json();
      return res.status(200).json({ 
        success: true, 
        message: 'Special 14-day trial login dispatched via email.',
        trialDetails: {
          trialId,
          trialPassword,
          trialLoginUrl,
          expires: formattedExpiry
        },
        resendId: data.id 
      });
    } catch (error) {
      console.error('Failed to send trial credentials email via Resend:', error);
      return res.status(200).json({ 
        success: true, 
        simulated: true,
        message: 'Trial credentials generated (email delivery simulated).',
        trialDetails: {
          trialId,
          trialPassword,
          trialLoginUrl,
          expires: formattedExpiry
        } 
      });
    }
  } else {
    return res.status(200).json({
      success: true,
      simulated: true,
      message: 'RESEND_API_KEY not configured. Trial credentials auto-generated in preview mode.',
      trialDetails: {
        trialId,
        trialPassword,
        trialLoginUrl,
        expires: formattedExpiry
      }
    });
  }
}
