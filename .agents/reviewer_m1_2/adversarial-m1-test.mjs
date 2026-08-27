// Adversarial Test Suite for OmniBiz AI Milestone M1
import aiGenerateHandler from '../../api/ai-generate.js';
import sendSmsHandler from '../../api/send-sms.js';
import adminSettingsHandler from '../../api/admin-settings.js';
import twilioMissedCallHandler from '../../api/twilio-missed-call.js';
import twilioSmsReplyHandler from '../../api/twilio-sms-reply.js';
import twilioVoiceAgentHandler from '../../api/twilio-voice-agent.js';
import sendEmailHandler from '../../api/send-email.js';
import trialReplyHandler from '../../api/trial-reply-handler.js';
import ttsHandler from '../../api/tts.js';
import webchatMessageHandler from '../../api/webchat-message.js';
import { generateAIContent } from '../../api/_utils/gcp.js';

// Mock request / response helpers
function createMockReqRes(options = {}) {
  const req = {
    method: options.method || 'POST',
    url: options.url || '/',
    query: options.query || {},
    body: options.body || {},
    headers: options.headers || {}
  };

  let statusCode = 200;
  let responseData = null;
  let headers = {};
  let ended = false;

  const res = {
    statusCode: 200,
    setHeader(key, val) {
      headers[key.toLowerCase()] = val;
      return this;
    },
    status(code) {
      statusCode = code;
      this.statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      ended = true;
      return this;
    },
    send(data) {
      responseData = data;
      ended = true;
      return this;
    },
    end() {
      ended = true;
      return this;
    },
    get headersSent() {
      return ended;
    },
    _getData: () => responseData,
    _getStatus: () => statusCode,
    _getHeaders: () => headers
  };

  return { req, res };
}

let passedCount = 0;
let failedCount = 0;
const failures = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passedCount++;
    console.log(`  ✓ ${testName}`);
  } else {
    failedCount++;
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
    failures.push({ testName, details });
  }
}

