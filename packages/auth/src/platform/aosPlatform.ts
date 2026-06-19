/** Advisor OS platform hostnames — path-based tenants live here. */
export const AOS_PLATFORM_HOSTS = new Set(['aos.aryxcloud.com']);

/** First path segments that are not tenant org slugs. */
export const AOS_RESERVED_PATH_SEGMENTS = new Set([
  'login',
  'landing',
  'forgot-password',
  'reset-password',
  'change-password',
  'auth',
  'api',
  'assets',
  'favicon.ico',
]);

export function isAosPlatformHost(hostname?: string): boolean {
  const host = (hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '')).toLowerCase();
  if (AOS_PLATFORM_HOSTS.has(host)) return true;
  // Local dev: advisor portal on :5175 with VITE_AOS_PLATFORM=1
  if (host === 'localhost' || host === '127.0.0.1') {
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    return env?.VITE_AOS_PLATFORM === '1' || env?.VITE_AOS_PLATFORM === 'true';
  }
  return false;
}

/** Extract tenant org slug from pathname on AOS (e.g. /saudemax/training → saudemax). */
export function parseAosTenantSlugFromPath(pathname: string): string | null {
  const segment = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  if (!segment || AOS_RESERVED_PATH_SEGMENTS.has(segment)) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment)) return null;
  return segment;
}

/** Prefix an app path with /{tenantSlug} on AOS; unchanged on MPB hosts. */
export function withAosTenantPath(path: string, tenantSlug: string | null, hostname?: string): string {
  if (!tenantSlug || !isAosPlatformHost(hostname)) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === `/${tenantSlug}` || normalized.startsWith(`/${tenantSlug}/`)) return normalized;
  return normalized === '/' ? `/${tenantSlug}` : `/${tenantSlug}${normalized}`;
}
