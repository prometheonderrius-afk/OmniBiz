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

  const { template, clientName, businessData } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API Configuration Error', 
      message: 'GEMINI_API_KEY is not defined in serverless environment variables.' 
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const promptText = `You are OmniBiz AI, a professional legal and operations document compiler.
Draft a highly detailed, formal, legally structured, and complete document for:
Template Type: ${template || 'Agreement'}
Client Business Name: ${clientName || 'Client Corp'}
Provider Business Profile:
- Company Name: ${businessData?.name || 'Provider Corp'}
- Category/Industry: ${businessData?.category || 'Professional Services'}
- Location: ${businessData?.location || 'Local Area'}
- Description: ${businessData?.description || 'Automation & Management Services'}

Requirements:
1. Write the document as a formal agreement or contract (e.g. Service Level Agreement, Non-Disclosure Agreement).
2. Incorporate both parties' details.
3. Tailor the scope of services, confidentiality rules, and performance guidelines to the provider's specific category/industry (${businessData?.category || 'Professional Services'}).
4. Structure the document with numbered sections, definitions, clear responsibilities, fee structures/terms, and formal execution/signature blocks.
5. Do not include markdown codeblocks or quotes. Return only the raw drafted document text. Ensure the tone is extremely professional, clear, and comprehensive. Use standard placeholder brackets for any specific items that need manual review (e.g. [Date], [Effective Period]).`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1500
        }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(502).json({ error: 'Gemini API Error', details: data.error });
    }

    const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!outputText.trim()) {
      throw new Error("Empty response received from Gemini API");
    }

    return res.status(200).json({ contractText: outputText.trim() });
    
  } catch (error) {
    console.error('Gemini contract call error:', error);
    // Return a structured mockup matching the requested template in case of failure
    let fallbackText = '';
    if (template === 'Non-Disclosure Agreement') {
      fallbackText = `MUTUAL NON-DISCLOSURE AGREEMENT (NDA)

BETWEEN:
${businessData?.name || 'Provider Corp'}
- AND -
${clientName || 'Client Corp'}

1. PURPOSE:
The parties wish to explore a business opportunity concerning automated workflows, local search metrics, and client database profiles. In connection with this, parties will share proprietary customer logs.

2. CONFIDENTIALITY:
Neither party shall disclose, copy, or distribute confidential records, client phone coordinates, or custom campaign statistics to third-party marketing brokers. All data is protected by high-standard database keys.`;
    } else {
      fallbackText = `SERVICE LEVEL AGREEMENT (SLA)

BETWEEN:
${businessData?.name || 'Provider Corp'} (hereinafter "Provider")
- AND -
${clientName || 'Client Corp'} (hereinafter "Client")

1. PURPOSE & SCOPE:
This Agreement outlines the operational support, response times, and automation metrics provider will supply. provider will integrate custom visibility scanners and response tunnels.

2. SERVICE LEVEL TARGETS:
AI Autopilot response times for missed calls will remain under 120 seconds.
Email responding and drafts will be auto-generated within 5 minutes of client submission.

3. FEES & DURATION:
Services are billed monthly in accordance with the OmniBiz billing settings. This contract remains valid until terminated by either party with 30 days written notice. provider reserves the right to suspend automation tunnels in case of non-payment.`;
    }
    return res.status(200).json({ contractText: fallbackText, fallback: true });
  }
}
