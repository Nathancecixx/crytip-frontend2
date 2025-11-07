import { NextRequest, NextResponse } from 'next/server';
import { guardOrigin, handleCorsOptions, withCORS } from '@/src/lib/cors';

export const OPTIONS = handleCorsOptions;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const guard = guardOrigin(req);
  if (!guard.ok) {
    return withCORS(req, guard.response);
  }

  const res = NextResponse.json({
    ok: true,
    method: req.method,
    origin: req.headers.get('origin'),
    timestamp: new Date().toISOString(),
  });
  return withCORS(req, res);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const guard = guardOrigin(req);
  if (!guard.ok) {
    return withCORS(req, guard.response);
  }

  const body = await req.text();
  const res = NextResponse.json({
    ok: true,
    method: req.method,
    origin: req.headers.get('origin'),
    body,
  });
  return withCORS(req, res);
}
