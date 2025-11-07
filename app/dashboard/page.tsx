'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

type Entitlement = {
  type: 'license' | 'addon' | 'subscription';
  sku: string;
  status: string;
  expires_at?: string | null;
  ref_mint?: string | null;
};

export default function Dashboard() {
  const [ents, setEnts] = useState<Entitlement[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<{ entitlements: Entitlement[] }>('/api/me/entitlements');
        setEnts(data.entitlements || []);
      } catch (e:any) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {error && <div className="card p-4 text-red-300">{error}</div>}
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
