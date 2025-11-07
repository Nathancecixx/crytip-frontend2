import { NextRequest, NextResponse } from 'next/server';
import { env } from './env';

type GuardOk = {
  ok: true;
  evaluation: string;
  response?: undefined;
};

type GuardBlocked = {
  ok: false;
  evaluation: string;
  response: NextResponse;
};

export type GuardResult = GuardOk | GuardBlocked;

export function allowedOrigins(): string[] {
  const origins = new Set<string>();
  origins.add(env.FRONTEND_ORIGIN.replace(/\/$/, ''));
  for (const origin of env.ALLOWED_ORIGINS) {
    origins.add(origin.replace(/\/$/, ''));
  }
  return Array.from(origins).filter(Boolean);
}

function determineAllowOrigin(req: NextRequest, evaluation: GuardResult['evaluation']): string | null {
  const originHeader = req.headers.get('origin');
  const requestUrl = new URL(req.url);
  const sameOrigin = requestUrl.origin;
  const normalizedAllowed = allowedOrigins();

  if (originHeader && normalizedAllowed.includes(originHeader.replace(/\/$/, ''))) {
    return originHeader;
  }

  if (!originHeader) {
    if (normalizedAllowed.includes(sameOrigin.replace(/\/$/, ''))) {
      return sameOrigin;
    }
    return normalizedAllowed[0] ?? sameOrigin;
  }

  if (originHeader === sameOrigin) {
    return originHeader;
  }

  if (evaluation === 'missing-allowlist') {
    return originHeader ?? sameOrigin;
  }

  if (evaluation === 'blocked-origin') {
    return originHeader;
  }

  return normalizedAllowed[0] ?? sameOrigin;
}

export function validateRequestOrigin(req: NextRequest): GuardResult {
  const originHeader = req.headers.get('origin');
  const allowed = allowedOrigins();
  const requestUrl = new URL(req.url);
  const sameOrigin = requestUrl.origin;

  if (!allowed.length) {
    return {
      ok: true,
      evaluation: 'missing-allowlist',
    };
  }

  if (!originHeader) {
    return {
      ok: true,
      evaluation: 'missing-origin-header',
    };
  }

  if (allowed.includes(originHeader.replace(/\/$/, ''))) {
    return {
      ok: true,
      evaluation: 'allowlist-match',
    };
  }

  if (originHeader === sameOrigin) {
    return {
      ok: true,
      evaluation: 'same-origin',
    };
  }

  const response = NextResponse.json(
    { error: 'Origin not allowed' },
    { status: 403 },
  );

  return {
    ok: false,
    evaluation: 'blocked-origin',
    response,
  };
}

export const guardOrigin = validateRequestOrigin;

export function withCORS(req: NextRequest, res: Response | NextResponse): NextResponse {
  const result = validateRequestOrigin(req);
  const evaluation = result.evaluation;
  const response = res instanceof NextResponse ? res : NextResponse.from(res);
  const allowOrigin = determineAllowOrigin(req, evaluation);
  const allowHeaders =
    req.headers.get('access-control-request-headers') ??
    'authorization, content-type, x-requested-with';
  const allowMethods = 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS';

  if (allowOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowOrigin);
  }
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', allowMethods);
  response.headers.set('Access-Control-Allow-Headers', allowHeaders);
  response.headers.append('Vary', 'Origin');

  return response;
}

export function handleCorsOptions(req: NextRequest): NextResponse {
  const guard = guardOrigin(req);
  if (!guard.ok) {
    return withCORS(req, guard.response);
  }

  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Content-Length', '0');
  return withCORS(req, response);
}

export function resolveAllowedRequestDomain(req: NextRequest): string {
  if (env.SIWS_DOMAIN) {
    return env.SIWS_DOMAIN;
  }
  const url = new URL(req.url);
  return url.host;
}
