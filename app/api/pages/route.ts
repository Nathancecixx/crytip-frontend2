import { NextRequest, NextResponse } from 'next/server';
import { guardOrigin, handleCorsOptions, withCORS } from '@/src/lib/cors';
import { listPages } from '@/src/lib/db';

export const OPTIONS = handleCorsOptions;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const guard = guardOrigin(req);
  if (!guard.ok) {
    return withCORS(req, guard.response);
  }

  try {
    const pages = await listPages();
    const res = NextResponse.json({ pages });
    return withCORS(req, res);
  } catch (error) {
    const res = NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
    return withCORS(req, res);
  }
}
