import { NextRequest } from 'next/server';
import {
  applyBffResponseHeaders,
  buildBackendUrl,
  cloneRequestBody,
  cloneRequestHeaders,
  cloneResponseHeaders,
  createJsonResponse,
  ensureCsrfHeader,
} from '@/lib/server/bffProxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const csrfError = ensureCsrfHeader(req);
  if (csrfError) {
    return csrfError;
  }

  const url = buildBackendUrl(req, ['auth', 'siws', 'start']);
  const body = await cloneRequestBody(req);
  const headers = cloneRequestHeaders(req);
  headers.set('Accept', 'application/json');

  if (body && !headers.has('content-type')) {
    const incomingContentType = req.headers.get('content-type');
    if (incomingContentType) {
      headers.set('Content-Type', incomingContentType);
    } else {
      headers.set('Content-Type', 'application/json');
    }
  }

  const backendResponse = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: body ?? undefined,
    cache: 'no-store',
    redirect: 'manual',
  });

  const responseHeaders = cloneResponseHeaders(backendResponse);
  applyBffResponseHeaders(responseHeaders);

  if (!backendResponse.ok) {
    const errorBody = await backendResponse.text();
    return new Response(errorBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  }

  let payload: unknown;
  try {
    payload = await backendResponse.json();
  } catch {
    return createJsonResponse(
      { error: 'invalid_backend_response' },
      { status: 502 }
    );
  }

  const message =
    payload && typeof payload === 'object' && 'message' in payload
      ? (payload as Record<string, unknown>).message
      : undefined;
  const nonce =
    payload && typeof payload === 'object' && 'nonce' in payload
      ? (payload as Record<string, unknown>).nonce
      : undefined;

  if (typeof message !== 'string' || typeof nonce !== 'string') {
    return createJsonResponse(
      { error: 'invalid_backend_response' },
      { status: 502 }
    );
  }

  return createJsonResponse({ message, nonce });
}
