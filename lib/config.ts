// lib/config.ts
export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.trim() ||
    '').replace(/\/+$/, '');
if (!API_BASE_URL) {
  console.warn('Missing NEXT_PUBLIC_API_BASE_URL');
}
