import { NextRequest } from 'next/server';
import { proxyApiRequest } from '@/lib/server/bffProxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

async function handler(req: NextRequest, { params }: { params: { segments?: string[] } }) {
  const segments = params.segments ?? [];
  return proxyApiRequest(req, segments);
}

export { handler as GET };
export { handler as POST };
export { handler as PUT };
export { handler as PATCH };
export { handler as DELETE };
export { handler as OPTIONS };
export { handler as HEAD };
