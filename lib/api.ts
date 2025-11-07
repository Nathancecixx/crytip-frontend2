export function api(path: string, init: RequestInit = {}) {
  return fetch(path, { ...init, credentials: 'include' });
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
  const { json, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders || undefined);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (json !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const init: RequestInit = {
    ...rest,
    headers,
  };

  if (json !== undefined) {
    init.body = JSON.stringify(json);
    if (!init.method) init.method = 'POST';
  }

  const response = await api(path, init);
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
    const message = `API ${init.method ?? 'GET'} ${path} ${response.status}` + (summary ? `: ${summary}` : '');
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
