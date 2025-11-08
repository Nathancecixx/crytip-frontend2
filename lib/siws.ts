// src/lib/siws.ts
import { BACKEND_ORIGIN } from './config';

export type SiwsStartResponse = {
  nonce: string;
  message: string;
  expiresAt?: string;
};

export async function siwsStart(): Promise<SiwsStartResponse> {
  const res = await fetch(`${BACKEND_ORIGIN}/api/auth/siws/start`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include', // keep cookies flowing even on start
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`siws_start_failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function siwsFinish(payload: {
  address: string;
  signature?: string;           // base58
  signatureBytes?: number[];    // raw bytes
  signatureBase64?: string;     // base64
  nonce: string;
}) {
  const res = await fetch(`${BACKEND_ORIGIN}/api/auth/siws/finish`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include', // REQUIRED so the Set-Cookie from the server is accepted
  });

  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = JSON.stringify(j);
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`siws_finish_failed: ${res.status} ${detail}`);
  }

  return res.json();
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_ORIGIN}${path}`, {
    method: 'GET',
    credentials: 'include', // send the session cookie with every API call
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`api_get_failed ${path}: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}
