// app/login/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { siwsStart, siwsFinish, apiGet } from '@/src/lib/siws';

const PLACEHOLDER = '<WALLET_ADDRESS>';

export default function LoginPage() {
  const router = useRouter();
  const { publicKey, signMessage, connect, connected } = useWallet();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      // 1) Ensure wallet is connected
      if (!connected) {
        await connect(); // shows wallet UI if needed
      }
      if (!publicKey) {
        throw new Error('wallet_no_public_key');
      }
      if (!signMessage) {
        // Some wallets do not support message signing
        throw new Error('wallet_sign_message_unavailable');
      }

      const address = publicKey.toBase58();

      // 2) Get challenge from backend
      const challenge = await siwsStart();

      // 3) Replace placeholder in challenge message with the actual address
      const messageToSign = challenge.message.replace(PLACEHOLDER, address);

      // 4) Sign the exact message shown (UTF-8 bytes)
      const encoder = new TextEncoder();
      const signatureBytes = await signMessage(encoder.encode(messageToSign));

      // Prefer base58 string to match backend normalization
      const signatureBase58 = bs58.encode(signatureBytes);

      // 5) Finish SIWS on backend (this sets the session cookie)
      await siwsFinish({
        address,
        signature: signatureBase58,
        nonce: challenge.nonce,
      });

      // 6) Optional sanity check: hit an authenticated endpoint
      await apiGet('/api/me');

      // 7) Navigate to your app's dashboard (adjust path if needed)
      router.replace('/dashboard');
    } catch (e: any) {
      console.error('login_error', e);
      setError(e?.message ?? 'login_failed');
    } finally {
      setLoading(false);
    }
  }, [connected, connect, publicKey, signMessage, router]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Sign in with your Solana wallet</h1>

      <button
        disabled={loading}
        onClick={handleLogin}
        className="rounded-xl px-5 py-3 font-medium shadow hover:opacity-90 disabled:opacity-60 border"
      >
        {loading ? 'Signing…' : 'Sign in'}
      </button>

      {error && (
        <p className="text-sm text-red-500 max-w-[520px] text-center">
          {error}
        </p>
      )}

      <p className="text-xs opacity-70 max-w-[520px] text-center">
        By continuing you agree to sign a message to prove ownership of your wallet.
        No funds are moved.
      </p>
    </main>
  );
}
