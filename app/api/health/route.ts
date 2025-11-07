import { NextRequest, NextResponse } from 'next/server';
import { guardOrigin, handleCorsOptions, withCORS } from '@/src/lib/cors';

export const OPTIONS = handleCorsOptions;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const guard = guardOrigin(req);
  if (!guard.ok) {
    return withCORS(req, guard.response);
  }

  const res = NextResponse.json({ ok: true });
  return withCORS(req, res);
}
