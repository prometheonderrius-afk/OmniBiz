import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBvUqb-NMr_9lvE-7gpuSjnNImfzaYySKo",
  authDomain: "wacom-canvas.firebaseapp.com",
  projectId: "wacom-canvas",
  storageBucket: "wacom-canvas.firebasestorage.app",
  messagingSenderId: "948691108517",
  appId: "1:948691108517:web:b8412b3428bec908ddc34c"
};

// Initialize Firebase once
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);
    
    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'Business profile not found.' });
    }

    const userData = userSnap.data();
    const businessData = userData.businessData || {};
    const autopilot = userData.autopilot || false;
    const selectedTier = userData.selectedTier || 'free';
    const savedHours = userData.savedHours || 12.5;

    // 1. Write the visitor's message to Firestore
    const chatColRef = collection(db, 'users', uid, 'webChat');
    const visitorMsgRef = await addDoc(chatColRef, {
      sender: 'Visitor',
      text: text,
      isUser: false,
      createdAt: Date.now()
    });

    let autoReplyText = '';
    let autoReplied = false;

    // 2. If Autopilot is active and tier is eligible (pro or enterprise), trigger AI response
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

        const data = await response.json();
        const draft = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (draft) {
          autoReplyText = draft.trim();
          
          // Write the AI reply to Firestore
          await addDoc(chatColRef, {
            sender: 'OmniBiz AI',
            text: autoReplyText,
            isUser: true,
            createdAt: Date.now()
          });

          // Update user stats
          await updateDoc(userDocRef, {
            savedHours: savedHours + 0.2
          });

          // Add notification
          await addDoc(collection(db, 'users', uid, 'notifications'), {
            text: `Autopilot website chat auto-response dispatched to visitor.`,
            type: "auto",
            createdAt: Date.now()
          });

          autoReplied = true;
        }
      }
    }

    return res.status(200).json({
      success: true,
      visitorMessageId: visitorMsgRef.id,
      autopilotActive: hasAutopilot,
      autoReplied,
      reply: autoReplyText
    });

  } catch (error) {
    console.error('Webchat webhook error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
