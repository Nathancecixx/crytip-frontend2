import { NextRequest, NextResponse } from 'next/server';
import { guardOrigin, handleCorsOptions, withCORS } from '@/src/lib/cors';
import { env } from '@/src/lib/env';

export const OPTIONS = handleCorsOptions;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const guard = guardOrigin(req);
  if (!guard.ok) {
    return withCORS(req, guard.response);
  }

  const response = NextResponse.json({ ok: true });
  const cookieDomain =
    env.SESSION_COOKIE_DOMAIN && process.env.VERCEL_ENV !== 'preview'
      ? env.SESSION_COOKIE_DOMAIN
      : undefined;
  response.cookies.set(env.SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 0,
    domain: cookieDomain,
  });
  return withCORS(req, response);
}
