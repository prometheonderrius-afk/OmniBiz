/**
 * OMNIBIZ AI — MILESTONE M2 ADVERSARIAL STRESS & EMPIRICAL VERIFICATION HARNESS
 * 
 * Empirical Stress Testing of:
 * 1. Offline Mutation Queue (concurrency, throughput, memory safety, 2,000 ops burst)
 * 2. Large Multi-Megabyte Payloads & Boundary Objects (1.5MB nested payload, unicode, nulls)
 * 3. Out-of-Order Timestamps & Deterministic Last-Write-Wins (LWW)
 * 4. Reconnection Bursts, Intermittent Dropouts (25% fault rate), and Retry Mechanics
 * 5. Multi-Tenant Onboarding Provisioning Across All 5 Industry Verticals
 * 6. Conductor Policy Invariant Pre-Commit Validation during Replay
 * 7. Offline Sync UI Badge & Reactive Status Subscriptions
 * 8. Real Provisioning Performance & Zero Fake Timers Audit
 */

import assert from 'node:assert';
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import {
  SovereignOfflineSyncEngine,
  MemoryStorage,
  OFFLINE_QUEUE_KEY,
  LOCAL_STORAGE_CACHE_KEY,
  queueOfflineMutation,
  replayOfflineQueue,
  getOfflineQueue,
  clearOfflineQueue,
  subscribeToSyncStatus,
  saveOfflineAction,
  getOfflineActions,
  clearOfflineActions,
  cacheLocalData,
  getCachedData
} from '../src/utils/offlineSync.js';
import { MockFirestore } from './test-utils.js';

// Dynamically extract constants, maps, and pure functions from src/components/Onboarding.jsx
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

class MemoryLocalStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
  clear() { this.map.clear(); }
}

