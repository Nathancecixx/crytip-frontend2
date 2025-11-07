'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { siwsStart, siwsFinish, siwsMessageToBytes } from '@/lib/siws';
import { requestEntitlementsRefresh } from '@/lib/entitlements';

export default function LoginPage() {
  const router = useRouter();
  const { connect, connected, publicKey, signMessage } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (!connected) {
        await connect();
      }
      if (!publicKey) throw new Error('No wallet connected');
      if (!signMessage) throw new Error('This wallet does not support signMessage');

      const address = publicKey.toBase58();

      // 1) Start SIWS → receive message + nonce
      const { message, nonce } = await siwsStart(address);

      // 2) Sign the message
      const enc = siwsMessageToBytes(message);
      const sigBytes = await signMessage(enc);

      // 3) Finish SIWS (IMPORTANT: include nonce)
      await siwsFinish(address, message, sigBytes, nonce);

      // 4) Refresh entitlements and go to dashboard
      requestEntitlementsRefresh();
      router.push('/dashboard');
    } catch (err: any) {
      console.error('SIWS login failed:', err);
      alert(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }, [loading, connected, connect, publicKey, signMessage, router]);

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">Sign in with Wallet</h1>
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
