export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
// When an absolute API base is provided we only use it while rendering on the
// server. In the browser we rely on the same-origin proxy defined in
// next.config.mjs to avoid CORS errors.
const API_BASE_IS_ABSOLUTE = /^https?:\/\//i.test(API_BASE);

function withBase(path: string) {
  if (!path.startsWith('/')) throw new Error('API paths must start with "/"');
  if (API_BASE_IS_ABSOLUTE && typeof window === 'undefined') {
    return `${API_BASE}${path}`;
  }
  return path;
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
