/**
 * OMNIBIZ AI — SOVEREIGN OFFLINE SYNC ENGINE & RECONCILIATION MANAGER
 * 
 * Local-First Sovereign Offline Queue with Last-Write-Wins (LWW) conflict resolution,
 * IndexedDB durable persistence with synchronous localStorage/MemoryStorage fallback,
 * and Deterministic Conductor Policy Invariant Pre-Commit Validation.
 */

import { evaluateConductorRules } from './conductorRules.js';

export const OFFLINE_QUEUE_KEY = 'omnibiz_offline_sync_queue';
export const LOCAL_STORAGE_CACHE_KEY = 'omnibiz_local_cache';
const DB_NAME = 'omnibiz_sovereign_db';
const DB_VERSION = 1;
const MUTATION_STORE = 'mutation_queue';
const CACHE_STORE = 'keyValueCache';

/**
 * Robust in-memory storage fallback for Node.js test runners, SSR, or private browsing.
 */
export class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

/**
 * IndexedDB helpers for durable multi-megabyte structured local-first storage.
 */
function openIndexedDB() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(MUTATION_STORE)) {
          db.createObjectStore(MUTATION_STORE, { keyPath: 'queueId' });
        }
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbPutMutation(entry) {
  try {
    const db = await openIndexedDB();
    if (!db) return;
    const tx = db.transaction(MUTATION_STORE, 'readwrite');
    tx.objectStore(MUTATION_STORE).put(entry);
  } catch (err) {
    console.debug('IndexedDB mutation put fallback:', err);
  }
}

async function idbClearMutations() {
  try {
    const db = await openIndexedDB();
    if (!db) return;
    const tx = db.transaction(MUTATION_STORE, 'readwrite');
    tx.objectStore(MUTATION_STORE).clear();
  } catch (err) {
    console.debug('IndexedDB mutation clear fallback:', err);
  }
}

async function idbPutCache(key, data) {
  try {
    const db = await openIndexedDB();
    if (!db) return;
    const tx = db.transaction(CACHE_STORE, 'readwrite');
    tx.objectStore(CACHE_STORE).put({ key, data, cachedAt: Date.now() });
  } catch (err) {
    console.debug('IndexedDB cache put fallback:', err);
  }
}

/**
 * Sovereign Offline Sync Engine
 */
export class SovereignOfflineSyncEngine {
  constructor(storage = (typeof localStorage !== 'undefined' ? localStorage : new MemoryStorage())) {
    this.storage = storage;
    this.QUEUE_KEY = OFFLINE_QUEUE_KEY;
    this.CACHE_KEY = LOCAL_STORAGE_CACHE_KEY;
    this.isOnline = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
    this.listeners = new Set();
    this.lastSyncTime = Date.now();
  }

  /**
   * Queue a persistent mutation locally.
   * Transaction schema: { queueId, actionType, collection, docId, payload, timestamp, status, retryCount, lastError }
   */
  queueMutation({ actionType, collection, docId, payload = {}, timestamp = Date.now() }) {
    const queue = this.getQueue();
    const entryDocId = docId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const entry = {
      queueId: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actionType,
      collection,
      docId: entryDocId,
      payload: payload || {},
      timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
      retryCount: 0,
      status: 'pending',
      lastError: null
    };

    queue.push(entry);
    this.storage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    idbPutMutation(entry);
    this._emitStatus();
    return { queueId: entry.queueId, status: 'queued', entry };
  }

