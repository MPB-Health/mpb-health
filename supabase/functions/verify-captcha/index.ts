import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
const log = createLogger('verify-captcha');

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes": string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

interface VerifyCaptchaRequest {
  token: string;
  remoteIp?: string;
}

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  // Rate limit: public-facing endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: 'verify-captcha',
  });
  if (rateLimitResponse) return rateLimitResponse;

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }

  try {
    const secretKey = Deno.env.get("TURNSTILE_SECRET_KEY");

    if (!secretKey) {
      log.error(
        "TURNSTILE_SECRET_KEY is not configured. " +
          "Set it in Supabase Edge Function secrets."
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "CAPTCHA service is not configured",
        }),
        {
          status: 503,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    const body: VerifyCaptchaRequest = await req.json();
    const { token, remoteIp } = body;

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing CAPTCHA token" }),
        {
          status: 400,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    // Build the verification payload for Cloudflare Turnstile
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!verifyResponse.ok) {
      log.error(
        "Turnstile API returned non-OK status:",
        verifyResponse.status
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "CAPTCHA verification service unavailable",
        }),
        {
          status: 502,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    const result: TurnstileVerifyResponse = await verifyResponse.json();

    if (!result.success) {
      log.warn("Verification failed:", result["error-codes"]);
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        errorCodes: result["error-codes"] || [],
      }),
      {
        status: 200,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    log.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal error during CAPTCHA verification",
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
