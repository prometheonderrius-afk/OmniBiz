/**
 * OMNIBIZ AI - MILESTONE M2 EMPIRICAL CHALLENGER STRESS HARNESS
 * 
 * Deep adversarial testing and empirical validation of:
 * - SovereignOfflineSyncEngine (high-throughput queuing, LWW reconciliation, partial failover, corrupt state recovery)
 * - Conductor policy gating (matrix validation, multi-rule composite violations, <0.05ms execution latency)
 * - Onboarding multi-stage provisioning (5 verticals, inventory/compliance seed verification, offline fallback)
 */

import assert from 'node:assert';
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';

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
} from '../src/utils/offlineSync.js';

import {
  evaluateConductorRules,
  GOVERNANCE_POLICIES
} from '../src/utils/conductorRules.js';

import { MockFirestore } from './test-utils.js';

// Dynamically extract constants and pure functions from src/components/Onboarding.jsx
const onboardingRaw = fs.readFileSync('src/components/Onboarding.jsx', 'utf8');
const declarationsCode = onboardingRaw.substring(0, onboardingRaw.indexOf('export default function Onboarding'));
const cleanDeclarations = declarationsCode
  .replace(/^import .*;$/gm, '')
  .replace(/export const /g, 'const ')
  .replace(/export default /g, '');
const onboardingScope = new Function(`
  ${cleanDeclarations}
  return { categories, goals, presets, getThemePresetForCategory, getVerticalKey, VERTICAL_SEEDS };
`)();

const { categories, goals, presets, getThemePresetForCategory, getVerticalKey, VERTICAL_SEEDS } = onboardingScope;

let totalPassed = 0;
let totalFailed = 0;

async function runTest(name, fn) {
  try {
    const t0 = performance.now();
    await fn();
    const elapsed = (performance.now() - t0).toFixed(2);
    totalPassed++;
    console.log(`  ✔ [PASS] ${name} (${elapsed}ms)`);
  } catch (err) {
    totalFailed++;
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    if (err.stack) {
      console.error(`     Stack: ${err.stack.split('\n')[1]}`);
    }
  }
}

