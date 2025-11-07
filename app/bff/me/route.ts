import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  applyBffResponseHeaders,
  buildBackendUrl,
  cloneResponseHeaders,
  createJsonResponse,
} from '@/lib/server/bffProxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return createJsonResponse({ error: 'unauthenticated' }, { status: 401 });
  }

  const url = buildBackendUrl(req, ['me']);
  const headers = new Headers();
  headers.set('Accept', 'application/json');
  headers.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionCookie}`);

  const backendResponse = await fetch(url.toString(), {
    method: 'GET',
    headers,
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
