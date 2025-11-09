// app/login/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWallet, useWalletModal } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { siwsFinish, siwsStart } from '@/lib/siws';
import { useSession } from '@/lib/session';

function toBase64(u8: Uint8Array) {
  if (typeof window === 'undefined') return '';
  let s = '';
  u8.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const { status } = useSession();

  const { publicKey, signMessage, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') router.replace(next);
  }, [status, router, next]);

  const doLogin = useCallback(async () => {
    setErr(null);
    try {
      if (!connected) {
        setVisible(true);
        return;
      }
      if (!publicKey) throw new Error('No wallet public key');
      if (!signMessage) throw new Error('Wallet does not support message signing');

      setBusy(true);
      const { nonce, message } = await siwsStart();

      const msgBytes = new TextEncoder().encode(message);
      const sig = await signMessage(msgBytes);
      const signatureBase64 = toBase64(sig);

      await siwsFinish({
        address: new PublicKey(publicKey).toBase58(),
        nonce,
        signatureBase64,
      });

      router.replace(next);
    } catch (e: any) {
      setErr(e?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }, [connected, publicKey, signMessage, setVisible, router, next]);

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-3">Sign in with Solana</h1>
      <p className="text-white/70 mb-6">
        Connect your wallet and sign a message to authenticate. No funds are moved.
      </p>
      <button
        onClick={doLogin}
        disabled={busy}
        className="btn disabled:opacity-60"
      >
        {busy ? 'Signing…' : (connected ? 'Sign In' : 'Connect Wallet')}
      </button>
      {err && (
        <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {err}
        </div>
      )}
    </div>
  );
}