async function main() {
  console.log('================================================================');
  console.log('🧪 MILESTONE M2 EMPIRICAL ADVERSARIAL STRESS SUITE');
  console.log('   Targeting Sovereign Offline Sync, Conductor Invariants, & Onboarding');
  console.log('================================================================\n');

  // ============================================================================
  // SECTION 1: SovereignOfflineSyncEngine Stress & Corner Cases
  // ============================================================================
  console.log('--- SECTION 1: SovereignOfflineSyncEngine Stress Testing ---');

  await runTest('1.1 High-Volume Queuing: Queue 1,000 rapid mutations with deterministic schema', async () => {
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);

    for (let i = 0; i < 1000; i++) {
      const res = engine.queueMutation({
        actionType: `ACTION_${i % 5}`,
        collection: 'orders',
        docId: `order_${i}`,
        payload: { index: i, val: `value_${i}` },
        timestamp: 100000 + i
      });
      assert.strictEqual(res.status, 'queued');
      assert.match(res.queueId, /^sync_\d+_/);
    }

    const queue = engine.getQueue();
    assert.strictEqual(queue.length, 1000);
    assert.strictEqual(queue[0].docId, 'order_0');
    assert.strictEqual(queue[999].docId, 'order_999');
    assert.strictEqual(queue[500].payload.index, 500);
    assert.strictEqual(queue[500].status, 'pending');
    assert.strictEqual(queue[500].retryCount, 0);
  });

  await runTest('1.2 Corrupt Storage Recovery: Handles corrupted JSON in storage without throwing', async () => {
    const storage = new MemoryStorage();
    storage.setItem(OFFLINE_QUEUE_KEY, 'MALFORMED_JSON_STRING_{{[');
    const engine = new SovereignOfflineSyncEngine(storage);

    const queue = engine.getQueue();
    assert.deepStrictEqual(queue, []);

    // Able to queue new items even after corruption
    engine.queueMutation({ actionType: 'RECOVERY_ACTION', collection: 'logs', payload: { ok: true } });
    assert.strictEqual(engine.getQueue().length, 1);
  });

  await runTest('1.3 Null/Undefined/Missing Payload Resilience', async () => {
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);

    const res1 = engine.queueMutation({ actionType: 'NULL_PAYLOAD', collection: 'test', payload: null });
    assert.deepStrictEqual(res1.entry.payload, {});

    const res2 = engine.queueMutation({ actionType: 'UNDEFINED_PAYLOAD', collection: 'test' });
    assert.deepStrictEqual(res2.entry.payload, {});
    assert.match(res2.entry.docId, /^doc_\d+/);
  });

  await runTest('1.4 Deterministic Timestamp Sorting on Replay: Out-of-order queue items are replayed chronologically', async () => {
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    const firestore = new MockFirestore();
    const userId = 'tenant_sort_test';

    const recordedOrder = [];
    const trackingDb = {
      getDoc: async (col, docId) => firestore.getDoc(col, docId),
      setDoc: async (col, docId, data) => {
        recordedOrder.push({ docId, timestamp: data.updatedAt || data.createdAt });
        return firestore.setDoc(col, docId, data);
      }
    };

    // Insert items in deliberately shuffled order
    const timestamps = [5000, 1000, 4000, 2000, 3000];
    for (const ts of timestamps) {
      engine.queueMutation({
        actionType: 'SORT_CHECK',
        collection: 'timeline',
        docId: `event_${ts}`,
        payload: { note: `Time ${ts}` },
        timestamp: ts
      });
    }

    const replayRes = await engine.replayOfflineQueue(trackingDb, userId);
    assert.strictEqual(replayRes.success, true);
    assert.strictEqual(replayRes.processedCount, 5);

    // Verify chronological execution order
    const executedTimestamps = recordedOrder.map(r => r.timestamp);
    assert.deepStrictEqual(executedTimestamps, [1000, 2000, 3000, 4000, 5000]);
  });

  await runTest('1.5 LWW Matrix: Local newer, local older, local equal, and field merging', async () => {
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    const firestore = new MockFirestore();
    const userId = 'tenant_lww_matrix';

    // Seed existing documents
    await firestore.setDoc(`users/${userId}/jobs`, 'job_newer_local', {
      title: 'Water Heater Install',
      status: 'PENDING',
      notes: 'Initial remote note',
      updatedAt: 1000
    });

    await firestore.setDoc(`users/${userId}/jobs`, 'job_older_local', {
      title: 'HVAC Repair',
      status: 'CANCELLED_ON_SERVER',
      notes: 'Server cancelled',
      updatedAt: 5000
    });

    await firestore.setDoc(`users/${userId}/jobs`, 'job_equal_ts', {
      title: 'Roof Inspection',
      status: 'INITIAL_STATE',
      updatedAt: 3000
    });

    // 1. Local newer (t=2000 > remote t=1000) -> Local wins, merges notes
    engine.queueMutation({
      actionType: 'UPDATE_JOB',
      collection: 'jobs',
      docId: 'job_newer_local',
      payload: { status: 'IN_PROGRESS', technician: 'Bob' },
      timestamp: 2000
    });

    // 2. Local older (t=3000 < remote t=5000) -> Remote preserved
    engine.queueMutation({
      actionType: 'UPDATE_JOB',
      collection: 'jobs',
      docId: 'job_older_local',
      payload: { status: 'OLD_LOCAL_OVERWRITE', technician: 'Alice' },
      timestamp: 3000
    });

    // 3. Local equal timestamp (t=3000 == remote t=3000) -> Local wins/reconciles
    engine.queueMutation({
      actionType: 'UPDATE_JOB',
      collection: 'jobs',
      docId: 'job_equal_ts',
      payload: { status: 'EQUAL_TS_UPDATED' },
      timestamp: 3000
    });

    const res = await engine.replayOfflineQueue(firestore, userId);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.processedCount, 3);
    assert.strictEqual(res.conflictsResolved, 3);

    // Verify job_newer_local: merged fields, remote 'notes' preserved
    const docNewer = await firestore.getDoc(`users/${userId}/jobs`, 'job_newer_local');
    assert.strictEqual(docNewer.data().status, 'IN_PROGRESS');
    assert.strictEqual(docNewer.data().technician, 'Bob');
    assert.strictEqual(docNewer.data().notes, 'Initial remote note');
    assert.strictEqual(docNewer.data().updatedAt, 2000);
    assert.ok(docNewer.data().syncReconciledAt);

    // Verify job_older_local: remote preserved intact
    const docOlder = await firestore.getDoc(`users/${userId}/jobs`, 'job_older_local');
    assert.strictEqual(docOlder.data().status, 'CANCELLED_ON_SERVER');
    assert.strictEqual(docOlder.data().technician, undefined);
    assert.strictEqual(docOlder.data().updatedAt, 5000);

    // Verify job_equal_ts: local merged
    const docEqual = await firestore.getDoc(`users/${userId}/jobs`, 'job_equal_ts');
    assert.strictEqual(docEqual.data().status, 'EQUAL_TS_UPDATED');
  });

  await runTest('1.6 Successive Same-Doc Mutations in Single Queue: Applies in chronological sequence', async () => {
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    const firestore = new MockFirestore();
    const userId = 'tenant_multi_mutation';

    // Queue 3 successive transitions for single doc
    engine.queueMutation({
      actionType: 'STEP_1',
      collection: 'invoices',
      docId: 'inv_500',
      payload: { step1: 'DONE', status: 'DRAFT' },
      timestamp: 100
    });

    engine.queueMutation({
      actionType: 'STEP_2',
      collection: 'invoices',
      docId: 'inv_500',
      payload: { step2: 'DONE', status: 'SENT' },
      timestamp: 200
    });

    engine.queueMutation({
      actionType: 'STEP_3',
      collection: 'invoices',
      docId: 'inv_500',
      payload: { step3: 'DONE', status: 'PAID', paidAmount: 1200 },
      timestamp: 300
    });

    const res = await engine.replayOfflineQueue(firestore, userId);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.processedCount, 3);

    const doc = await firestore.getDoc(`users/${userId}/invoices`, 'inv_500');
    assert.strictEqual(doc.data().status, 'PAID');
    assert.strictEqual(doc.data().step1, 'DONE');
    assert.strictEqual(doc.data().step2, 'DONE');
    assert.strictEqual(doc.data().step3, 'DONE');
    assert.strictEqual(doc.data().paidAmount, 1200);
    assert.strictEqual(doc.data().updatedAt, 300);
  });

  await runTest('1.7 Partial Failures & Retry Persistence: Retains only failed items with incremented retryCount', async () => {
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    const userId = 'tenant_partial_fail';

    // Queue 5 items
    for (let i = 1; i <= 5; i++) {
      engine.queueMutation({
        actionType: `MUT_${i}`,
        collection: 'tasks',
        docId: `task_${i}`,
        payload: { i },
        timestamp: i * 100
      });
    }

    // Mock DB that fails specifically on task_3
    const flakyDb = {
      store: {},
      getDoc: async (col, docId) => {
        if (docId === 'task_3') throw new Error('Simulated network socket timeout on task_3');
        return flakyDb.store[`${col}/${docId}`] || null;
      },
      setDoc: async (col, docId, data) => {
        if (docId === 'task_3') throw new Error('Simulated network socket timeout on task_3');
        flakyDb.store[`${col}/${docId}`] = { exists: () => true, data: () => data };
      }
    };

    // First replay attempt
    const res1 = await engine.replayOfflineQueue(flakyDb, userId);
    assert.strictEqual(res1.success, false);
    assert.strictEqual(res1.processedCount, 4);
    assert.strictEqual(res1.remainingCount, 1);

    const remaining = engine.getQueue();
    assert.strictEqual(remaining.length, 1);
    assert.strictEqual(remaining[0].docId, 'task_3');
    assert.strictEqual(remaining[0].retryCount, 1);
    assert.strictEqual(remaining[0].status, 'failed');
    assert.strictEqual(remaining[0].lastError, 'Simulated network socket timeout on task_3');

    // Second replay attempt with healed DB
    const healedDb = {
      getDoc: async (col, docId) => flakyDb.store[`${col}/${docId}`] || null,
      setDoc: async (col, docId, data) => {
        flakyDb.store[`${col}/${docId}`] = { exists: () => true, data: () => data };
      }
    };

    const res2 = await engine.replayOfflineQueue(healedDb, userId);
    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.processedCount, 1);
    assert.strictEqual(res2.remainingCount, 0);
    assert.strictEqual(engine.getQueue().length, 0);

    // Verify task_3 now exists in store
    const doc3 = await healedDb.getDoc(`users/${userId}/tasks`, 'task_3');
    assert.ok(doc3);
  });

  await runTest('1.8 Listener Resiliency: Faulty subscribers do not break notification dispatch or unsubscribe', async () => {
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);

    let receivedClean = 0;
    const cleanSub = engine.subscribeToSyncStatus(() => {
      receivedClean++;
    });

    // Sub with intentional exception
    const faultySub = engine.subscribeToSyncStatus(() => {
      throw new Error('Subscriber intentional explosion');
    });

    // Emit by queueing
    engine.queueMutation({ actionType: 'TEST', collection: 'col', payload: {} });
    assert.ok(receivedClean >= 2); // Initial + queue

    // Unsubscribe both
    cleanSub();
    faultySub();

    const previousCount = receivedClean;
    engine.queueMutation({ actionType: 'TEST2', collection: 'col', payload: {} });
    assert.strictEqual(receivedClean, previousCount);
  });

  // ============================================================================
  // SECTION 2: Conductor Policy Gating & Latency Invariants
  // ============================================================================
  console.log('\n--- SECTION 2: Deterministic Conductor Policy Invariant Gating ---');

  await runTest('2.1 Margin Floor Enforcement: Replay blocks proposals below 60% gross margin', async () => {
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    const firestore = new MockFirestore();
    const userId = 'tenant_margin_gate';

    // Sub-threshold margin (48%)
    engine.queueMutation({
      actionType: 'SUBMIT_PROPOSAL',
      collection: 'proposals',
      docId: 'prop_low',
      payload: { grossMargin: 0.48, amount: 2500 }
    });

    // Compliant margin (65%)
    engine.queueMutation({
      actionType: 'SUBMIT_PROPOSAL',
      collection: 'proposals',
      docId: 'prop_ok',
      payload: { grossMargin: 0.65, amount: 4200 }
    });

    await engine.replayOfflineQueue(firestore, userId);

    const docLow = await firestore.getDoc(`users/${userId}/proposals`, 'prop_low');
    assert.ok(docLow.data().conductorVerdict);
    assert.strictEqual(docLow.data().conductorVerdict.isBlocked, true);
    assert.strictEqual(docLow.data().conductorVerdict.violations[0].ruleId, 'RULE_MARGIN_FLOOR_BREACH');

    const docOk = await firestore.getDoc(`users/${userId}/proposals`, 'prop_ok');
    assert.strictEqual(docOk.data().conductorVerdict, undefined);
  });

  await runTest('2.2 CFO Credit Hold & Past-Due Policy Gating', async () => {
    const verdict1 = evaluateConductorRules({
      financialHealth: { creditHold: true, overdueBalance: '$1,850', daysPastDue: 15 }
    });
    assert.strictEqual(verdict1.isBlocked, true);
    assert.strictEqual(verdict1.violations[0].ruleId, 'RULE_CFO_CREDIT_HOLD');
    assert.strictEqual(verdict1.violations[0].severity, 'CRITICAL_BLOCK');
    assert.strictEqual(verdict1.requiredOverrides[0].type, 'INJECT_PAYMENT_GATE');

    const verdict2 = evaluateConductorRules({
      financialHealth: { creditHold: false, overdueBalance: '$3,200', daysPastDue: 45 }
    });
    assert.strictEqual(verdict2.isBlocked, true);
    assert.strictEqual(verdict2.violations[0].ruleId, 'RULE_CFO_CREDIT_HOLD');
  });

  await runTest('2.3 Physical Hazard Safety Preemption Policy', async () => {
    for (const hazard of GOVERNANCE_POLICIES.HAZARD_TYPES) {
      const verdict = evaluateConductorRules({
        triageIntent: { hazard }
      });
      assert.strictEqual(verdict.isBlocked, false); // Safety directive injected, not blocking quote
      assert.strictEqual(verdict.requiredOverrides[0].type, 'INJECT_SAFETY_DIRECTIVE');
      assert.strictEqual(verdict.requiredOverrides[0].hazard, hazard);
      assert.ok(verdict.requiredOverrides[0].action.includes('Prepend emergency shutoff guidance'));
    }
  });

  await runTest('2.4 Composite Multi-Violation Collision Matrix', async () => {
    const verdict = evaluateConductorRules({
      financialHealth: { creditHold: true, overdueBalance: '$5,000', daysPastDue: 60 },
      triageIntent: { hazard: 'Gas Leak' },
      supplyStatus: { inStock: false, partNumber: 'CAP-45-5', eta: 'Tomorrow 8:00 AM' },
      estimatingProposal: { grossMargin: 0.35 }
    });

    assert.strictEqual(verdict.isBlocked, true);
    assert.strictEqual(verdict.violations.length, 3); // Credit Hold, Supply Unavailable, Margin Floor
    assert.strictEqual(verdict.requiredOverrides.length, 4); // Payment Gate, Safety Directive, Shift Slot, HITL Override
    assert.ok(verdict.atomicLockId.startsWith('LOCK_'));
  });

  await runTest('2.5 Invariant Evaluation Latency Benchmark: 10,000 runs executed under <0.05ms average', async () => {
    const iterations = 10000;
    const testState = {
      financialHealth: { creditHold: false, daysPastDue: 5 },
      triageIntent: { hazard: 'Flooding Hazard' },
      supplyStatus: { inStock: true },
      estimatingProposal: { grossMargin: 0.72 }
    };

    // Warm-up JIT
    for (let i = 0; i < 500; i++) evaluateConductorRules(testState);

    const tStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      evaluateConductorRules(testState);
    }
    const tTotal = performance.now() - tStart;
    const avgMs = tTotal / iterations;

    console.log(`     Conductor Latency Benchmark: ${iterations} iterations in ${tTotal.toFixed(2)}ms (Avg: ${(avgMs * 1000).toFixed(2)}µs per run)`);
    assert.ok(avgMs < 0.05, `Conductor evaluation took ${avgMs}ms on average, which exceeds the 0.05ms invariant budget!`);
  });

  // ============================================================================
  // SECTION 3: Client Onboarding Flow & Multi-Tenant Vertical Seeding
  // ============================================================================
  console.log('\n--- SECTION 3: Onboarding Multi-Stage Provisioning & Trade Verticals ---');

  await runTest('3.1 Category and Vertical Mapping Exhaustive Verification', async () => {
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
      assert.strictEqual(getVerticalKey(item.cat), item.vKey, `Mismatch for vertical key on: ${item.cat}`);
      assert.strictEqual(getThemePresetForCategory(item.cat), item.theme, `Mismatch for theme on: ${item.cat}`);
    }

    // Default fallback
    assert.strictEqual(getVerticalKey('Unknown Category'), 'plumbing_hvac');
    assert.strictEqual(getThemePresetForCategory('Unknown Category'), 'rugged_services');
    assert.strictEqual(getVerticalKey(null), 'plumbing_hvac');
    assert.strictEqual(getThemePresetForCategory(''), 'rugged_services');
  });

  await runTest('3.2 Theme Presets Integrity: All presets define valid hex colors and descriptions', async () => {
    const presetKeys = Object.keys(presets);
    assert.strictEqual(presetKeys.length, 6);

    for (const key of presetKeys) {
      const p = presets[key];
      assert.ok(p.name, `Preset ${key} missing name`);
      assert.match(p.primary, /^#[0-9a-fA-F]{6}$/, `Preset ${key} primary color invalid: ${p.primary}`);
      assert.match(p.secondary, /^#[0-9a-fA-F]{6}$/, `Preset ${key} secondary color invalid: ${p.secondary}`);
      assert.match(p.bg, /^#[0-9a-fA-F]{6}$/, `Preset ${key} bg color invalid: ${p.bg}`);
      assert.ok(p.desc, `Preset ${key} missing description`);
    }
  });

  await runTest('3.3 Full 5-Stage Onboarding Provisioning Pipeline Simulation across Verticals', async () => {
    const storage = new MemoryStorage();
    const firestore = new MockFirestore();
    const uid = 'tenant_onboarding_test_99';
    const category = 'Auto Repair, Maintenance & Towing';
    const vKey = getVerticalKey(category);
    const effectiveTier = 'pro';

    const seedData = VERTICAL_SEEDS[vKey];
    assert.ok(seedData, `Missing seed data for vertical: ${vKey}`);

    // Stage 1: Profile Provisioning
    const generalProfile = {
      businessName: 'Vance Auto Tech',
      category,
      plan: effectiveTier,
      selectedTier: effectiveTier,
      location: 'Roanoke, VA',
      website: 'https://vanceauto.com',
      ownerName: 'Liam Vance',
      ownerEmail: 'liam@vanceauto.com',
      ownerPhone: '(540) 555-0199',
      teamMembers: [{ name: 'David', role: 'Lead Mechanic' }],
      themePreset: 'rugged_services',
      provisionedAt: Date.now(),
      onboardingComplete: true
    };

    await firestore.setDoc(`users/${uid}`, 'profile_summary', {
      businessData: generalProfile,
      selectedTier: effectiveTier,
      onboardingComplete: true,
      autopilot: true
    });
    await firestore.setDoc(`users/${uid}/profile`, 'general', generalProfile);

    // Stage 2: Inventory & Compliance Seeding
    for (const item of seedData.inventory) {
      await firestore.setDoc(`users/${uid}/inventory`, item.sku, { ...item, updatedAt: Date.now() });
    }
    for (const comp of seedData.compliance) {
      await firestore.setDoc(`users/${uid}/compliance`, comp.code, { ...comp, updatedAt: Date.now() });
    }

    // Stage 3: Blackboard Initialization
    const blackboardState = {
      status: 'INITIALIZED',
      activeAgents: 10,
      conductorLocked: false,
      lastUpdated: Date.now(),
      governanceFloor: 0.60
    };
    await firestore.setDoc(`users/${uid}/blackboard`, 'state', blackboardState);

    // Stage 4: Local Storage Sovereignty Cache
    cacheLocalData('omnibiz_tenant_profile', generalProfile);
    cacheLocalData('omnibiz_active_vertical', vKey);
    cacheLocalData('omnibiz_theme_preset', 'rugged_services');
    cacheLocalData('omnibiz_onboarding_completed', true);

    // Stage 5: Verification of Provisioned Database Nodes
    const profileDoc = await firestore.getDoc(`users/${uid}/profile`, 'general');
    assert.ok(profileDoc.exists());
    assert.strictEqual(profileDoc.data().businessName, 'Vance Auto Tech');
    assert.strictEqual(profileDoc.data().selectedTier, 'pro');

    const invDoc1 = await firestore.getDoc(`users/${uid}/inventory`, 'BRAKE-PAD-CER');
    assert.ok(invDoc1.exists());
    assert.strictEqual(invDoc1.data().unitCost, 35.00);

    const compDoc1 = await firestore.getDoc(`users/${uid}/compliance`, 'NHTSA-SAFETY-INSPECTION');
    assert.ok(compDoc1.exists());
    assert.strictEqual(compDoc1.data().status, 'Active');

    const bbDoc = await firestore.getDoc(`users/${uid}/blackboard`, 'state');
    assert.ok(bbDoc.exists());
    assert.strictEqual(bbDoc.data().activeAgents, 10);
    assert.strictEqual(bbDoc.data().status, 'INITIALIZED');

    assert.strictEqual(getCachedData('omnibiz_active_vertical'), 'auto_repair');
    assert.strictEqual(getCachedData('omnibiz_onboarding_completed'), true);
  });

  await runTest('3.4 Offline Mode Onboarding Fallback: Correctly queues mutations and populates local cache', async () => {
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);

    // Simulate offline failure
    const offlineProfile = {
      businessName: 'Apex Offline Plumbing',
      category: 'Plumbing, HVAC & Electrical Contracting',
      selectedTier: 'starter'
    };

    engine.queueMutation({
      actionType: 'PROVISION_TENANT_PROFILE',
      collection: 'profile',
      docId: 'general',
      payload: offlineProfile
    });

    engine.queueMutation({
      actionType: 'SEED_INVENTORY',
      collection: 'inventory',
      docId: 'CAP-45-5',
      payload: { sku: 'CAP-45-5', qty: 6 }
    });

    engine.queueMutation({
      actionType: 'INIT_BLACKBOARD',
      collection: 'blackboard',
      docId: 'state',
      payload: { status: 'INITIALIZED' }
    });

    const queue = engine.getQueue();
    assert.strictEqual(queue.length, 3);
    assert.strictEqual(queue[0].actionType, 'PROVISION_TENANT_PROFILE');
    assert.strictEqual(queue[1].actionType, 'SEED_INVENTORY');
    assert.strictEqual(queue[2].actionType, 'INIT_BLACKBOARD');

    // When connection is restored, replay succeeds
    const firestore = new MockFirestore();
    const res = await engine.replayOfflineQueue(firestore, 'offline_tenant');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.processedCount, 3);
    assert.strictEqual(engine.getQueue().length, 0);

    const doc = await firestore.getDoc('users/offline_tenant/profile', 'general');
    assert.strictEqual(doc.data().businessName, 'Apex Offline Plumbing');
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n================================================================');
  console.log(`📊 M2 EMPIRICAL CHALLENGER RESULTS: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log('================================================================');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal M2 Challenge Harness Error:', err);
  process.exit(1);
});
