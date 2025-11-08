'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { siwsLogin } from '@/lib/siws-login';
import { useSession } from '@/lib/session';

type Status = 'idle' | 'connecting' | 'signing';

function formatError(error: unknown): string {
  if (!error) return 'Something went wrong while signing in.';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message || 'Failed to sign in.';
  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return 'Something went wrong while signing in.';
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams?.get('next') ?? '/dashboard';
  const { refresh, status: sessionStatus, initializing } = useSession();

  const { publicKey, signMessage, connect, connected, connecting, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const address = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  useEffect(() => {
    if (!initializing && sessionStatus === 'authenticated') {
      router.replace(nextUrl);
    }
  }, [initializing, sessionStatus, router, nextUrl]);

  const ensureWalletSelected = useCallback(() => {
    if (!wallet) {
      setVisible(true);
      throw new Error('Select a wallet to continue.');
    }
  }, [wallet, setVisible]);

  const signIn = useCallback(async () => {
    setError(null);
    setStatus('idle');

    try {
      ensureWalletSelected();

      if (!connected) {
        setStatus('connecting');
        await connect();
      }

      if (!publicKey) throw new Error('Your wallet did not provide a public key.');
      if (!signMessage) throw new Error('Your wallet does not support message signing.');

      setStatus('signing');
      const result = await siwsLogin(publicKey, signMessage);
      if (!result.ok) {
        throw new Error(result.error);
      }

      await refresh();
      router.replace(nextUrl);
    } catch (err) {
      const message = formatError(err);
      if (!message.includes('Select a wallet')) {
        console.error('Failed to sign in with wallet:', err);
      }
      setError(message);
      setStatus('idle');
    }
  }, [ensureWalletSelected, connected, connect, publicKey, signMessage, refresh, router, nextUrl]);

  const isBusy = connecting || status !== 'idle';

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="max-w-xl space-y-4">
        <h1 className="text-3xl font-semibold">Sign in with your Solana wallet</h1>
        <p className="text-white/70">
          We&apos;ll request a one-time Sign-In With Solana message from the Crypto Tip API. Review the details, sign the
          message in your wallet, and we&apos;ll finish the secure login—no funds move.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={signIn}
          disabled={isBusy}
          className="rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow disabled:opacity-60 hover:bg-brand-500 transition"
        >
          {status === 'connecting' ? 'Connecting wallet…' : status === 'signing' ? 'Awaiting signature…' : 'Sign in'}
        </button>
        <div className="text-xs text-white/60">
          {address ? `Connected as ${address}` : 'Connect any Wallet Standard compatible wallet.'}
        </div>
        <WalletMultiButton className="!mt-2 !rounded-xl !bg-white/10 !px-4 !py-2 !text-sm" />
      </div>

      {error && <div className="max-w-md rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <p className="text-xs text-white/60 max-w-md">
        Your session is stored as an HTTP-only cookie from the API. If you disconnect your wallet we&apos;ll sign you out
        automatically.
      </p>
    </main>
  );
}
