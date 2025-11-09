// lib/routes.ts
export function isAllowedNextRoute(path: string): boolean {
  // Allow only in-app paths (no protocol, no external)
  if (!path.startsWith('/')) return false;
  // Deny auth routes as destinations:
  const banned = ['/login', '/logout'];
  if (banned.includes(path)) return false;
  // Optionally restrict to known pages:
  return true;
}
