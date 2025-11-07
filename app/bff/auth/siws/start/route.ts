import { NextRequest } from 'next/server';
import {
  applyBffResponseHeaders,
  buildBackendUrl,
  cloneRequestBody,
  cloneRequestHeaders,
  cloneResponseHeaders,
  ensureCsrfHeader,
  rebindSessionCookies,
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
  const sessionCookies = rebindSessionCookies(backendResponse.headers);
  for (const cookie of sessionCookies) {
    responseHeaders.append('Set-Cookie', cookie);
  }
  applyBffResponseHeaders(responseHeaders);

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}
