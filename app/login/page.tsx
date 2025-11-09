// app/login/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { siwsFinish, siwsStart } from '@/lib/siws';
import { useSession } from '@/lib/session';
import { isAllowedNextRoute } from '@/lib/routes';

function toBase64(u8: Uint8Array) {
  let s = '';
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return typeof window !== 'undefined' ? btoa(s) : '';
}

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get('next');

  // Sanitize + satisfy typedRoutes
  const safeNext: Route = useMemo(() => {
    if (rawNext && isAllowedNextRoute(rawNext)) return rawNext as Route;
    return '/dashboard';
  }, [rawNext]);

  const { status } = useSession();
  const { publicKey, signMessage, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') router.replace(safeNext);
  }, [status, router, safeNext]);

  const doLogin = useCallback(async () => {
    setErr(null);
    try {
      if (!connected) { setVisible(true); return; }
      if (!publicKey) throw new Error('No wallet public key');
      if (!signMessage) throw new Error('Wallet does not support message signing');

      setBusy(true);

      // 1) Start SIWS — server returns a template with <WALLET_ADDRESS>
      const { nonce, message: template } = await siwsStart();

      // 2) Inject the actual address into the message BEFORE signing
      const address58 = new PublicKey(publicKey).toBase58();
      const message = template.replace('<WALLET_ADDRESS>', address58);

      // 3) Sign the final message
      const msgBytes = new TextEncoder().encode(message);
      const sig = await signMessage(msgBytes);
      const signatureBase64 = toBase64(sig);

      // 4) Finish SIWS
      await siwsFinish({ address: address58, nonce, signatureBase64 });

      router.replace(safeNext);
    } catch (e: any) {
      setErr(e?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }, [connected, publicKey, signMessage, setVisible, router, safeNext]);


  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-3">Sign in with Solana</h1>
      <p className="text-white/70 mb-6">
        Connect your wallet and sign a message to authenticate. No funds are moved.
      </p>
      <button onClick={doLogin} disabled={busy} className="btn disabled:opacity-60">
        {busy ? 'Signing…' : connected ? 'Sign In' : 'Connect Wallet'}
      </button>
      {err && (
        <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {err}
        </div>
      )}
    </div>
  );
}
