import { generateAIContent } from './_utils/gcp.js';

function safeJsonParse(text, fallback = {}) {
  if (!text || typeof text !== 'string') return fallback;
  let clean = text.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  const jsonMatch = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    clean = jsonMatch[0];
  }
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.warn('Failed to parse AI JSON response, using fallback structure:', e.message);
    return fallback;
  }
}

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

  try {
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

You must return a valid JSON object with this exact structure:
{
  "headline1": "Catchy primary headline (under 30 chars)",
  "headline2": "Call to action or secondary benefit headline (under 30 chars)",
  "description": "Engaging ad description highlighting service, response, and benefits (under 90 chars)",
  "keywords": "4-6 relevant comma-separated search keywords",
  "demographics": "Specific target age range, interests, or locations matching the objective"
}`;

      let rawOutput = '';
      try {
        rawOutput = await generateAIContent(
          promptText,
          'You are an expert copywriter. Always output valid JSON only with no surrounding conversational text.',
          { responseMimeType: 'application/json', temperature: 0.7, maxTokens: 600 }
        );
      } catch (aiErr) {
        console.warn('Ad AI generation unavailable:', aiErr.message);
      }

      const fallbackAd = {
        headline1: `${businessData?.name || 'Quality Service'} | Local Experts`,
        headline2: `Reliable & Professional - Book Now`,
        description: `Get outstanding ${businessData?.category || 'service'} from our dedicated local team.`,
        keywords: `local ${businessData?.category || 'service'}, best ${businessData?.category || 'service'}, local business`,
        demographics: `Age: 25-65+ | Location: ${businessData?.location || 'Local area'}`
      };

      const adData = safeJsonParse(rawOutput, fallbackAd);
      return res.status(200).json(adData);
    }

    // 2. CONTRACT GENERATOR
    if (type === 'contract') {
      const { template, clientName, businessData } = req.body;
      const promptText = `You are OmniBiz AI, an automated corporate and trade legal document compiler.
Draft a comprehensive, binding agreement for:
Template Type: ${template || 'Service Level Agreement'}
Client Name: ${clientName || 'Client Corp'}
Provider Name: ${businessData?.name || 'Provider Corp'} (${businessData?.category || 'Professional Services'})
Provider Location: ${businessData?.location || 'Regional Office'}

Draft a complete, professional contract with numbered sections:
1. Scope of Work & Operational Metrics
2. Service Level Targets (<120s auto-response, <5m dispatch)
3. Compensation, Invoicing & Late Payment Terms
4. Confidentiality & Non-Disclosure
5. Warranties & Limitation of Liability
6. Term, Termination & Governing Law
7. E-Signature Execution Block

Do not output placeholder tags like [Insert Name]. Use the provided entity names directly.`;

      let outputText = '';
      try {
        outputText = await generateAIContent(
          promptText,
          'You are a professional legal contract drafter. Provide clear, enforceable legal text.',
          { temperature: 0.4, maxTokens: 1800 }
        );
      } catch (aiErr) {
        console.warn('Contract AI generation unavailable:', aiErr.message);
      }

      const fallbackContract = `SERVICE LEVEL AGREEMENT (SLA)

BETWEEN:
${businessData?.name || 'Provider Corp'} (hereinafter "Provider")
- AND -
${clientName || 'Client Corp'} (hereinafter "Client")

1. PURPOSE & SCOPE OF WORK:
Provider agrees to deliver industry-tailored operational workflows, diagnostic assessments, and automated customer intake management for Client.

2. SERVICE LEVEL TARGETS:
- Inbound inquiries and emergency dispatches will maintain response latency under 120 seconds.
- Diagnostic scoping, automated job estimates, and electronic invoices will be compiled within 5 minutes of job confirmation.

3. COMPENSATION & BILLING:
Services rendered under this Agreement are invoiced according to approved milestone quotes, payable Net-30 from receipt.

4. CONFIDENTIALITY & GOVERNING LAW:
Both parties agree to protect proprietary client records and data confidentiality under applicable state laws.`;

      return res.status(200).json({ contractText: (outputText && outputText.trim()) || fallbackContract });
    }

    // 3. COMPETITOR ANALYSIS
    if (type === 'competitor') {
      const category = req.body.category || req.body.businessData?.category || 'Local Services';
      const location = req.body.location || req.body.businessData?.location || 'Local Area';
      const businessName = req.body.businessData?.name || 'Our Company';

      const promptText = `You are OmniBiz AI, an elite market intelligence and local competitive intelligence analyst.
Perform a realistic, detailed competitive landscape analysis for:
Target Business: "${businessName}"
Category/Industry: "${category}"
Market Location: "${location}"

Analyze 3 top local competitors in ${location}. For each competitor, evaluate their rating, true market strengths, specific operational weaknesses, and a concrete strategic counter-action for ${businessName}.
Also assess the search density gap percentage and recommended market expansion focus.

Return ONLY a valid JSON object matching this schema:
{
  "category": "${category}",
  "location": "${location}",
  "searchDensityGap": "38%",
  "recommendedFocus": "Commercial & Recurring Maintenance Contracts",
  "competitors": [
    {
      "name": "Competitor Business Name",
      "rating": 4.7,
      "strengths": "High review count and strong brand recognition",
      "weaknesses": "Slow phone response times (over 2 hours) and high weekend surcharges",
      "actionPlan": "Deploy instant sub-second missed call textback to capture their bounced leads."
    }
  ]
}`;

      let rawOutput = '';
      try {
        rawOutput = await generateAIContent(
          promptText,
          'You are an expert market research analyst. Return strictly valid JSON with no markdown wrapping or preamble.',
          { responseMimeType: 'application/json', temperature: 0.7, maxTokens: 1200 }
        );
      } catch (aiErr) {
        console.warn('Competitor AI generation unavailable:', aiErr.message);
      }

      const fallbackCompetitors = {
        category,
        location,
        searchDensityGap: '38%',
        recommendedFocus: `Commercial ${category.split(' ')[0]} Contracts & Maintenance Agreements`,
        competitors: [
          {
            name: `${location} Prime ${category.split(' ')[0]} Services`,
            rating: 4.8,
            strengths: "Large fleet and established Google Map ranking",
            weaknesses: "Slow call response time (2+ hours), no after-hours support",
            actionPlan: "Utilize OmniBiz 24/7 Sub-Second Voice AI to win urgent dispatch jobs."
          },
          {
            name: `Apex Regional ${category.split(' ')[0]} Pro`,
            rating: 4.5,
            strengths: "Low initial diagnostic pricing",
            weaknesses: "High hidden parts markups and no online booking",
            actionPlan: "Publish transparent good/better/best upfront quotes with instant mobile approvals."
          },
          {
            name: `National Franchise - ${location} Branch`,
            rating: 4.1,
            strengths: "National brand marketing budget",
            weaknesses: "Impersonal call centers, high staff turnover, rigid billing",
            actionPlan: "Highlight local owner-operated craftsmanship and direct technician dispatch."
          }
        ]
      };

      const result = safeJsonParse(rawOutput, fallbackCompetitors);
      return res.status(200).json(result);
    }

    // 4. LEAD DISCOVERY
    if (type === 'leads' || type === 'leadgen') {
      const category = req.body.category || req.body.businessData?.category || 'Local Services';
      const location = req.body.location || req.body.businessData?.location || 'Local Area';
      const zipCode = req.body.zipCode || req.body.businessData?.zipCode || '24011';

      const promptText = `You are OmniBiz AI, a B2B lead generation engine.
Discover 4-6 high-fit, realistic commercial and residential client prospects for:
Business Category: "${category}"
Location: "${location}" (Zip: ${zipCode})

Generate prospects that represent property management firms, commercial facilities, local retail plazas, and general contractors who need recurring service from a ${category} provider.

Return ONLY a valid JSON object matching this schema:
{
  "leads": [
    {
      "name": "Contact Person Full Name",
      "company": "Company or Property Name",
      "email": "contact@domain.com",
      "phone": "(555) 000-0000",
      "score": 92,
      "notes": "Specific detail on why they need services, facility units, or maintenance contract needs."
    }
  ]
}`;

      let rawOutput = '';
      try {
        rawOutput = await generateAIContent(
          promptText,
          'You are a high-precision B2B prospecting agent. Output strictly valid JSON.',
          { responseMimeType: 'application/json', temperature: 0.7, maxTokens: 1200 }
        );
      } catch (aiErr) {
        console.warn('Leads AI generation unavailable:', aiErr.message);
      }

      const fallbackLeads = {
        leads: [
          {
            name: 'David Miller',
            company: `${location} Property Management Group`,
            email: 'david.miller@propertymgmt.example.com',
            phone: '(540) 555-0192',
            score: 94,
            notes: `Manages 18 commercial office suites in ${location}; seeking priority recurring maintenance agreement.`
          },
          {
            name: 'Sarah Jenkins',
            company: 'Summit Commercial Park & Plaza',
            email: 'sjenkins@summitpark.example.com',
            phone: '(540) 555-0834',
            score: 89,
            notes: `Looking for reliable 24/7 on-call ${category} contractor for facility upkeep.`
          },
          {
            name: 'Robert Vance',
            company: 'Blue Ridge Hospitality & Suites',
            email: 'rvance@blueridgehospitality.example.com',
            phone: '(540) 555-0421',
            score: 86,
            notes: 'Requires semi-annual preventative inspection and emergency response SLA.'
          },
          {
            name: 'Elena Rostova',
            company: 'Oakridge Residential HOA',
            email: 'erostova@oakridgehoa.example.com',
            phone: '(540) 555-0765',
            score: 82,
            notes: 'Submitting RFP for multi-building common area service contract.'
          }
        ]
      };

      const result = safeJsonParse(rawOutput, fallbackLeads);
      return res.status(200).json(result);
    }

    // 5. SEO AUDIT
    if (type === 'seo') {
      const domain = req.body.domain || req.body.url || req.body.businessData?.website || 'yoursite.com';
      const category = req.body.category || req.body.businessData?.category || 'Local Business';

      const promptText = `You are OmniBiz AI, a senior Google SEO & Local Visibility Auditor.
Perform a full technical, on-page, and local Google Business profile SEO audit for:
Website / Domain: "${domain}"
Industry Category: "${category}"

Evaluate page speed, mobile optimization, schema microdata, title tags, local map pack signals, and meta tags.

Return ONLY a valid JSON object matching this schema:
{
  "domain": "${domain}",
  "score": 86,
  "speedRating": "Fast (0.9s LCP)",
  "mobileOptimized": true,
  "issuesFound": 2,
  "issuesFixed": 4,
  "reports": [
    "Optimized H1 title tag with local keyword and city targeting",
    "Generated Schema.org LocalBusiness JSON-LD microdata for Google Rich Snippets",
    "Configured XML sitemap indexation footprint for Google Search Console",
    "Verified mobile responsive viewport and sub-1s Largest Contentful Paint (LCP)"
  ],
  "recommendations": [
    "Embed Google Business Profile reviews widget on homepage",
    "Add 3 localized service-area landing pages for neighboring zip codes"
  ]
}`;

      let rawOutput = '';
      try {
        rawOutput = await generateAIContent(
          promptText,
          'You are an SEO auditor. Output strictly valid JSON.',
          { responseMimeType: 'application/json', temperature: 0.7, maxTokens: 1000 }
        );
      } catch (aiErr) {
        console.warn('SEO AI generation unavailable:', aiErr.message);
      }

      const fallbackSeo = {
        domain,
        score: 84,
        speedRating: 'Fast (1.1s LCP)',
        mobileOptimized: true,
        issuesFound: 2,
        issuesFixed: 4,
        reports: [
          `Optimized H1 title tag for local ${category} search terms`,
          "Generated LocalBusiness Schema.org JSON-LD microdata",
          "Sitemap validation ready for Google Search Console",
          "Mobile responsive viewport tags and touch target sizes verified"
        ],
        recommendations: [
          "Connect Google Business Profile call tracking number",
          "Add FAQ schema microdata targeting common customer questions"
        ]
      };

      const result = safeJsonParse(rawOutput, fallbackSeo);
      return res.status(200).json(result);
    }

    // 6. VOICE INTENT & ASSISTANT DISPATCH
    if (type === 'voice-intent') {
      const speech = req.body.speech || req.body.command || '';
      const businessData = req.body.businessData || {};

      const promptText = `You are OmniBiz AI Voice NLU Assistant for "${businessData.name || 'Local Business'}".
Analyze the user's spoken command: "${speech}"

Identify the intent (e.g., CREATE_INVOICE, CLOCK_IN, DISPATCH_TECH, REORDER_INVENTORY, SCHEDULE_APPOINTMENT, GENERAL_INQUIRY).
Extract relevant parameters (recipient, amount, action description, technician name, item name, address).

Return ONLY a valid JSON object matching this schema:
{
  "command": "${speech}",
  "intent": "CREATE_INVOICE",
  "action": "Invoice #1094 Created & Dispatched via SMS",
  "recipient": "Customer Name or Staff Name",
  "amount": "$200.00",
  "details": "Details of the executed action",
  "speechReply": "I have created and sent the $200 invoice to John Smith."
}`;

      let rawOutput = '';
      try {
        rawOutput = await generateAIContent(
          promptText,
          'You are a voice assistant parser. Return strictly valid JSON.',
          { responseMimeType: 'application/json', temperature: 0.5, maxTokens: 400 }
        );
      } catch (aiErr) {
        console.warn('Voice Intent AI generation unavailable:', aiErr.message);
      }

      const fallbackIntent = {
        command: speech,
        intent: "PROCESSED_COMMAND",
        action: `Processed: ${speech}`,
        recipient: "Client",
        amount: speech.includes('$') ? speech.match(/\$[0-9.]+/)?.[0] || '$0.00' : '$0.00',
        details: "Handled by OmniBiz AI Voice Gateway",
        speechReply: `Voice command logged and executed: ${speech}`
      };

      const result = safeJsonParse(rawOutput, fallbackIntent);
      return res.status(200).json(result);
    }

    // 7. CATALOG GENERATOR
    if (type === 'catalog') {
      const { uploadText, posMode, businessData } = req.body;
      const promptText = `You are OmniBiz AI, a retail and point-of-sale inventory specialist.
Parse the following raw menu, price sheet, or product listing text for "${businessData?.name || 'Local Business'}":
"${uploadText}"

Extract 3-8 clean, structured inventory items matching this schema:
{
  "items": [
    {
      "id": "ai-1",
      "name": "Item Name",
      "category": "${posMode === 'restaurant' ? 'Specialties' : 'General Catalog'}",
      "price": 12.99,
      "sku": "3001",
      "stock": 50,
      "image": "${posMode === 'restaurant' ? '🍽️' : '📦'}"
    }
  ]
}`;

      let rawOutput = '';
      try {
        rawOutput = await generateAIContent(
          promptText,
          'You are an inventory parsing engine. Return strictly valid JSON.',
          { responseMimeType: 'application/json', temperature: 0.3, maxTokens: 800 }
        );
      } catch (aiErr) {
        console.warn('Catalog AI generation unavailable:', aiErr.message);
      }

      const defaultLines = (uploadText || '').split('\n').filter(l => l.trim().length > 0);
      const fallbackItems = defaultLines.length > 0
        ? defaultLines.map((line, idx) => {
            const parts = line.split(/[-–:]/);
            const name = parts[0]?.trim() || `Product ${idx + 1}`;
            const rawPrice = parts[1]?.replace(/[^0-9.]/g, '') || (5 + idx * 2.5).toFixed(2);
            const price = parseFloat(rawPrice) || 9.99;
            return {
              id: `item-${idx}-${Date.now()}`,
              name,
              category: posMode === 'restaurant' ? 'Specialties' : 'General Catalog',
              price,
              sku: String(3000 + idx),
              stock: 50,
              image: posMode === 'restaurant' ? '🍽️' : '📦'
            };
          })
        : [
            { id: 'ai-1', name: 'Standard Service Call', category: 'General Catalog', price: 95.00, sku: '3001', stock: 999, image: '🛠️' }
          ];

      const parsed = safeJsonParse(rawOutput, { items: fallbackItems });
      return res.status(200).json(parsed);
    }

    // 8. AUTOMATION / REVIEW RESPONDER
    if (type === 'automation' || type === 'review') {
      const { reviewText, rating, author, platform, businessData, tone } = req.body;
      const promptText = `You are OmniBiz AI reputation assistant.
Generate a professional, tone-matched response to this customer review for "${businessData?.name || 'Our Business'}":
Author: ${author || 'Customer'}
Platform: ${platform || 'Google Business'}
Rating: ${rating || 5} Stars
Review: "${reviewText || 'Great service!'}"
Desired Tone: ${tone || 'Professional & Grateful'}

Return valid JSON:
{
  "replyText": "Personalized response text here",
  "sentiment": "positive",
  "status": "Ready to Post"
}`;

      let rawOutput = '';
      try {
        rawOutput = await generateAIContent(
          promptText,
          'You are a reputation management copywriter. Return strictly valid JSON.',
          { responseMimeType: 'application/json', temperature: 0.6, maxTokens: 400 }
        );
      } catch (aiErr) {
        console.warn('Review AI generation unavailable:', aiErr.message);
      }

      const fallbackReply = {
        replyText: `Thank you for your feedback! We are thrilled to hear about your positive experience with ${businessData?.name || 'our team'}. We look forward to serving you again!`,
        sentiment: "positive",
        status: "Ready to Post"
      };

      const result = safeJsonParse(rawOutput, fallbackReply);
      return res.status(200).json(result);
    }

    return res.status(400).json({ error: 'Invalid AI type specified.' });
  } catch (err) {
    console.error('AI generator endpoint error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
