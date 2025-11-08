'use client';

import { PropsWithChildren, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/lib/session';

type ProtectedRouteProps = PropsWithChildren<{
  redirectTo?: string;
  loadingLabel?: string;
}>;

export default function ProtectedRoute({
  redirectTo = '/login',
  loadingLabel = 'Loading…',
  children,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, initializing, error } = useSession();

  useEffect(() => {
    if (initializing) return;
    if (status === 'unauthenticated') {
      const params = new URLSearchParams();
      if (pathname && pathname !== '/') {
        params.set('next', pathname);
      }
      const target = params.size > 0 ? `${redirectTo}?${params.toString()}` : redirectTo;
      router.replace(target);
    }
  }, [status, initializing, redirectTo, router, pathname]);

  if (status === 'authenticated') {
    return <>{children}</>;
  }

  if (status === 'error') {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error || 'Failed to verify your session.'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white/70">
      {loadingLabel}
    </div>
  );
}
