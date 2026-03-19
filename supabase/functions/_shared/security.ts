/**
 * Shared security utilities for all Supabase Edge Functions.
 * Provides rate limiting, auth verification, input validation, and audit logging.
 * 
 * SOC 2 Controls: CC6.1 (Logical Access), CC7.2 (System Monitoring)
 * HIPAA: §164.312(a)(1) Access Control, §164.312(b) Audit Controls
 */

// deno-lint-ignore-file
// @ts-types="npm:@supabase/supabase-js@2"
import { type SupabaseClient } from "jsr:@supabase/supabase-js@2";

// ============================================================================
// Rate Limiter (in-memory, per-instance)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Key prefix for namespacing */
  keyPrefix?: string;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowSeconds: 60,
  keyPrefix: "default",
};

/**
 * Check if a request should be rate limited.
 * Returns null if allowed, or a Response if rate limited.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT,
  corsHeaders?: Record<string, string>,
): Response | null {
  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore) {
      if (v.resetAt < now) rateLimitStore.delete(k);
    }
  }

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    });
    return null;
  }

  entry.count++;
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return new Response(
      JSON.stringify({
        error: "Too many requests",
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          ...(corsHeaders ?? {}),
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}

/**
 * Extract client identifier for rate limiting (IP-based).
 */
export function getClientIdentifier(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ============================================================================
// Authentication Verification
// ============================================================================

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  email?: string;
  role?: string;
  error?: string;
}

/**
 * Verify the JWT token from the Authorization header.
 * Returns the authenticated user or an error.
 */
export async function verifyAuth(
  req: Request,
  supabase: SupabaseClient
): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { authenticated: false, error: "Missing Authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token || token === authHeader) {
    return { authenticated: false, error: "Invalid Authorization format" };
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        authenticated: false,
        error: error?.message || "Invalid or expired token",
      };
    }

    return {
      authenticated: true,
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  } catch (err) {
    return {
      authenticated: false,
      error: "Token verification failed",
    };
  }
}

/**
 * Require authentication - returns a 401 Response if not authenticated.
 */
export async function requireAuth(
  req: Request,
  supabase: SupabaseClient
): Promise<{ user: AuthResult; errorResponse?: Response }> {
  const auth = await verifyAuth(req, supabase);

  if (!auth.authenticated) {
    return {
      user: auth,
      errorResponse: new Response(
        JSON.stringify({ error: auth.error || "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  return { user: auth };
}

// ============================================================================
// Role-Based Access Control
// ============================================================================

/**
 * Check if the user has the required role via the user_roles table.
 */
export async function requireRole(
  userId: string,
  requiredRoles: string[],
  supabase: SupabaseClient
): Promise<{ authorized: boolean; errorResponse?: Response }> {
  try {
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      return {
        authorized: false,
        errorResponse: new Response(
          JSON.stringify({ error: "Failed to verify permissions" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        ),
      };
    }

    const userRoles = (roles || []).map((r: { role: string }) => r.role);
    const hasRole = requiredRoles.some((r) => userRoles.includes(r));

    if (!hasRole) {
      return {
        authorized: false,
        errorResponse: new Response(
          JSON.stringify({ error: "Insufficient permissions" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        ),
      };
    }

    return { authorized: true };
  } catch {
    return {
      authorized: false,
      errorResponse: new Response(
        JSON.stringify({ error: "Authorization check failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
}

// ============================================================================
// Input Validation & Sanitization
// ============================================================================

/**
 * Sanitize a string to prevent XSS and injection attacks.
 * Strips HTML tags and limits length.
 */
export function sanitizeInput(input: string, maxLength: number = 10000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[<>"'&]/g, (c) => {
      // Encode remaining special chars
      const map: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "&": "&amp;",
      };
      return map[c] || c;
    })
    .slice(0, maxLength);
}

/**
 * Validate email format (strict).
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

/** HTML-entity-escape user data before interpolating into HTML templates. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validate UUID format.
 */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

// ============================================================================
// Audit Logging (HIPAA §164.312(b))
// ============================================================================

export interface AuditEvent {
  action: string;
  resource_type: string;
  resource_id?: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  severity: "info" | "warning" | "critical";
}

/**
 * Log a security-relevant audit event to the database.
 */
export async function logAuditEvent(
  supabase: SupabaseClient,
  event: AuditEvent
): Promise<void> {
  try {
    await supabase.from("security_audit_log").insert({
      action: event.action,
      resource_type: event.resource_type,
      resource_id: event.resource_id,
      user_id: event.user_id,
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      metadata: event.metadata,
      severity: event.severity,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Audit log failures should never crash the main operation
    // but should be logged for operational monitoring
    console.error("[AUDIT] Failed to write audit log:", err);
  }
}

// ============================================================================
// Error Response Helpers (prevent info leakage)
// ============================================================================

/**
 * Create a safe error response that doesn't leak internal details.
 */
export function safeErrorResponse(
  status: number,
  publicMessage: string,
  headers?: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: publicMessage }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }
  );
}

// ============================================================================
// HMAC Webhook Signature Verification
// ============================================================================

/**
 * Verify an HMAC-SHA256 webhook signature using constant-time comparison.
 */
export async function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}
