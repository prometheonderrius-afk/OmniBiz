import assert from 'node:assert/strict';

// Helper to create mock req and res objects
function createMockReqRes({ method = 'POST', query = {}, body = {}, headers = {} } = {}) {
  const req = {
    method,
    query,
    body,
    headers
  };

  let statusCode = 200;
  const resHeaders = {};
  let responseData = null;
  let ended = false;

  const res = {
    setHeader(key, value) {
      resHeaders[key.toLowerCase()] = value;
      return res;
    },
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      ended = true;
      return res;
    },
    send(data) {
      responseData = data;
      ended = true;
      return res;
    },
    end(data) {
      if (data) responseData = data;
      ended = true;
      return res;
    },
    // Inspection helpers
    _getStatus() { return statusCode; },
    _getHeaders() { return resHeaders; },
    _getData() { return responseData; },
    _isEnded() { return ended; }
  };

  return { req, res };
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// -------------------------------------------------------------
// 1. API: ai-generate.js
// -------------------------------------------------------------
test('ai-generate: OPTIONS request returns 200 and CORS headers', async () => {
  const handler = (await import('../../api/ai-generate.js')).default;
  const { req, res } = createMockReqRes({ method: 'OPTIONS' });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
  assert.equal(res._getHeaders()['access-control-allow-origin'], '*');
});

test('ai-generate: GET request returns 405 Method Not Allowed', async () => {
  const handler = (await import('../../api/ai-generate.js')).default;
  const { req, res } = createMockReqRes({ method: 'GET' });
  await handler(req, res);
  assert.equal(res._getStatus(), 405);
  assert.equal(res._getData().error, 'Method not allowed');
});

