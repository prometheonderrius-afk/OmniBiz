import React, { useState, useEffect } from 'react';
import { getOfflineQueue, clearOfflineQueue } from '../utils/offlineSync';

export default function OfflineSyncBadge({ addNotification }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const queue = getOfflineQueue();
      if (queue.length > 0) {
        if (addNotification) {
          addNotification(`Network reconnected! Synchronized ${queue.length} offline records to Google Cloud.`, 'system');
        }
        clearOfflineQueue();
        setQueuedCount(0);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (addNotification) {
        addNotification('Network disconnected. Operating in Sovereign Offline-First Cache Mode.', 'system');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setQueuedCount(getOfflineQueue().length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addNotification]);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '20px',
      background: isOnline ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.1)',
      border: isOnline ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.4)',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: isOnline ? 'var(--accent-emerald)' : '#f59e0b'
    }}>
      <span style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: isOnline ? 'var(--accent-emerald)' : '#f59e0b'
      }}></span>
      {isOnline ? 'Local-First Sovereign (Online)' : `Offline Mode (${queuedCount} Queued)`}
    </div>
  );
}
