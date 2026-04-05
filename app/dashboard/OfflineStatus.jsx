'use client';

import { useState, useEffect } from 'react';

export default function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Initial check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 150, // Higher to avoid overlapping with InstallPrompt or Bottom Nav
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: '#ef4444',
      color: '#fff',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      border: '1px solid rgba(255,255,255,0.2)'
    }}>
      <span style={{ fontSize: '14px' }}>⚠️</span>
      <span>No Internet Connection. Some features may not work.</span>
      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