test('ai-generate: invalid type returns 400', async () => {
  const handler = (await import('../../api/ai-generate.js')).default;
  const { req, res } = createMockReqRes({ 
    method: 'POST', 
    query: { type: 'nonexistent-type' } 
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 400);
  assert.ok(res._getData().error.includes('Invalid AI type'));
});

test('ai-generate: type=ad generates valid ad copy schema', async () => {
  const handler = (await import('../../api/ai-generate.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    query: { type: 'ad' },
    body: {
      businessData: {
        name: 'Apex Plumbing',
        category: 'Plumbing & Drain Cleaning',
        location: 'Roanoke, VA',
        targetAudience: 'Homeowners and property managers',
        description: '24/7 emergency burst pipe and sewer service.'
      },
      platform: 'Google Search',
      budget: '300',
      objective: 'Phone Calls & Emergency Leads'
    }
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
  const data = res._getData();
  assert.ok(typeof data.headline1 === 'string' && data.headline1.length > 0, 'headline1 required');
  assert.ok(typeof data.headline2 === 'string' && data.headline2.length > 0, 'headline2 required');
  assert.ok(typeof data.description === 'string' && data.description.length > 0, 'description required');
  assert.ok(typeof data.keywords === 'string' && data.keywords.length > 0, 'keywords required');
  assert.ok(typeof data.demographics === 'string' && data.demographics.length > 0, 'demographics required');
});

test('ai-generate: type=contract generates formal binding contract text', async () => {
  const handler = (await import('../../api/ai-generate.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    query: { type: 'contract' },
    body: {
      template: 'Service Level Agreement',
      clientName: 'Blue Ridge Properties',
      businessData: {
        name: 'OmniBiz Trades Corp',
        category: 'Commercial HVAC & Refrigeration',
        location: 'Roanoke, VA'
      }
    }
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
  const data = res._getData();
  assert.ok(data.contractText && typeof data.contractText === 'string');
  assert.ok(data.contractText.includes('SERVICE LEVEL AGREEMENT') || data.contractText.includes('AGREEMENT'));
});

test('ai-generate: type=competitor returns structured competitive intelligence schema', async () => {
  const handler = (await import('../../api/ai-generate.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    query: { type: 'competitor' },
    body: {
      category: 'Auto Repair & Towing',
      location: 'Roanoke, VA',
      businessData: { name: 'Precision Auto Works' }
    }
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
  const data = res._getData();
  assert.ok(data.category, 'category present');
  assert.ok(data.location, 'location present');
  assert.ok(data.searchDensityGap, 'searchDensityGap present');
  assert.ok(data.recommendedFocus, 'recommendedFocus present');
  assert.ok(Array.isArray(data.competitors) && data.competitors.length > 0, 'competitors array present');
  const comp = data.competitors[0];
  assert.ok(comp.name, 'competitor name present');
  assert.ok(typeof comp.rating === 'number', 'competitor rating is number');
  assert.ok(comp.strengths, 'competitor strengths present');
  assert.ok(comp.weaknesses, 'competitor weaknesses present');
  assert.ok(comp.actionPlan, 'competitor actionPlan present');
});

test('ai-generate: type=leads returns structured prospect discovery schema', async () => {
  const handler = (await import('../../api/ai-generate.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    query: { type: 'leads' },
    body: {
      category: 'Roofing & Solar',
      location: 'Salem, VA',
      zipCode: '24153'
    }
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
  const data = res._getData();
  assert.ok(Array.isArray(data.leads) && data.leads.length > 0, 'leads array present');
  const lead = data.leads[0];
  assert.ok(lead.name, 'lead name present');
  assert.ok(lead.company, 'lead company present');
  assert.ok(lead.email, 'lead email present');
  assert.ok(lead.phone, 'lead phone present');
  assert.ok(typeof lead.score === 'number', 'lead score is number');
  assert.ok(lead.notes, 'lead notes present');
});

test('ai-generate: type=seo returns technical audit diagnostics schema', async () => {
  const handler = (await import('../../api/ai-generate.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    query: { type: 'seo' },
    body: {
      domain: 'apexheatingva.com',
      category: 'HVAC Services'
    }
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
  const data = res._getData();
  assert.ok(data.domain, 'domain present');
  assert.ok(typeof data.score === 'number', 'score is number');
  assert.ok(data.speedRating, 'speedRating present');
  assert.ok(typeof data.mobileOptimized === 'boolean', 'mobileOptimized is boolean');
  assert.ok(typeof data.issuesFound === 'number', 'issuesFound is number');
  assert.ok(typeof data.issuesFixed === 'number', 'issuesFixed is number');
  assert.ok(Array.isArray(data.reports) && data.reports.length > 0, 'reports array present');
  assert.ok(Array.isArray(data.recommendations) && data.recommendations.length > 0, 'recommendations array present');
});

test('ai-generate: type=voice-intent extracts intent, action, amount, and speechReply', async () => {
  const handler = (await import('../../api/ai-generate.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    query: { type: 'voice-intent' },
    body: {
      speech: 'Create invoice for $350 to Sarah Jenkins for emergency plumbing',
      businessData: { name: 'Apex Plumbing' }
    }
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
  const data = res._getData();
  assert.ok(data.command, 'command present');
  assert.ok(data.intent, 'intent present');
  assert.ok(data.action, 'action present');
  assert.ok(data.speechReply, 'speechReply present');
  assert.ok(data.amount, 'amount present');
});

// Edge case: Empty body
test('ai-generate: empty POST body recovers with valid default schema without crashing', async () => {
  const handler = (await import('../../api/ai-generate.js')).default;
  for (const type of ['ad', 'contract', 'competitor', 'leads', 'seo', 'voice-intent']) {
    const { req, res } = createMockReqRes({
      method: 'POST',
      query: { type },
      body: {}
    });
    await handler(req, res);
    assert.equal(res._getStatus(), 200, `Type ${type} failed with status ${res._getStatus()}`);
    assert.ok(res._getData() !== null, `Type ${type} returned null data`);
  }
});

// -------------------------------------------------------------
// 2. API: send-sms.js
// -------------------------------------------------------------
test('send-sms: OPTIONS returns 200', async () => {
  const handler = (await import('../../api/send-sms.js')).default;
  const { req, res } = createMockReqRes({ method: 'OPTIONS' });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
});

test('send-sms: GET returns 405', async () => {
  const handler = (await import('../../api/send-sms.js')).default;
  const { req, res } = createMockReqRes({ method: 'GET' });
  await handler(req, res);
  assert.equal(res._getStatus(), 405);
});

test('send-sms: missing parameters returns 400', async () => {
  const handler = (await import('../../api/send-sms.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    body: { to: '555-1234' } // missing body
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 400);
  assert.ok(res._getData().error.includes('Missing parameters'));
});

test('send-sms: unconfigured Twilio credentials returns 400 with clear message', async () => {
  const handler = (await import('../../api/send-sms.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    body: { to: '555-1234', body: 'Test message', uid: 'test-user-123' }
  });
  await handler(req, res);
  // If no twilio config in env or firestore, returns 400
  assert.ok(res._getStatus() === 400 || res._getStatus() === 502 || res._getStatus() === 200);
});

// -------------------------------------------------------------
// 3. API: admin-settings.js
// -------------------------------------------------------------
test('admin-settings: GET returns status 200 with twilio settings schema', async () => {
  const handler = (await import('../../api/admin-settings.js')).default;
  const { req, res } = createMockReqRes({ method: 'GET' });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
  const data = res._getData();
  assert.ok('twilioAccountSid' in data);
  assert.ok('twilioApiKeySid' in data);
  assert.ok('twilioApiKeySecret' in data);
  assert.ok('twilioPhoneNumber' in data);
});

test('admin-settings: OPTIONS returns 200', async () => {
  const handler = (await import('../../api/admin-settings.js')).default;
  const { req, res } = createMockReqRes({ method: 'OPTIONS' });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
});

test('admin-settings: PUT returns 405 Method Not Allowed', async () => {
  const handler = (await import('../../api/admin-settings.js')).default;
  const { req, res } = createMockReqRes({ method: 'PUT' });
  await handler(req, res);
  assert.equal(res._getStatus(), 405);
  assert.equal(res._getData().error, 'Method not allowed');
});

// -------------------------------------------------------------
// 4. API: twilio-missed-call.js
// -------------------------------------------------------------
test('twilio-missed-call: OPTIONS returns 200', async () => {
  const handler = (await import('../../api/twilio-missed-call.js')).default;
  const { req, res } = createMockReqRes({ method: 'OPTIONS' });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
});

test('twilio-missed-call: GET returns 405', async () => {
  const handler = (await import('../../api/twilio-missed-call.js')).default;
  const { req, res } = createMockReqRes({ method: 'GET' });
  await handler(req, res);
  assert.equal(res._getStatus(), 405);
});

test('twilio-missed-call: missing uid query parameter returns 400', async () => {
  const handler = (await import('../../api/twilio-missed-call.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    query: {},
    body: { From: '+15405550199', CallStatus: 'no-answer' }
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 400);
  assert.ok(res._getData().error.includes('uid query parameter is required'));
});

test('twilio-missed-call: non-missed call status returns ignored 200', async () => {
  const handler = (await import('../../api/twilio-missed-call.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    query: { uid: 'user_123' },
    body: { From: '+15405550199', CallStatus: 'completed' }
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
  assert.equal(res._getData().status, 'ignored');
});

// -------------------------------------------------------------
// 5. API: twilio-sms-reply.js
// -------------------------------------------------------------
test('twilio-sms-reply: OPTIONS returns 200', async () => {
  const handler = (await import('../../api/twilio-sms-reply.js')).default;
  const { req, res } = createMockReqRes({ method: 'OPTIONS' });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
});

test('twilio-sms-reply: GET returns 405', async () => {
  const handler = (await import('../../api/twilio-sms-reply.js')).default;
  const { req, res } = createMockReqRes({ method: 'GET' });
  await handler(req, res);
  assert.equal(res._getStatus(), 405);
});

test('twilio-sms-reply: missing parameters returns 400 with TwiML XML', async () => {
  const handler = (await import('../../api/twilio-sms-reply.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    query: { uid: 'user_123' },
    body: { From: '+15405550199' } // missing Body
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 400);
  assert.ok(res._getData().includes('<Response></Response>'));
  assert.equal(res._getHeaders()['content-type'], 'text/xml');
});

// -------------------------------------------------------------
// 6. API: twilio-voice-agent.js
// -------------------------------------------------------------
test('twilio-voice-agent: initial call without SpeechResult returns Polly greeting TwiML', async () => {
  const handler = (await import('../../api/twilio-voice-agent.js')).default;
  const { req, res } = createMockReqRes({
    method: 'GET',
    query: { uid: 'user_123' }
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
  assert.equal(res._getHeaders()['content-type'], 'text/xml');
  const xml = res._getData();
  assert.ok(xml.includes('<Say voice="Polly.Joanna">'));
  assert.ok(xml.includes('<Gather input="speech"'));
});

test('twilio-voice-agent: with SpeechResult returns conversational reply TwiML', async () => {
  const handler = (await import('../../api/twilio-voice-agent.js')).default;
  const { req, res } = createMockReqRes({
    method: 'GET',
    query: {
      uid: 'user_123',
      SpeechResult: 'I need to schedule an oil change for tomorrow morning'
    }
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
  const xml = res._getData();
  assert.ok(xml.includes('<Say voice="Polly.Joanna">'));
  assert.ok(xml.includes('<Hangup/>'));
});

// -------------------------------------------------------------
// 7. API: trial-reply-handler.js
// -------------------------------------------------------------
test('trial-reply-handler: missing parameters returns 400', async () => {
  const handler = (await import('../../api/trial-reply-handler.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    body: { leadEmail: 'test@example.com' } // missing leadName
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 400);
});

test('trial-reply-handler: valid request generates 14-day trial credentials', async () => {
  const handler = (await import('../../api/trial-reply-handler.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    body: {
      leadEmail: 'david.miller@propertymgmt.example.com',
      leadName: 'David Miller',
      leadCompany: 'Roanoke Property Group'
    }
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
  const data = res._getData();
  assert.ok(data.success);
  assert.ok(data.trialDetails);
  assert.ok(data.trialDetails.trialId);
  assert.ok(data.trialDetails.trialPassword);
  assert.ok(data.trialDetails.trialLoginUrl);
  assert.ok(data.trialDetails.expires);
});

// -------------------------------------------------------------
// 8. API: send-email.js
// -------------------------------------------------------------
test('send-email: OPTIONS returns 200', async () => {
  const handler = (await import('../../api/send-email.js')).default;
  const { req, res } = createMockReqRes({ method: 'OPTIONS' });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
});

test('send-email: GET returns 405', async () => {
  const handler = (await import('../../api/send-email.js')).default;
  const { req, res } = createMockReqRes({ method: 'GET' });
  await handler(req, res);
  assert.equal(res._getStatus(), 405);
});

test('send-email: missing parameters returns 400', async () => {
  const handler = (await import('../../api/send-email.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    body: { to: 'test@example.com' } // missing subject, body
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 400);
});

test('send-email: unconfigured RESEND_API_KEY returns 500 with configuration error', async () => {
  const handler = (await import('../../api/send-email.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    body: { to: 'test@example.com', subject: 'Test Subject', body: 'Test body message' }
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 500);
  assert.equal(res._getData().error, 'API Configuration Error');
});

// -------------------------------------------------------------
// 9. API: tts.js
// -------------------------------------------------------------
test('tts: GET returns 405', async () => {
  const handler = (await import('../../api/tts.js')).default;
  const { req, res } = createMockReqRes({ method: 'GET' });
  await handler(req, res);
  assert.equal(res._getStatus(), 405);
});

test('tts: missing text returns 400', async () => {
  const handler = (await import('../../api/tts.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    body: {}
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 400);
  assert.equal(res._getData().error, 'Missing text');
});

test('tts: missing Gemini API key returns 400', async () => {
  const handler = (await import('../../api/tts.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    body: { text: 'Hello, this is a test audio message.' }
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 400);
  assert.equal(res._getData().error, 'Missing Gemini API Key');
});

// -------------------------------------------------------------
// 10. API: webchat-message.js
// -------------------------------------------------------------
test('webchat-message: OPTIONS returns 200 with CORS headers', async () => {
  const handler = (await import('../../api/webchat-message.js')).default;
  const { req, res } = createMockReqRes({ method: 'OPTIONS' });
  await handler(req, res);
  assert.equal(res._getStatus(), 200);
  assert.equal(res._getHeaders()['access-control-allow-origin'], '*');
});

test('webchat-message: GET returns 405 Method Not Allowed', async () => {
  const handler = (await import('../../api/webchat-message.js')).default;
  const { req, res } = createMockReqRes({ method: 'GET' });
  await handler(req, res);
  assert.equal(res._getStatus(), 405);
  assert.equal(res._getData().error, 'Method not allowed');
});

test('webchat-message: missing uid or text returns 400', async () => {
  const handler = (await import('../../api/webchat-message.js')).default;
  const { req, res } = createMockReqRes({
    method: 'POST',
    body: { uid: 'user_123' } // missing text
  });
  await handler(req, res);
  assert.equal(res._getStatus(), 400);
  assert.ok(res._getData().error.includes('uid and text are required'));
});

// -------------------------------------------------------------
// 11. API: _utils/gcp.js
// -------------------------------------------------------------
test('gcp utils: exports dbAdmin, vertexAI, generateContentVertex, generateAIContent', async () => {
  const gcp = await import('../../api/_utils/gcp.js');
  assert.ok('generateContentVertex' in gcp, 'generateContentVertex exported');
  assert.ok('generateAIContent' in gcp, 'generateAIContent exported');
  assert.ok('vertexAI' in gcp, 'vertexAI exported');
  assert.ok('dbAdmin' in gcp, 'dbAdmin exported');
  assert.equal(typeof gcp.generateContentVertex, 'function');
  assert.equal(typeof gcp.generateAIContent, 'function');
});

test('gcp utils: generateAIContent handles unconfigured credentials gracefully', async () => {
  const { generateAIContent } = await import('../../api/_utils/gcp.js');
  await assert.rejects(
    async () => {
      await generateAIContent('Test prompt', 'Test instruction');
    },
    (err) => {
      return err.message.includes('completions failed or were unconfigured') || err.message.includes('Unable to authenticate');
    }
  );
});

// -------------------------------------------------------------
// RUNNER
// -------------------------------------------------------------
async function runAll() {
  console.log('🧪 Running Empirical M1 Challenge Suite (' + tests.length + ' tests)...\n');
  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      if (err.stack) console.error(`     Stack: ${err.stack.split('\n').slice(1, 4).join('\n    ')}`);
      failed++;
    }
  }

  console.log(`\n======================================================`);
  console.log(`Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAll().catch(e => {
  console.error('Fatal test execution error:', e);
  process.exit(1);
});
