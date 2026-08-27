/**
 * EMPIRICAL STRESS TEST SUITE - OMNIBIZ AI (M1)
 * Tests edge cases: empty request bodies, malformed JSON inputs, missing query params,
 * extreme prompt lengths, and safeJsonParse resilience against markdown fences,
 * unformatted text, and empty returns.
 */

import assert from 'node:assert';
import { performance } from 'node:perf_hooks';

// Helper: Mock Response Object
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    ended: false,
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      this.ended = true;
      return this;
    },
    send(data) {
      this.body = data;
      this.ended = true;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    }
  };
  return res;
}

// ----------------------------------------------------------------------------
// 1. Stress-test safeJsonParse implementation
// ----------------------------------------------------------------------------
function safeJsonParse(text, fallback = {}) {
  if (!text || typeof text !== 'string') return fallback;
  let clean = text.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  const jsonMatch = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    clean = jsonMatch[0];
  }
  try {
    return JSON.parse(clean);
  } catch (e) {
    return fallback;
  }
}

async function runParserStressTests() {
  console.log('--- 1. Testing safeJsonParse Resilience ---');
  const fallback = { fallback: true };
  const tests = [
    { name: 'Null input', input: null, expected: fallback },
    { name: 'Undefined input', input: undefined, expected: fallback },
    { name: 'Empty string', input: '', expected: fallback },
    { name: 'Whitespace only', input: '   \n\t  ', expected: fallback },
    { name: 'Number input', input: 12345, expected: fallback },
    { name: 'Boolean input', input: true, expected: fallback },
    { name: 'Object input', input: { a: 1 }, expected: fallback },
    { name: 'Pure plain text with no JSON', input: 'I cannot generate JSON for this query.', expected: fallback },
    { name: 'Malformed JSON (unclosed brace)', input: '{"title": "Test"', expected: fallback },
    { name: 'Malformed JSON (unquoted keys)', input: '{title: "Test"}', expected: fallback },
    { name: 'Malformed JSON (trailing comma in strict)', input: '{"title": "Test",}', expected: fallback },
    { name: 'Standard valid JSON string', input: '{"key": "value"}', expected: { key: 'value' } },
    { name: 'Valid JSON array string', input: '[1, 2, "three"]', expected: [1, 2, 'three'] },
    { name: 'JSON with standard markdown fence ```json ... ```', input: '```json\n{"headline": "Service"}\n```', expected: { headline: 'Service' } },
    { name: 'JSON with plain markdown fence ``` ... ```', input: '```\n{"headline": "Service"}\n```', expected: { headline: 'Service' } },
    { name: 'JSON with leading conversational text', input: 'Here is the requested output:\n{"category": "Plumbing", "score": 95}', expected: { category: 'Plumbing', score: 95 } },
    { name: 'JSON with trailing conversational text', input: '{"category": "Plumbing"}\nHope this helps your business!', expected: { category: 'Plumbing' } },
    { name: 'JSON wrapped in markdown fence with surrounding commentary', input: 'Certainly! Below is the JSON:\n```json\n{"status": "ok", "items": [1, 2]}\n```\nLet me know if you need changes.', expected: { status: 'ok', items: [1, 2] } },
    { name: 'JSON with nested structures & escaped quotes', input: '{"message": "Hello \\"World\\"", "nested": {"a": [1, 2, {"b": true}]}}', expected: { message: 'Hello "World"', nested: { a: [1, 2, { b: true }] } } },
    { name: 'JSON with Unicode, emojis, and newlines', input: '{"emoji": "🚀✨", "text": "Line 1\\nLine 2", "lang": "日本語"}', expected: { emoji: '🚀✨', text: 'Line 1\nLine 2', lang: '日本語' } },
    { name: 'Extreme input: 100KB string with JSON embedded', input: 'X'.repeat(50000) + '{"found": true}' + 'Y'.repeat(50000), expected: { found: true } },
    { name: 'Extreme input: 100KB string with NO JSON', input: 'Z'.repeat(100000), expected: fallback }
  ];

  let passed = 0;
  let failed = 0;
  for (const t of tests) {
    try {
      const res = safeJsonParse(t.input, fallback);
      assert.deepStrictEqual(res, t.expected);
      passed++;
      console.log(`  ✓ ${t.name}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${t.name}: ${err.message}`);
    }
  }
  console.log(`safeJsonParse Summary: ${passed} passed, ${failed} failed.\n`);
  return { passed, failed };
}

