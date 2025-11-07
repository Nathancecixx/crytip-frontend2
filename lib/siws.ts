import bs58 from 'bs58';
import { api } from './api';

export async function siwsStart(address: string): Promise<{ message: string; nonce: string }> {
  const res = await api('/api/auth/siws/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  if (!res.ok) throw new Error(`SIWS start failed: ${res.status}`);
  return res.json();
}

export async function siwsFinish(address: string, message: string, signatureBytes: Uint8Array) {
  const signature = bs58.encode(signatureBytes);
  const res = await api('/api/auth/siws/finish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address, message, signature }),
  });
  if (!res.ok) throw new Error(`SIWS finish failed: ${res.status}`);
}

export async function apiLogout() {
  await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
}
