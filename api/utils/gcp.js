import admin from 'firebase-admin';
import { VertexAI } from '@google-cloud/vertexai';

const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || 'zany-passkey-d9st9';

// 1. Initialize Firebase Admin SDK
// This allows serverless functions to securely read/write to Firestore bypassing client rules.
if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
      const credentials = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
        projectId: credentials.project_id || GCP_PROJECT_ID
      });
      console.log('Firebase Admin initialized via Service Account JSON.');
    } else {
      // Fallback for Vercel/Local if Application Default Credentials are used
      admin.initializeApp({
        projectId: GCP_PROJECT_ID
      });
      console.log('Firebase Admin initialized via Default Credentials.');
    }
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

export const dbAdmin = admin.firestore();

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
