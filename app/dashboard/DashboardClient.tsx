'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSession } from '@/lib/session';

type Entitlement = {
  type?: 'license' | 'addon' | 'subscription';
  sku: string;
  status?: string;
  expires_at?: string | null;
  ref_mint?: string | null;
};

export default function DashboardClient() {
  const { entitlements, status, error, initializing, refreshing } = useSession();

  const { list, unauthorized, displayError } = useMemo(() => {
    const unauthorized = status === 'unauthenticated';
    const list = status === 'authenticated' ? (entitlements as Entitlement[]) : [];
    let displayError: string | null = null;
    if (unauthorized) {
      displayError = 'Please sign in';
    } else if (status === 'error') {
      displayError = error ?? 'Failed to load entitlements.';
    }
    return { list, unauthorized, displayError };
  }, [entitlements, status, error]);

  const showLoading = initializing || (refreshing && status === 'authenticated' && list.length === 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {displayError && (
        <div className={`card p-4 space-y-3 ${unauthorized ? 'text-amber-200' : 'text-red-300'}`}>
          <div>{displayError}</div>
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
        {showLoading && <div className="text-white/70">Loading…</div>}
        {!showLoading && list.length === 0 && <div className="text-white/70">No entitlements yet.</div>}
        <ul className="space-y-2">
          {list.map((e, i) => (
            <li key={e.sku || i} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2">
              <span>{e.type ? `${e.type} — ${e.sku}` : e.sku}</span>
              <span className="text-white/60 text-sm">
                {e.status ?? 'active'}
                {e.expires_at ? ` (expires ${new Date(e.expires_at).toLocaleDateString()})` : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
