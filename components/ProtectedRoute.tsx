// components/ProtectedRoute.tsx
'use client';

import { PropsWithChildren, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useSession } from '@/lib/session';
import { isAllowedNextRoute } from '@/lib/routes';

type Props = PropsWithChildren<{ redirectTo?: Route; loadingLabel?: string }>;

export default function ProtectedRoute({
  redirectTo = '/login',
  loadingLabel = 'Checking your session…',
  children,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, initializing, error } = useSession();

  useEffect(() => {
    if (initializing) return;
    if (status === 'unauthenticated') {
      const params = new URLSearchParams();
      if (pathname && isAllowedNextRoute(pathname)) params.set('next', pathname);
      const target = (params.size ? `${redirectTo}?${params}` : redirectTo) as Route;
      router.replace(target);
    }
  }, [status, initializing, redirectTo, router, pathname]);

  if (status === 'authenticated') return <>{children}</>;
  if (status === 'error')
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error || 'Failed to verify your session.'}
        </div>
      </div>
    );

  return <div className="p-6 text-white/70">{loadingLabel}</div>;
}
