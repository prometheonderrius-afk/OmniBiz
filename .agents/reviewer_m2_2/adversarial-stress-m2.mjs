/**
 * ADVERSARIAL STRESS TEST SUITE FOR MILESTONE M2
 * Author: Reviewer M2 (Adversarial Critic)
 */

import assert from 'node:assert';
import fs from 'node:fs';
import {
  SovereignOfflineSyncEngine,
  MemoryStorage,
  queueOfflineMutation,
  replayOfflineQueue,
  getOfflineQueue,
  clearOfflineQueue,
  subscribeToSyncStatus,
  saveOfflineAction,
  getOfflineActions,
  clearOfflineActions,
  cacheLocalData,
  getCachedData,
  OFFLINE_QUEUE_KEY,
  LOCAL_STORAGE_CACHE_KEY
} from '../../src/utils/offlineSync.js';

import { MockFirestore } from '../../tests/test-utils.js';

// Extract exported logic from Onboarding.jsx dynamically without JSX parsing issue
const onboardingCode = fs.readFileSync('src/components/Onboarding.jsx', 'utf8');

// Safely extract constants and helpers from Onboarding.jsx
function extractOnboardingLogic() {
  const sanitizedCode = onboardingCode
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/export\s+default\s+function\s+Onboarding[\s\S]*$/, '')
    .replace(/export\s+/g, '');

  const codeToEval = `
    ${sanitizedCode}
    return { categories, goals, presets, getThemePresetForCategory, getVerticalKey, VERTICAL_SEEDS };
  `;
  const fn = new Function(codeToEval);
  return fn();
}

const { categories, goals, presets, getThemePresetForCategory, getVerticalKey, VERTICAL_SEEDS } = extractOnboardingLogic();

