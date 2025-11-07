import bs58 from 'bs58';
import type { PublicKey } from '@solana/web3.js';
import { API_BASE_URL } from './api';

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

async function parseJson<T>(response: Response): Promise<T | undefined> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
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

export async function siwsLogin(
  publicKey: PublicKey,
  signMessage: SignMessageFn
): Promise<SiwsLoginResult> {
  try {
    const origin = ensureBrowserOrigin();
    const address = publicKey.toBase58();

    const startResponse = await fetch(`${API_BASE_URL}/api/auth/siws/start`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        origin,
      },
      body: JSON.stringify({ address }),
    });

    if (!startResponse.ok) {
      const body = await parseJson<FinishErrorBody>(startResponse);
      return {
        ok: false,
        error: friendlyError(body?.error, body?.message || 'Failed to start sign-in.'),
      };
    }

    const start = (await parseJson<SiwsStartResponse>(startResponse)) ?? undefined;
    if (!start?.message || !start?.nonce) {
      return { ok: false, error: 'Invalid response from sign-in challenge.' };
    }

    const messageBytes = textEncoder.encode(start.message);
    const rawSignature = await signMessage(messageBytes);
    const signature = bs58.encode(toUint8Array(rawSignature));

    const finishResponse = await fetch(`${API_BASE_URL}/api/auth/siws/finish`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        origin,
      },
      body: JSON.stringify({
        address,
        message: start.message,
        nonce: start.nonce,
        signature,
      }),
    });

    const finishBody = await parseJson<FinishErrorBody>(finishResponse);
    if (!finishResponse.ok) {
      const message = finishBody?.message;
      return {
        ok: false,
        error: friendlyError(finishBody?.error, message),
      };
    }

    const entitlementsResponse = await fetch(`${API_BASE_URL}/api/me/entitlements`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        origin,
      },
    });

    if (!entitlementsResponse.ok) {
      const body = await parseJson<FinishErrorBody>(entitlementsResponse);
      return {
        ok: false,
        error: body?.message || 'Signed in but failed to load entitlements.',
      };
    }

    const entitlements = (await parseJson<EntitlementsResponse>(entitlementsResponse)) ?? {};

    return {
      ok: true,
      entitlements,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during sign-in.';
    return { ok: false, error: message };
  }
}
