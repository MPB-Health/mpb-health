import { CMS_REDIRECTS } from './apps/website/generated/cms-redirects.mjs';

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

export default function middleware(request) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (STATIC_FILE.test(pathname)) return;
  if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;

  const normalized = normalizePath(pathname);

  for (const rule of CMS_REDIRECTS) {
    if (!matchesRule(pathname, normalized, rule)) continue;

    const targetPath = resolveDestination(pathname, rule);
    const destination = new URL(targetPath, url.origin);
    destination.search = url.search;
    return Response.redirect(destination.toString(), rule.status);
  }
}

export const config = {
  matcher: ['/((?!assets/|favicon|.*\\..*).*)'],
};
