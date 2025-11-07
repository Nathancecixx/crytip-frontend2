'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { siwsLogin } from '@/lib/siws-login';
import { requestEntitlementsRefresh } from '@/lib/entitlements';

export default function LoginPage() {
  const router = useRouter();
  const { connect, connected, publicKey, signMessage } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      if (!connected) {
        await connect();
      }
      if (!publicKey) throw new Error('No wallet connected');
      if (!signMessage) throw new Error('This wallet does not support signMessage');

      const result = await siwsLogin(publicKey, signMessage);
      if (!result.ok) {
        setError(result.error ?? 'Login failed');
        return;
      }

      requestEntitlementsRefresh();
      router.push('/dashboard');
    } catch (err: any) {
      console.error('SIWS login failed:', err);
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }, [loading, connected, connect, publicKey, signMessage, router]);

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">Sign in with Wallet</h1>
      {error && <p className="mb-3 rounded-md bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
      <button
        onClick={handleLogin}
        disabled={loading}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? 'Signing…' : 'Sign in with wallet'}
      </button>
    </div>
  );
}
