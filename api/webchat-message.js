import { dbAdmin, generateContentVertex } from './_utils/gcp.js';

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

  try {
    // 1. Fetch the user profile using Firebase Admin
    const userRef = dbAdmin.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Business profile not found.' });
    }

    const userData = userDoc.data();
    const autopilot = userData.autopilot || false;
    const selectedTier = userData.selectedTier || 'free';
    const savedHours = parseFloat(userData.savedHours || 12.5);
    const businessData = userData.businessData || {};

    // 2. Write the visitor's message to Firestore securely via Admin SDK
    const webChatRef = userRef.collection('webChat');
    await webChatRef.add({
      sender: 'Visitor',
      text: text,
      isUser: false,
      createdAt: Date.now()
    });

    let autoReplyText = '';
    let autoReplied = false;

    // 3. If Autopilot is active and tier is eligible (pro or enterprise), trigger Vertex AI response
    const hasAutopilot = autopilot && (selectedTier === 'pro' || selectedTier === 'enterprise');
    
    if (hasAutopilot) {
      const prompt = `The visitor just typed: "${text}"\nDraft a professional, friendly, and helpful live-chat response. Keep it under 60 words. Speak on behalf of the business. Do not use placeholders or markdown formatting.`;
      
      const systemInstruction = `You are OmniBiz AI, an automated live-chat customer assistant for the business "${businessData.name || 'our company'}" (Category: "${businessData.category || 'Local Business'}").
Your business is located in: "${businessData.location || 'our service area'}".
Business Owner Name: "${businessData.ownerName || 'Owner'}".
Business Staff Members: ${businessData.employees?.map(e => `${e.name} (${e.role})`).join(', ') || 'none'}.
Business Goals/Details: "${businessData.goals || 'provide top quality services'}".`;

      // Use GCP Vertex AI to generate content securely using their credits
      const draft = await generateContentVertex(prompt, systemInstruction, { maxTokens: 150, temperature: 0.7 });
      
      if (draft) {
        autoReplyText = draft.trim();
        
        // Write the AI reply to Firestore using Firebase Admin
        await webChatRef.add({
          sender: 'OmniBiz AI',
          text: autoReplyText,
          isUser: true,
          createdAt: Date.now()
        });

        // Update user stats in Firestore
        await userRef.update({
          savedHours: savedHours + 0.2
        });

        // Write system notification
        await userRef.collection('notifications').add({
          text: `Autopilot website chat auto-response dispatched to visitor.`,
          type: 'auto',
          createdAt: Date.now()
        });

        autoReplied = true;
      }
    }

    return res.status(200).json({
      success: true,
      autopilotActive: hasAutopilot,
      autoReplied,
      reply: autoReplyText
    });

  } catch (error) {
    console.error('Webchat Webhook Error (GCP Version):', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
