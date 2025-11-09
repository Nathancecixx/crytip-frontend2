// lib/siws.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;
if (!API_BASE) console.warn('NEXT_PUBLIC_API_BASE_URL is not set; auth calls will fail.');

async function asJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try { return JSON.parse(text) as T; } catch { return {} as T; }
}

export async function siwsStart(): Promise<{ nonce: string; message: string; createdAt?: string; expiresAt?: string; }> {
  const res = await fetch(`${API_BASE}/api/auth/siws/start`, { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new Error(`siws_start_failed: ${res.status} ${JSON.stringify(await asJson(res))}`);
  return res.json();
}

export async function siwsFinish(body: { address: string; nonce: string; signatureBase64?: string; signature?: string; signatureBytes?: number[]; }) {
  const res = await fetch(`${API_BASE}/api/auth/siws/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`siws_finish_failed: ${res.status} ${JSON.stringify(await asJson(res))}`);
  return res.json();
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`api_get_failed: ${res.status} ${JSON.stringify(await asJson(res))}`);
  return res.json();
}
