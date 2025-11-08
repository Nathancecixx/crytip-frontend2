const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const missingApiBaseMessage =
  'NEXT_PUBLIC_API_BASE_URL is not set. Set NEXT_PUBLIC_API_BASE_URL to the backend origin (e.g. https://api.example.com).';

if (!rawBaseUrl) {
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(missingApiBaseMessage);
  }
  throw new Error(missingApiBaseMessage);
}

export const API_BASE_URL = rawBaseUrl.replace(/\/$/, '');

if (
  typeof window !== 'undefined' &&
  process.env.NODE_ENV !== 'production' &&
  window.location?.origin === API_BASE_URL
) {
  console.warn(
    'Warning: NEXT_PUBLIC_API_BASE_URL matches the current window origin. Did you mean to point to the API server?'
  );
}

function applyGlobalRequestDefaults(init: RequestInit = {}): RequestInit {
  const { headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders ?? undefined);

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    if (!headers.has('origin')) {
      headers.set('origin', origin);
    }
  }

  return {
    ...rest,
    headers,
    credentials: 'include',
  };
}

function isAbsoluteUrl(path: string): boolean {
  return /^https?:\/\//i.test(path);
}

function normalizeApiPath(path: string): string {
  if (isAbsoluteUrl(path)) return path;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${suffix}`;
}

export function api(path: string, init: RequestInit = {}) {
  const url = normalizeApiPath(path);
  return fetch(url, applyGlobalRequestDefaults(init));
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export type ApiFetchOptions = RequestInit & { json?: unknown };

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { json, ...rest } = options;
  const init = applyGlobalRequestDefaults(rest);
  const headers = new Headers(init.headers ?? undefined);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (json !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  init.headers = headers;

  if (json !== undefined) {
    init.body = JSON.stringify(json);
    if (!init.method) init.method = 'POST';
  }

  const target = normalizeApiPath(path);
  const response = await fetch(target, init);
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');
  const raw = response.status === 204 ? '' : await response.text();
  let parsed: unknown = null;

  if (raw) {
    if (isJson) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw;
      }
    } else {
      parsed = raw;
    }
  }

  if (!response.ok) {
    const summary = typeof parsed === 'string'
      ? parsed
      : parsed
        ? JSON.stringify(parsed)
        : raw;
    const method = init.method ?? 'GET';
    const baseMessage = response.status === 401
      ? `Authentication required (401) for ${method} ${target}`
      : `API ${method} ${target} ${response.status}`;
    const message = baseMessage + (summary ? `: ${summary}` : '');
    throw new ApiError(message, response.status, parsed ?? raw);
  }

  return (parsed ?? undefined) as T;
}

export function apiGet<T>(path: string, init: Omit<ApiFetchOptions, 'json' | 'body'> = {}): Promise<T> {
  return apiFetch<T>(path, { ...init, method: init.method ?? 'GET' });
}

export function apiPost<T>(path: string, body: unknown, init: Omit<ApiFetchOptions, 'json' | 'body'> = {}): Promise<T> {
  return apiFetch<T>(path, { ...init, json: body, method: init.method ?? 'POST' });
}
