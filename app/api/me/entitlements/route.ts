import { NextRequest, NextResponse } from 'next/server';
import { requireSession, UnauthorizedError } from '@/src/lib/auth';
import { guardOrigin, handleCorsOptions, withCORS } from '@/src/lib/cors';
import { listEntitlements } from '@/src/lib/db';

export const OPTIONS = handleCorsOptions;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const guard = guardOrigin(req);
  if (!guard.ok) {
    return withCORS(req, guard.response);
  }

  try {
    const { userId } = requireSession(req);
    const entitlements = await listEntitlements(userId);
    const res = NextResponse.json({ entitlements });
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
