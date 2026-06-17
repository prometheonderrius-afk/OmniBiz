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

  const projectId = "wacom-canvas";
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

    // 4. Run Gemini to generate conversational response
    const apiKey = process.env.GEMINI_API_KEY;
    let replyText = `Thanks for your message! One of our team members at ${businessData.name} will check this out and get back to you shortly.`;

    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const staffString = businessData.employees?.map(e => `${e.name} (${e.role})`).join(', ') || 'none';
        
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are the AI virtual receptionist for "${businessData.name}" (Category: "${businessData.category}").
Owner name: "${businessData.ownerName}".
Active Staff: ${staffString}.
Our target audience: "${businessData.targetAudience}".

Here is the conversation history with this customer so far:
${historyText}
Client: ${Body}

Draft a professional, friendly, and helpful text response to the customer. Keep it under 50 words. Speak on behalf of the business. Do not use placeholders or markdown formatting.`
              }]
            }],
            generationConfig: {
              maxOutputTokens: 120,
              temperature: 0.7
            }
          })
        });

        const geminiData = await response.json();
        const output = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (output) {
          replyText = output.trim();
        }
      } catch (geminiErr) {
        console.error('Gemini prompt generation failed for SMS reply:', geminiErr);
      }
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

    // 7. Return standard TwiML XML reply response to Twilio
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