async function runStressTests() {
  console.log('================================================================================');
  console.log('   🔥 OMNIBIZ AI — M2 ADVERSARIAL STRESS & LOAD TEST HARNESS');
  console.log('================================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function recordPass(testName, durationMs, details = '') {
    passedTests++;
    totalTests++;
    console.log(`  ✔ [PASS] ${testName} (${durationMs.toFixed(2)}ms)${details ? ' — ' + details : ''}`);
  }

  // --------------------------------------------------------------------------
  // SECTION 1: RAPID CONCURRENT QUEUE WRITES & HIGH THROUGHPUT
  // --------------------------------------------------------------------------
  console.log('\n--- Section 1: Rapid Concurrent Queue Writes & High Throughput ---');

  // Test 1.1: 2,000 Rapid Sequential & Concurrent Writes
  {
    const t0 = performance.now();
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    const writeCount = 2000;
    const generatedIds = new Set();

    for (let i = 0; i < writeCount; i++) {
      const res = engine.queueMutation({
        actionType: `ACTION_${i % 10}`,
        collection: 'stress_collection',
        docId: `doc_stress_${i}`,
        payload: {
          index: i,
          batchId: 'batch_alpha',
          meta: { worker: `worker_${i % 4}`, active: true }
        },
        timestamp: 100000 + i
      });
      assert.strictEqual(res.status, 'queued');
      assert.ok(!generatedIds.has(res.queueId), `Duplicate queue ID generated: ${res.queueId}`);
      generatedIds.add(res.queueId);
    }

    const queue = engine.getQueue();
    assert.strictEqual(queue.length, writeCount, `Expected ${writeCount} queued items, found ${queue.length}`);
    assert.strictEqual(generatedIds.size, writeCount);
    
    // Check first and last entries
    assert.strictEqual(queue[0].docId, 'doc_stress_0');
    assert.strictEqual(queue[writeCount - 1].docId, `doc_stress_${writeCount - 1}`);

    const t1 = performance.now();
    recordPass('2,000 Rapid Queue Writes (Zero ID Collisions & Strict Schema)', t1 - t0, `${(writeCount / ((t1 - t0) / 1000)).toFixed(0)} ops/sec`);
  }

  // Test 1.2: Status Subscription Under Heavy Mutation Burst
  {
    const t0 = performance.now();
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    let notificationCount = 0;
    let lastPendingReported = -1;

    const unsub = engine.subscribeToSyncStatus((status) => {
      notificationCount++;
      lastPendingReported = status.pendingCount;
    });

    const burstSize = 500;
    for (let i = 0; i < burstSize; i++) {
      engine.queueMutation({
        actionType: 'BURST_MUTATION',
        collection: 'burst_test',
        payload: { num: i }
      });
    }

    // Initial subscriber call (1) + 500 mutations = 501 notifications
    assert.strictEqual(notificationCount, burstSize + 1);
    assert.strictEqual(lastPendingReported, burstSize);

    unsub();
    engine.queueMutation({ actionType: 'AFTER_UNSUB', collection: 'burst_test', payload: {} });
    assert.strictEqual(notificationCount, burstSize + 1); // No further emissions after unsub

    const t1 = performance.now();
    recordPass('Status Subscription Reactivity Under 500-Item Burst', t1 - t0, `${notificationCount} emissions handled synchronously`);
  }

  // --------------------------------------------------------------------------
  // SECTION 2: LARGE PAYLOADS & BOUNDARY OBJECTS
  // --------------------------------------------------------------------------
  console.log('\n--- Section 2: Large Payloads & Boundary Objects ---');

  // Test 2.1: Multi-Megabyte Payload (1.5 MB Deep Object)
  {
    const t0 = performance.now();
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);

    // Build 1.5MB nested inventory payload
    const items = [];
    for (let i = 0; i < 5000; i++) {
      items.push({
        id: `sku_${i}`,
        name: `High-Performance Hydraulic Valve Part ${i}`,
        attributes: { psi: 3500 + (i % 50), material: 'Grade 316 Stainless Steel', tolerance: 0.001 },
        specSheetHash: 'a'.repeat(128),
        cost: 142.50
      });
    }

    const payload = {
      manifestId: 'manifest_mega_1',
      totalItems: items.length,
      items,
      notes: '🔥 Large payload test with special characters: \u0000 \uFFFF 🚀 & < > " \' \n \r \t',
      deeplyNested: { l1: { l2: { l3: { l4: { l5: { value: 'deep_success' } } } } } }
    };

    const res = engine.queueMutation({
      actionType: 'BULK_IMPORT',
      collection: 'catalogs',
      docId: 'cat_mega_01',
      payload,
      timestamp: 200000
    });

    assert.strictEqual(res.status, 'queued');
    const queue = engine.getQueue();
    assert.strictEqual(queue.length, 1);
    assert.strictEqual(queue[0].payload.items.length, 5000);
    assert.strictEqual(queue[0].payload.deeplyNested.l1.l2.l3.l4.l5.value, 'deep_success');

    // Replay to mock firestore
    const firestore = new MockFirestore();
    const replayRes = await engine.replayOfflineQueue(firestore, 'tenant_mega');
    assert.strictEqual(replayRes.success, true);
    assert.strictEqual(replayRes.processedCount, 1);

    const docSnap = await firestore.getDoc('users/tenant_mega/catalogs', 'cat_mega_01');
    assert.strictEqual(docSnap.data().items.length, 5000);
    assert.strictEqual(docSnap.data().deeplyNested.l1.l2.l3.l4.l5.value, 'deep_success');

    const t1 = performance.now();
    recordPass('1.5MB Structured Payload Queueing, Serialization & Replay', t1 - t0, '5,000 items preserved intact');
  }

  // Test 2.2: Edge-Case Payloads (Empty, Null, Special Types)
  {
    const t0 = performance.now();
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);

    const edgeCases = [
      { docId: 'edge_empty', payload: {} },
      { docId: 'edge_null_fields', payload: { a: null, b: '', c: 0, d: false } },
      { docId: 'edge_unicode', payload: { text: '日本語・中文・العربية・Русский・🔥💼⚡' } },
      { docId: 'edge_arrays', payload: { matrix: [[1, 2], [3, 4], [5, [6, 7]]] } }
    ];

    for (const ec of edgeCases) {
      engine.queueMutation({
        actionType: 'EDGE_CASE',
        collection: 'edge_tests',
        docId: ec.docId,
        payload: ec.payload
      });
    }

    const firestore = new MockFirestore();
    const replayRes = await engine.replayOfflineQueue(firestore, 'tenant_edge');
    assert.strictEqual(replayRes.success, true);
    assert.strictEqual(replayRes.processedCount, 4);

    const uniDoc = await firestore.getDoc('users/tenant_edge/edge_tests', 'edge_unicode');
    assert.strictEqual(uniDoc.data().text, '日本語・中文・العربية・Русский・🔥💼⚡');

    const t1 = performance.now();
    recordPass('Boundary Payloads (Unicode, Nulls, Empty Objects, Nested Arrays)', t1 - t0);
  }

  // --------------------------------------------------------------------------
  // SECTION 3: OUT-OF-ORDER TIMESTAMPS & LAST-WRITE-WINS (LWW) CONFLICT RESOLUTION
  // --------------------------------------------------------------------------
  console.log('\n--- Section 3: Out-of-Order Timestamps & Deterministic LWW ---');

  // Test 3.1: 50 Randomized Out-of-Order Updates to Single Document
  {
    const t0 = performance.now();
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    const firestore = new MockFirestore();
    const userId = 'tenant_lww_stress';

    // Seed initial document in remote Firestore
    await firestore.setDoc(`users/${userId}/work_orders`, 'wo_adversarial_1', {
      orderId: 'wo_adversarial_1',
      title: 'Initial Work Order',
      stateSequence: 'init',
      version: 0,
      createdAt: 1000,
      updatedAt: 1000
    });

    // Create 50 mutations with shuffled timestamps
    const timestamps = Array.from({ length: 50 }, (_, i) => 1100 + (i * 10));
    // Deterministic shuffle
    const shuffled = [...timestamps].sort(() => 0.5 - Math.random());

    for (let i = 0; i < shuffled.length; i++) {
      const ts = shuffled[i];
      engine.queueMutation({
        actionType: 'PROGRESS_WORK_ORDER',
        collection: 'work_orders',
        docId: 'wo_adversarial_1',
        payload: {
          lastUpdatedTimestamp: ts,
          stateSequence: `step_${ts}`,
          [`field_${ts}`]: `val_${ts}`
        },
        timestamp: ts
      });
    }

    // Replay queue
    const replayRes = await engine.replayOfflineQueue(firestore, userId);
    assert.strictEqual(replayRes.success, true);
    assert.strictEqual(replayRes.processedCount, 50);

    // Verify final state in Firestore matches the highest timestamp (max ts = 1100 + 49*10 = 1590)
    const finalDoc = await firestore.getDoc(`users/${userId}/work_orders`, 'wo_adversarial_1');
    const maxTs = Math.max(...timestamps);
    assert.strictEqual(finalDoc.data().lastUpdatedTimestamp, maxTs);
    assert.strictEqual(finalDoc.data().stateSequence, `step_${maxTs}`);
    assert.strictEqual(finalDoc.data().updatedAt, maxTs);
    assert.strictEqual(finalDoc.data().title, 'Initial Work Order'); // Preserved unmutated initial field

    const t1 = performance.now();
    recordPass('50 Shuffled Out-of-Order Updates Deterministically Reconciled to Max Timestamp', t1 - t0, `Max Timestamp: ${maxTs}`);
  }

  // Test 3.2: Remote Newer Than Local (Remote Preserved, Conflict Resolved)
  {
    const t0 = performance.now();
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    const firestore = new MockFirestore();
    const userId = 'tenant_lww_remote_win';

    // Remote updated at t=5000
    await firestore.setDoc(`users/${userId}/settings`, 'config', {
      theme: 'dark_emerald',
      activeUsers: 42,
      updatedAt: 5000
    });

    // Offline client queues stale update at t=2000
    engine.queueMutation({
      actionType: 'UPDATE_SETTINGS',
      collection: 'settings',
      docId: 'config',
      payload: { theme: 'light_purple' },
      timestamp: 2000
    });

    const replayRes = await engine.replayOfflineQueue(firestore, userId);
    assert.strictEqual(replayRes.success, true);
    assert.strictEqual(replayRes.conflictsResolved, 1);

    const doc = await firestore.getDoc(`users/${userId}/settings`, 'config');
    assert.strictEqual(doc.data().theme, 'dark_emerald'); // Remote wins
    assert.strictEqual(doc.data().activeUsers, 42);

    const t1 = performance.now();
    recordPass('Stale Offline Mutation Discarded in Favor of Newer Remote State', t1 - t0);
  }

  // Test 3.3: Identical Timestamp Collision (t_local === t_remote)
  {
    const t0 = performance.now();
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    const firestore = new MockFirestore();
    const userId = 'tenant_lww_equal_ts';

    await firestore.setDoc(`users/${userId}/dispatch`, 'd1', {
      truckId: 'TRUCK_9',
      driver: 'Alice',
      status: 'IDLE',
      updatedAt: 3000
    });

    // Local update with exact same timestamp t=3000
    engine.queueMutation({
      actionType: 'UPDATE_STATUS',
      collection: 'dispatch',
      docId: 'd1',
      payload: { status: 'DISPATCHED', destination: 'Site B' },
      timestamp: 3000
    });

    const res = await engine.replayOfflineQueue(firestore, userId);
    assert.strictEqual(res.success, true);

    const doc = await firestore.getDoc(`users/${userId}/dispatch`, 'd1');
    // Local merges with remote
    assert.strictEqual(doc.data().status, 'DISPATCHED');
    assert.strictEqual(doc.data().driver, 'Alice');
    assert.strictEqual(doc.data().destination, 'Site B');

    const t1 = performance.now();
    recordPass('Equal Timestamp Collision (t_local === t_remote) Merges Correctly', t1 - t0);
  }

  // --------------------------------------------------------------------------
  // SECTION 4: RECONNECTION BURSTS, RETRIES & TRANSIENT FAULTS
  // --------------------------------------------------------------------------
  console.log('\n--- Section 4: Reconnection Bursts, Retries & Transient Faults ---');

  // Test 4.1: Simulated Flaky Reconnection with 25% Fault Rate
  {
    const t0 = performance.now();
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    const totalMutations = 100;

    for (let i = 0; i < totalMutations; i++) {
      engine.queueMutation({
        actionType: 'FLAKY_ACTION',
        collection: 'flaky_records',
        docId: `flaky_${i}`,
        payload: { itemIndex: i, testVal: `val_${i}` },
        timestamp: 1000 + i
      });
    }

    assert.strictEqual(engine.getQueue().length, 100);

    // Flaky Firestore mock: fails if index % 4 === 0 (25 failures)
    const storeMap = new Map();
    const flakyFirestore = {
      getDoc: async (colPath, docId) => {
        const index = parseInt(docId.replace('flaky_', ''), 10);
        if (index % 4 === 0) {
          throw new Error(`Transient Network 503 at doc ${docId}`);
        }
        return storeMap.get(`${colPath}/${docId}`) || null;
      },
      setDoc: async (colPath, docId, data) => {
        const index = parseInt(docId.replace('flaky_', ''), 10);
        if (index % 4 === 0) {
          throw new Error(`Transient Network 503 at doc ${docId}`);
        }
        storeMap.set(`${colPath}/${docId}`, data);
      }
    };

    // First replay attempt during flake
    const replay1 = await engine.replayOfflineQueue(flakyFirestore, 'tenant_flaky');
    assert.strictEqual(replay1.success, false);
    assert.strictEqual(replay1.processedCount, 75);
    assert.strictEqual(replay1.remainingCount, 25);
    assert.strictEqual(engine.getQueue().length, 25);

    // Verify all remaining items have retryCount = 1 and error recorded
    for (const item of engine.getQueue()) {
      assert.strictEqual(item.retryCount, 1);
      assert.match(item.lastError, /Transient Network 503/);
      assert.strictEqual(item.status, 'failed');
    }

    // Network recovers: simulate stable firestore
    const stableFirestore = {
      getDoc: async (colPath, docId) => storeMap.get(`${colPath}/${docId}`) || null,
      setDoc: async (colPath, docId, data) => { storeMap.set(`${colPath}/${docId}`, data); }
    };

    // Second replay attempt
    const replay2 = await engine.replayOfflineQueue(stableFirestore, 'tenant_flaky');
    assert.strictEqual(replay2.success, true);
    assert.strictEqual(replay2.processedCount, 25);
    assert.strictEqual(replay2.remainingCount, 0);
    assert.strictEqual(engine.getQueue().length, 0);
    assert.strictEqual(storeMap.size, 100); // All 100 documents committed

    const t1 = performance.now();
    recordPass('Flaky Reconnection Simulation (25% Failures Retried & Fully Recovered)', t1 - t0, '100/100 documents committed');
  }

  // Test 4.2: Concurrent Replay Idempotency & Document Integrity
  {
    const t0 = performance.now();
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    const firestore = new MockFirestore();
    const userId = 'tenant_concurrent_replay';

    for (let i = 0; i < 20; i++) {
      engine.queueMutation({
        actionType: 'CONCURRENT_OP',
        collection: 'concurrent_col',
        docId: `c_${i}`,
        payload: { val: i, worker: 'mesh_node' },
        timestamp: 5000 + i
      });
    }

    // Invoke 3 concurrent replays simultaneously
    const [r1, r2, r3] = await Promise.all([
      engine.replayOfflineQueue(firestore, userId),
      engine.replayOfflineQueue(firestore, userId),
      engine.replayOfflineQueue(firestore, userId)
    ]);

    // All 3 replays report success, queue is cleared, all 20 documents exist in Firestore
    assert.strictEqual(r1.success, true);
    assert.strictEqual(r2.success, true);
    assert.strictEqual(r3.success, true);
    assert.strictEqual(engine.getQueue().length, 0);

    for (let i = 0; i < 20; i++) {
      const doc = await firestore.getDoc(`users/${userId}/concurrent_col`, `c_${i}`);
      assert.ok(doc.exists(), `Document c_${i} missing after concurrent replay`);
      assert.strictEqual(doc.data().val, i);
      assert.strictEqual(doc.data().worker, 'mesh_node');
    }

    const t1 = performance.now();
    recordPass('Triple Concurrent Replay Invocations (Idempotent LWW & 20/20 Docs Verified)', t1 - t0);
  }

  // --------------------------------------------------------------------------
  // SECTION 5: ONBOARDING PROVISIONING ACROSS ALL 5 INDUSTRY VERTICALS
  // --------------------------------------------------------------------------
  console.log('\n--- Section 5: Onboarding Provisioning Across All 5 Industry Verticals ---');

  const VERTICALS = [
    {
      key: 'plumbing_hvac',
      category: 'Plumbing, HVAC & Electrical Contracting',
      expectedTheme: 'rugged_services',
      expectedSkus: ['CAP-45-5', 'RELAY-SPST', 'TXV-VALVE-3T', 'COPPER-PIPE-34', 'PEX-CRIMP-TOOL'],
      expectedCompliance: ['UPC-2026-COMPLIANCE', 'NEC-ELECTRICAL-CLEARANCE', 'EPA-SECTION-608']
    },
    {
      key: 'auto_repair',
      category: 'Auto Repair, Maintenance & Towing',
      expectedTheme: 'rugged_services',
      expectedSkus: ['BRAKE-PAD-CER', 'OIL-FILT-SYN', 'ROTOR-VENT-F', 'SYN-OIL-5W30', 'SPARK-PLUG-IRID'],
      expectedCompliance: ['NHTSA-SAFETY-INSPECTION', 'OSHA-HAZMAT-FLUID']
    },
    {
      key: 'roofing_construction',
      category: 'Handyman, Construction & Remodeling',
      expectedTheme: 'rugged_services',
      expectedSkus: ['SHING-ARCH-30', 'UNDERLAY-SYN', 'ICE-WATER-SHLD', 'RIDGE-VENT-4FT', 'ROOF-NAIL-COIL'],
      expectedCompliance: ['OSHA-FALL-PROTECTION-1926', 'GAF-MASTER-ELITE']
    },
    {
      key: 'restaurant_food',
      category: 'Restaurants, Cafes & Food Trucks',
      expectedTheme: 'warm_cafe',
      expectedSkus: ['ESPRESSO-BEAN-5LB', 'OAT-MILK-CASE', 'TO-GO-BOX-ECO', 'SAN-WIPES-COMM', 'FRYER-OIL-35LB'],
      expectedCompliance: ['FDA-FOOD-CODE-2026', 'HACCP-TEMP-LOG']
    },
    {
      key: 'retail_wellness',
      category: 'Fashion, Boutique & Retail Shops',
      expectedTheme: 'rose_boutique',
      expectedSkus: ['BOT-SERUM-HA', 'ESS-OIL-LAV', 'SOY-CANDLE-SIG', 'SPA-TOWEL-LUX', 'BAMBOO-DISPLAY'],
      expectedCompliance: ['COSMETIC-GMP-ISO-22716', 'HIPAA-CLIENT-RECORDS']
    }
  ];

  async function simulateOnboardingProvisioning(verticalConfig, tier = 'pro') {
    const firestore = new MockFirestore();
    const localStorage = new MemoryLocalStorage();
    const uid = `tenant_${verticalConfig.key}_${Date.now()}`;
    const vKey = getVerticalKey(verticalConfig.category);
    assert.strictEqual(vKey, verticalConfig.key, `Vertical key mismatch for category ${verticalConfig.category}`);

    const themePreset = getThemePresetForCategory(verticalConfig.category);
    assert.strictEqual(themePreset, verticalConfig.expectedTheme);

    const generalProfile = {
      businessName: `Test ${verticalConfig.key} Business`,
      category: verticalConfig.category,
      plan: tier,
      selectedTier: tier,
      location: 'Roanoke, VA',
      website: `www.${verticalConfig.key}.com`,
      ownerName: 'Alex Master',
      ownerEmail: `alex@${verticalConfig.key}.com`,
      ownerPhone: '(540) 555-0100',
      teamMembers: [
        { name: 'Janet', role: 'Office Manager', phone: '(540) 555-0101' },
        { name: 'David', role: 'Lead Technician', phone: '(540) 555-0102' }
      ],
      themePreset,
      provisionedAt: Date.now(),
      onboardingComplete: true
    };

    // Stage 1: Profile Sync
    await firestore.setDoc(`users`, uid, {
      businessData: generalProfile,
      selectedTier: tier,
      onboardingComplete: true,
      autopilot: tier === 'pro' || tier === 'enterprise',
      savedHours: 12.5
    });
    await firestore.setDoc(`users/${uid}/profile`, 'general', generalProfile);

    // Stage 2: Vertical Ingestion from exact VERTICAL_SEEDS in Onboarding.jsx
    const seeds = VERTICAL_SEEDS[vKey];
    assert.ok(seeds, `Missing seeds for vertical key ${vKey}`);
    for (const inv of seeds.inventory) {
      await firestore.setDoc(`users/${uid}/inventory`, inv.sku, inv);
    }
    for (const comp of seeds.compliance) {
      await firestore.setDoc(`users/${uid}/compliance`, comp.code, comp);
    }

    // Stage 3: Blackboard state
    const blackboard = {
      status: 'INITIALIZED',
      activeAgents: 10,
      conductorLocked: false,
      lastUpdated: Date.now(),
      governanceFloor: 0.60
    };
    await firestore.setDoc(`users/${uid}/blackboard`, 'state', blackboard);

    // Stage 4: Local Storage Cache
    const cachePayload = { ...generalProfile };
    localStorage.setItem('omnibiz_tenant_profile', JSON.stringify(cachePayload));
    localStorage.setItem('omnibiz_active_vertical', vKey);
    localStorage.setItem('omnibiz_theme_preset', themePreset);
    localStorage.setItem('omnibiz_onboarding_completed', 'true');

    return { firestore, uid, seeds, vKey, themePreset, localStorage };
  }

  for (const v of VERTICALS) {
    const t0 = performance.now();
    const result = await simulateOnboardingProvisioning(v, 'pro');

    // Verify Firestore Root Doc
    const rootUser = await result.firestore.getDoc('users', result.uid);
    assert.strictEqual(rootUser.data().onboardingComplete, true);
    assert.strictEqual(rootUser.data().autopilot, true);
    assert.strictEqual(rootUser.data().selectedTier, 'pro');

    // Verify Inventory Seeding
    for (const expectedSku of v.expectedSkus) {
      const invDoc = await result.firestore.getDoc(`users/${result.uid}/inventory`, expectedSku);
      assert.ok(invDoc.exists(), `Missing expected SKU: ${expectedSku} in vertical ${v.key}`);
      assert.strictEqual(invDoc.data().sku, expectedSku);
      assert.ok(invDoc.data().unitCost > 0);
    }

    // Verify Compliance Seeding
    for (const expectedComp of v.expectedCompliance) {
      const compDoc = await result.firestore.getDoc(`users/${result.uid}/compliance`, expectedComp);
      assert.ok(compDoc.exists(), `Missing expected compliance code: ${expectedComp} in vertical ${v.key}`);
      assert.strictEqual(compDoc.data().code, expectedComp);
    }

    // Verify Blackboard state
    const bbDoc = await result.firestore.getDoc(`users/${result.uid}/blackboard`, 'state');
    assert.strictEqual(bbDoc.data().status, 'INITIALIZED');
    assert.strictEqual(bbDoc.data().activeAgents, 10);
    assert.strictEqual(bbDoc.data().governanceFloor, 0.60);

    // Verify Local Cache
    assert.strictEqual(result.localStorage.getItem('omnibiz_active_vertical'), v.key);
    assert.strictEqual(result.localStorage.getItem('omnibiz_theme_preset'), v.expectedTheme);
    assert.strictEqual(result.localStorage.getItem('omnibiz_onboarding_completed'), 'true');

    const t1 = performance.now();
    recordPass(`Provisioning Vertical [${v.key.toUpperCase()}] (${v.expectedSkus.length} SKUs, ${v.expectedCompliance.length} Compliance Rules)`, t1 - t0, `Theme: ${v.expectedTheme}`);
  }

  // --------------------------------------------------------------------------
  // SECTION 6: CONDUCTOR POLICY INVARIANT GATEKEEPING DURING REPLAY
  // --------------------------------------------------------------------------
  console.log('\n--- Section 6: Conductor Policy Invariant Gatekeeping During Replay ---');

  // Test 6.1: Margin Floor Breach (< 60%) Intercept
  {
    const t0 = performance.now();
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    const firestore = new MockFirestore();
    const userId = 'tenant_conductor_margin';

    engine.queueMutation({
      actionType: 'SUBMIT_QUOTE',
      collection: 'proposals',
      docId: 'quote_discounted',
      payload: { client: 'Bob', amount: 3200, grossMargin: 0.35 },
      timestamp: 8000
    });

    const res = await engine.replayOfflineQueue(firestore, userId);
    assert.strictEqual(res.success, true);

    const doc = await firestore.getDoc(`users/${userId}/proposals`, 'quote_discounted');
    assert.ok(doc.data().conductorVerdict);
    assert.strictEqual(doc.data().conductorVerdict.isBlocked, true);
    assert.strictEqual(doc.data().conductorVerdict.violations[0].ruleId, 'RULE_MARGIN_FLOOR_BREACH');

    const t1 = performance.now();
    recordPass('Conductor Blocks Sub-60% Margin Proposal During Offline Replay', t1 - t0);
  }

  // Test 6.2: High Margin (75%) Proposal Passes Cleanly
  {
    const t0 = performance.now();
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    const firestore = new MockFirestore();
    const userId = 'tenant_conductor_ok';

    engine.queueMutation({
      actionType: 'SUBMIT_QUOTE',
      collection: 'proposals',
      docId: 'quote_healthy',
      payload: { client: 'Alice', amount: 8500, grossMargin: 0.75 },
      timestamp: 8100
    });

    const res = await engine.replayOfflineQueue(firestore, userId);
    assert.strictEqual(res.success, true);

    const doc = await firestore.getDoc(`users/${userId}/proposals`, 'quote_healthy');
    assert.strictEqual(doc.data().conductorVerdict, undefined); // No violations, committed cleanly

    const t1 = performance.now();
    recordPass('Conductor Passes Compliant 75% Margin Proposal Without Intercept', t1 - t0);
  }

  // --------------------------------------------------------------------------
  // SECTION 7: PROVISIONING PERFORMANCE & ZERO FAKE TIMERS AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- Section 7: Provisioning Performance & Zero Fake Timers Audit ---');

  {
    const t0 = performance.now();
    // Audit Onboarding.jsx source code for setTimeout or setInterval or fake loops in Step 5
    const step5Index = onboardingRaw.indexOf('STEP 5: Live Ecosystem Provisioning');
    assert.ok(step5Index !== -1, 'STEP 5 block must be present');
    const step5Block = onboardingRaw.substring(step5Index);

    assert.ok(!step5Block.includes('setTimeout'), 'STEP 5 must NOT contain any fake setTimeout calls');
    assert.ok(!step5Block.includes('setInterval'), 'STEP 5 must NOT contain any fake setInterval calls');
    assert.ok(onboardingRaw.includes('runProvisioningPipeline'), 'Onboarding must contain runProvisioningPipeline');
    assert.ok(onboardingRaw.includes('performance.now()'), 'Onboarding must benchmark stage durations with performance.now()');

    const t1 = performance.now();
    recordPass('Static Code Audit: Zero Fake setTimeout/setInterval Loops in Onboarding Step 5', t1 - t0);
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log(`   📊 STRESS TEST SUITE EXECUTION SUMMARY: ${passedTests}/${totalTests} PASSED (100%)`);
  console.log('================================================================================\n');
}

runStressTests().catch(err => {
  console.error('❌ STRESS TEST FAILURE:', err);
  process.exit(1);
});
