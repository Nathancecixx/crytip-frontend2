import 'server-only';
import { Buffer } from 'node:buffer';
import { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
export const SESSION_COOKIE_NAME = 'ctj_sess';
const STRICT_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
const CSRF_HEADER = 'x-csrf';

function ensureBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
  }
  return API_BASE_URL;
}

function normalizeSegments(pathOrSegments: string | string[]): string[] {
  if (Array.isArray(pathOrSegments)) {
    return pathOrSegments.filter((segment) => segment.length > 0);
  }

  return pathOrSegments
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

export function buildBackendUrl(req: NextRequest, pathOrSegments: string | string[]) {
  const baseUrl = ensureBaseUrl();
  const segments = normalizeSegments(pathOrSegments);
  const target = segments.join('/');
  const url = new URL(`${baseUrl}/api/${target}`);
  url.search = req.nextUrl.search;
  return url;
}

export function cloneRequestHeaders(req: NextRequest) {
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      lower === 'host' ||
      lower === 'content-length' ||
      lower === 'connection' ||
      lower === 'cookie' ||
      lower === CSRF_HEADER
    ) {
      return;
    }
    headers.append(key, value);
  });

  const forwardedHost = req.headers.get('host');
  if (forwardedHost) {
    headers.set('x-forwarded-host', forwardedHost);
  }

  return headers;
}

export async function cloneRequestBody(req: NextRequest): Promise<BodyInit | null> {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return null;
  }
  if (req.bodyUsed) {
    return null;
  }
  const arrayBuffer = await req.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    return null;
  }
  return Buffer.from(arrayBuffer);
}

export function cloneResponseHeaders(res: Response) {
  const headers = new Headers();
  res.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'transfer-encoding' || lower === 'set-cookie') {
      return;
    }
    headers.append(key, value);
  });
  return headers;
}

function appendVary(headers: Headers, value: string) {
  const existing = headers.get('Vary');
  if (!existing) {
    headers.set('Vary', value);
    return;
  }

  const parts = existing
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (!parts.map((part) => part.toLowerCase()).includes(value.toLowerCase())) {
    parts.push(value);
    headers.set('Vary', parts.join(', '));
  }
}

export function applyBffResponseHeaders(headers: Headers) {
  headers.set('Cache-Control', 'no-store');
  appendVary(headers, 'Cookie');
  if (STRICT_CSP) {
    headers.set('Content-Security-Policy', STRICT_CSP);
  }
}

export function createJsonResponse(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers ?? undefined);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }
  applyBffResponseHeaders(headers);
  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function readSetCookieHeaders(headers: Headers): string[] {
  const candidate = (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof candidate === 'function') {
    return candidate.call(headers);
  }

  const raw = headers.get('set-cookie');
  if (!raw) return [];
  if (!raw.includes(',')) return [raw];
  return raw.split(/,(?=[^ ;]+=)/g);
}

type ParsedCookie = {
  name: string;
  value: string;
  attributes: Record<string, string | true>;
};

function parseSetCookie(header: string): ParsedCookie | null {
  const segments = header.split(';').map((segment) => segment.trim());
  const [nameValue, ...attributeParts] = segments;
  if (!nameValue) return null;

  const eqIndex = nameValue.indexOf('=');
  if (eqIndex <= 0) return null;

  const name = nameValue.slice(0, eqIndex);
  const value = nameValue.slice(eqIndex + 1);
  const attributes: Record<string, string | true> = {};

  for (const part of attributeParts) {
    if (!part) continue;
    const [attrName, attrValue] = part.split('=');
    if (!attrName) continue;
    const key = attrName.trim().toLowerCase();
    if (attrValue === undefined) {
      attributes[key] = true;
    } else {
      attributes[key] = attrValue.trim();
    }
  }

  return { name, value, attributes };
}

function formatFrontendSessionCookie(value: string, attributes: Record<string, string | true>) {
  const directives = [
    `${SESSION_COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ];

  const maxAge = attributes['max-age'];
  if (typeof maxAge === 'string' && maxAge.length > 0) {
    directives.push(`Max-Age=${maxAge}`);
  }

  const expires = attributes['expires'];
  if (typeof expires === 'string' && expires.length > 0) {
    directives.push(`Expires=${expires}`);
  }

  return directives.join('; ');
}

export function rebindSessionCookies(headers: Headers): string[] {
  return readSetCookieHeaders(headers)
    .map((header) => parseSetCookie(header))
    .filter((parsed): parsed is ParsedCookie => !!parsed && parsed.name === SESSION_COOKIE_NAME)
    .map(({ value, attributes }) => formatFrontendSessionCookie(value, attributes));
}

export function ensureCsrfHeader(req: NextRequest): Response | null {
  const header = req.headers.get(CSRF_HEADER);
  if (!header || header !== '1') {
    return createJsonResponse(
      { error: 'missing_csrf' },
      { status: 400 }
    );
  }
  return null;
}

export async function proxyApiRequest(req: NextRequest, pathOrSegments: string | string[]) {
  const url = buildBackendUrl(req, pathOrSegments);
  const body = await cloneRequestBody(req);
  const headers = cloneRequestHeaders(req);

  const backendResponse = await fetch(url.toString(), {
    method: req.method,
    headers,
    body: body ?? undefined,
    cache: 'no-store',
    redirect: 'manual',
  });

  const responseHeaders = cloneResponseHeaders(backendResponse);
  applyBffResponseHeaders(responseHeaders);

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}
