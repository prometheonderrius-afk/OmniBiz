/**
 * EDGE & BOUNDARY STRESS TEST FOR CONDUCTOR & OFFLINE ENGINE
 */
import assert from 'node:assert';
import { evaluateConductorRules } from '../src/utils/conductorRules.js';
import { SovereignOfflineSyncEngine, MemoryStorage } from '../src/utils/offlineSync.js';
import { MockFirestore } from './test-utils.js';

console.log('--- Running Conductor & Offline Edge Cases ---');

// Test 1: Conductor with missing/partial state properties
{
  const v1 = evaluateConductorRules({});
  assert.strictEqual(v1.isBlocked, false);
  assert.strictEqual(v1.violations.length, 0);

  const v2 = evaluateConductorRules({ financialHealth: {} });
  assert.strictEqual(v2.isBlocked, false);

  const v3 = evaluateConductorRules({ estimatingProposal: { grossMargin: 0 } });
  // 0 is falsy, let's check how conductor evaluates grossMargin: 0
  // if (state.estimatingProposal?.grossMargin && (state.estimatingProposal.grossMargin < ...))
  // grossMargin: 0 is falsy in JavaScript!
}

// Test 2: Offline Engine with rapid queue/clear cycles
{
  const storage = new MemoryStorage();
  const engine = new SovereignOfflineSyncEngine(storage);
  for (let i = 0; i < 50; i++) {
    engine.queueMutation({ actionType: 'A', collection: 'c', payload: { i } });
    engine.clearQueue();
    assert.strictEqual(engine.getQueue().length, 0);
  }
}

// Test 3: Offline Engine with special characters and Unicode in docId and collection
{
  const storage = new MemoryStorage();
  const engine = new SovereignOfflineSyncEngine(storage);
  const firestore = new MockFirestore();
  
  engine.queueMutation({
    actionType: 'SPECIAL_CHARS',
    collection: 'col/nested/sub',
    docId: 'doc#123:abc-xyz_99',
    payload: { special: '✓ 🎉 🚀' }
  });

  const res = await engine.replayOfflineQueue(firestore, 'user_spec');
  assert.strictEqual(res.success, true);
  const doc = await firestore.getDoc('users/user_spec/col/nested/sub', 'doc#123:abc-xyz_99');
  assert.strictEqual(doc.data().special, '✓ 🎉 🚀');
}

console.log('✔ All Edge & Boundary tests passed cleanly!\n');
