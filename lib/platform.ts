export function isIOS(userAgent?: string): boolean {
  if (userAgent) {
    return /iPad|iPhone|iPod/i.test(userAgent);
  }

  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/i.test(ua)) {
    return true;
  }

  // Detect iPadOS 13+ which reports as Mac but has touch support.
  const platform = navigator.platform || '';
  const maxTouchPoints = (navigator as any).maxTouchPoints || 0;
  return platform === 'MacIntel' && maxTouchPoints > 1;
}
