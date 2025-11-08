'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiLogout } from '@/lib/siws';

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await apiGet('/api/me');
        setMe(data);
      } catch (e: any) {
        setError(e?.message ?? 'unauthorized');
        router.replace('/login');
      }
    })();
  }, [router]);

  if (error) return null;
  if (!me) return <div className="p-6">Loading…</div>;

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Welcome</h1>
      <pre className="bg-neutral-900/5 p-4 rounded-md text-sm">{JSON.stringify(me, null, 2)}</pre>
      <button
        onClick={async () => { await apiLogout(); router.replace('/login'); }}
        className="border rounded px-3 py-2"
      >
        Logout
      </button>
    </main>
  );
}
