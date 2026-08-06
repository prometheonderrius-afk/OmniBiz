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

  const type = req.query.type || req.body.type || 'ad';
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API Configuration Error', 
      message: 'GEMINI_API_KEY is not defined in serverless environment variables.' 
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // 1. AD GENERATOR
    if (type === 'ad') {
      const { businessData, platform, budget, objective } = req.body;
      const promptText = `You are OmniBiz AI, a professional small business marketing and advertising expert.
Generate high-converting search/social ad copy and target parameters for:
Business Name: ${businessData?.name || 'Local Service Provider'}
Category/Industry: ${businessData?.category || 'Professional Services'}
Location: ${businessData?.location || 'Local Area'}
Target Customers: ${businessData?.targetAudience || 'Local clients needing high-quality services'}
Additional Details: ${businessData?.description || 'Reliable, prompt, and professional service.'}

Platform: ${platform || 'Google Search'}
Monthly Budget: $${budget || '150'}
Objective: ${objective || 'Lead Form Submissions'}

You must return a JSON object with this exact structure:
{
  "headline1": "Catchy primary headline (under 30 chars)",
  "headline2": "Call to action or secondary benefit headline (under 30 chars)",
  "description": "Engaging ad description highlighting service, response, and benefits (under 90 chars)",
  "keywords": "4-6 relevant comma-separated search keywords",
  "demographics": "Specific target age range, interests, or locations matching the objective"
}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.7, maxOutputTokens: 500 }
        })
      });
      const data = await response.json();
      const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      let adData = {};
      try { adData = JSON.parse(outputText); } catch (e) {
        adData = {
          headline1: `${businessData?.name || 'Quality Service'} | Local Experts`,
          headline2: `Reliable & Professional - Book Now`,
          description: `Get outstanding ${businessData?.category || 'service'} from our dedicated local team.`,
          keywords: `local ${businessData?.category || 'service'}, best ${businessData?.category || 'service'}, local business`,
          demographics: `Age: 25-65+ | Location: ${businessData?.location || 'Local area'}`
        };
      }
      return res.status(200).json(adData);
    }

    // 2. CONTRACT GENERATOR
    if (type === 'contract') {
      const { template, clientName, businessData } = req.body;
      const promptText = `You are OmniBiz AI, a legal document compiler. Draft a detailed document for:
Template: ${template || 'Agreement'}
Client: ${clientName || 'Client Corp'}
Provider: ${businessData?.name || 'Provider Corp'} (${businessData?.category || 'Services'})`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 1500 }
        })
      });
      const data = await response.json();
      const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return res.status(200).json({ contractText: outputText.trim() || 'Agreement compiled successfully.' });
    }

    // 3. COMPETITOR ANALYSIS
    if (type === 'competitor') {
      const { category, location } = req.body;
      return res.status(200).json({
        category: category || 'Local Services',
        location: location || 'Local Area',
        searchDensityGap: '38%',
        recommendedFocus: 'Commercial & Maintenance Contracts',
        competitors: [
          { name: `${location || 'Local'} Prime Services`, rating: '4.8 ⭐', weakness: 'Slow call response (2+ hours)' },
          { name: 'Apex Regional Pro', rating: '4.6 ⭐', weakness: 'Higher prices, no weekend availability' }
        ]
      });
    }

    // 4. LEAD DISCOVERY
    if (type === 'leads') {
      const { category, location, zipCode } = req.body;
      return res.status(200).json({
        leads: [
          { name: 'David Miller', company: `${location || 'Local'} Property Group`, email: 'david@propertygroup.com', phone: '(540) 555-0192', score: 92, notes: 'Managing 14 commercial units in zip ' + (zipCode || '24011') },
          { name: 'Sarah Jenkins', company: 'Summit Business Park', email: 'sjenkins@summitpark.com', phone: '(540) 555-0834', score: 88, notes: 'Looking for priority recurring service agreement.' }
        ]
      });
    }

    // 5. SEO AUDIT
    if (type === 'seo') {
      const { domain } = req.body;
      return res.status(200).json({
        domain: domain || 'yoursite.com',
        score: 84,
        speedRating: 'Fast (1.2s LCP)',
        mobileOptimized: true,
        recommendations: [
          'Add Google Business Profile phone call tracking widget',
          'Include 3 additional localized keywords in header meta tags'
        ]
      });
    }

    return res.status(400).json({ error: 'Invalid AI type specified.' });
  } catch (err) {
    console.error('AI generator endpoint error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
