'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { siwsFinish, siwsStart } from '@/lib/siws';
import { requestEntitlementsRefresh } from '@/lib/entitlements';

export default function Login() {
  const { publicKey, signMessage, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function start() {
    setError(null);
    if (!publicKey) { setError('Connect your wallet in the top right first.'); return; }
    if (!signMessage) { setError('Wallet does not support signMessage.'); return; }
    setLoading(true);
    try {
      const address = publicKey.toBase58();
      const { message } = await siwsStart(address);
      const enc = new TextEncoder().encode(message);
      const sigBytes = await signMessage(enc);
      await siwsFinish(address, message, sigBytes);
      requestEntitlementsRefresh();
      router.push('/dashboard');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e ?? '');
      setError(message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Sign in with Solana</h1>
      <p className="text-white/80 mb-4">Connect your wallet (top right), then sign a message to authenticate.</p>
      {error && <div className="mb-3 text-red-300">{error}</div>}
      <button className="btn" onClick={start} disabled={loading || !connected}>
        {loading ? 'Signing...' : 'Sign In'}
      </button>
    </div>
  );
}
