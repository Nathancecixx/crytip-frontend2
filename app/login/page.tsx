'use client';

import { Buffer } from 'buffer';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { apiPost } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function Login() {
  const { publicKey, signMessage, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function start() {
    setError(null);
    if (!publicKey) { setError('Connect Phantom in the top right first.'); return; }
    if (!signMessage) { setError('Wallet does not support signMessage.'); return; }
    setLoading(true);
    try {
      const { nonce, message } = await apiPost<{nonce:string,message:string}>(
        '/api/auth/siws/start',
        { wallet: publicKey.toBase58() }
      );
      const enc = new TextEncoder().encode(message);
      const sigBytes = await signMessage(enc);
      const signature = Buffer.from(sigBytes).toString('base64');
      await apiPost('/api/auth/siws/finish', {
        wallet: publicKey.toBase58(),
        signature,
        message
      });
      router.push('/dashboard');
    } catch (e:any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Sign in with Solana</h1>
      <p className="text-white/80 mb-4">Connect Phantom (top right), then sign a message to authenticate.</p>
      {error && <div className="mb-3 text-red-300">{error}</div>}
      <button className="btn" onClick={start} disabled={loading || !connected}>
        {loading ? 'Signing...' : 'Sign In'}
      </button>
    </div>
  );
}
