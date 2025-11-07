import { NextRequest, NextResponse } from 'next/server';
import { buildSiwsMessage, makeNonce } from '@/src/lib/auth';
import { guardOrigin, handleCorsOptions, resolveAllowedRequestDomain, withCORS } from '@/src/lib/cors';
import { saveSiwsNonce } from '@/src/lib/db';

export const OPTIONS = handleCorsOptions;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const guard = guardOrigin(req);
  if (!guard.ok) {
    return withCORS(req, guard.response);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const res = NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    return withCORS(req, res);
  }

  const address = typeof (body as Record<string, unknown>)?.address === 'string'
    ? (body as Record<string, unknown>).address.trim()
    : '';
  if (!address) {
    const res = NextResponse.json({ error: 'Address is required' }, { status: 400 });
    return withCORS(req, res);
  }

  const domain = resolveAllowedRequestDomain(req);
  const nonce = makeNonce();
  const message = buildSiwsMessage(domain, address, nonce);

  try {
    await saveSiwsNonce(address, nonce);
  } catch (error) {
    const res = NextResponse.json(
      { error: 'Failed to persist nonce' },
      { status: 500 },
    );
    return withCORS(req, res);
  }

  const res = NextResponse.json({ domain, nonce, message });
  return withCORS(req, res);
}
