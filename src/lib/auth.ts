import crypto, { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { env } from './env';

export class UnauthorizedError extends Error {
  code = 'unauthorized' as const;

  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export function makeNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function buildSiwsMessage(
  domain: string,
  address: string,
  nonce: string,
  issuedAt: string = new Date().toISOString(),
): string {
  return [
    `${domain} wants you to sign in with your Solana account:`,
    address,
    '',
    'By signing this message, you are proving ownership of this wallet.',
    '',
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n');
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}

export function issueSessionJWT(userId: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  } satisfies Record<string, unknown>;
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    iat: issuedAt,
    exp: issuedAt + env.SESSION_MAX_AGE,
  } satisfies Record<string, unknown>;

  const headerSegment = base64UrlEncode(JSON.stringify(header));
  const payloadSegment = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerSegment}.${payloadSegment}`;
  const signature = createHmac('sha256', env.SESSION_SECRET)
    .update(signingInput)
    .digest('base64url');

  return `${signingInput}.${signature}`;
}

export function setSessionCookie(res: NextResponse, token: string): void {
  const cookieName = env.SESSION_COOKIE_NAME;
  const cookieDomain =
    env.SESSION_COOKIE_DOMAIN && process.env.VERCEL_ENV !== 'preview'
      ? env.SESSION_COOKIE_DOMAIN
      : undefined;

  res.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: env.SESSION_MAX_AGE,
    domain: cookieDomain,
  });
}

function extractRequestCookie(req: NextRequest | undefined): string | undefined {
  const cookieName = env.SESSION_COOKIE_NAME;
  if (req) {
    return req.cookies.get(cookieName)?.value;
  }
  return cookies().get(cookieName)?.value;
}

export function requireSession(req?: NextRequest): { userId: string } {
  const token = extractRequestCookie(req);
  if (!token) {
    throw new UnauthorizedError('Session cookie missing');
  }

  const segments = token.split('.');
  if (segments.length !== 3) {
    throw new UnauthorizedError('Malformed session token');
  }

  const [headerSegment, payloadSegment, signatureSegment] = segments;
  const signingInput = `${headerSegment}.${payloadSegment}`;
  const expectedSignature = createHmac('sha256', env.SESSION_SECRET)
    .update(signingInput)
    .digest();

  let providedSignature: Buffer;
  try {
    providedSignature = base64UrlDecode(signatureSegment);
  } catch {
    throw new UnauthorizedError('Malformed session token');
  }

  if (providedSignature.length !== expectedSignature.length || !timingSafeEqual(providedSignature, expectedSignature)) {
    throw new UnauthorizedError('Invalid session token');
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(base64UrlDecode(payloadSegment).toString('utf-8')) as Record<string, unknown>;
  } catch {
    throw new UnauthorizedError('Malformed session token');
  }

  const subject = typeof payload.sub === 'string' ? payload.sub : undefined;
  const exp = typeof payload.exp === 'number' ? payload.exp : undefined;
  const now = Math.floor(Date.now() / 1000);

  if (!subject || !exp || exp <= now) {
    throw new UnauthorizedError('Session expired');
  }

  return { userId: subject };
}
