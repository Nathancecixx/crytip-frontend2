import { NextRequest, NextResponse } from 'next/server';
import { requireSession, UnauthorizedError } from '@/src/lib/auth';
import { guardOrigin, handleCorsOptions, withCORS } from '@/src/lib/cors';
import { createCheckoutSession } from '@/src/lib/db';

export const OPTIONS = handleCorsOptions;

interface CheckoutRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

function parseCheckoutRequest(body: unknown): CheckoutRequest | null {
  if (!body || typeof body !== 'object') return null;
  const { priceId, successUrl, cancelUrl, metadata } = body as Record<string, unknown>;
  if (typeof priceId !== 'string' || typeof successUrl !== 'string' || typeof cancelUrl !== 'string') {
    return null;
  }
  const payload: CheckoutRequest = {
    priceId: priceId.trim(),
    successUrl: successUrl.trim(),
    cancelUrl: cancelUrl.trim(),
  };
  if (metadata && typeof metadata === 'object') {
    payload.metadata = Object.fromEntries(
      Object.entries(metadata as Record<string, unknown>).map(([key, value]) => [key, String(value)]),
    );
  }
  return payload;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const guard = guardOrigin(req);
  if (!guard.ok) {
    return withCORS(req, guard.response);
  }

  let session;
  try {
    session = requireSession(req);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      const res = NextResponse.json({ error: error.message }, { status: 401 });
      return withCORS(req, res);
    }
    const res = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    return withCORS(req, res);
  }

  let payload: CheckoutRequest | null = null;
  try {
    payload = parseCheckoutRequest(await req.json());
  } catch {
    const res = NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    return withCORS(req, res);
  }

  if (!payload) {
    const res = NextResponse.json({ error: 'Missing checkout parameters' }, { status: 400 });
    return withCORS(req, res);
  }

  try {
    const sessionData = await createCheckoutSession(session.userId, payload);
    const res = NextResponse.json({ session: sessionData });
    return withCORS(req, res);
  } catch (error) {
    const res = NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    return withCORS(req, res);
  }
}
