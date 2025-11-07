import { NextRequest, NextResponse } from 'next/server';
import { guardOrigin, handleCorsOptions, withCORS } from '@/src/lib/cors';
import { markPurchaseStatus } from '@/src/lib/db';

export const OPTIONS = handleCorsOptions;

interface WebhookPayload {
  purchaseId: string;
  status: string;
  metadata?: Record<string, unknown>;
}

function parseWebhookPayload(body: unknown): WebhookPayload | null {
  if (!body || typeof body !== 'object') return null;
  const { purchaseId, status, metadata } = body as Record<string, unknown>;
  if (typeof purchaseId !== 'string' || typeof status !== 'string') {
    return null;
  }
  return {
    purchaseId: purchaseId.trim(),
    status: status.trim(),
    metadata: metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : undefined,
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const guard = guardOrigin(req);
  if (!guard.ok) {
    return withCORS(req, guard.response);
  }

  let payload: WebhookPayload | null = null;
  try {
    payload = parseWebhookPayload(await req.json());
  } catch {
    const res = NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    return withCORS(req, res);
  }

  if (!payload) {
    const res = NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    return withCORS(req, res);
  }

  try {
    await markPurchaseStatus(payload.purchaseId, payload.status, payload.metadata ?? {});
  } catch (error) {
    const res = NextResponse.json({ error: 'Failed to update purchase' }, { status: 500 });
    return withCORS(req, res);
  }

  const res = NextResponse.json({ ok: true });
  return withCORS(req, res);
}