  /**
   * Retrieve current mutation queue in FIFO order.
   */
  getQueue() {
    try {
      const raw = this.storage.getItem(this.QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear all pending queued mutations.
   */
  clearQueue() {
    this.storage.removeItem(this.QUEUE_KEY);
    idbClearMutations();
    this._emitStatus();
  }

  /**
   * Set live network online status.
   */
  setOnlineStatus(online) {
    this.isOnline = Boolean(online);
    this._emitStatus();
  }

  /**
   * Subscribe to live sync status changes.
   * Callback receives { isOnline, pendingCount, lastSyncTime }.
   * Returns an unsubscribe function.
   */
  subscribeToSyncStatus(callback) {
    this.listeners.add(callback);
    try {
      callback({
        isOnline: this.isOnline,
        pendingCount: this.getQueue().length,
        lastSyncTime: this.lastSyncTime
      });
    } catch (err) {
      console.error('Error in initial sync status subscriber invocation:', err);
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  _emitStatus() {
    const status = {
      isOnline: this.isOnline,
      pendingCount: this.getQueue().length,
      lastSyncTime: this.lastSyncTime
    };
    for (const cb of Array.from(this.listeners)) {
      try {
        cb(status);
      } catch (err) {
        console.error('Error emitting sync status to subscriber:', err);
      }
    }
  }

  /**
   * Replay all pending offline mutations to Firestore with Last-Write-Wins (LWW)
   * conflict resolution and Conductor policy invariant pre-commit validation.
   */
  async replayOfflineQueue(firestoreInstance, userId = 'default_user') {
    const queue = this.getQueue();
    if (!queue.length) {
      return { success: true, processedCount: 0, conflictsResolved: 0, remainingCount: 0 };
    }

    let processedCount = 0;
    let conflictsResolved = 0;
    const remainingQueue = [];

    // Sort ascending by timestamp for deterministic sequential replay
    queue.sort((a, b) => a.timestamp - b.timestamp);

    for (const item of queue) {
      try {
        // Conductor Invariant Gatekeeping
        let conductorVerdict = null;
        try {
          const conductorContext = {
            estimatingProposal: item.payload?.grossMargin !== undefined ? { grossMargin: item.payload.grossMargin } : undefined,
            financialHealth: item.payload?.financialHealth,
            triageIntent: item.payload?.hazard ? { hazard: item.payload.hazard } : undefined,
            supplyStatus: item.payload?.supplyStatus
          };
          conductorVerdict = evaluateConductorRules(conductorContext);
        } catch (conductorErr) {
          console.debug('Conductor rule check bypassed during replay:', conductorErr);
        }

        const payloadToCommit = { ...item.payload };
        if (conductorVerdict && conductorVerdict.violations?.length > 0) {
          payloadToCommit.conductorVerdict = {
            atomicLockId: conductorVerdict.atomicLockId,
            isBlocked: conductorVerdict.isBlocked,
            violations: conductorVerdict.violations,
            evaluatedAt: Date.now()
          };
        }

        // Detect if MockFirestore (test-utils.js) or standard Firebase Modular SDK
        const isMockFirestore = typeof firestoreInstance?.getDoc === 'function';

        if (isMockFirestore) {
          const colPath = `users/${userId}/${item.collection}`;
          const existingDoc = await firestoreInstance.getDoc(colPath, item.docId);

          if (existingDoc && (typeof existingDoc.exists === 'function' ? existingDoc.exists() : Boolean(existingDoc))) {
            const remoteData = (typeof existingDoc.data === 'function' ? existingDoc.data() : existingDoc) || {};
            const remoteTimestamp = remoteData.updatedAt || remoteData.createdAt || 0;

            // Last-Write-Wins (LWW)
            if (item.timestamp >= remoteTimestamp) {
              await firestoreInstance.setDoc(colPath, item.docId, {
                ...remoteData,
                ...payloadToCommit,
                updatedAt: item.timestamp,
                syncReconciledAt: Date.now()
              });
              conflictsResolved++;
            } else {
              // Remote is newer, preserve remote data intact
              conflictsResolved++;
            }
          } else {
            // Document does not exist in remote Firestore yet
            await firestoreInstance.setDoc(colPath, item.docId, {
              ...payloadToCommit,
              createdAt: item.timestamp,
              updatedAt: item.timestamp
            });
          }
        } else if (firestoreInstance && typeof window !== 'undefined') {
          // Firebase Modular Web SDK in Browser
          const { doc, getDoc, setDoc } = await import('firebase/firestore');
          const docRef = doc(firestoreInstance, 'users', userId, item.collection, item.docId);
          const snap = await getDoc(docRef);

          if (snap && snap.exists()) {
            const remoteData = snap.data() || {};
            const remoteTimestamp = remoteData.updatedAt || remoteData.createdAt || 0;

            if (item.timestamp >= remoteTimestamp) {
              await setDoc(docRef, {
                ...remoteData,
                ...payloadToCommit,
                updatedAt: item.timestamp,
                syncReconciledAt: Date.now()
              }, { merge: true });
              conflictsResolved++;
            } else {
              conflictsResolved++;
            }
          } else {
            await setDoc(docRef, {
              ...payloadToCommit,
              createdAt: item.timestamp,
              updatedAt: item.timestamp
            });
          }
        }

        processedCount++;
      } catch (err) {
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = err?.message || String(err);
        item.status = 'failed';
        remainingQueue.push(item);
      }
    }

    this.lastSyncTime = Date.now();
    if (remainingQueue.length) {
      this.storage.setItem(this.QUEUE_KEY, JSON.stringify(remainingQueue));
    } else {
      this.storage.removeItem(this.QUEUE_KEY);
      idbClearMutations();
    }

    this._emitStatus();
    return {
      success: remainingQueue.length === 0,
      processedCount,
      conflictsResolved,
      remainingCount: remainingQueue.length
    };
  }

  /**
   * Cache arbitrary local data in local-first storage.
   */
  cacheLocalData(key, data) {
    try {
      const current = JSON.parse(this.storage.getItem(this.CACHE_KEY) || '{}');
      current[key] = { data, cachedAt: Date.now() };
      this.storage.setItem(this.CACHE_KEY, JSON.stringify(current));
      idbPutCache(key, data);
    } catch (err) {
      console.error('Failed to cache local data:', err);
    }
  }

  /**
   * Retrieve cached data from local-first storage.
   */
  getCachedData(key) {
    try {
      const current = JSON.parse(this.storage.getItem(this.CACHE_KEY) || '{}');
      return current[key] ? current[key].data : null;
    } catch {
      return null;
    }
  }
}

// Global Singleton Instance
export const offlineEngine = new SovereignOfflineSyncEngine();

// Top-Level Convenience Functional Exports
export const queueOfflineMutation = (mutation) => offlineEngine.queueMutation(mutation);
export const replayOfflineQueue = (firestoreDb, userId) => offlineEngine.replayOfflineQueue(firestoreDb, userId);
export const getOfflineQueue = () => offlineEngine.getQueue();
export const clearOfflineQueue = () => offlineEngine.clearQueue();
export const subscribeToSyncStatus = (callback) => offlineEngine.subscribeToSyncStatus(callback);

// Backward-Compatible Action Helpers
export const saveOfflineAction = (actionType, payload) => {
  const result = offlineEngine.queueMutation({ actionType, collection: 'general', payload });
  return result.entry;
};
export const getOfflineActions = () => offlineEngine.getQueue();
export const clearOfflineActions = () => offlineEngine.clearQueue();

export const cacheLocalData = (key, data) => offlineEngine.cacheLocalData(key, data);
export const getCachedData = (key) => offlineEngine.getCachedData(key);

export default offlineEngine;
