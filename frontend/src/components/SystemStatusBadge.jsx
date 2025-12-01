import React, { useEffect, useState } from 'react';
import { getStatus } from '../api/status.js';

/**
 * SystemStatusBadge - Lightweight component to display backend status
 * 
 * Shows "Backend: Online ✅" if status is ok, otherwise "Backend: Unreachable ⚠️"
 * Non-intrusive, small font-size component suitable for footer or utility areas.
 */
export default function SystemStatusBadge() {
  const [status, setStatus] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkStatus() {
      try {
        const data = await getStatus();
        if (mounted) {
          setStatus(data);
          setIsOnline(data?.status === 'ok');
        }
      } catch (err) {
        if (mounted) {
          setIsOnline(false);
          setStatus(null);
        }
      }
    }

    checkStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{
      fontSize: '0.75rem',
      opacity: 0.7,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      <span style={{ color: isOnline ? '#00ffc6' : '#ff6b6b' }}>
        Backend: {isOnline ? 'Online ✅' : 'Unreachable ⚠️'}
      </span>
    </div>
  );
}

