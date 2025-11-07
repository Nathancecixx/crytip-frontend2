'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiError, apiGet } from '@/lib/api';
import { ENTITLEMENTS_REFRESH_EVENT } from '@/lib/entitlements';

type Entitlement = {
  type: 'license' | 'addon' | 'subscription';
  sku: string;
  status: string;
  expires_at?: string | null;
  ref_mint?: string | null;
};

export default function DashboardClient() {
  const [ents, setEnts] = useState<Entitlement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadEntitlements() {
      try {
        const data = await apiGet<{ entitlements: Entitlement[] }>('/api/me/entitlements');
        if (cancelled) return;
        setEnts(data.entitlements || []);
        setUnauthorized(false);
        setError(null);
      } catch (e: any) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          setUnauthorized(true);
          setEnts([]);
          setError('Sign in with your wallet to view your entitlements.');
          return;
        }
        setError(e?.message ?? 'Failed to load entitlements.');
      }
    }

    loadEntitlements();

    function handleRefresh() {
      loadEntitlements();
    }

    window.addEventListener(ENTITLEMENTS_REFRESH_EVENT, handleRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener(ENTITLEMENTS_REFRESH_EVENT, handleRefresh);
    };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {error && (
        <div className={`card p-4 space-y-3 ${unauthorized ? 'text-amber-200' : 'text-red-300'}`}>
          <div>{error}</div>
          {unauthorized && (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Sign in with wallet
            </Link>
          )}
        </div>
      )}
      <div className="card p-6">
        <h2 className="font-semibold mb-3">Your Entitlements</h2>
        {ents.length === 0 && <div className="text-white/70">No entitlements yet.</div>}
        <ul className="space-y-2">
          {ents.map((e, i) => (
            <li key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2">
              <span>{e.type} — {e.sku}</span>
              <span className="text-white/60 text-sm">
                {e.status}{e.expires_at ? ` (expires ${new Date(e.expires_at).toLocaleDateString()})` : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
