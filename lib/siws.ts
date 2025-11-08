// lib/siws.ts
import { API_BASE_URL } from './config';

export type SiwsStartResponse = {
  nonce: string;
  message: string;
  expiresAt?: string;
};

function apiUrl(path: string) {
  if (!API_BASE_URL) throw new Error('Missing NEXT_PUBLIC_API_BASE_URL');
  return `${API_BASE_URL}${path}`;
}

export async function siwsStart(): Promise<SiwsStartResponse> {
  const res = await fetch(apiUrl('/api/auth/siws/start'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
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
  const res = await fetch(apiUrl('/api/auth/siws/finish'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include', // REQUIRED so Set-Cookie is accepted
  });
  if (!res.ok) {
    let detail = '';
    try { detail = JSON.stringify(await res.json()); }
    catch { detail = await res.text().catch(() => ''); }
    throw new Error(`siws_finish_failed: ${res.status} ${detail}`);
  }
  return res.json();
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: 'GET',
    credentials: 'include', // send session cookie
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`api_get_failed ${path}: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function apiLogout(): Promise<void> {
  const res = await fetch(apiUrl('/api/auth/logout'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok && res.status !== 404 && res.status !== 405) {
    const text = await res.text().catch(() => '');
    throw new Error(`api_logout_failed: ${res.status} ${text}`);
  }
}
