import type { Route } from 'next';

export const ALLOWED_NEXT_ROUTES: ReadonlyArray<Route> = ['/dashboard', '/editor'];

export const DEFAULT_AFTER_LOGIN: Route = '/dashboard';

export function resolveNextRoute(nextParam: string | null | undefined): Route {
  if (!nextParam) return DEFAULT_AFTER_LOGIN;
  return ALLOWED_NEXT_ROUTES.find((route) => route === nextParam) ?? DEFAULT_AFTER_LOGIN;
}

export function isAllowedNextRoute(pathname: string | null | undefined): pathname is Route {
  if (!pathname) return false;
  return ALLOWED_NEXT_ROUTES.some((route) => route === pathname);
}
