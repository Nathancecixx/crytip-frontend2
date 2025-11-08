'use client';

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ApiError, apiGet } from './api';

export type SessionEntitlement = {
  type?: string;
  sku: string;
  status?: string;
  expires_at?: string | null;
  ref_mint?: string | null;
};

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

type SessionContextValue = {
  status: SessionStatus;
  entitlements: SessionEntitlement[];
  error: string | null;
  initializing: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [entitlements, setEntitlements] = useState<SessionEntitlement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const inflight = useRef<Promise<void> | null>(null);
  const initializingRef = useRef(true);

  const refresh = useCallback(() => {
    if (inflight.current) {
      return inflight.current;
    }

    const task = (async () => {
      if (initializingRef.current) {
        setStatus('loading');
      }
      setRefreshing(true);
      try {
        const data = await apiGet<{ entitlements: SessionEntitlement[] }>(
          '/api/me/entitlements'
        );
        setEntitlements(data?.entitlements ?? []);
        setStatus('authenticated');
        setError(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setEntitlements([]);
          setStatus('unauthenticated');
          setError('Please sign in');
        } else {
          const message = err instanceof Error ? err.message : String(err ?? '');
          setStatus('error');
          setError(message || 'Failed to load session.');
        }
      } finally {
        setRefreshing(false);
        if (initializingRef.current) {
          initializingRef.current = false;
          setInitializing(false);
        }
      }
    })();

    inflight.current = task.finally(() => {
      inflight.current = null;
    });

    return inflight.current;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<SessionContextValue>(
    () => ({ status, entitlements, error, initializing, refreshing, refresh }),
    [status, entitlements, error, initializing, refreshing, refresh]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
