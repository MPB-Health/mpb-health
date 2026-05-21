import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { checkRateLimit, getClientIdentifier } from "../_shared/security.ts";
import { wrapEmailLayout, emailCta, emailCallout } from "../_shared/emailLayout.ts";

const log = createLogger("advisor-forgot-password");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "MPB Health <onboarding@mpb.health>";
const ADVISOR_RESET_URL = "https://advisor.mpb.health/reset-password";
const LOGO_URL = "https://mpb.health/assets/MPB-Health-No-background.png";

function buildResetEmail(email: string, resetLink: string): { html: string; text: string } {
  const accent = "#0d9488";
  const bodyHtml = `
    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 16px;">
      We received a request to reset the password for the Advisor Portal account
      associated with <strong style="color:#111827;">${email}</strong>.
    </p>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 8px;">
      Click the button below to choose a new password. This link is valid for 24 hours and can only be used once.
    </p>
    ${emailCta(resetLink, "Reset My Password", accent)}
    <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:20px 0 0;text-align:center;word-break:break-all;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${resetLink}" style="color:${accent};text-decoration:underline;">${resetLink}</a>
    </p>
    ${emailCallout("If you did not request this password reset, no action is needed — your account remains secure.", "warning")}`;

  const html = wrapEmailLayout({
    appName: "Advisor Portal",
    accentColor: accent,
    heading: "Reset Your Password",
    preheader: "Reset the password for your Advisor Portal account.",
    portalUrl: ADVISOR_RESET_URL,
  }, bodyHtml);

  const text = `Reset Your Password — MPB Health Advisor Portal

We received a request to reset the password for the Advisor Portal account associated with ${email}.

Reset your password using the link below. This link is valid for 24 hours and can only be used once.

${resetLink}

If you did not request this password reset, no action is needed — your account remains secure.

— MPB Health, Inc.`;

  return { html, text };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  // Rate limit: 5 reset attempts per IP per 15 minutes
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 5,
    windowSeconds: 900,
    keyPrefix: "advisor-forgot-password",
  }, req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid email required" }),
        { status: 400, headers },
      );
    }

    // Always return success — never reveal whether email exists in the system
    if (!RESEND_API_KEY) {
      log.error("RESEND_API_KEY not configured — cannot send reset email");
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate a recovery link via Admin API — bypasses Supabase email rate limits
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: ADVISOR_RESET_URL },
    });

    if (linkError || !linkData?.properties?.action_link) {
      // User may not exist — don't reveal this, just return success silently
      log.warn(`Could not generate reset link for ${email}: ${linkError?.message}`);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    // SCANNER-PROOF: Never send the action_link directly — M365 SafeLinks and
    // other email scanners pre-click it, consuming the single-use token before
    // the advisor can.  Instead, route through the advisor portal with a
    // token_hash (or email+token fallback).  The token is only exchanged when
    // a real browser executes verifyOtp() in JavaScript.
    let resetLink: string;
    const hashedToken = linkData.properties?.hashed_token;

    if (hashedToken) {
      resetLink = `${ADVISOR_RESET_URL}?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`;
    } else {
      // hashed_token may be absent on older GoTrue versions — compute it from
      // the raw token embedded in the action_link.  GoTrue stores
      // sha256hex(rawToken + type) and verifyOtp({token_hash}) looks up by that.
      const actionUrl = new URL(linkData.properties.action_link);
      const rawToken = actionUrl.searchParams.get("token");
      if (rawToken) {
        const hashInput = new TextEncoder().encode(rawToken + "recovery");
        const hashBuf = await crypto.subtle.digest("SHA-256", hashInput);
        const computedHash = Array.from(new Uint8Array(hashBuf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        resetLink = `${ADVISOR_RESET_URL}?token_hash=${encodeURIComponent(computedHash)}&type=recovery`;
        log.info("Computed token_hash from action_link (hashed_token was absent)");
      } else {
        // Last resort: pass email + raw token so the portal can call
        // verifyOtp({email, token, type}) — still scanner-proof (JS-only).
        log.warn("Could not extract token from action_link; using email+token fallback");
        resetLink = `${ADVISOR_RESET_URL}?email=${encodeURIComponent(email)}&type=recovery`;
      }
    }

    // Send via Resend (branded, scanner-proof) for ALL domains.
    // Previously internal domains (@mympb.com) used Supabase built-in email, but
    // M365 email scanners follow the Supabase verify link and consume the single-use
    // token before the user can click it, causing an infinite forgot-password loop.
    const { html, text } = buildResetEmail(email, resetLink);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [email],
        subject: "Reset Your Password — MPB Health Advisor Portal",
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      log.error(`Resend error for ${email}: ${res.status} ${errBody}`);
    } else {
      log.info(`Password reset email sent to ${email} via Resend`);
    }

    // Always return success to not leak whether email exists
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    log.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers },
    );
  }
});
