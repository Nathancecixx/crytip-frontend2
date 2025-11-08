'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSession } from '@/lib/session';
import { apiGet } from '@/lib/api';
import { logout } from '@/lib/auth';

type Entitlement = {
  type?: 'license' | 'addon' | 'subscription';
  sku: string;
  status?: string;
  expires_at?: string | null;
  ref_mint?: string | null;
};

export default function DashboardClient() {
  const { entitlements, status, error, initializing, refreshing, refresh } = useSession();
  const { disconnect } = useWallet();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (status !== 'authenticated') {
      setProfile(null);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const data = await apiGet<Record<string, unknown>>('/api/me');
        if (!cancelled) {
          setProfile(data);
          setProfileError(null);
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load account details.';
        setProfile(null);
        setProfileError(message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  const entList = useMemo(() => (status === 'authenticated' ? (entitlements as Entitlement[]) : []), [status, entitlements]);

  const showLoadingEntitlements = initializing || (refreshing && status === 'authenticated' && entList.length === 0);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logout();
      await disconnect();
    } catch (err) {
      console.error('Failed to log out:', err);
    } finally {
      setLoggingOut(false);
      refresh();
    }
  }, [disconnect, refresh]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/10 disabled:opacity-60"
        >
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>

      {profileError && (
        <div className="card border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{profileError}</div>
      )}

      {profile && (
        <div className="card space-y-3 p-5">
          <h2 className="text-lg font-semibold">Account</h2>
          <pre className="overflow-auto rounded-lg bg-black/30 p-4 text-left text-xs leading-relaxed text-white/80">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Your Entitlements</h2>
          <button
            type="button"
            className="text-xs text-white/60 underline underline-offset-4 hover:text-white"
            onClick={() => refresh()}
          >
            Refresh
          </button>
        </div>
        {showLoadingEntitlements && <div className="mt-4 text-white/70">Loading…</div>}
        {!showLoadingEntitlements && entList.length === 0 && <div className="mt-4 text-white/70">No entitlements yet.</div>}
        <ul className="mt-4 space-y-2">
          {entList.map((entitlement, index) => (
            <li key={entitlement.sku || index} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 px-4 py-2">
              <span className="font-medium">{entitlement.type ? `${entitlement.type} — ${entitlement.sku}` : entitlement.sku}</span>
              <span className="text-sm text-white/60">
                {entitlement.status ?? 'active'}
                {entitlement.expires_at ? ` · expires ${new Date(entitlement.expires_at).toLocaleDateString()}` : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {status === 'error' && (
        <div className="card border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error ?? 'Failed to load entitlements.'}
        </div>
      )}

      <div className="card p-5 text-sm text-white/70">
        Need to unlock more? Visit the{' '}
        <Link href="/store" className="font-medium text-white underline underline-offset-4">
          store
        </Link>{' '}
        to purchase template packs and add-ons.
      </div>
    </div>
  );
}
