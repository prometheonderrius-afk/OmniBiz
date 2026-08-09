import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// API Handlers
import aiGenerateHandler from './api/ai-generate.js';
import sendEmailHandler from './api/send-email.js';
import sendSmsHandler from './api/send-sms.js';
import ttsHandler from './api/tts.js';
import adminSettingsHandler from './api/admin-settings.js';
import trialReplyHandler from './api/trial-reply-handler.js';
import twilioMissedCallHandler from './api/twilio-missed-call.js';
import twilioSmsReplyHandler from './api/twilio-sms-reply.js';
import twilioVoiceAgentHandler from './api/twilio-voice-agent.js';
import webchatMessageHandler from './api/webchat-message.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express wrapper helper for serverless Vercel handlers
const wrapHandler = (handler, defaultType) => async (req, res) => {
  if (defaultType) {
    req.query = req.query || {};
    req.query.type = defaultType;
  }
  try {
    await handler(req, res);
  } catch (err) {
    console.error('API Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }
};

// Register API Routes
app.all('/api/ai-generate', wrapHandler(aiGenerateHandler));
app.all('/api/generate-ad', wrapHandler(aiGenerateHandler, 'ad'));
app.all('/api/generate-contract', wrapHandler(aiGenerateHandler, 'contract'));
app.all('/api/competitor-analysis', wrapHandler(aiGenerateHandler, 'competitor'));
app.all('/api/discover-leads', wrapHandler(aiGenerateHandler, 'leads'));
app.all('/api/seo-audit', wrapHandler(aiGenerateHandler, 'seo'));

app.all('/api/send-email', wrapHandler(sendEmailHandler));
app.all('/api/send-sms', wrapHandler(sendSmsHandler));
app.all('/api/tts', wrapHandler(ttsHandler));
app.all('/api/admin-settings', wrapHandler(adminSettingsHandler));
app.all('/api/trial-reply-handler', wrapHandler(trialReplyHandler));
app.all('/api/twilio-missed-call', wrapHandler(twilioMissedCallHandler));
app.all('/api/twilio-sms-reply', wrapHandler(twilioSmsReplyHandler));
app.all('/api/twilio-voice-agent', wrapHandler(twilioVoiceAgentHandler));
app.all('/api/webchat-message', wrapHandler(webchatMessageHandler));

// Serve Vite build output in production
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 OmniBiz AI GCP Server running on port ${PORT}`);
});
