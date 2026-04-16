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

const log = createLogger("notification-service");

type NotificationAction =
  | "list"
  | "mark_read"
  | "mark_all_read"
  | "get_unread_count"
  | "create_event"
  | "ping";

const RATE_LIMIT = { maxRequests: 60, windowSeconds: 60, keyPrefix: "notif" };

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  const correlationId =
    req.headers.get("x-request-id") ||
    `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

    const action = body.action as NotificationAction;

    if (action === "ping") {
      return respond({ success: true, message: "pong" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // create_event can be called with service role key (server-to-server)
    if (action === "create_event") {
      const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
      const isServiceRole = authHeader === supabaseServiceKey;

      if (!isServiceRole) {
        // Also allow authenticated users for self-events
        const auth = await verifyAuth(req, supabaseAdmin);
        if (!auth.authenticated) {
          return respondError("Unauthorized", 401);
        }
      }

      const { user_id, org_id, event_type, title, body: eventBody, action_url, source_type, source_id, actor_id, metadata } = body;

      if (!user_id || !org_id || !event_type || !title) {
        return respondError("Missing required fields: user_id, org_id, event_type, title", 400);
      }

      const { data: event, error: insertErr } = await supabaseAdmin
        .from("notification_events")
        .insert({
          user_id,
          org_id,
          event_type,
          title,
          body: eventBody || null,
          action_url: action_url || null,
          source_type: source_type || null,
          source_id: source_id || null,
          actor_id: actor_id || null,
          metadata: metadata || {},
        })
        .select()
        .single();

      if (insertErr) {
        log.error("Failed to create notification event", insertErr);
        return respondError("Failed to create event", 500);
      }

      return respond({ success: true, event });
    }

    // All other actions require user auth
    const auth = await verifyAuth(req, supabaseAdmin);
    if (!auth.authenticated || !auth.userId) {
      return respondError("Unauthorized", 401);
    }

    const userId = auth.userId;

    switch (action) {
      // ================================================================
      // LIST
      // ================================================================
      case "list": {
        const { limit = 30, offset = 0, event_type, unread_only = false } = body;

        let query = supabaseAdmin
          .from("notification_events")
          .select("id, user_id, event_type, title, message, data, is_read, read_at, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .range(offset, offset + Math.min(limit, 100) - 1);

        if (event_type) {
          query = query.eq("event_type", event_type);
        }

        if (unread_only) {
          query = query.eq("is_read", false);
        }

        const { data: events, error: listErr } = await query;

        if (listErr) {
          log.error("Failed to list events", listErr);
          return respondError("Failed to list events", 500);
        }

        // Enrich actor names
        const actorIds = [...new Set((events || []).filter((e: { actor_id: string | null }) => e.actor_id).map((e: { actor_id: string }) => e.actor_id))];
        let actorMap = new Map<string, string>();

        if (actorIds.length > 0) {
          const { data: profiles } = await supabaseAdmin
            .from("advisor_profiles")
            .select("id, first_name, last_name")
            .in("id", actorIds);

          actorMap = new Map(
            (profiles || []).map((p: { id: string; first_name: string; last_name: string }) => [
              p.id,
              `${p.first_name} ${p.last_name}`.trim(),
            ])
          );
        }

        const enriched = (events || []).map((e: Record<string, unknown>) => ({
          ...e,
          actor_name: e.actor_id ? actorMap.get(e.actor_id as string) || "Unknown" : null,
        }));

        return respond({ success: true, events: enriched });
      }

      // ================================================================
      // MARK READ
      // ================================================================
      case "mark_read": {
        const { event_ids } = body;

        if (!event_ids || !Array.isArray(event_ids) || event_ids.length === 0) {
          return respondError("event_ids array required", 400);
        }

        if (!event_ids.every((id: unknown) => typeof id === "string" && isValidUUID(id as string))) {
          return respondError("Invalid event_ids", 400);
        }

        const { error: updateErr } = await supabaseAdmin
          .from("notification_events")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in("id", event_ids)
          .eq("user_id", userId);

        if (updateErr) {
          log.error("Failed to mark events as read", updateErr);
          return respondError("Failed to mark as read", 500);
        }

        return respond({ success: true });
      }

      // ================================================================
      // MARK ALL READ
      // ================================================================
      case "mark_all_read": {
        const { error: updateErr } = await supabaseAdmin
          .from("notification_events")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("is_read", false);

        if (updateErr) {
          log.error("Failed to mark all as read", updateErr);
          return respondError("Failed to mark all as read", 500);
        }

        return respond({ success: true });
      }

      // ================================================================
      // GET UNREAD COUNT
      // ================================================================
      case "get_unread_count": {
        const { data: count, error: countErr } = await supabaseAdmin
          .rpc("get_notification_events_unread_count", { p_user_id: userId });

        if (countErr) {
          log.error("Failed to get unread count", countErr);
          return respondError("Failed to get count", 500);
        }

        return respond({ success: true, unread_count: count || 0 });
      }

      default:
        return respondError(`Unknown action: ${action}`, 400);
    }
  } catch (err) {
    log.error("Unhandled error", err);
    return respond({ success: false, error: "Internal server error" }, 500);
  }
});
