import { dbAdmin, generateAIContent } from './_utils/gcp.js';

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

  const { uid } = req.query;
  const { From, Body } = req.body;

  if (!uid || !From || !Body) {
    // Return empty TwiML if parameters are missing
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
    return res.status(400).setHeader('Content-Type', 'text/xml').send(errorXml);
  }

  console.log(`Received incoming SMS from ${From}: ${Body}`);

  const projectId = process.env.GCP_PROJECT_ID || "zany-passkey-d9st9";
  const userDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
  const smsLogUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/smsLog`;

  try {
    // 1. Fetch user business profile from Firestore REST API
    const userResponse = await fetch(userDocUrl);
    if (!userResponse.ok) {
      throw new Error('User profile not found.');
    }

    const userDoc = await userResponse.json();
    const fields = userDoc.fields || {};
    
    let businessData = {};
    if (fields.businessData?.mapValue?.fields) {
      const bFields = fields.businessData.mapValue.fields;
      businessData = {
        name: bFields.name?.stringValue || 'our company',
        category: bFields.category?.stringValue || 'Local Business',
        location: bFields.location?.stringValue || '',
        ownerName: bFields.ownerName?.stringValue || 'Owner',
        targetAudience: bFields.targetAudience?.stringValue || 'our clients',
        employees: bFields.employees?.arrayValue?.values?.map(v => ({
          name: v.mapValue?.fields?.name?.stringValue || '',
          role: v.mapValue?.fields?.role?.stringValue || ''
        })) || []
      };
    }

    // 2. Fetch conversation history from Firestore REST API
    let historyText = '';
    try {
      const smsLogResponse = await fetch(`${smsLogUrl}?pageSize=15`);
      if (smsLogResponse.ok) {
        const logData = await smsLogResponse.json();
        const docs = logData.documents || [];
        
        // Sort documents chronologically by fields.createdAt
        docs.sort((a, b) => {
          const tA = parseInt(a.fields?.createdAt?.integerValue || '0', 10);
          const tB = parseInt(b.fields?.createdAt?.integerValue || '0', 10);
          return tA - tB;
        });

        historyText = docs.map(d => {
          const sender = d.fields?.sender?.stringValue || 'Client';
          const text = d.fields?.text?.stringValue || '';
          return `${sender}: ${text}`;
        }).join('\n');
      }
    } catch (historyErr) {
      console.warn('Failed to load SMS conversation history:', historyErr);
    }

    // 3. Log the customer's incoming message to Firestore first
    const clientLogBody = {
      fields: {
        sender: { stringValue: 'Client' },
        text: { stringValue: Body },
        isUser: { booleanValue: false },
        createdAt: { integerValue: Date.now().toString() }
      }
    };
    await fetch(smsLogUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientLogBody)
    });

    // 4. Run Vertex AI / Gemini to generate conversational response
    let replyText = `Thanks for your message! One of our team members at ${businessData.name || 'our company'} will check this out and get back to you shortly.`;

    try {
      const staffString = businessData.employees?.map(e => `${e.name} (${e.role})`).join(', ') || 'none';
      const prompt = `Here is the conversation history with this customer so far:
${historyText}
Client: ${Body}

Draft a professional, friendly, and helpful text response to the customer. Keep it under 50 words. Speak on behalf of the business. Do not use placeholders or markdown formatting.`;
      
      const systemInstruction = `You are the AI virtual receptionist for "${businessData.name || 'our company'}" (Category: "${businessData.category || 'Local Business'}").
Owner name: "${businessData.ownerName || 'Owner'}".
Active Staff: ${staffString}.
Our target audience: "${businessData.targetAudience || 'our clients'}".`;

      const output = await generateAIContent(prompt, systemInstruction, { maxTokens: 120, temperature: 0.7 });
      if (output) {
        replyText = output.trim();
      }
    } catch (aiErr) {
      console.warn('AI prompt generation failed for SMS reply, using standard greeting:', aiErr.message);
    }

    // 5. Log the AI response to Firestore smsLog
    const aiLogBody = {
      fields: {
        sender: { stringValue: 'OmniBiz AI' },
        text: { stringValue: replyText },
        isUser: { booleanValue: true },
        createdAt: { integerValue: Date.now().toString() }
      }
    };
    await fetch(smsLogUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aiLogBody)
    });

    // 6. Log system notification
    const notifyUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/notifications`;
    const notifyBody = {
      fields: {
        text: { stringValue: `Live SMS: AI responded to client ${From}.` },
        type: { stringValue: 'auto' },
        createdAt: { integerValue: Date.now().toString() }
      }
    };
    await fetch(notifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notifyBody)
    });

    // 7. Log to admin diagnostic logger
    try {
      await dbAdmin.collection('apiLogs').add({
        timestamp: Date.now(),
        apiName: '/api/twilio-sms-reply',
        status: 'success',
        details: `Auto-replied to client ${From} for UID ${uid}.`
      });
    } catch (logErr) {
      console.warn('Failed to write to apiLogs:', logErr);
    }

    // 8. Return standard TwiML XML reply response to Twilio
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${replyText}</Message>
</Response>`;

    return res.status(200).setHeader('Content-Type', 'text/xml').send(twiml);

  } catch (error) {
    console.error('Twilio SMS webhook processing error:', error);
    // Standard silent fallback XML
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thanks for your message! We will get back to you shortly.</Message></Response>`;
    return res.status(200).setHeader('Content-Type', 'text/xml').send(fallbackXml);
  }
}
