/**
 * useRealTimeStatus.ts - Real-Time Member Status Hook
 * ===================================================
 * Calculates member status based on last_activity_at
 * Updates every second for live countdown
 * 
 * Status Rules:
 * - Active: < 60 seconds ago (green pulse)
 * - Idle: 60-300 seconds ago (yellow)
 * - Offline: > 300 seconds ago or no activity (gray)
 */

import { useState, useEffect } from 'react';

export type MemberStatus = 'active' | 'idle' | 'offline';

interface UseRealTimeStatusReturn {
  status: MemberStatus;
  secondsAgo: number;
  formattedTime: string;
}

export function useRealTimeStatus(lastActivityAt: string | null): UseRealTimeStatusReturn {
  const [status, setStatus] = useState<MemberStatus>('offline');
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [formattedTime, setFormattedTime] = useState('Never');
  
  useEffect(() => {
    if (!lastActivityAt) {
      setStatus('offline');
      setSecondsAgo(0);
      setFormattedTime('Never');
      return;
    }
    
    const updateStatus = () => {
      const now = new Date();
      const lastActivity = new Date(lastActivityAt);
      const seconds = Math.floor((now.getTime() - lastActivity.getTime()) / 1000);
      
      setSecondsAgo(seconds);
      
      // Calculate status
      let newStatus: MemberStatus;
      if (seconds < 60) {
        newStatus = 'active';
      } else if (seconds < 300) {
        newStatus = 'idle';
      } else {
        newStatus = 'offline';
      }
      setStatus(newStatus);
      
      // Format time
      let formatted: string;
      if (seconds < 60) {
        formatted = `${seconds}s ago`;
      } else if (seconds < 3600) {
        formatted = `${Math.floor(seconds / 60)}m ago`;
      } else if (seconds < 86400) {
        formatted = `${Math.floor(seconds / 3600)}h ago`;
      } else {
        formatted = `${Math.floor(seconds / 86400)}d ago`;
      }
      setFormattedTime(formatted);
    };
    
    // Initial update
    updateStatus();
    
    // Update every second
    const interval = setInterval(updateStatus, 1000);
    
    return () => clearInterval(interval);
  }, [lastActivityAt]);
  
  return { status, secondsAgo, formattedTime };
}
