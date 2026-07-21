import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/db';

// Tracks whether the app currently has a live Realtime connection to
// Supabase. Status values: 'connecting' | 'connected' | 'offline'.
// Uses a single dedicated channel (separate from the data-table channels in
// useData.js) purely to observe connection state via Supabase's official
// subscribe() status callback — 'SUBSCRIBED' means the socket is live.
export function useSyncStatus() {
  const [status, setStatus] = useState(navigator.onLine === false ? 'offline' : 'connecting');
  const [lastConnected, setLastConnected] = useState(null);

  const checkNow = useCallback(async () => {
    setStatus('connecting');
    try {
      const { error } = await supabase.from('app_settings').select('id').limit(1);
      if (error) throw error;
      setStatus('connected');
      setLastConnected(new Date());
    } catch {
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    function handleOffline() {
      setStatus('offline');
    }
    function handleOnline() {
      checkNow();
    }
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    const channel = supabase.channel('connection-status-monitor').subscribe((subStatus) => {
      if (subStatus === 'SUBSCRIBED') {
        setStatus('connected');
        setLastConnected(new Date());
      } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT' || subStatus === 'CLOSED') {
        setStatus((s) => (navigator.onLine === false ? 'offline' : s === 'connected' ? 'connecting' : s));
      }
    });

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      supabase.removeChannel(channel);
    };
  }, [checkNow]);

  return { status, lastConnected, checkNow };
}