async function runAdversarialTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING ADVERSARIAL STRESS TESTS FOR MILESTONE M1');
  console.log('======================================================\n');

  // 1. Stress-testing /api/ai-generate across all types with empty, null, or extreme payloads
  console.log('--- Test Suite 1: /api/ai-generate Robustness & Fallback ---');

  // 1.1 Type = 'ad' with completely empty body
  {
    const { req, res } = createMockReqRes({ method: 'POST', query: { type: 'ad' }, body: {} });
    await aiGenerateHandler(req, res);
    assert(res._getStatus() === 200, 'ad: returns 200 on empty body', `got status ${res._getStatus()}`);
    const data = res._getData();
    assert(data && typeof data.headline1 === 'string' && data.headline1.length > 0, 'ad: contains valid headline1');
    assert(data && typeof data.headline2 === 'string' && data.headline2.length > 0, 'ad: contains valid headline2');
    assert(data && typeof data.description === 'string' && data.description.length > 0, 'ad: contains valid description');
    assert(data && typeof data.keywords === 'string' && data.keywords.length > 0, 'ad: contains valid keywords');
    assert(data && typeof data.demographics === 'string' && data.demographics.length > 0, 'ad: contains valid demographics');
  }

  // 1.2 Type = 'contract' with empty body
  {
    const { req, res } = createMockReqRes({ method: 'POST', query: { type: 'contract' }, body: {} });
    await aiGenerateHandler(req, res);
    assert(res._getStatus() === 200, 'contract: returns 200 on empty body', `got status ${res._getStatus()}`);
    const data = res._getData();
    assert(data && typeof data.contractText === 'string' && data.contractText.includes('SERVICE'), 'contract: contains valid contractText');
  }

  // 1.3 Type = 'competitor' with empty body
  {
    const { req, res } = createMockReqRes({ method: 'POST', query: { type: 'competitor' }, body: {} });
    await aiGenerateHandler(req, res);
    assert(res._getStatus() === 200, 'competitor: returns 200 on empty body', `got status ${res._getStatus()}`);
    const data = res._getData();
    assert(data && Array.isArray(data.competitors) && data.competitors.length > 0, 'competitor: contains competitors array');
    assert(data && typeof data.searchDensityGap === 'string', 'competitor: contains searchDensityGap');
    assert(data && typeof data.recommendedFocus === 'string', 'competitor: contains recommendedFocus');
    const firstComp = data.competitors[0];
    assert(firstComp && typeof firstComp.name === 'string' && typeof firstComp.rating === 'number', 'competitor: first competitor has name & numeric rating');
  }

  // 1.4 Type = 'leads' with empty body
  {
    const { req, res } = createMockReqRes({ method: 'POST', query: { type: 'leads' }, body: {} });
    await aiGenerateHandler(req, res);
    assert(res._getStatus() === 200, 'leads: returns 200 on empty body', `got status ${res._getStatus()}`);
    const data = res._getData();
    assert(data && Array.isArray(data.leads) && data.leads.length > 0, 'leads: contains leads array');
    const firstLead = data.leads[0];
    assert(firstLead && typeof firstLead.name === 'string' && typeof firstLead.score === 'number', 'leads: first lead has name & numeric score');
    assert(firstLead && typeof firstLead.company === 'string' && typeof firstLead.email === 'string', 'leads: first lead has company and email');
  }

  // 1.5 Type = 'seo' with empty body
  {
    const { req, res } = createMockReqRes({ method: 'POST', query: { type: 'seo' }, body: {} });
    await aiGenerateHandler(req, res);
    assert(res._getStatus() === 200, 'seo: returns 200 on empty body', `got status ${res._getStatus()}`);
    const data = res._getData();
    assert(data && typeof data.domain === 'string', 'seo: contains domain');
    assert(data && typeof data.score === 'number', 'seo: contains numeric score');
    assert(data && Array.isArray(data.reports) && data.reports.length > 0, 'seo: contains reports array');
    assert(data && typeof data.mobileOptimized === 'boolean', 'seo: contains mobileOptimized boolean');
  }

  // 1.6 Type = 'voice-intent' with empty body
  {
    const { req, res } = createMockReqRes({ method: 'POST', query: { type: 'voice-intent' }, body: {} });
    await aiGenerateHandler(req, res);
    assert(res._getStatus() === 200, 'voice-intent: returns 200 on empty body', `got status ${res._getStatus()}`);
    const data = res._getData();
    assert(data && typeof data.intent === 'string', 'voice-intent: contains intent');
    assert(data && typeof data.action === 'string', 'voice-intent: contains action');
    assert(data && typeof data.speechReply === 'string', 'voice-intent: contains speechReply');
  }

  // 1.7 HTTP Method boundaries for /api/ai-generate
  {
    const { req, res } = createMockReqRes({ method: 'GET', query: { type: 'ad' } });
    await aiGenerateHandler(req, res);
    assert(res._getStatus() === 405, 'ai-generate: GET returns 405 Method Not Allowed');

    const { req: optReq, res: optRes } = createMockReqRes({ method: 'OPTIONS' });
    await aiGenerateHandler(optReq, optRes);
    assert(optRes._getStatus() === 200, 'ai-generate: OPTIONS returns 200');

    const { req: invReq, res: invRes } = createMockReqRes({ method: 'POST', query: { type: 'invalid_type_123' }, body: {} });
    await aiGenerateHandler(invReq, invRes);
    assert(invRes._getStatus() === 400, 'ai-generate: invalid type returns 400');
  }

  // 2. Stress-testing /api/send-sms
  console.log('\n--- Test Suite 2: /api/send-sms Validation & Defaults ---');
  {
    // 2.1 Missing both 'to' and 'body'
    const { req, res } = createMockReqRes({ method: 'POST', body: {} });
    await sendSmsHandler(req, res);
    assert(res._getStatus() === 400, 'send-sms: missing to & body returns 400');

    // 2.2 Missing body only
    const { req: req2, res: res2 } = createMockReqRes({ method: 'POST', body: { to: '+15405550199' } });
    await sendSmsHandler(req2, res2);
    assert(res2._getStatus() === 400, 'send-sms: missing body returns 400');

    // 2.3 Valid to & body without Twilio env set -> should return 400 Missing Twilio Config
    const { req: req3, res: res3 } = createMockReqRes({ method: 'POST', body: { to: '+15405550199', body: 'Test quote' } });
    await sendSmsHandler(req3, res3);
    assert(res3._getStatus() === 400, 'send-sms: missing Twilio credentials returns 400');
    const data3 = res3._getData();
    assert(data3.error === 'Missing Twilio Configuration', 'send-sms: error message matches expected config warning');

    // 2.4 Stringified JSON body support
    const stringBody = JSON.stringify({ to: '+15405550199', body: 'Stringified body test' });
    const { req: req4, res: res4 } = createMockReqRes({ method: 'POST', body: stringBody });
    await sendSmsHandler(req4, res4);
    assert(res4._getStatus() === 400, 'send-sms: stringified body correctly parsed');

    // 2.5 Method check
    const { req: req5, res: res5 } = createMockReqRes({ method: 'GET' });
    await sendSmsHandler(req5, res5);
    assert(res5._getStatus() === 405, 'send-sms: GET returns 405');
  }

  // 3. Stress-testing /api/admin-settings
  console.log('\n--- Test Suite 3: /api/admin-settings ---');
  {
    // 3.1 GET admin-settings
    const { req, res } = createMockReqRes({ method: 'GET' });
    await adminSettingsHandler(req, res);
    assert(res._getStatus() === 200, 'admin-settings: GET returns 200');
    const data = res._getData();
    assert(typeof data.twilioAccountSid === 'string', 'admin-settings: returns twilioAccountSid field');
    assert(typeof data.twilioApiKeySid === 'string', 'admin-settings: returns twilioApiKeySid field');
    assert(typeof data.twilioPhoneNumber === 'string', 'admin-settings: returns twilioPhoneNumber field');

    // 3.2 Method check
    const { req: req2, res: res2 } = createMockReqRes({ method: 'DELETE' });
    await adminSettingsHandler(req2, res2);
    assert(res2._getStatus() === 405, 'admin-settings: DELETE returns 405');
  }

  // 4. Stress-testing /api/twilio-missed-call
  console.log('\n--- Test Suite 4: /api/twilio-missed-call ---');
  {
    // 4.1 Missing uid parameter
    const { req, res } = createMockReqRes({ method: 'POST', query: {}, body: { From: '+15405550199', CallStatus: 'no-answer' } });
    await twilioMissedCallHandler(req, res);
    assert(res._getStatus() === 400, 'twilio-missed-call: missing uid returns 400');

    // 4.2 Non-missed call (completed)
    const { req: req2, res: res2 } = createMockReqRes({ method: 'POST', query: { uid: 'user_123' }, body: { From: '+15405550199', CallStatus: 'completed' } });
    await twilioMissedCallHandler(req2, res2);
    assert(res2._getStatus() === 200, 'twilio-missed-call: non-missed call status ignored gracefully (200)');
    assert(res2._getData().status === 'ignored', 'twilio-missed-call: ignored reason provided');
  }

  // 5. Stress-testing /api/twilio-sms-reply
  console.log('\n--- Test Suite 5: /api/twilio-sms-reply ---');
  {
    // 5.1 Missing parameters returns empty TwiML XML
    const { req, res } = createMockReqRes({ method: 'POST', query: {}, body: {} });
    await twilioSmsReplyHandler(req, res);
    assert(res._getStatus() === 400, 'twilio-sms-reply: missing parameters returns 400');
    assert(res._getHeaders()['content-type'] === 'text/xml', 'twilio-sms-reply: sets text/xml content-type');
    assert(res._getData().includes('<Response></Response>'), 'twilio-sms-reply: returns valid empty TwiML response');

    // 5.2 Method check
    const { req: req2, res: res2 } = createMockReqRes({ method: 'GET' });
    await twilioSmsReplyHandler(req2, res2);
    assert(res2._getStatus() === 405, 'twilio-sms-reply: GET returns 405');
  }

  // 6. Stress-testing /api/twilio-voice-agent
  console.log('\n--- Test Suite 6: /api/twilio-voice-agent ---');
  {
    // 6.1 Initial call greeting
    const { req, res } = createMockReqRes({ method: 'GET', query: { uid: 'user_123' } });
    await twilioVoiceAgentHandler(req, res);
    assert(res._getStatus() === 200, 'twilio-voice-agent: returns 200 on initial greeting');
    assert(res._getHeaders()['content-type'] === 'text/xml', 'twilio-voice-agent: returns text/xml header');
    const xml = res._getData();
    assert(xml.includes('<Say voice="Polly.Joanna">'), 'twilio-voice-agent: contains Polly.Joanna voice greeting');
    assert(xml.includes('<Gather input="speech"'), 'twilio-voice-agent: contains speech gather directive');

    // 6.2 Speech response handling
    const { req: req2, res: res2 } = createMockReqRes({ method: 'GET', query: { uid: 'user_123', SpeechResult: 'I need an emergency plumber right now' } });
    await twilioVoiceAgentHandler(req2, res2);
    assert(res2._getStatus() === 200, 'twilio-voice-agent: returns 200 on speech result');
    const xml2 = res2._getData();
    assert(xml2.includes('<Say voice="Polly.Joanna">'), 'twilio-voice-agent: contains spoken confirmation');
    assert(xml2.includes('<Hangup/>'), 'twilio-voice-agent: contains hangup termination');
  }

  // 7. Stress-testing /api/trial-reply-handler
  console.log('\n--- Test Suite 7: /api/trial-reply-handler ---');
  {
    // 7.1 Missing parameters
    const { req, res } = createMockReqRes({ method: 'POST', body: {} });
    await trialReplyHandler(req, res);
    assert(res._getStatus() === 400, 'trial-reply-handler: missing leadEmail/leadName returns 400');

    // 7.2 Valid parameters without RESEND_API_KEY
    const { req: req2, res: res2 } = createMockReqRes({ method: 'POST', body: { leadEmail: 'test@client.com', leadName: 'John Doe', leadCompany: 'Acme Corp' } });
    await trialReplyHandler(req2, res2);
    assert(res2._getStatus() === 200, 'trial-reply-handler: generates trial credentials with 200 status');
    const data = res2._getData();
    assert(data.success === true, 'trial-reply-handler: success is true');
    assert(data.trialDetails && typeof data.trialDetails.trialId === 'string', 'trial-reply-handler: returns trialId');
    assert(data.trialDetails && typeof data.trialDetails.trialPassword === 'string', 'trial-reply-handler: returns trialPassword');
  }

  // 8. Stress-testing /api/send-email
  console.log('\n--- Test Suite 8: /api/send-email ---');
  {
    // 8.1 Missing to/subject/body
    const { req, res } = createMockReqRes({ method: 'POST', body: { to: 'test@example.com' } });
    await sendEmailHandler(req, res);
    assert(res._getStatus() === 400, 'send-email: missing subject/body returns 400');

    // 8.2 Missing RESEND_API_KEY
    const { req: req2, res: res2 } = createMockReqRes({ method: 'POST', body: { to: 'test@example.com', subject: 'Hi', body: 'Hello' } });
    await sendEmailHandler(req2, res2);
    assert(res2._getStatus() === 500, 'send-email: missing API key returns 500 error configuration notice');
  }

  // 9. Stress-testing /api/tts
  console.log('\n--- Test Suite 9: /api/tts ---');
  {
    // 9.1 Missing text
    const { req, res } = createMockReqRes({ method: 'POST', body: {} });
    await ttsHandler(req, res);
    assert(res._getStatus() === 400, 'tts: missing text returns 400');

    // 9.2 Missing GEMINI_API_KEY
    const { req: req2, res: res2 } = createMockReqRes({ method: 'POST', body: { text: 'Hello world' } });
    await ttsHandler(req2, res2);
    assert(res2._getStatus() === 400, 'tts: missing API key returns 400');
  }

  // 10. Stress-testing /api/webchat-message
  console.log('\n--- Test Suite 10: /api/webchat-message ---');
  {
    // 10.1 Missing parameters
    const { req, res } = createMockReqRes({ method: 'POST', body: { uid: 'user_123' } });
    await webchatMessageHandler(req, res);
    assert(res._getStatus() === 400, 'webchat-message: missing text returns 400');
  }

  console.log('\n======================================================');
  console.log(`📊 ADVERSARIAL TEST SUMMARY: ${passedCount} Passed | ${failedCount} Failed`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    console.error('FAILURES:', failures);
    process.exit(1);
  }
}

runAdversarialTests().catch(err => {
  console.error('Fatal in test runner:', err);
  process.exit(1);
});
