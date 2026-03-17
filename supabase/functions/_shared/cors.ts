/**
 * Shared CORS utility for all Supabase Edge Functions.
 *
 * Restricts Access-Control-Allow-Origin to an explicit allowlist
 * instead of the wildcard "*". The Origin header from the incoming
 * request is checked against the list; if it matches, that origin
 * is reflected back. Otherwise the first allowed origin is returned
 * (browsers will block the response when it doesn't match).
 */

const isDev =
  Deno.env.get("ENVIRONMENT") === "development" ||
  Deno.env.get("DENO_ENV") === "development";

const ALLOWED_ORIGINS: string[] = [
  // Production
  "https://www.mpbhealth.com",
  "https://mpbhealth.com",
  "https://app.mpbhealth.com",
  "https://crm.mpbhealth.com",
  "https://admin.mpbhealth.com",
  "https://advisor.mpbhealth.com",
  "https://www.mpb.health",
  "https://mpb.health",
  "https://app.mpb.health",
  "https://crm.mpb.health",
  "https://admin.mpb.health",
  "https://advisor.mpb.health",
  "https://support.mpb.health",

  // Vercel preview / branch deploys (any subdomain)
  // Matched via pattern below, not listed literally.

  // Local development (only in dev mode)
  ...(isDev
    ? [
        "http://localhost:3000",
        "http://localhost:4173",
        "http://localhost:5173",
        "http://localhost:8080",
      ]
    : []),
];

/**
 * Returns true when `origin` is in the static allowlist **or**
 * matches one of the dynamic patterns (e.g. *.vercel.app).
 */
function isOriginAllowed(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Allow Vercel preview deploys for mpbhealth projects only
  if (/^https:\/\/mpbhealth[a-z0-9-]*\.vercel\.app$/.test(origin)) {
    return true;
  }

  // Allow any localhost port for local development (only in dev mode)
  if (isDev && /^http:\/\/localhost:\d+$/.test(origin)) {
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
  const requestedHeaders = req.headers.get("Access-Control-Request-Headers");
  const defaultAllowHeaders =
    "Content-Type, Authorization, X-Client-Info, X-Supabase-Client-Platform, Apikey, x-request-id, " +
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods":
      opts?.methods ?? "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      opts?.allowHeaders ?? requestedHeaders ?? defaultAllowHeaders,
    // Expose x-request-id so the browser JS (or Supabase SDK) can read it
    // from the response for correlation / debugging.
    "Access-Control-Expose-Headers": "x-request-id",
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
