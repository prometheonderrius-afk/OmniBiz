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

  const { uid, text } = req.body;
  if (!uid || !text) {
    return res.status(400).json({ error: 'uid and text are required.' });
  }

  const projectId = "wacom-canvas";

  try {
    // 1. Fetch the user profile from Firestore REST API
    const userDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
    const userResponse = await fetch(userDocUrl);
    
    if (!userResponse.ok) {
      return res.status(404).json({ error: 'Business profile not found or database error.' });
    }

    const userDoc = await userResponse.json();
    
    // Parse businessData and autopilot from Firestore REST format
    // Firestore REST API returns fields in a structured format: e.g. fields: { autopilot: { booleanValue: true } }
    const fields = userDoc.fields || {};
    const autopilot = fields.autopilot?.booleanValue || false;
    const selectedTier = fields.selectedTier?.stringValue || 'free';
    const savedHours = parseFloat(fields.savedHours?.doubleValue || fields.savedHours?.integerValue || '12.5');
    
    let businessData = {};
    if (fields.businessData?.mapValue?.fields) {
      const bFields = fields.businessData.mapValue.fields;
      businessData = {
        name: bFields.name?.stringValue || '',
        category: bFields.category?.stringValue || 'Local Business',
        location: bFields.location?.stringValue || '',
        goals: bFields.goals?.stringValue || ''
      };
    }

    // 2. Write the visitor's message to Firestore using REST API
    const chatColUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/webChat`;
    const visitorMsgBody = {
      fields: {
        sender: { stringValue: 'Visitor' },
        text: { stringValue: text },
        isUser: { booleanValue: false },
        createdAt: { integerValue: Date.now().toString() } // Firestore REST expects integer fields as strings representing numbers
      }
    };

    const writeVisitorResponse = await fetch(chatColUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visitorMsgBody)
    });

    if (!writeVisitorResponse.ok) {
      const writeErr = await writeVisitorResponse.json();
      throw new Error(`Firestore REST write failed: ${JSON.stringify(writeErr)}`);
    }

    let autoReplyText = '';
    let autoReplied = false;

    // 3. If Autopilot is active and tier is eligible (pro or enterprise), trigger AI response
    const hasAutopilot = autopilot && (selectedTier === 'pro' || selectedTier === 'enterprise');
    if (hasAutopilot) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are OmniBiz AI, an automated live-chat customer assistant for the business "${businessData.name || 'our company'}" (Category: "${businessData.category || 'Local Business'}").
Your business is located in: "${businessData.location || 'our service area'}".
Business Goals/Details: "${businessData.goals || 'provide top quality services'}".

The visitor just typed: "${text}".
Draft a professional, friendly, and helpful live-chat response. Keep it under 60 words. Speak on behalf of the business. Do not use placeholders or markdown formatting.`
              }]
            }],
            generationConfig: {
              maxOutputTokens: 150,
              temperature: 0.7
            }
          })
        });

        const geminiData = await response.json();
        const draft = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (draft) {
          autoReplyText = draft.trim();
          
          // Write the AI reply to Firestore using REST API
          const aiMsgBody = {
            fields: {
              sender: { stringValue: 'OmniBiz AI' },
              text: { stringValue: autoReplyText },
              isUser: { booleanValue: true },
              createdAt: { integerValue: Date.now().toString() }
            }
          };

          await fetch(chatColUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiMsgBody)
          });

          // Update user stats in Firestore (patch request for partial updates)
          const patchUrl = `${userDocUrl}?updateMask.fieldPaths=savedHours`;
          const patchBody = {
            fields: {
              savedHours: { doubleValue: savedHours + 0.2 }
            }
          };

          await fetch(patchUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patchBody)
          });

          // Write system notification using REST API
          const notifyUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/notifications`;
          const notifyBody = {
            fields: {
              text: { stringValue: `Autopilot website chat auto-response dispatched to visitor.` },
              type: { stringValue: 'auto' },
              createdAt: { integerValue: Date.now().toString() }
            }
          };

          await fetch(notifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notifyBody)
          });

          autoReplied = true;
        }
      }
    }

    return res.status(200).json({
      success: true,
      autopilotActive: hasAutopilot,
      autoReplied,
      reply: autoReplyText
    });

  } catch (error) {
    console.error('Webchat REST API webhook error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