// ----------------------------------------------------------------------------
// 2. Stress-test Backend API Handlers
// ----------------------------------------------------------------------------
async function runApiStressTests() {
  console.log('--- 2. Testing API Handlers Against Edge Cases ---');

  const { default: aiGenerateHandler } = await import('../api/ai-generate.js');
  const { default: sendSmsHandler } = await import('../api/send-sms.js');
  const { default: adminSettingsHandler } = await import('../api/admin-settings.js');
  const { default: sendEmailHandler } = await import('../api/send-email.js');
  const { default: trialReplyHandler } = await import('../api/trial-reply-handler.js');
  const { default: ttsHandler } = await import('../api/tts.js');
  const { default: twilioMissedCallHandler } = await import('../api/twilio-missed-call.js');
  const { default: twilioSmsReplyHandler } = await import('../api/twilio-sms-reply.js');
  const { default: twilioVoiceAgentHandler } = await import('../api/twilio-voice-agent.js');

  let passed = 0;
  let failed = 0;

  async function testCase(name, fn) {
    try {
      await fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${name}: ${err.message}`);
    }
  }

  // --- ai-generate.js ---
  await testCase('ai-generate: OPTIONS request returns 200', async () => {
    const req = { method: 'OPTIONS', query: {}, body: {} };
    const res = createMockRes();
    await aiGenerateHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
  });

  await testCase('ai-generate: Non-POST method returns 405', async () => {
    const req = { method: 'GET', query: {}, body: {} };
    const res = createMockRes();
    await aiGenerateHandler(req, res);
    assert.strictEqual(res.statusCode, 405);
    assert.strictEqual(res.body.error, 'Method not allowed');
  });

  await testCase('ai-generate: Invalid AI type returns 400', async () => {
    const req = { method: 'POST', query: { type: 'invalid_type' }, body: {} };
    const res = createMockRes();
    await aiGenerateHandler(req, res);
    assert.strictEqual(res.statusCode, 400);
  });

  await testCase('ai-generate: Type "ad" with empty body returns fallback ad structure', async () => {
    const req = { method: 'POST', query: { type: 'ad' }, body: {} };
    const res = createMockRes();
    await aiGenerateHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.headline1);
    assert.ok(res.body.headline2);
    assert.ok(res.body.description);
    assert.ok(res.body.keywords);
  });

  await testCase('ai-generate: Type "contract" with empty body returns valid contract text', async () => {
    const req = { method: 'POST', query: { type: 'contract' }, body: {} };
    const res = createMockRes();
    await aiGenerateHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(typeof res.body.contractText === 'string');
    assert.ok(res.body.contractText.includes('SERVICE LEVEL AGREEMENT'));
  });

  await testCase('ai-generate: Type "competitor" with empty body returns structured competitor object', async () => {
    const req = { method: 'POST', query: { type: 'competitor' }, body: {} };
    const res = createMockRes();
    await aiGenerateHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.competitors));
    assert.ok(res.body.competitors.length >= 1);
    assert.ok(res.body.searchDensityGap);
  });

  await testCase('ai-generate: Type "leads" with empty body returns structured leads array', async () => {
    const req = { method: 'POST', query: { type: 'leads' }, body: {} };
    const res = createMockRes();
    await aiGenerateHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.leads));
    assert.ok(res.body.leads.length >= 1);
    assert.ok(res.body.leads[0].score >= 80);
  });

  await testCase('ai-generate: Type "seo" with empty body returns structured SEO metrics', async () => {
    const req = { method: 'POST', query: { type: 'seo' }, body: {} };
    const res = createMockRes();
    await aiGenerateHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.score >= 80);
    assert.ok(Array.isArray(res.body.reports));
    assert.ok(Array.isArray(res.body.recommendations));
  });

  await testCase('ai-generate: Type "voice-intent" with empty body returns intent structure', async () => {
    const req = { method: 'POST', query: { type: 'voice-intent' }, body: {} };
    const res = createMockRes();
    await aiGenerateHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.intent);
    assert.ok(res.body.action);
    assert.ok(res.body.speechReply);
  });

  await testCase('ai-generate: Extreme prompt length (20,000 chars) handles gracefully without crash', async () => {
    const req = {
      method: 'POST',
      query: { type: 'ad' },
      body: {
        businessData: {
          name: 'Extreme '.repeat(1000),
          category: 'Plumbing',
          description: 'A'.repeat(15000)
        }
      }
    };
    const res = createMockRes();
    await aiGenerateHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.headline1);
  });

  // --- send-sms.js ---
  await testCase('send-sms: Non-POST returns 405', async () => {
    const req = { method: 'GET', query: {}, body: {} };
    const res = createMockRes();
    await sendSmsHandler(req, res);
    assert.strictEqual(res.statusCode, 405);
  });

  await testCase('send-sms: Missing to or body returns 400', async () => {
    const req = { method: 'POST', query: {}, body: { uid: 'u1' } };
    const res = createMockRes();
    await sendSmsHandler(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.error.includes('Missing parameters'));
  });

  await testCase('send-sms: Malformed JSON string in body defaults to empty and returns 400', async () => {
    const req = { method: 'POST', query: {}, body: '{ not valid json ' };
    const res = createMockRes();
    await sendSmsHandler(req, res);
    assert.strictEqual(res.statusCode, 400);
  });

  await testCase('send-sms: Missing Twilio config returns 400 with config error message', async () => {
    const req = { method: 'POST', query: {}, body: { to: '+15405550199', body: 'Test SMS' } };
    const res = createMockRes();
    await sendSmsHandler(req, res);
    // When Twilio keys not present in local test env
    assert.ok(res.statusCode === 400 || res.statusCode === 502);
  });

  // --- admin-settings.js ---
  await testCase('admin-settings: OPTIONS returns 200', async () => {
    const req = { method: 'OPTIONS', query: {}, body: {} };
    const res = createMockRes();
    await adminSettingsHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
  });

  await testCase('admin-settings: GET returns settings object with default empty strings', async () => {
    const req = { method: 'GET', query: {}, body: {} };
    const res = createMockRes();
    await adminSettingsHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok('twilioAccountSid' in res.body);
    assert.ok('twilioApiKeySid' in res.body);
    assert.ok('twilioApiKeySecret' in res.body);
    assert.ok('twilioPhoneNumber' in res.body);
  });

  // --- send-email.js ---
  await testCase('send-email: Non-POST returns 405', async () => {
    const req = { method: 'GET', query: {}, body: {} };
    const res = createMockRes();
    await sendEmailHandler(req, res);
    assert.strictEqual(res.statusCode, 405);
  });

  await testCase('send-email: Missing parameters returns 400', async () => {
    const req = { method: 'POST', query: {}, body: { to: 'test@example.com' } };
    const res = createMockRes();
    await sendEmailHandler(req, res);
    assert.strictEqual(res.statusCode, 400);
  });

  // --- trial-reply-handler.js ---
  await testCase('trial-reply-handler: Missing leadEmail returns 400', async () => {
    const req = { method: 'POST', query: {}, body: { leadName: 'John Doe' } };
    const res = createMockRes();
    await trialReplyHandler(req, res);
    assert.strictEqual(res.statusCode, 400);
  });

  await testCase('trial-reply-handler: Valid payload returns trial credentials with 14-day expiry', async () => {
    const req = { method: 'POST', query: {}, body: { leadEmail: 'test@example.com', leadName: 'Jane Smith', leadCompany: 'Smith Electric' } };
    const res = createMockRes();
    await trialReplyHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.trialDetails.trialId);
    assert.ok(res.body.trialDetails.trialPassword);
    assert.ok(res.body.trialDetails.expires);
  });

  // --- tts.js ---
  await testCase('tts: Missing text returns 400', async () => {
    const req = { method: 'POST', query: {}, body: {} };
    const res = createMockRes();
    await ttsHandler(req, res);
    assert.strictEqual(res.statusCode, 400);
  });

  // --- twilio-missed-call.js ---
  await testCase('twilio-missed-call: Missing uid returns 400', async () => {
    const req = { method: 'POST', query: {}, body: { From: '+15405550199' } };
    const res = createMockRes();
    await twilioMissedCallHandler(req, res);
    assert.strictEqual(res.statusCode, 400);
  });

  await testCase('twilio-missed-call: Non-missed call status returns 200 ignored', async () => {
    const req = { method: 'POST', query: { uid: 'user_test_123' }, body: { CallStatus: 'completed', From: '+15405550199' } };
    const res = createMockRes();
    await twilioMissedCallHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'ignored');
  });

  // --- twilio-sms-reply.js ---
  await testCase('twilio-sms-reply: Missing parameters returns 400 with empty TwiML XML', async () => {
    const req = { method: 'POST', query: {}, body: {} };
    const res = createMockRes();
    await twilioSmsReplyHandler(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.headers['Content-Type'], 'text/xml');
    assert.ok(res.body.includes('<Response>'));
  });

  // --- twilio-voice-agent.js ---
  await testCase('twilio-voice-agent: Missing SpeechResult returns initial Gather TwiML XML', async () => {
    const req = { method: 'GET', query: { uid: 'user_123' }, body: {} };
    const res = createMockRes();
    await twilioVoiceAgentHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['Content-Type'], 'text/xml');
    assert.ok(res.body.includes('<Gather'));
    assert.ok(res.body.includes('<Say voice="Polly.Joanna">'));
  });

  await testCase('twilio-voice-agent: With SpeechResult returns speech reply and Hangup TwiML XML', async () => {
    const req = { method: 'GET', query: { uid: 'user_123', SpeechResult: 'I need an emergency plumber right now' }, body: {} };
    const res = createMockRes();
    await twilioVoiceAgentHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['Content-Type'], 'text/xml');
    assert.ok(res.body.includes('<Hangup/>'));
    assert.ok(res.body.includes('I need an emergency plumber'));
  });

  console.log(`\nAPI Stress Summary: ${passed} passed, ${failed} failed.\n`);
  return { passed, failed };
}

async function main() {
  const start = performance.now();
  console.log('================================================================');
  console.log('🔥 OMNIBIZ AI M1 EMPIRICAL STRESS TEST HARNESS');
  console.log('================================================================\n');

  const parserRes = await runParserStressTests();
  const apiRes = await runApiStressTests();

  const totalPassed = parserRes.passed + apiRes.passed;
  const totalFailed = parserRes.failed + apiRes.failed;
  const duration = (performance.now() - start).toFixed(2);

  console.log('================================================================');
  console.log(`📊 STRESS TEST TOTAL: ${totalPassed} Passed, ${totalFailed} Failed (${duration}ms)`);
  console.log('================================================================');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal Stress Runner Error:', err);
  process.exit(1);
});
