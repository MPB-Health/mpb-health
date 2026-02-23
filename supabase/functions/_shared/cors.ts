/**
 * Shared CORS utility for all Supabase Edge Functions.
 *
 * Restricts Access-Control-Allow-Origin to an explicit allowlist
 * instead of the wildcard "*". The Origin header from the incoming
 * request is checked against the list; if it matches, that origin
 * is reflected back. Otherwise the first allowed origin is returned
 * (browsers will block the response when it doesn't match).
 */

const ALLOWED_ORIGINS: string[] = [
  // Production
  "https://www.mpbhealth.com",
  "https://mpbhealth.com",
  "https://app.mpbhealth.com",
  "https://crm.mpbhealth.com",
  "https://admin.mpbhealth.com",
  "https://advisor.mpbhealth.com",

  // Vercel preview / branch deploys (any subdomain)
  // Matched via pattern below, not listed literally.

  // Local development
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:5173",
  "http://localhost:8080",
];

/**
 * Returns true when `origin` is in the static allowlist **or**
 * matches one of the dynamic patterns (e.g. *.vercel.app).
 */
function isOriginAllowed(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Allow any Vercel preview deploy for the mpbhealth project
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
    return true;
  }

  // Allow any localhost port for local development
  if (/^http:\/\/localhost:\d+$/.test(origin)) {
    return true;
  }

  return false;
}

/**
 * Build CORS headers for a given request.
 *
 * @param req  The incoming Request (used to read the Origin header).
 * @param opts Optional overrides for methods and extra allowed headers.
 * @returns    A plain object suitable for spreading into Response headers.
 */
export function getCorsHeaders(
  req: Request,
  opts?: {
    methods?: string;
    allowHeaders?: string;
  },
): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = isOriginAllowed(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods":
      opts?.methods ?? "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      opts?.allowHeaders ??
      "Content-Type, Authorization, X-Client-Info, X-Supabase-Client-Platform, Apikey, authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
    "Vary": "Origin",
  };
}

/**
 * Convenience: return a 200 preflight response with the correct CORS headers.
 */
export function handleCorsPreflightRequest(
  req: Request,
  opts?: {
    methods?: string;
    allowHeaders?: string;
  },
): Response {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(req, opts),
  });
}
