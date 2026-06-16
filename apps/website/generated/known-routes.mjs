/**
 * Known public routes for Vercel Edge Middleware 404 handling.
 * Regenerated at build/install by scripts/generate-known-routes.mjs.
 */
export const STATIC_PATHS = new Set([
  "/",
  "/3d-flip-book/careplus",
  "/3d-flip-book/direct",
  "/3d-flip-book/direct-handbook",
  "/3d-flip-book/essentials",
  "/3d-flip-book/mecessentials-handbook",
  "/3d-flip-book/premium-care",
  "/3d-flip-book/premium-hsa",
  "/3d-flip-book/secure-hsa",
  "/3d-flip-book/zion-guidelines",
  "/about-us",
  "/admin/login",
  "/adult-dependent-information",
  "/advisor-directory",
  "/advisors-and-brokers",
  "/auth/confirm",
  "/benefits/accident",
  "/benefits/critical-illness",
  "/benefits/dental",
  "/benefits/disability",
  "/benefits/hospital",
  "/benefits/life",
  "/benefits/pet",
  "/benefits/vision",
  "/blog",
  "/businesses-and-organizations",
  "/businesses-organizations",
  "/calculator",
  "/cancel-membership",
  "/care-support-hub",
  "/compare-plans",
  "/contact",
  "/dependent-over-18-information",
  "/download-app",
  "/education-enrollment",
  "/employee-removal",
  "/employer-forms",
  "/enroll/care-plus",
  "/enroll/direct",
  "/enroll/essentials",
  "/enroll/mec-essentials",
  "/enroll/secure-hsa",
  "/enrollment",
  "/events",
  "/faq",
  "/features",
  "/features/health-sharing",
  "/features/hsa-compatibility",
  "/features/maternity-care",
  "/features/medical-weight-loss-support",
  "/features/membership-concierge",
  "/features/mental-health",
  "/features/pet-telehealth",
  "/features/preventive-care",
  "/features/primary-care",
  "/features/rx-benefits",
  "/features/urgent-care",
  "/forbidden",
  "/forgot-password",
  "/freequote",
  "/get-a-quote",
  "/get-started",
  "/healthcare-advisor-review-change",
  "/how-it-works",
  "/individuals-and-families",
  "/individuals-families",
  "/insights-analytics",
  "/join-our-team",
  "/list-bill-conversion",
  "/list-bill-setup",
  "/list-bill-update",
  "/login",
  "/logout",
  "/member-feedback",
  "/member-forms",
  "/member-portal",
  "/member-portal/account",
  "/member-stories",
  "/membership-changes",
  "/mfa-enrollment",
  "/mvp",
  "/newsletter/unsubscribe",
  "/permission-to-discuss-plan",
  "/plans",
  "/podcast",
  "/privacy-policy",
  "/quote",
  "/refer-a-friend",
  "/request-rx-quote",
  "/request-to-schedule-an-appointment",
  "/reset-password",
  "/resource-library",
  "/resources",
  "/resources/how-to-submit-a-sharing-need",
  "/review-or-change-advisor",
  "/review-us",
  "/schedule-a-call",
  "/schedule-welcome-call",
  "/state-notices",
  "/support",
  "/terms-and-conditions",
  "/update-form-of-payment",
  "/washington-statement",
  "/welcome",
  "/welcome-call-survey"
]);

export const KNOWN_DYNAMIC_PATHS = new Set([]);

export const PROTECTED_PREFIXES = [
  "/admin",
  "/member",
  "/advisor"
];

export const NOT_FOUND_HTML = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <meta name=\"robots\" content=\"noindex, nofollow\">\n  <title>404 — Page Not Found | MPB Health</title>\n  <style>\n    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb; color: #111827; }\n    main { text-align: center; padding: 2rem; max-width: 28rem; }\n    h1 { font-size: 3rem; margin: 0 0 0.5rem; }\n    p { color: #4b5563; margin: 0 0 1.5rem; line-height: 1.5; }\n    a { color: #0284c7; text-decoration: none; font-weight: 600; }\n    a:hover { text-decoration: underline; }\n  </style>\n</head>\n<body>\n  <main>\n    <h1>404</h1>\n    <p>The page you are looking for does not exist or has been moved.</p>\n    <a href=\"/\">Return to MPB Health home</a>\n  </main>\n</body>\n</html>";

export function normalizeKnownPath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function isKnownRoute(pathname) {
  const normalized = normalizeKnownPath(pathname);
  if (normalized === '/') return true;
  if (STATIC_PATHS.has(normalized)) return true;
  if (KNOWN_DYNAMIC_PATHS.has(normalized)) return true;
  if (PROTECTED_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(prefix + '/'))) {
    return true;
  }
  return false;
}
