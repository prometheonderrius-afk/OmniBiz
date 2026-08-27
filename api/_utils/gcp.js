import admin, { getApps, initializeApp, cert } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { VertexAI } from '@google-cloud/vertexai';

const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || 'zany-passkey-d9st9';

// 1. Initialize Firebase Admin SDK
// This allows serverless functions to securely read/write to Firestore bypassing client rules.
if (!getApps().length) {
  try {
    const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
      const credentials = JSON.parse(serviceAccountJson);
      initializeApp({
        credential: cert(credentials),
        projectId: credentials.project_id || GCP_PROJECT_ID
      });
      console.log('Firebase Admin initialized via Service Account JSON.');
    } else {
      // Fallback for Vercel/Local if Application Default Credentials are used
      initializeApp({
        projectId: GCP_PROJECT_ID
      });
      console.log('Firebase Admin initialized via Default Credentials.');
    }
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

export const dbAdmin = getApps().length ? getFirestore() : null;

// 2. Initialize Vertex AI SDK
// This securely connects to the GCP project to consume GenAI credits.
export const vertexAI = new VertexAI({
  project: GCP_PROJECT_ID,
  location: 'us-central1' // Default region for Vertex AI
});

/**
 * Helper function to generate content using Vertex AI Gemini.
 */
export async function generateContentVertex(prompt, systemInstruction = null, config = {}) {
  try {
    const modelOptions = {
      model: config.model || 'gemini-1.5-flash-001',
      generationConfig: {
        maxOutputTokens: config.maxTokens || 256,
        temperature: config.temperature !== undefined ? config.temperature : 0.7,
      }
    };

    if (config.responseMimeType) {
      modelOptions.generationConfig.responseMimeType = config.responseMimeType;
    }
    
    // Add tools (e.g. google search grounding)
    if (config.tools) {
      modelOptions.tools = config.tools;
    }
    
    // Add system instruction if provided (for context like persona)
    if (systemInstruction) {
      modelOptions.systemInstruction = {
        role: "system",
        parts: [{ text: systemInstruction }]
      };
    }
    
    const generativeModel = vertexAI.preview.getGenerativeModel(modelOptions);
    const request = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    };
    
    const streamingResp = await generativeModel.generateContent(request);
    const response = await streamingResp.response;
    
    if (response.candidates && response.candidates.length > 0) {
      return response.candidates[0].content.parts[0].text;
    }
    return '';
  } catch (error) {
    console.error("Vertex AI Generation Error:", error);
    throw error;
  }
}

/**
 * Unified GenAI caller:
 * 1. Tries Vertex AI SDK on project zany-passkey-d9st9 via generateContentVertex.
 * 2. If Vertex AI fails or credentials are unavailable, seamlessly falls back to Google AI Studio Gemini API using GEMINI_API_KEY.
 */
export async function generateAIContent(prompt, systemInstruction = null, config = {}) {
  // 1. Try Vertex AI SDK first
  try {
    const text = await generateContentVertex(prompt, systemInstruction, config);
    if (text && typeof text === 'string' && text.trim().length > 0) {
      return text;
    }
  } catch (vertexErr) {
    console.warn('Vertex AI SDK invocation unavailable or failed, falling back to Gemini AI Studio:', vertexErr.message);
  }

  // 2. Fallback to Gemini AI Studio API
  const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const model = config.model || 'gemini-1.5-flash';
      const studioModel = model.includes('gemini-2.5') ? 'gemini-2.5-flash' : 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${studioModel}:generateContent?key=${apiKey}`;

      const payload = {
        contents: [
          {
            parts: [{ text: systemInstruction ? `[SYSTEM INSTRUCTION: ${systemInstruction}]\n\n${prompt}` : prompt }]
          }
        ],
        generationConfig: {
          temperature: config.temperature !== undefined ? config.temperature : 0.7,
          maxOutputTokens: config.maxTokens || 1500
        }
      };

      if (config.responseMimeType) {
        payload.generationConfig.responseMimeType = config.responseMimeType;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const output = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (output) return output;
      } else {
        const errText = await res.text();
        console.warn('Gemini AI Studio API responded with error:', errText);
      }
    } catch (studioErr) {
      console.warn('Gemini AI Studio fallback invocation error:', studioErr.message);
    }
  }

  throw new Error('Both Vertex AI and Gemini AI Studio completions failed or were unconfigured.');
}

