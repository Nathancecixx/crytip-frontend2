export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

function withBase(path: string) {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  return API_BASE.replace(/\/$/, '') + path;
}

export async function apiGet<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(withBase(path), { ...init, credentials: 'include' });
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: any, init: RequestInit = {}): Promise<T> {
  const res = await fetch(withBase(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST ${path} ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}
