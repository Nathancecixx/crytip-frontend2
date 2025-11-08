// lib/config.ts
// Use the repo’s documented env; fall back to the older name if present.
export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.trim() ||
    '').replace(/\/+$/, ''); // strip trailing slash
