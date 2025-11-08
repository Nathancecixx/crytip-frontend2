'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useRouter } from 'next/navigation';
import bs58 from 'bs58';
import { ApiError, apiGet } from '@/lib/api';
import { siwsFinish, siwsStart } from '@/lib/siws';
import { useSession } from '@/lib/session';

const textEncoder = new TextEncoder();

type ErrorState = { message: string; retryable?: boolean } | null;

type FinishErrorBody = { error?: string; message?: string } | null;

function toUint8Array(value: Uint8Array | ArrayBuffer) {
  if (value instanceof Uint8Array) return value;
  return new Uint8Array(value);
}

function friendlyError(code?: string, fallback?: string) {
  switch (code) {
    case 'nonce_invalid':
      return 'Your sign-in request expired. Please try again.';
    case 'signature_invalid':
      return 'The signature was rejected. Please try again.';
    case 'domain_mismatch':
      return 'This sign-in request was issued for a different site. Refresh and try again.';
    default:
      return fallback ?? 'Failed to sign in with your wallet. Please try again.';
  }
}

function parseApiError(error: unknown): FinishErrorBody {
  if (error instanceof ApiError) {
    const body = error.body;
    if (body && typeof body === 'object') {
      const maybe = body as { error?: unknown; message?: unknown };
      return {
        error: typeof maybe.error === 'string' ? maybe.error : undefined,
        message: typeof maybe.message === 'string' ? maybe.message : undefined,
      };
    }
    if (typeof body === 'string') {
      return { message: body };
    }
    return { message: error.message };
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return { message: typeof message === 'string' ? message : undefined };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const { connected, publicKey, signMessage, wallet } = useWallet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorState>(null);

  const walletName = wallet?.adapter?.name ?? 'wallet';

  const handleLogin = useCallback(async () => {
    if (busy) return;

    if (!connected || !publicKey) {
      setError({ message: 'Connect your wallet to continue.' });
      return;
    }

    if (!signMessage) {
      setError({ message: 'This wallet does not support message signing.' });
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const address = publicKey.toBase58();
      const challenge = await siwsStart(address);
      if (!challenge?.message || !challenge?.nonce) {
        throw new Error('Invalid sign-in challenge.');
      }

      const messageBytes = textEncoder.encode(challenge.message);
      const rawSignature = await signMessage(messageBytes);
      const signature = bs58.encode(toUint8Array(rawSignature));

      await siwsFinish({ address, signature, nonce: challenge.nonce });
      await apiGet('/api/me');
      await refresh();

      router.push('/dashboard');
    } catch (err) {
      console.error('SIWS login failed:', err);
      const details = parseApiError(err);
      const message = friendlyError(details?.error, details?.message);
      setError({ message, retryable: true });
    } finally {
      setBusy(false);
    }
  }, [busy, connected, publicKey, signMessage, router, refresh]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Sign in with Wallet</h1>
        <p className="text-sm text-white/70">
          Connect your wallet and sign the request to continue.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/40 p-4">
        <span className="text-sm font-medium text-white/80">Wallet</span>
        <WalletMultiButton className="!rounded-xl !bg-indigo-600 hover:!bg-indigo-500" />
        <span className="text-xs text-white/60">
          Connected wallet: {connected && publicKey ? walletName : 'none'}
        </span>
      </div>

      {error && (
        <div className="space-y-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          <p>{error.message}</p>
          {error.retryable && (
            <button
              type="button"
              className="rounded-lg bg-red-500/20 px-3 py-1 text-red-100 transition hover:bg-red-500/30"
              onClick={() => {
                setError(null);
                handleLogin();
              }}
              disabled={busy}
            >
              Try again
            </button>
          )}
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={busy || !connected || !publicKey || !signMessage}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Signing…' : 'Sign in'}
      </button>
    </div>
  );
}
