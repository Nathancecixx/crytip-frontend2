'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { siwsLogin } from '@/lib/siws-login';
import { useSession } from '@/lib/session';

export default function LoginPage() {
  const router = useRouter();
  const { connected, publicKey, signMessage } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refresh } = useSession();

  const handleLogin = useCallback(async () => {
    if (loading) return;
    if (!connected || !publicKey) {
      setError('Connect your wallet to sign in.');
      return;
    }
    if (!signMessage) {
      setError('This wallet does not support message signing.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await siwsLogin(publicKey, signMessage);
      if (!result.ok) {
        setError(result.error ?? 'Login failed');
        return;
      }

      await refresh();
      router.push('/dashboard');
    } catch (err: any) {
      console.error('SIWS login failed:', err);
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }, [loading, connected, publicKey, signMessage, router, refresh]);

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">Sign in with Wallet</h1>
      {error && <p className="mb-3 rounded-md bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
      <button
        onClick={handleLogin}
        disabled={loading || !connected || !signMessage}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? 'Signing…' : 'Sign in with wallet'}
      </button>
    </div>
  );
}
