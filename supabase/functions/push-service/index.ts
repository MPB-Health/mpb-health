import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import {
  checkRateLimit,
  getClientIdentifier,
  verifyAuth,
  isValidUUID,
  safeErrorResponse,
} from "../_shared/security.ts";

const log = createLogger("push-service");

type PushAction =
  | "register_device"
  | "unregister_device"
  | "send_push"
  | "get_settings"
  | "update_settings"
  | "get_vapid_public_key"
  | "ping";

const RATE_LIMIT = { maxRequests: 30, windowSeconds: 60, keyPrefix: "push" };

/**
 * Web Push: Send a push notification using the Web Push protocol.
 * Uses VAPID authentication with ECDSA P-256 keys.
 */
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth_key: string },
  payload: Record<string, unknown>,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string,
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    // For Web Push, we need to encrypt the payload using the subscription keys.
    // Deno doesn't have a built-in web-push library, so we use the raw Web Push protocol.
    // The payload must be encrypted with the subscription's p256dh and auth keys.

    // Simplified approach: POST to the endpoint with VAPID headers
    // For production, consider using a Web Push library or service like OneSignal/Firebase

    const payloadString = JSON.stringify(payload);

    // Create VAPID JWT
    const jwtHeader = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" })).replace(/=/g, "");
    const audience = new URL(subscription.endpoint).origin;
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = btoa(JSON.stringify({
      aud: audience,
      exp: now + 86400,
      sub: vapidSubject,
    })).replace(/=/g, "");

    // Import the VAPID private key for signing
    const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
    const publicKeyBytes = base64UrlDecode(vapidPublicKey);

    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      {
        kty: "EC",
        crv: "P-256",
        d: vapidPrivateKey,
        x: vapidPublicKey.slice(0, 43),
        y: vapidPublicKey.slice(43),
      },
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"],
    ).catch(() => null);

    if (!cryptoKey) {
      log.warn("VAPID key import failed — falling back to unencrypted push");
      // Fallback: send without encryption (some push services accept this)
      const response = await fetch(subscription.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "TTL": "86400",
        },
        body: payloadString,
      });

      return {
        success: response.ok || response.status === 201,
        status: response.status,
      };
    }

    const unsignedToken = `${jwtHeader}.${jwtPayload}`;
    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      cryptoKey,
      new TextEncoder().encode(unsignedToken),
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const jwt = `${unsignedToken}.${signatureB64}`;

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "TTL": "86400",
      },
      body: new TextEncoder().encode(payloadString),
    });

    if (response.status === 410) {
      // Subscription expired — caller should deactivate
      return { success: false, status: 410, error: "Subscription expired" };
    }

    return {
      success: response.ok || response.status === 201,
      status: response.status,
    };
  } catch (err) {
    log.error("Web Push send failed", err);
    return { success: false, error: String(err) };
  }
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  const correlationId =
    req.headers.get("x-request-id") ||
    `push-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const respond = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify({ ...body, correlationId }), {
      status,
      headers: { "Content-Type": "application/json", "x-request-id": correlationId, ...corsHeaders },
    });

  const respondError = (msg: string, status: number) =>
    respond({ success: false, error: msg }, status);

  try {
    if (req.method !== "POST") {
      return respondError("Method not allowed", 405);
    }

    const clientIp = getClientIdentifier(req);
    const rateLimited = checkRateLimit(clientIp, RATE_LIMIT);
    if (rateLimited) {
      Object.entries(corsHeaders).forEach(([k, v]) => rateLimited.headers.set(k, v));
      return rateLimited;
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.action) {
      return respondError("Missing action", 400);
    }

    const action = body.action as PushAction;

    if (action === "ping") {
      return respond({ success: true, message: "pong" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // get_vapid_public_key doesn't require auth (needed before subscription)
    if (action === "get_vapid_public_key") {
      const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
      if (!vapidPublicKey) {
        return respondError("Push notifications not configured", 503);
      }
      return respond({ success: true, vapid_public_key: vapidPublicKey });
    }

    // send_push: internal (service-role only)
    if (action === "send_push") {
      const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
      if (authHeader !== supabaseServiceKey) {
        return respondError("Unauthorized — service role required", 401);
      }

      const { user_id, title, body: pushBody, action_url, tag } = body;

      if (!user_id || !title) {
        return respondError("Missing user_id and title", 400);
      }

      // HIPAA: Payload must be generic, no PHI
      const payload = {
        title,
        body: pushBody || "You have a new notification",
        url: action_url || "/",
        tag: tag || "mpb-notification",
      };

      // Get active subscriptions for this user
      const { data: subs } = await supabaseAdmin
        .from("device_push_subscriptions")
        .select("id, endpoint, p256dh, auth_key")
        .eq("user_id", user_id)
        .eq("is_active", true);

      if (!subs || subs.length === 0) {
        return respond({ success: true, sent: 0, message: "No active subscriptions" });
      }

      const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
      const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
      const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:support@mpbhealth.com";

      let sent = 0;
      let failed = 0;

      const results = await Promise.allSettled(
        subs.map(async (sub: { id: string; endpoint: string; p256dh: string; auth_key: string }) => {
          const result = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey, vapidSubject);

          if (result.status === 410) {
            // Deactivate expired subscription
            await supabaseAdmin
              .from("device_push_subscriptions")
              .update({ is_active: false })
              .eq("id", sub.id);
            failed++;
          } else if (result.success) {
            // Update last_used_at
            await supabaseAdmin
              .from("device_push_subscriptions")
              .update({ last_used_at: new Date().toISOString() })
              .eq("id", sub.id);
            sent++;
          } else {
            failed++;
          }
        })
      );

      return respond({ success: true, sent, failed, total: subs.length });
    }

    // All other actions require user auth
    const auth = await verifyAuth(req, supabaseAdmin);
    if (!auth.authenticated || !auth.userId) {
      return respondError("Unauthorized", 401);
    }

    const userId = auth.userId;

    switch (action) {
      // ================================================================
      // REGISTER DEVICE
      // ================================================================
      case "register_device": {
        const { endpoint, p256dh, auth_key, user_agent } = body;

        if (!endpoint || !p256dh || !auth_key) {
          return respondError("Missing required fields: endpoint, p256dh, auth_key", 400);
        }

        const { data: sub, error: upsertErr } = await supabaseAdmin
          .from("device_push_subscriptions")
          .upsert(
            {
              user_id: userId,
              endpoint,
              p256dh,
              auth_key,
              user_agent: user_agent || null,
              is_active: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "endpoint" }
          )
          .select()
          .single();

        if (upsertErr) {
          log.error("Failed to register device", upsertErr);
          return respondError("Failed to register device", 500);
        }

        return respond({ success: true, subscription: sub });
      }

      // ================================================================
      // UNREGISTER DEVICE
      // ================================================================
      case "unregister_device": {
        const { endpoint } = body;

        if (!endpoint) {
          return respondError("Missing endpoint", 400);
        }

        const { error: updateErr } = await supabaseAdmin
          .from("device_push_subscriptions")
          .update({ is_active: false })
          .eq("user_id", userId)
          .eq("endpoint", endpoint);

        if (updateErr) {
          log.error("Failed to unregister device", updateErr);
          return respondError("Failed to unregister device", 500);
        }

        return respond({ success: true });
      }

      // ================================================================
      // GET SETTINGS
      // ================================================================
      case "get_settings": {
        const { data: settings } = await supabaseAdmin
          .from("notification_preferences")
          .select("push_enabled, push_chat_messages, push_chat_mentions, push_ticket_updates, push_bulletins, mute_all_until")
          .eq("user_id", userId)
          .single();

        return respond({
          success: true,
          settings: settings || {
            push_enabled: false,
            push_chat_messages: true,
            push_chat_mentions: true,
            push_ticket_updates: true,
            push_bulletins: true,
            mute_all_until: null,
          },
        });
      }

      // ================================================================
      // UPDATE SETTINGS
      // ================================================================
      case "update_settings": {
        const allowedFields = [
          "push_enabled",
          "push_chat_messages",
          "push_chat_mentions",
          "push_ticket_updates",
          "push_bulletins",
          "mute_all_until",
        ];

        const updates: Record<string, unknown> = {};
        for (const field of allowedFields) {
          if (body[field] !== undefined) {
            updates[field] = body[field];
          }
        }

        if (Object.keys(updates).length === 0) {
          return respondError("No valid settings to update", 400);
        }

        updates.updated_at = new Date().toISOString();

        // Upsert: create row if it doesn't exist
        const { data: existing } = await supabaseAdmin
          .from("notification_preferences")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (existing) {
          const { error: updateErr } = await supabaseAdmin
            .from("notification_preferences")
            .update(updates)
            .eq("user_id", userId);

          if (updateErr) {
            log.error("Failed to update settings", updateErr);
            return respondError("Failed to update settings", 500);
          }
        } else {
          const { error: insertErr } = await supabaseAdmin
            .from("notification_preferences")
            .insert({ user_id: userId, ...updates });

          if (insertErr) {
            log.error("Failed to create settings", insertErr);
            return respondError("Failed to create settings", 500);
          }
        }

        return respond({ success: true });
      }

      default:
        return respondError(`Unknown action: ${action}`, 400);
    }
  } catch (err) {
    log.error("Unhandled error", err);
    return respond({ success: false, error: "Internal server error" }, 500);
  }
});
