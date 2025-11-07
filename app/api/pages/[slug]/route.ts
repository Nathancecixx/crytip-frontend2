import { NextRequest, NextResponse } from 'next/server';
import { guardOrigin, handleCorsOptions, withCORS } from '@/src/lib/cors';
import { getPageBySlug } from '@/src/lib/db';

export const OPTIONS = handleCorsOptions;

interface Params {
  slug: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Params },
): Promise<NextResponse> {
  const guard = guardOrigin(req);
  if (!guard.ok) {
    return withCORS(req, guard.response);
  }

  const slug = params.slug;
  if (!slug) {
    const res = NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    return withCORS(req, res);
  }

  const page = await getPageBySlug(slug);
  if (!page) {
    const res = NextResponse.json({ error: 'Page not found' }, { status: 404 });
    return withCORS(req, res);
  }

  const res = NextResponse.json({ page });
  return withCORS(req, res);
}
