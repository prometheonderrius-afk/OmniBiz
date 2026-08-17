// Local-First Offline Synchronization Manager (IndexedDB / LocalStorage Cache)

const OFFLINE_QUEUE_KEY = 'omnibiz_offline_sync_queue';
const LOCAL_STORAGE_CACHE_KEY = 'omnibiz_local_cache';

export const saveOfflineAction = (actionType, payload) => {
  try {
    const existingQueue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    const newEntry = {
      id: 'offline-' + Date.now(),
      type: actionType,
      payload,
      timestamp: Date.now()
    };
    existingQueue.push(newEntry);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existingQueue));
    return newEntry;
  } catch (err) {
    console.error('Failed to save offline action:', err);
    return null;
  }
};

export const getOfflineQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch (err) {
    return [];
  }
};

export const clearOfflineQueue = () => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

export const cacheLocalData = (key, data) => {
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CACHE_KEY) || '{}');
    current[key] = { data, cachedAt: Date.now() };
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to cache local data:', err);
  }
};

export const getCachedData = (key) => {
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CACHE_KEY) || '{}');
    return current[key] ? current[key].data : null;
  } catch (err) {
    return null;
  }
};
