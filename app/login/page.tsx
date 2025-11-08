'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import bs58 from 'bs58';
import { siwsStart, siwsFinish, apiGet } from '@/lib/siws';

const PLACEHOLDER = '<WALLET_ADDRESS>';

export default function LoginPage() {
  const router = useRouter();
  const { publicKey, signMessage, connect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (!connected) {
        try {
          await connect();
        } catch (err: any) {
          if (err?.name === 'WalletNotSelectedError') {
            setVisible(true);
            return; // wait for user to pick wallet, then click again
          }
          throw err;
        }
      }
      if (!publicKey) throw new Error('wallet_no_public_key');
      if (!signMessage) throw new Error('wallet_sign_message_unavailable');

      const address = publicKey.toBase58();

      const challenge = await siwsStart();
      const messageToSign = challenge.message.replace(PLACEHOLDER, address);

      const signatureBytes = await signMessage(new TextEncoder().encode(messageToSign));
      const signatureBase58 = bs58.encode(signatureBytes);

      await siwsFinish({ address, signature: signatureBase58, nonce: challenge.nonce });

      // Session sanity check
      await apiGet('/api/me');

      router.replace('/dashboard');
    } catch (e: any) {
      console.error('login_error', e);
      setError(e?.message ?? 'login_failed');
    } finally {
      setLoading(false);
    }
  }, [connected, connect, publicKey, signMessage, setVisible, router]);

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
      {error && <p className="text-sm text-red-500 max-w-[520px] text-center">{error}</p>}
      <p className="text-xs opacity-70 max-w-[520px] text-center">
        You’ll sign a message to prove wallet ownership. No funds move.
      </p>
    </main>
  );
}
