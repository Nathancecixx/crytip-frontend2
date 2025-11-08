import bs58 from 'bs58';
import type { PublicKey } from '@solana/web3.js';
import { ApiError, apiGet, apiPost } from './api';

type SignMessageFn = (message: Uint8Array) => Promise<Uint8Array | ArrayBuffer>;

type SiwsStartResponse = {
  message: string;
  nonce: string;
};

type FinishErrorBody = {
  error?: string;
  message?: string;
};

type EntitlementsResponse = unknown;

export type SiwsLoginResult =
  | { ok: true; entitlements: EntitlementsResponse }
  | { ok: false; error: string };

const textEncoder = new TextEncoder();

function ensureBrowserOrigin(): string {
  if (typeof window === 'undefined' || !window.location?.origin) {
    throw new Error('Sign in with wallet requires a browser context.');
  }
  return window.location.origin;
}

function toUint8Array(value: Uint8Array | ArrayBuffer): Uint8Array {
  if (value instanceof Uint8Array) return value;
  return new Uint8Array(value);
}

function friendlyError(code?: string, fallback?: string): string {
  switch (code) {
    case 'nonce_invalid':
      return 'Your sign-in request expired. Please try again.';
    case 'domain_mismatch':
      return 'This sign-in request is for a different site. Refresh and try again.';
    default:
      return fallback ?? 'Failed to sign in with your wallet. Please try again.';
  }
}

function parseErrorDetails(error: unknown): FinishErrorBody {
  if (error instanceof ApiError) {
    const body = error.body;
    if (body && typeof body === 'object') {
      const details = body as FinishErrorBody;
      return {
        error: typeof details.error === 'string' ? details.error : undefined,
        message: typeof details.message === 'string' ? details.message : undefined,
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

  return {};
}

export async function siwsLogin(
  publicKey: PublicKey,
  signMessage: SignMessageFn
): Promise<SiwsLoginResult> {
  try {
    ensureBrowserOrigin();
    const address = publicKey.toBase58();

    let start: SiwsStartResponse | undefined;
    try {
      start = await apiPost<SiwsStartResponse>('/api/auth/siws/start', { address });
    } catch (error) {
      const details = parseErrorDetails(error);
      return {
        ok: false,
        error: friendlyError(details.error, details.message || 'Failed to start sign-in.'),
      };
    }

    if (!start?.message || !start?.nonce) {
      return { ok: false, error: 'Invalid response from sign-in challenge.' };
    }

    const messageBytes = textEncoder.encode(start.message);
    const rawSignature = await signMessage(messageBytes);
    const signature = bs58.encode(toUint8Array(rawSignature));

    try {
      await apiPost('/api/auth/siws/finish', {
        address,
        message: start.message,
        nonce: start.nonce,
        signature,
      });
    } catch (error) {
      const details = parseErrorDetails(error);
      return {
        ok: false,
        error: friendlyError(details.error, details.message),
      };
    }

    let entitlements: EntitlementsResponse | undefined;
    try {
      entitlements = await apiGet<EntitlementsResponse>('/api/me/entitlements');
    } catch (error) {
      const details = parseErrorDetails(error);
      return {
        ok: false,
        error: details.message || 'Signed in but failed to load entitlements.',
      };
    }

    return {
      ok: true,
      entitlements: entitlements ?? {},
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during sign-in.';
    return { ok: false, error: message };
  }
}
