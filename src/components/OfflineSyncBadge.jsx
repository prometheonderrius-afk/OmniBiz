import React, { useState, useEffect, useCallback } from 'react';
import { subscribeToSyncStatus, replayOfflineQueue, offlineEngine } from '../utils/offlineSync';
import { db, auth } from '../firebase';

export default function OfflineSyncBadge({ addNotification, firestoreDb, db: propDb, userId }) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [, setLastSyncTime] = useState(Date.now());

  const performReplay = useCallback(async (isAutomatic = false) => {
    const activeDb = firestoreDb || propDb || db;
    const targetUserId = userId || auth?.currentUser?.uid || 'default_tenant';

    setIsSyncing(true);
    try {
      const res = await replayOfflineQueue(activeDb, targetUserId);
      if (res && res.processedCount > 0 && addNotification) {
        addNotification(`Network reconnected! Synchronized ${res.processedCount} offline records to Google Cloud.`, 'system');
      } else if (!isAutomatic && addNotification) {
        addNotification('All local offline records are synchronized.', 'system');
      }
      return res;
    } catch (err) {
      console.error('Offline queue replay failed:', err);
      if (addNotification) {
        addNotification(`Sync replay warning: ${err?.message || err}`, 'system');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [firestoreDb, propDb, userId, addNotification]);

  useEffect(() => {
    const unsubscribe = subscribeToSyncStatus((status) => {
      setIsOnline(status.isOnline);
      setQueuedCount(status.pendingCount);
      setLastSyncTime(status.lastSyncTime);
    });

    const handleOnline = () => {
      offlineEngine.setOnlineStatus(true);
      performReplay(true);
    };

    const handleOffline = () => {
      offlineEngine.setOnlineStatus(false);
      if (addNotification) {
        addNotification('Network disconnected. Operating in Sovereign Offline-First Cache Mode.', 'system');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [performReplay, addNotification]);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '20px',
        background: isSyncing 
          ? 'rgba(6, 182, 212, 0.12)' 
          : isOnline 
            ? 'rgba(16, 185, 129, 0.08)' 
            : 'rgba(245, 158, 11, 0.1)',
        border: isSyncing 
          ? '1px solid rgba(6, 182, 212, 0.4)' 
          : isOnline 
            ? '1px solid rgba(16, 185, 129, 0.25)' 
            : '1px solid rgba(245, 158, 11, 0.4)',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: isSyncing 
          ? '#06b6d4' 
          : isOnline 
            ? 'var(--accent-emerald, #10b981)' 
            : '#f59e0b',
        transition: 'all 0.2s ease'
      }}>
        {isSyncing ? (
          <div className="animate-spin-fast" style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            border: '2px solid rgba(6, 182, 212, 0.3)',
            borderTopColor: '#06b6d4'
          }}></div>
        ) : (
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: isOnline ? 'var(--accent-emerald, #10b981)' : '#f59e0b',
            boxShadow: isOnline ? '0 0 6px rgba(16, 185, 129, 0.6)' : '0 0 6px rgba(245, 158, 11, 0.6)'
          }}></span>
        )}
        {isSyncing ? 'Syncing...' : isOnline ? 'Local-First Sovereign (Online)' : `Offline Mode (${queuedCount} Queued)`}
      </div>

      {queuedCount > 0 && !isSyncing && (
        <button
          type="button"
          onClick={() => performReplay(false)}
          title="Manually synchronize queued offline actions"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.1))',
            color: 'var(--text-primary, #ffffff)',
            borderRadius: '12px',
            padding: '3px 8px',
            fontSize: '0.7rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Sync Now
        </button>
      )}
    </div>
  );
}

