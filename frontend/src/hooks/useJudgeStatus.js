import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const JUDGE_POLL_INTERVAL = 15000;

export function useJudgeStatus() {
  const [status, setStatus] = useState(null); // null = loading, true = online, false = offline
  const { apiFetch } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await apiFetch('/judge/status');
        if (!res.ok) throw new Error('non-ok');
        const data = await res.json();
        if (!cancelled) setStatus(Boolean(data.online));
      } catch {
        if (!cancelled) setStatus(false);
      }
    }

    poll();
    const timer = setInterval(poll, JUDGE_POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [apiFetch]);

  return status;
}

