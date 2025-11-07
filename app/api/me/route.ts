import { NextRequest, NextResponse } from 'next/server';
import { requireSession, UnauthorizedError } from '@/src/lib/auth';
import { guardOrigin, handleCorsOptions, withCORS } from '@/src/lib/cors';

export const OPTIONS = handleCorsOptions;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const guard = guardOrigin(req);
  if (!guard.ok) {
    return withCORS(req, guard.response);
  }

  try {
    const session = requireSession(req);
    const res = NextResponse.json({ userId: session.userId });
    return withCORS(req, res);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      const res = NextResponse.json({ error: error.message }, { status: 401 });
      return withCORS(req, res);
    }
    const res = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    return withCORS(req, res);
  }
}
