import { CMS_REDIRECTS } from './apps/website/generated/cms-redirects.mjs';
import { LEGACY_REDIRECTS, WP_DATE_PATH } from './apps/website/scripts/legacy-redirects.mjs';

const SKIP_PREFIXES = ['/assets/', '/favicon', '/BingSiteAuth.xml', '/google'];
const STATIC_FILE = /\.[a-zA-Z0-9]{2,8}$/;

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function matchesRule(pathname, normalized, rule) {
  if (rule.isRegex) {
    try {
      const re = new RegExp(rule.from);
      return re.test(pathname) || re.test(normalized);
    } catch {
      return false;
    }
  }
  const from = normalizePath(rule.from);
  return normalized === from || pathname === rule.from;
}

function resolveDestination(pathname, rule) {
  if (rule.isRegex) {
    try {
      const re = new RegExp(rule.from);
      return pathname.replace(re, rule.to);
    } catch {
      return rule.to;
    }
  }
  return rule.to;
}

function redirectTo(url, target, status = 301) {
  const destination = target.startsWith('http')
    ? new URL(target)
    : new URL(target, url.origin);
  if (!target.startsWith('http')) {
    destination.search = url.search;
  }
  return Response.redirect(destination.toString(), status);
}

export default function middleware(request) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (STATIC_FILE.test(pathname)) return;
  if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;

  if (url.searchParams.has('page_id')) {
    return redirectTo(url, '/');
  }

  const wpMatch = pathname.match(WP_DATE_PATH);
  if (wpMatch) {
    return redirectTo(url, `/blog/${wpMatch[4]}`);
  }

  const normalized = normalizePath(pathname);

  for (const rule of LEGACY_REDIRECTS) {
    const from = normalizePath(rule.from);
    if (normalized === from || pathname === rule.from) {
      return redirectTo(url, rule.to, rule.status || 301);
    }
  }

  for (const rule of CMS_REDIRECTS) {
    if (!matchesRule(pathname, normalized, rule)) continue;

    const targetPath = resolveDestination(pathname, rule);
    return redirectTo(url, targetPath, rule.status);
  }
}

export const config = {
  matcher: ['/((?!assets/|favicon|.*\\..*).*)'],
};
