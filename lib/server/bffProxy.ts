import 'server-only';
import { Buffer } from 'node:buffer';
import { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

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

function buildBackendUrl(req: NextRequest, pathOrSegments: string | string[]) {
  const baseUrl = ensureBaseUrl();
  const segments = normalizeSegments(pathOrSegments);
  const target = segments.join('/');
  const url = new URL(`${baseUrl}/api/${target}`);
  url.search = req.nextUrl.search;
  return url;
}

function cloneRequestHeaders(req: NextRequest) {
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'host' || lower === 'content-length' || lower === 'connection') {
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

async function cloneRequestBody(req: NextRequest): Promise<BodyInit | null> {
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

function cloneResponseHeaders(res: Response) {
  const headers = new Headers();
  res.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'transfer-encoding') {
      return;
    }
    headers.append(key, value);
  });
  return headers;
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

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}
