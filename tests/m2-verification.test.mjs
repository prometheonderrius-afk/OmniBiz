/**
 * Milestone M2 Dedicated Verification Suite
 * Tests actual source files: src/utils/offlineSync.js
 */

import assert from 'node:assert';
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
  OFFLINE_QUEUE_KEY
} from '../src/utils/offlineSync.js';

import { MockFirestore } from './test-utils.js';

async function runM2Verification() {
  console.log('--- Starting Milestone M2 Sovereign Offline Sync Verification ---');

  // Test 1: SovereignOfflineSyncEngine instantiation and schema
  {
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);

    const res = engine.queueMutation({
      actionType: 'CREATE_WORK_ORDER',
      collection: 'jobs',
      docId: 'wo_m2_100',
      payload: { customer: 'John Doe', amount: 500 },
      timestamp: 1000
    });

    assert.strictEqual(res.status, 'queued');
    assert.match(res.queueId, /^sync_\d+_/);
    assert.strictEqual(res.entry.actionType, 'CREATE_WORK_ORDER');
    assert.strictEqual(res.entry.collection, 'jobs');
    assert.strictEqual(res.entry.docId, 'wo_m2_100');
    assert.strictEqual(res.entry.retryCount, 0);
    assert.strictEqual(res.entry.status, 'pending');
    assert.strictEqual(res.entry.lastError, null);

    const storedQueue = JSON.parse(storage.getItem(OFFLINE_QUEUE_KEY));
    assert.strictEqual(storedQueue.length, 1);
    assert.strictEqual(storedQueue[0].queueId, res.queueId);
    console.log('✔ Test 1 Passed: SovereignOfflineSyncEngine queues mutation with exact transaction schema');
  }

  // Test 2: Auto DocId generation when docId is omitted
  {
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);

    const res = engine.queueMutation({
      actionType: 'INVENTORY_ADJUST',
      collection: 'inventory',
      payload: { sku: 'CAP-45-5', delta: -1 }
    });

    assert.match(res.entry.docId, /^doc_\d+/);
    console.log('✔ Test 2 Passed: Auto-generates docId matching /^doc_\\d+/');
  }

  // Test 3: Status subscription mechanism
  {
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    let subscriberNotifications = [];

    const unsub = engine.subscribeToSyncStatus((status) => {
      subscriberNotifications.push({ ...status });
    });

    assert.strictEqual(subscriberNotifications.length, 1);
    assert.strictEqual(subscriberNotifications[0].pendingCount, 0);
    assert.strictEqual(subscriberNotifications[0].isOnline, true);

    engine.queueMutation({ actionType: 'A1', collection: 'col', payload: {} });
    assert.strictEqual(subscriberNotifications.length, 2);
    assert.strictEqual(subscriberNotifications[1].pendingCount, 1);

    engine.setOnlineStatus(false);
    assert.strictEqual(subscriberNotifications.length, 3);
    assert.strictEqual(subscriberNotifications[2].isOnline, false);

    unsub();
    engine.queueMutation({ actionType: 'A2', collection: 'col', payload: {} });
    assert.strictEqual(subscriberNotifications.length, 3); // Unsubscribed, no extra notifications
    console.log('✔ Test 3 Passed: subscribeToSyncStatus emits live status and unsubscribes cleanly');
  }

  // Test 4: Replay with Last-Write-Wins (LWW) conflict resolution
  {
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    const firestore = new MockFirestore();
    const userId = 'tenant_m2_lww';

    // Step A: Seed older remote record
    await firestore.setDoc(`users/${userId}/jobs`, 'job_101', {
      status: 'SCHEDULED',
      dispatcherNote: 'Access gate code #1234',
      updatedAt: 500
    });

    // Step B: Queue newer offline technician update (t=1500)
    engine.queueMutation({
      actionType: 'COMPLETE_JOB',
      collection: 'jobs',
      docId: 'job_101',
      payload: { status: 'COMPLETED_SIGNED', signedBy: 'Homeowner Alice', grossMargin: 0.65 },
      timestamp: 1500
    });

    // Step C: Queue stale update for different doc (remote is t=3000, local is t=1200)
    await firestore.setDoc(`users/${userId}/jobs`, 'job_102', {
      status: 'CANCELLED_BY_CUSTOMER',
      updatedAt: 3000
    });
    engine.queueMutation({
      actionType: 'UPDATE_JOB',
      collection: 'jobs',
      docId: 'job_102',
      payload: { status: 'EN_ROUTE' },
      timestamp: 1200
    });

    // Replay queue
    const replayRes = await engine.replayOfflineQueue(firestore, userId);
    assert.strictEqual(replayRes.success, true);
    assert.strictEqual(replayRes.processedCount, 2);
    assert.strictEqual(replayRes.conflictsResolved, 2);
    assert.strictEqual(engine.getQueue().length, 0);

    // Verify job_101: local won LWW, merged fields, preserved remote dispatcherNote
    const job101Doc = await firestore.getDoc(`users/${userId}/jobs`, 'job_101');
    assert.strictEqual(job101Doc.data().status, 'COMPLETED_SIGNED');
    assert.strictEqual(job101Doc.data().signedBy, 'Homeowner Alice');
    assert.strictEqual(job101Doc.data().dispatcherNote, 'Access gate code #1234');
    assert.strictEqual(job101Doc.data().updatedAt, 1500);

    // Verify job_102: remote won LWW, kept CANCELLED_BY_CUSTOMER
    const job102Doc = await firestore.getDoc(`users/${userId}/jobs`, 'job_102');
    assert.strictEqual(job102Doc.data().status, 'CANCELLED_BY_CUSTOMER');
    console.log('✔ Test 4 Passed: LWW merges local updates when local >= remote and preserves remote fields');
  }

  // Test 5: Conductor Policy Invariant Pre-Commit Validation during Replay
  {
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    const firestore = new MockFirestore();
    const userId = 'tenant_m2_conductor';

    // Queue mutation with low margin (< 0.60)
    engine.queueMutation({
      actionType: 'PROPOSAL_SUBMIT',
      collection: 'proposals',
      docId: 'prop_99',
      payload: { title: 'AC Replacement', grossMargin: 0.45, amount: 4500 },
      timestamp: 2000
    });

    await engine.replayOfflineQueue(firestore, userId);
    const propDoc = await firestore.getDoc(`users/${userId}/proposals`, 'prop_99');
    assert.ok(propDoc.exists());
    assert.ok(propDoc.data().conductorVerdict);
    assert.strictEqual(propDoc.data().conductorVerdict.isBlocked, true);
    assert.strictEqual(propDoc.data().conductorVerdict.violations[0].ruleId, 'RULE_MARGIN_FLOOR_BREACH');
    console.log('✔ Test 5 Passed: Conductor deterministic policy evaluation attached during replay');
  }

  // Test 6: Retry count and error retention on write exception
  {
    const storage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(storage);
    const faultyDb = {
      getDoc: async () => { throw new Error('Simulated network timeout'); }
    };

    engine.queueMutation({ actionType: 'FAULTY_ACTION', collection: 'faulty', docId: 'f1', payload: {} });
    const res = await engine.replayOfflineQueue(faultyDb, 'user_fault');

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.remainingCount, 1);
    assert.strictEqual(engine.getQueue()[0].retryCount, 1);
    assert.strictEqual(engine.getQueue()[0].lastError, 'Simulated network timeout');
    console.log('✔ Test 6 Passed: Faulty mutations retain in queue with retryCount and lastError');
  }

  // Test 7: Global helper exports
  {
    clearOfflineQueue();
    assert.strictEqual(getOfflineQueue().length, 0);

    const act = saveOfflineAction('TEST_ACTION', { foo: 'bar' });
    assert.ok(act.queueId);
    assert.strictEqual(getOfflineActions().length, 1);

    cacheLocalData('test_key', { a: 1, b: 2 });
    assert.deepStrictEqual(getCachedData('test_key'), { a: 1, b: 2 });

    clearOfflineActions();
    assert.strictEqual(getOfflineQueue().length, 0);
    console.log('✔ Test 7 Passed: Named functional helper exports operational');
  }

  console.log('\n🎉 ALL MILESTONE M2 VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n');
}

runM2Verification().catch(err => {
  console.error('❌ M2 Verification Failure:', err);
  process.exit(1);
});
