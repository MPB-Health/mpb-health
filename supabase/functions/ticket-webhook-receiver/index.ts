import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("ticket-webhook-receiver");

interface TicketWebhookPayload {
  type: "ticket.created" | "ticket.updated" | "ticket.comment_added" | "ticket.resolved" | "ticket.closed";
  ticket_id: string;
  ticket_number: number;
  subject: string;
  status: string;
  priority: string;
  requester_email: string;
  assignee_email?: string;
  comment?: string;
  old_status?: string;
  new_status?: string;
}

const WEBHOOK_SECRET = Deno.env.get("ITSTS_WEBHOOK_SECRET");

function verifyWebhookSignature(req: Request): boolean {
  if (!WEBHOOK_SECRET) return true;
  const sig = req.headers.get("x-webhook-signature");
  return sig === WEBHOOK_SECRET;
}

function getNotificationTitle(payload: TicketWebhookPayload): string {
  switch (payload.type) {
    case "ticket.created":
      return `New ticket #${payload.ticket_number} created`;
    case "ticket.updated":
      return `Ticket #${payload.ticket_number} updated`;
    case "ticket.comment_added":
      return `New reply on ticket #${payload.ticket_number}`;
    case "ticket.resolved":
      return `Ticket #${payload.ticket_number} resolved`;
    case "ticket.closed":
      return `Ticket #${payload.ticket_number} closed`;
    default:
      return `Ticket #${payload.ticket_number} activity`;
  }
}

function getNotificationBody(payload: TicketWebhookPayload): string {
  switch (payload.type) {
    case "ticket.created":
      return `Your ticket "${payload.subject}" has been received.`;
    case "ticket.updated":
      return payload.old_status && payload.new_status
        ? `Status changed from ${payload.old_status} to ${payload.new_status}`
        : `"${payload.subject}" has been updated.`;
    case "ticket.comment_added":
      return payload.comment
        ? payload.comment.slice(0, 120) + (payload.comment.length > 120 ? "..." : "")
        : `A new reply has been added to "${payload.subject}"`;
    case "ticket.resolved":
      return `"${payload.subject}" has been resolved.`;
    case "ticket.closed":
      return `"${payload.subject}" has been closed.`;
    default:
      return payload.subject;
  }
}

function getNotificationPriority(payload: TicketWebhookPayload): string {
  if (payload.type === "ticket.resolved" || payload.type === "ticket.closed") return "normal";
  if (payload.priority === "urgent") return "urgent";
  if (payload.priority === "high") return "high";
  return "normal";
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!verifyWebhookSignature(req)) {
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const payload: TicketWebhookPayload = await req.json();

    if (!payload.requester_email || !payload.ticket_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    log.info("Received ticket webhook", {
      type: payload.type,
      ticket: payload.ticket_number,
      email: payload.requester_email,
    });

    // Look up user in monorepo by email
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find the user by email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = users?.users?.find((u) => u.email === payload.requester_email);

    if (!user) {
      log.info("User not found in monorepo, skipping notification", { email: payload.requester_email });
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "user_not_found" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Get user's org_id (from user_roles or org_memberships)
    const { data: orgMembership } = await supabaseAdmin
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const orgId = orgMembership?.org_id || user.id;

    // Create notification in monorepo
    const { error: notifError } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: user.id,
        org_id: orgId,
        title: getNotificationTitle(payload),
        body: getNotificationBody(payload),
        icon: "headphones",
        action_url: "/tickets",
        action_label: "View Ticket",
        priority: getNotificationPriority(payload),
        category: "support",
        channels: ["in_app"],
        delivered_via: ["in_app"],
        is_read: false,
        is_dismissed: false,
        metadata: {
          ticket_id: payload.ticket_id,
          ticket_number: payload.ticket_number,
          event_type: payload.type,
          status: payload.status,
          priority: payload.priority,
        },
      });

    if (notifError) {
      log.error("Failed to create notification", notifError);
      return new Response(
        JSON.stringify({ success: false, error: notifError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    log.info("Notification created", { user_id: user.id, type: payload.type });

    return new Response(
      JSON.stringify({ success: true, user_id: user.id }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    log.error("Webhook processing failed", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
