export const ENTITLEMENTS_REFRESH_EVENT = 'entitlements:refresh';

export function requestEntitlementsRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(ENTITLEMENTS_REFRESH_EVENT));
}