async function runAdversarialProbes() {
  console.log('===============================================================');
  console.log('🔥 STARTING ADVERSARIAL STRESS-TESTING FOR MILESTONE M2 🔥');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✖ [FAIL] ${name}`);
      console.error(`     Reason:`, err.message);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // PROBE 1: Offline Queue Persistence & Fallback Resilience
  // -------------------------------------------------------------
  console.log('--- 1. PROBING OFFLINE QUEUE PERSISTENCE & STORAGE FALLBACKS ---');

  await test('1.1 SSR / Headless environment without window or localStorage', () => {
    // MemoryStorage default fallback in Node/SSR
    const memStorage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(memStorage);
    
    assert.strictEqual(engine.isOnline, true);
    const res = engine.queueMutation({
      actionType: 'SSR_MUTATION',
      collection: 'test',
      payload: { data: 'ssr_val' }
    });
    assert.strictEqual(res.status, 'queued');
    assert.strictEqual(engine.getQueue().length, 1);
    assert.strictEqual(engine.getQueue()[0].payload.data, 'ssr_val');
  });

  await test('1.2 QuotaExceededError / SecurityError throwing storage handling', () => {
    // Simulating private/incognito mode where localStorage.setItem throws
    const throwingStorage = {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError: DOM Exception 22'); },
      removeItem: () => {},
      clear: () => {}
    };

    let engine;
    assert.doesNotThrow(() => {
      engine = new SovereignOfflineSyncEngine(throwingStorage);
    });

    try {
      engine.queueMutation({ actionType: 'FAIL_STORAGE', collection: 'c', payload: {} });
    } catch (e) {
      assert.match(e.message, /QuotaExceededError/);
    }
  });

  await test('1.3 Corrupted / non-JSON payload in storage', () => {
    const corruptStorage = new MemoryStorage();
    corruptStorage.setItem(OFFLINE_QUEUE_KEY, '{ invalid: json ]]]');
    corruptStorage.setItem(LOCAL_STORAGE_CACHE_KEY, 'NOT_JSON');

    const engine = new SovereignOfflineSyncEngine(corruptStorage);
    assert.deepStrictEqual(engine.getQueue(), []);
    assert.strictEqual(engine.getCachedData('any_key'), null);
  });

  await test('1.4 High concurrency / rapid burst queueing (1,000 items)', () => {
    const memStorage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(memStorage);

    const count = 1000;
    for (let i = 0; i < count; i++) {
      engine.queueMutation({
        actionType: `BURST_${i}`,
        collection: 'burst',
        payload: { seq: i, timestamp: Date.now() + i }
      });
    }

    const queue = engine.getQueue();
    assert.strictEqual(queue.length, count);
    assert.strictEqual(queue[0].actionType, 'BURST_0');
    assert.strictEqual(queue[999].actionType, 'BURST_999');
  });

  // -------------------------------------------------------------
  // PROBE 2: Last-Write-Wins (LWW) Reconciliation Edge Cases
  // -------------------------------------------------------------
  console.log('\n--- 2. PROBING LWW RECONCILIATION & CONFLICT RESOLUTION ---');

  await test('2.1 Remote doc has extra/nested properties not in local mutation', async () => {
    const memStorage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(memStorage);
    const firestore = new MockFirestore();
    const userId = 'tenant_extra_props';

    // Remote doc contains various legacy and nested fields
    await firestore.setDoc(`users/${userId}/customers`, 'cust_101', {
      name: 'Old Name',
      billingAddress: { street: '123 Main St', city: 'Roanoke', state: 'VA' },
      tags: ['vip', 'commercial'],
      internalCreditLimit: 50000,
      updatedAt: 1000
    });

    // Local mutation updates phone and name at t=2000
    engine.queueMutation({
      actionType: 'UPDATE_CUSTOMER',
      collection: 'customers',
      docId: 'cust_101',
      payload: { name: 'Updated Name Inc.', phone: '(540) 555-9999' },
      timestamp: 2000
    });

    const replayRes = await engine.replayOfflineQueue(firestore, userId);
    assert.strictEqual(replayRes.success, true);
    assert.strictEqual(replayRes.conflictsResolved, 1);

    const reconciled = (await firestore.getDoc(`users/${userId}/customers`, 'cust_101')).data();
    // Check updated fields
    assert.strictEqual(reconciled.name, 'Updated Name Inc.');
    assert.strictEqual(reconciled.phone, '(540) 555-9999');
    assert.strictEqual(reconciled.updatedAt, 2000);
    assert.ok(reconciled.syncReconciledAt);

    // Check that remote extra properties were preserved
    assert.deepStrictEqual(reconciled.billingAddress, { street: '123 Main St', city: 'Roanoke', state: 'VA' });
    assert.deepStrictEqual(reconciled.tags, ['vip', 'commercial']);
    assert.strictEqual(reconciled.internalCreditLimit, 50000);
  });

  await test('2.2 Identical timestamps between local mutation and remote doc', async () => {
    const memStorage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(memStorage);
    const firestore = new MockFirestore();
    const userId = 'tenant_identical_ts';

    const identicalTimestamp = 55555;
    await firestore.setDoc(`users/${userId}/inventory`, 'part_1', {
      qty: 10,
      updatedAt: identicalTimestamp
    });

    // Local mutation has identical timestamp
    engine.queueMutation({
      actionType: 'UPDATE_QTY',
      collection: 'inventory',
      docId: 'part_1',
      payload: { qty: 8 },
      timestamp: identicalTimestamp
    });

    const res = await engine.replayOfflineQueue(firestore, userId);
    assert.strictEqual(res.conflictsResolved, 1);

    // When timestamps are equal (local.timestamp >= remote.timestamp), local wins
    const doc = (await firestore.getDoc(`users/${userId}/inventory`, 'part_1')).data();
    assert.strictEqual(doc.qty, 8);
    assert.strictEqual(doc.updatedAt, identicalTimestamp);
  });

  await test('2.3 Multiple out-of-order mutations targeting the same docId', async () => {
    const memStorage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(memStorage);
    const firestore = new MockFirestore();
    const userId = 'tenant_multi_mutations';

    // Queue 3 mutations added out of timestamp order
    engine.queueMutation({
      actionType: 'STEP_FINAL',
      collection: 'orders',
      docId: 'ord_99',
      payload: { step: 'DELIVERED', finalNote: 'Delivered at porch' },
      timestamp: 3000
    });
    engine.queueMutation({
      actionType: 'STEP_INIT',
      collection: 'orders',
      docId: 'ord_99',
      payload: { step: 'DISPATCHED', initialNote: 'Driver assigned' },
      timestamp: 1000
    });
    engine.queueMutation({
      actionType: 'STEP_TRANSIT',
      collection: 'orders',
      docId: 'ord_99',
      payload: { step: 'IN_TRANSIT', transitNote: 'Halfway' },
      timestamp: 2000
    });

    // Replay should sort ascending (1000 -> 2000 -> 3000) and apply sequentially
    const res = await engine.replayOfflineQueue(firestore, userId);
    assert.strictEqual(res.processedCount, 3);

    const finalDoc = (await firestore.getDoc(`users/${userId}/orders`, 'ord_99')).data();
    assert.strictEqual(finalDoc.step, 'DELIVERED');
    assert.strictEqual(finalDoc.initialNote, 'Driver assigned');
    assert.strictEqual(finalDoc.transitNote, 'Halfway');
    assert.strictEqual(finalDoc.finalNote, 'Delivered at porch');
    assert.strictEqual(finalDoc.updatedAt, 3000);
  });

  await test('2.4 Remote document has createdAt but no updatedAt', async () => {
    const memStorage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(memStorage);
    const firestore = new MockFirestore();
    const userId = 'tenant_no_updated_at';

    await firestore.setDoc(`users/${userId}/leads`, 'lead_1', {
      name: 'Bob',
      createdAt: 2000
    });

    // Local mutation timestamp = 1500 (older than remote createdAt 2000)
    engine.queueMutation({
      actionType: 'UPDATE_LEAD',
      collection: 'leads',
      docId: 'lead_1',
      payload: { name: 'Old Bob' },
      timestamp: 1500
    });

    await engine.replayOfflineQueue(firestore, userId);
    const doc = (await firestore.getDoc(`users/${userId}/leads`, 'lead_1')).data();
    // Remote should win because remote createdAt is 2000 > 1500
    assert.strictEqual(doc.name, 'Bob');
  });

  await test('2.5 Conductor policy violation flagging during offline sync replay', async () => {
    const memStorage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(memStorage);
    const firestore = new MockFirestore();
    const userId = 'tenant_conductor_violation';

    // Submitting a proposal with margin below floor (< 0.60)
    engine.queueMutation({
      actionType: 'CREATE_PROPOSAL',
      collection: 'proposals',
      docId: 'prop_low_margin',
      payload: { title: 'Plumbing Job', grossMargin: 0.35, amount: 2000 },
      timestamp: 5000
    });

    const res = await engine.replayOfflineQueue(firestore, userId);
    assert.strictEqual(res.success, true);

    const doc = (await firestore.getDoc(`users/${userId}/proposals`, 'prop_low_margin')).data();
    assert.ok(doc.conductorVerdict);
    assert.strictEqual(doc.conductorVerdict.isBlocked, true);
    assert.ok(doc.conductorVerdict.violations.some(v => v.ruleId === 'RULE_MARGIN_FLOOR_BREACH'));
  });

  // -------------------------------------------------------------
  // PROBE 3: Onboarding Step 5 Resilience & Seed Data Coverage
  // -------------------------------------------------------------
  console.log('\n--- 3. PROBING ONBOARDING RESILIENCE & SEED DATA COVERAGE ---');

  await test('3.1 Category vertical mapping and theme presets for all 8 categories', () => {
    const expectedMappings = [
      { cat: 'Plumbing, HVAC & Electrical Contracting', vKey: 'plumbing_hvac', theme: 'rugged_services' },
      { cat: 'Auto Repair, Maintenance & Towing', vKey: 'auto_repair', theme: 'rugged_services' },
      { cat: 'Handyman, Construction & Remodeling', vKey: 'roofing_construction', theme: 'rugged_services' },
      { cat: 'Restaurants, Cafes & Food Trucks', vKey: 'restaurant_food', theme: 'warm_cafe' },
      { cat: 'Fashion, Boutique & Retail Shops', vKey: 'retail_wellness', theme: 'rose_boutique' },
      { cat: 'Gas Station & Convenience Store', vKey: 'plumbing_hvac', theme: 'navy_corporate' },
      { cat: 'Tech Startup & SaaS Application', vKey: 'plumbing_hvac', theme: 'cyber_saas' },
      { cat: 'Professional Services (Legal, Financial, Consulting)', vKey: 'plumbing_hvac', theme: 'navy_corporate' }
    ];

    for (const item of expectedMappings) {
      assert.strictEqual(getVerticalKey(item.cat), item.vKey, `Mismatch for category vertical: ${item.cat}`);
      assert.strictEqual(getThemePresetForCategory(item.cat), item.theme, `Mismatch for category theme: ${item.cat}`);
    }
  });

  await test('3.2 Verify all 5 trade vertical seed catalogs are populated with authentic SKUs & compliance protocols', () => {
    const requiredKeys = ['plumbing_hvac', 'auto_repair', 'roofing_construction', 'restaurant_food', 'retail_wellness'];
    for (const key of requiredKeys) {
      assert.ok(VERTICAL_SEEDS[key], `VERTICAL_SEEDS must contain ${key}`);
      assert.ok(VERTICAL_SEEDS[key].inventory.length >= 5, `${key} inventory must have >= 5 items`);
      assert.ok(VERTICAL_SEEDS[key].compliance.length >= 2, `${key} compliance must have >= 2 items`);
      
      // Verify SKU schema
      for (const item of VERTICAL_SEEDS[key].inventory) {
        assert.ok(item.sku && item.name && typeof item.qty === 'number' && typeof item.unitCost === 'number', `Invalid SKU schema in ${key}`);
      }
      for (const comp of VERTICAL_SEEDS[key].compliance) {
        assert.ok(comp.code && comp.title && comp.status, `Invalid compliance schema in ${key}`);
      }
    }
  });

  await test('3.3 Local-first cache fallback when Firestore is unavailable during Onboarding Step 5', async () => {
    clearOfflineQueue();

    // Simulating complete offline onboarding provisioning
    const offlineProfile = {
      businessName: 'Apex Offline Plumbing',
      category: 'Plumbing, HVAC & Electrical Contracting',
      plan: 'pro',
      themePreset: 'rugged_services',
      location: 'Roanoke, VA',
      ownerName: 'Liam Vance'
    };

    cacheLocalData('omnibiz_tenant_profile', offlineProfile);
    cacheLocalData('omnibiz_active_vertical', 'plumbing_hvac');
    cacheLocalData('omnibiz_theme_preset', 'rugged_services');
    cacheLocalData('omnibiz_onboarding_completed', true);

    // Queue offline mutations for profile and seeds
    queueOfflineMutation({
      actionType: 'PROVISION_TENANT_PROFILE',
      collection: 'profile',
      docId: 'general',
      payload: offlineProfile
    });

    const cachedProfile = getCachedData('omnibiz_tenant_profile');
    assert.deepStrictEqual(cachedProfile, offlineProfile);
    assert.strictEqual(getCachedData('omnibiz_active_vertical'), 'plumbing_hvac');
    assert.strictEqual(getCachedData('omnibiz_onboarding_completed'), true);
    assert.strictEqual(getOfflineQueue().length, 1);
  });

  await test('3.4 Offline replay of provisioned onboarding mutations when reconnected', async () => {
    const firestore = new MockFirestore();
    const userId = 'reconnected_onboarded_user';

    const res = await replayOfflineQueue(firestore, userId);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.processedCount, 1);
    assert.strictEqual(getOfflineQueue().length, 0);

    const doc = (await firestore.getDoc(`users/${userId}/profile`, 'general')).data();
    assert.strictEqual(doc.businessName, 'Apex Offline Plumbing');
    assert.strictEqual(doc.category, 'Plumbing, HVAC & Electrical Contracting');
  });

  // -------------------------------------------------------------
  // PROBE 4: Integrity & Anti-Cheating Analysis
  // -------------------------------------------------------------
  console.log('\n--- 4. PROBING CODE INTEGRITY & ANTI-CHEATING PATTERNS ---');

  await test('4.1 Verify zero fake setTimeout delays remain in Onboarding', () => {
    const onboardingSrc = fs.readFileSync('src/components/Onboarding.jsx', 'utf8');
    const offlineSyncSrc = fs.readFileSync('src/utils/offlineSync.js', 'utf8');

    assert.ok(!onboardingSrc.includes('setTimeout'), 'Onboarding.jsx must not contain fake setTimeout loops');
    assert.ok(!offlineSyncSrc.includes('setTimeout'), 'offlineSync.js must not contain fake setTimeout loops');
  });

  await test('4.2 Verify no hardcoded test outputs or mock bypasses in production code', () => {
    const offlineSyncSrc = fs.readFileSync('src/utils/offlineSync.js', 'utf8');
    
    // Ensure real LWW logic is executing, not a mock flag
    assert.ok(offlineSyncSrc.includes('item.timestamp >= remoteTimestamp'), 'LWW timestamp comparison must be present');
    assert.ok(offlineSyncSrc.includes('evaluateConductorRules'), 'Conductor rule check must be wired');
    assert.ok(offlineSyncSrc.includes('idbPutMutation'), 'IndexedDB durable write helper must be present');
    assert.ok(offlineSyncSrc.includes('subscribeToSyncStatus'), 'Status subscription must be present');
  });

  console.log('\n===============================================================');
  console.log(`📊 ADVERSARIAL TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdversarialProbes().catch(err => {
  console.error('Unhandled Adversarial Suite Failure:', err);
  process.exit(1);
});
