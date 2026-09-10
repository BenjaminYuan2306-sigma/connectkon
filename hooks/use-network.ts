import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyNetwork, type Network } from '@/lib/network';
import { repository } from '@/lib/persistence';
export function useNetwork() {
  const [data, setData] = useState<Network>(emptyNetwork),
    [ready, setReady] = useState(false),
    [status, setStatus] = useState('Loading…');
  const ref = useRef(data),
    past = useRef<Network[]>([]),
    future = useRef<Network[]>([]);
  const [, render] = useState(0);
  const blocked = useRef(false);
  useEffect(() => {
    try {
      const d = repository.load();
      ref.current = d;
      setData(d);
    } catch {
      blocked.current = true;
      setStatus('Stored data could not be loaded. Import a backup to recover.');
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || blocked.current) return;
    setStatus('Saving…');
    const t = setTimeout(() => {
      try {
        repository.save(data);
        setStatus('All changes saved');
      } catch {
        setStatus('Storage is full or unavailable. Export a backup.');
      }
    }, 300);
    return () => clearTimeout(t);
  }, [data, ready]);
  useEffect(() => {
    const flush = () => {
      if (!blocked.current)
        try {
          repository.save(ref.current);
        } catch {}
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);
  const update = useCallback(
    (change: (d: Network) => Network, record = true) => {
      if (record) {
        past.current = [...past.current.slice(-49), ref.current];
        future.current = [];
      }
      const next = change(ref.current);
      ref.current = next;
      setData(next);
    },
    [],
  );
  const undo = useCallback(() => {
    const d = past.current.pop();
    if (d) {
      future.current.push(ref.current);
      ref.current = d;
      setData(d);
      render((x) => x + 1);
    }
  }, []);
  const redo = useCallback(() => {
    const d = future.current.pop();
    if (d) {
      past.current.push(ref.current);
      ref.current = d;
      setData(d);
      render((x) => x + 1);
    }
  }, []);
  const replace = useCallback(
    (d: Network) => {
      blocked.current = false;
      update(() => d);
    },
    [update],
  );
  return {
    data,
    ref,
    update,
    replace,
    undo,
    redo,
    ready,
    status,
    canUndo: !!past.current.length,
    canRedo: !!future.current.length,
  };
}
