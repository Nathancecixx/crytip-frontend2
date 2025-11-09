// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard', '/editor'];

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();

  // Minimal check: presence of session cookie set by backend after SIWS finish.
  const sess = req.cookies.get('ctj_sess')?.value;
  if (sess) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  // Avoid redirect loops; only attach a safe internal next path.
  if (pathname !== '/' && pathname.startsWith('/')) {
    loginUrl.searchParams.set('next', pathname + (searchParams.toString() ? `?${searchParams}` : ''));
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/editor/:path*'],
};
