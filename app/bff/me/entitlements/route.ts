import { NextRequest } from 'next/server';
import { proxyApiRequest } from '@/lib/server/bffProxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  return proxyApiRequest(req, ['me', 'entitlements']);
}
