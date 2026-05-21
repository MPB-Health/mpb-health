/**
 * send-ticket-notification
 * ─────────────────────────────────────────────────────────────────────────────
 * Internal edge function called (fire-and-forget) by ticket-proxy after every
 * write action. Sends:
 *
 *   1. Email notifications via Resend
 *   2. In-app notification events (notification_events table)
 *   3. Browser/PWA push notifications via push-service
 *
 * Recipients:
 *   • advisor_email  — on: created, created_for_advisor, staff_replied, status_changed
 *   • SUPPORT_TEAM_EMAIL / admin users — on: created, advisor_replied
 *
 * Auth: verified against SUPABASE_SERVICE_ROLE_KEY (server-to-server only).
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";
import { escapeHtml } from "../_shared/security.ts";
import { wrapEmailLayout, emailCta } from "../_shared/emailLayout.ts";

const log = createLogger("send-ticket-notification");

// ── Types ─────────────────────────────────────────────────────────────────────

type NotificationEvent =
  | "created"
  | "created_for_advisor"
  | "advisor_replied"
  | "staff_replied"
  | "status_changed";

interface TicketNotificationPayload {
  event: NotificationEvent;
  ticket_id: string;
  ticket_number: number;
  subject: string;
  priority?: string;
  status?: string;
  category?: string | null;
  // The advisor the ticket belongs to
  advisor_email: string;
  advisor_name: string;
  agent_id?: string | null;
  company_name?: string | null;
  // Comment text (for reply events)
  comment?: string;
  // Status/priority change details
  old_status?: string | null;
  new_status?: string | null;
  old_priority?: string | null;
  new_priority?: string | null;
  // Who triggered the action (for admin-side events)
  actor_name?: string;
}

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "🚨 Urgent",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  open: "Open",
  pending: "Pending",
  closed: "Closed",
};

// ── Email HTML builder ────────────────────────────────────────────────────────

function wrap(title: string, preheader: string, body: string, appUrl: string): string {
  return wrapEmailLayout({
    appName: "Advisor Support",
    accentColor: "#6366f1",
    heading: title,
    preheader,
    portalUrl: `${appUrl}/tickets`,
    supportEmail: "support@mpb.health",
  }, body);
}

function ticketMetaRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:5px 0;color:#6b7280;font-size:13px;width:130px;vertical-align:top;">${label}</td>
    <td style="padding:5px 0;color:#111827;font-size:13px;font-weight:500;vertical-align:top;">${value}</td>
  </tr>`;
}

function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 0;">
    <tr>
      <td style="background:linear-gradient(135deg,#3b82f6 0%,#6366f1 100%);border-radius:8px;">
        <a href="${href}" target="_blank" style="display:inline-block;padding:13px 28px;color:#fff;text-decoration:none;font-size:15px;font-weight:600;">${label}</a>
      </td>
    </tr>
  </table>`;
}

// ── Per-event email generators ─────────────────────────────────────────────────

function buildMessages(p: TicketNotificationPayload, appUrl: string, supportEmail: string): EmailMessage[] {
  const ticketUrl = `${appUrl}/tickets?tid=${p.ticket_id}`;
  const adminUrl = `${appUrl}/admin/tickets`;
  const priorityLabel = PRIORITY_LABELS[p.priority || "medium"] || escapeHtml(p.priority || "Medium");
  const statusLabel = STATUS_LABELS[p.status || "new"] || escapeHtml(p.status || "New");

  // Escape all user-supplied values before interpolating into HTML
  const safeAdvisorName = escapeHtml(p.advisor_name);
  const safeAdvisorEmail = escapeHtml(p.advisor_email);
  const safeSubject = escapeHtml(p.subject);
  const safeAgentId = p.agent_id ? escapeHtml(p.agent_id) : null;
  const safeCompanyName = p.company_name ? escapeHtml(p.company_name) : null;
  const safeActorName = p.actor_name ? escapeHtml(p.actor_name) : null;
  const safeCategory = p.category ? escapeHtml(p.category) : null;

  const agentLine = [
    safeAgentId ? `Agent ID: <strong>${safeAgentId}</strong>` : null,
    safeCompanyName ? `Company: <strong>${safeCompanyName}</strong>` : null,
  ].filter(Boolean).join(" &nbsp;·&nbsp; ");

  const advisorBlock = `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:16px 0;width:100%;">
      ${ticketMetaRow("Advisor", `${safeAdvisorName} (${safeAdvisorEmail})`)}
      ${safeAgentId ? ticketMetaRow("Agent ID", safeAgentId) : ""}
      ${safeCompanyName ? ticketMetaRow("Company", safeCompanyName) : ""}
      ${ticketMetaRow("Ticket #", `${p.ticket_number}`)}
      ${ticketMetaRow("Subject", safeSubject)}
      ${ticketMetaRow("Priority", priorityLabel)}
      ${ticketMetaRow("Status", statusLabel)}
      ${safeCategory ? ticketMetaRow("Category", safeCategory) : ""}
    </table>`;

  const messages: EmailMessage[] = [];

  switch (p.event) {
    // ── New ticket submitted by advisor ──────────────────────────────────────
    case "created": {
      // Confirmation to advisor
      messages.push({
        to: p.advisor_email,
        subject: `✅ Ticket #${p.ticket_number} received — ${p.subject}`,
        html: wrap(
          `Ticket #${p.ticket_number} Received`,
          `Your support ticket has been received and will be reviewed shortly.`,
          `<h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Your ticket has been received</h2>
           <p style="margin:0 0 20px;color:#374151;font-size:15px;">
             Hi ${escapeHtml(p.advisor_name.split(" ")[0])}, we've received your support request and will get back to you shortly.
           </p>
           <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 20px;width:100%;">
             ${ticketMetaRow("Ticket #", `${p.ticket_number}`)}
             ${ticketMetaRow("Subject", safeSubject)}
             ${ticketMetaRow("Priority", priorityLabel)}
             ${safeCategory ? ticketMetaRow("Category", safeCategory) : ""}
           </table>
           <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">
             You can track this ticket and reply directly in the Advisor Portal.
           </p>
           ${ctaButton(ticketUrl, "View Ticket #" + p.ticket_number)}`,
          appUrl,
        ),
      });

      // Staff notification is handled by ITSTS notify-staff trigger
      // (category-based routing to the correct team members).
      break;
    }

    // ── Admin created ticket on behalf of advisor ─────────────────────────────
    case "created_for_advisor": {
      messages.push({
        to: p.advisor_email,
        subject: `📋 Support ticket #${p.ticket_number} opened on your behalf`,
        html: wrap(
          `Ticket #${p.ticket_number} Created`,
          `A support ticket has been opened on your behalf.`,
          `<h2 style="margin:0 0 8px;font-size:20px;color:#111827;">A support ticket was opened for you</h2>
           <p style="margin:0 0 20px;color:#374151;font-size:15px;">
             Hi ${escapeHtml(p.advisor_name.split(" ")[0])}, our support team has opened the following ticket on your behalf.
             ${safeActorName ? `It was created by <strong>${safeActorName}</strong>.` : ""}
           </p>
           <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 20px;width:100%;">
             ${ticketMetaRow("Ticket #", `${p.ticket_number}`)}
             ${ticketMetaRow("Subject", safeSubject)}
             ${ticketMetaRow("Priority", priorityLabel)}
             ${safeCategory ? ticketMetaRow("Category", safeCategory) : ""}
           </table>
           <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">
             View the ticket in your portal and add any additional details.
           </p>
           ${ctaButton(ticketUrl, "View Ticket")}`,
          appUrl,
        ),
      });
      break;
    }

    // ── Advisor replied to their ticket ──────────────────────────────────────
    // Staff notification is handled by ITSTS comment trigger → notify-staff
    // (category-based routing with preference checks).
    case "advisor_replied":
      break;

    // ── Staff/admin replied to advisor ticket ─────────────────────────────────
    case "staff_replied": {
      const preview = p.comment
        ? escapeHtml(p.comment.slice(0, 500) + (p.comment.length > 500 ? "…" : ""))
        : "";
      messages.push({
        to: p.advisor_email,
        subject: `💬 New reply on ticket #${p.ticket_number} — ${p.subject}`,
        html: wrap(
          `New Reply — Ticket #${p.ticket_number}`,
          `Support team replied to your ticket.`,
          `<h2 style="margin:0 0 8px;font-size:20px;color:#111827;">New reply on your support ticket</h2>
           <p style="margin:0 0 20px;color:#374151;font-size:15px;">
             Hi ${escapeHtml(p.advisor_name.split(" ")[0])}, the support team has replied to your ticket.
           </p>
           <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 16px;width:100%;">
             ${ticketMetaRow("Ticket #", `${p.ticket_number}`)}
             ${ticketMetaRow("Subject", safeSubject)}
           </table>
           ${preview ? `
           <div style="margin:8px 0 20px;padding:16px;background:#f0f9ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;">
             <p style="margin:0 0 8px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Support team wrote:</p>
             <p style="margin:0;color:#1e3a5f;font-size:14px;line-height:1.6;white-space:pre-wrap;">${preview}</p>
           </div>` : ""}
           <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">
             Log in to your Advisor Portal to read the full reply and respond.
           </p>
           ${ctaButton(ticketUrl, "View & Reply in Portal")}`,
          appUrl,
        ),
      });
      break;
    }

    // ── Status or priority changed by admin ───────────────────────────────────
    case "status_changed": {
      const changeLines: string[] = [];
      if (p.old_status && p.new_status && p.old_status !== p.new_status) {
        changeLines.push(
          ticketMetaRow(
            "Status",
            `<span style="color:#6b7280;text-decoration:line-through;">${STATUS_LABELS[p.old_status] || escapeHtml(p.old_status)}</span>
             &nbsp;→&nbsp;
             <strong style="color:#111827;">${STATUS_LABELS[p.new_status] || escapeHtml(p.new_status)}</strong>`,
          ),
        );
      }
      if (p.old_priority && p.new_priority && p.old_priority !== p.new_priority) {
        changeLines.push(
          ticketMetaRow(
            "Priority",
            `<span style="color:#6b7280;text-decoration:line-through;">${PRIORITY_LABELS[p.old_priority] || escapeHtml(p.old_priority)}</span>
             &nbsp;→&nbsp;
             <strong style="color:#111827;">${PRIORITY_LABELS[p.new_priority] || escapeHtml(p.new_priority)}</strong>`,
          ),
        );
      }

      if (changeLines.length === 0) break; // Nothing meaningful changed

      messages.push({
        to: p.advisor_email,
        subject: `📌 Ticket #${p.ticket_number} updated — ${p.new_status ? STATUS_LABELS[p.new_status] || p.new_status : p.subject}`,
        html: wrap(
          `Ticket #${p.ticket_number} Updated`,
          `Your support ticket status has been updated.`,
          `<h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Your ticket has been updated</h2>
           <p style="margin:0 0 20px;color:#374151;font-size:15px;">
             Hi ${escapeHtml(p.advisor_name.split(" ")[0])}, your support ticket has been updated by our team.
           </p>
           <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 8px;width:100%;">
             ${ticketMetaRow("Ticket #", `${p.ticket_number}`)}
             ${ticketMetaRow("Subject", safeSubject)}
             ${changeLines.join("")}
           </table>
           ${p.new_status === "closed" ? `
           <div style="margin:16px 0;padding:14px 16px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;">
             <p style="margin:0;color:#166534;font-size:14px;">
               ✅ Your ticket has been closed. If you have any further questions, feel free to open a new ticket.
             </p>
           </div>` : ""}
           ${ctaButton(ticketUrl, "View Ticket")}`,
          appUrl,
        ),
      });
      break;
    }
  }

  return messages;
}

// ── Send via Resend ───────────────────────────────────────────────────────────

async function sendEmail(
  resendApiKey: string,
  fromEmail: string,
  fromName: string,
  msg: EmailMessage,
): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
      tracking: {
        open: true,
        click: true,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

// ── In-app + Push notification helpers ────────────────────────────────────────

// Default org_id for notification_events (single-org setup)
const DEFAULT_ORG_ID = "00000000-0000-4000-a000-000000000001";

interface PushTarget {
  user_id: string;
  title: string;
  body: string;
  action_url: string;
  tag: string;
  event_type: string;
  actor_name?: string;
}

/**
 * Build the list of push/in-app notification targets for a given ticket event.
 * HIPAA-safe: titles and bodies contain no PHI — only ticket number and generic text.
 */
function buildPushTargets(
  p: TicketNotificationPayload,
  advisorUserId: string | null,
  adminUserIds: string[],
): PushTarget[] {
  const targets: PushTarget[] = [];

  switch (p.event) {
    case "created": {
      // Advisor gets confirmation
      if (advisorUserId) {
        targets.push({
          user_id: advisorUserId,
          title: "Ticket received",
          body: `Ticket #${p.ticket_number} has been submitted`,
          action_url: `/tickets?tid=${p.ticket_id}`,
          tag: "mpb-ticket",
          event_type: "ticket_status_change",
          actor_name: p.advisor_name || null,
        });
      }
      // All admins get alert about new ticket
      for (const adminId of adminUserIds) {
        targets.push({
          user_id: adminId,
          title: "New support ticket",
          body: `Ticket #${p.ticket_number} submitted by an advisor`,
          action_url: "/admin/tickets",
          tag: "mpb-ticket",
          event_type: "ticket_reply",
          actor_name: p.advisor_name || null,
        });
      }
      break;
    }

    case "created_for_advisor": {
      // Advisor gets notified
      if (advisorUserId) {
        targets.push({
          user_id: advisorUserId,
          title: "Ticket opened for you",
          body: `Support ticket #${p.ticket_number} was opened on your behalf`,
          action_url: `/tickets?tid=${p.ticket_id}`,
          tag: "mpb-ticket",
          event_type: "ticket_status_change",
          actor_name: p.actor_name || "Support Team",
        });
      }
      break;
    }

    case "advisor_replied": {
      // All admins get notified
      for (const adminId of adminUserIds) {
        targets.push({
          user_id: adminId,
          title: "New ticket reply",
          body: `Advisor replied to ticket #${p.ticket_number}`,
          action_url: "/admin/tickets",
          tag: "mpb-ticket",
          event_type: "ticket_reply",
          actor_name: p.advisor_name || null,
        });
      }
      break;
    }

    case "staff_replied": {
      // Advisor gets notified
      if (advisorUserId) {
        targets.push({
          user_id: advisorUserId,
          title: "New reply on your ticket",
          body: `Support team replied to ticket #${p.ticket_number}`,
          action_url: `/tickets?tid=${p.ticket_id}`,
          tag: "mpb-ticket",
          event_type: "ticket_reply",
          actor_name: p.actor_name || "Support Team",
        });
      }
      break;
    }

    case "status_changed": {
      // Advisor gets notified
      if (advisorUserId) {
        const statusText = p.new_status ? STATUS_LABELS[p.new_status] || p.new_status : "updated";
        targets.push({
          user_id: advisorUserId,
          title: "Ticket updated",
          body: `Ticket #${p.ticket_number} is now ${statusText}`,
          action_url: `/tickets?tid=${p.ticket_id}`,
          tag: "mpb-ticket",
          event_type: "ticket_status_change",
          actor_name: p.actor_name || "Support Team",
        });
      }
      break;
    }
  }

  return targets;
}

/**
 * Look up the main-project auth user_id for an email address.
 * advisor_profiles.id = auth.users.id and has email column.
 */
async function getUserIdByEmail(
  supabaseAdmin: ReturnType<typeof createClient>,
  email: string,
): Promise<string | null> {
  // advisor_profiles has (id, email) where id references auth.users
  const { data: ap } = await supabaseAdmin
    .from("advisor_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (ap?.id) return ap.id;

  // Fallback: admin_users table for staff lookups
  const { data: au } = await supabaseAdmin
    .from("admin_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  return au?.id || null;
}

/**
 * Get all admin user auth IDs for staff-facing notifications.
 */
async function getAdminUserIds(
  supabaseAdmin: ReturnType<typeof createClient>,
): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .in("role", ["admin", "super_admin"]);
  return (data || []).map((r: { user_id: string }) => r.user_id);
}

/**
 * Check if a user has push_ticket_updates enabled.
 * Returns true by default if no settings row exists (opt-out model).
 */
async function isPushEnabledForTickets(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("notification_settings")
    .select("push_enabled, push_ticket_updates")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return true; // Default: enabled
  return data.push_enabled !== false && data.push_ticket_updates !== false;
}

/**
 * Deduplication window — ignore a notification_events insert if an identical
 * (user_id + source_id + event_type) row was created within this many seconds.
 * Prevents duplicates from ticket-proxy retries or overlapping ITSTS triggers.
 */
const DEDUP_WINDOW_SECONDS = 120;

/**
 * Create in-app notification event and trigger browser/PWA push for a target user.
 * Includes a deduplication check to prevent the same ticket event from producing
 * multiple notifications within a short window.
 */
async function sendInAppAndPush(
  supabaseAdmin: ReturnType<typeof createClient>,
  target: PushTarget,
  ticketId: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<boolean> {
  // 1. Deduplication: skip if an identical notification was recently created
  const cutoff = new Date(Date.now() - DEDUP_WINDOW_SECONDS * 1000).toISOString();
  const { data: existing } = await supabaseAdmin
    .from("notification_events")
    .select("id")
    .eq("user_id", target.user_id)
    .eq("source_id", ticketId)
    .eq("event_type", target.event_type)
    .gte("created_at", cutoff)
    .limit(1);

  if (existing && existing.length > 0) {
    log.info("Dedup: skipping duplicate notification", {
      userId: target.user_id,
      ticketId,
      eventType: target.event_type,
      existingId: existing[0].id,
    });
    return false;
  }

  // 2. Check user's notification preferences
  const pushEnabled = await isPushEnabledForTickets(supabaseAdmin, target.user_id);

  // 3. Insert in-app notification event (always — respects in-app bell icon)
  const { error: eventErr } = await supabaseAdmin
    .from("notification_events")
    .insert({
      user_id: target.user_id,
      org_id: DEFAULT_ORG_ID,
      event_type: target.event_type,
      title: target.title,
      body: target.body,
      action_url: target.action_url,
      source_type: "ticket",
      source_id: ticketId,
      actor_name: target.actor_name || null,
      metadata: { tag: target.tag },
    });

  if (eventErr) {
    log.error("Failed to create notification event", { userId: target.user_id, error: eventErr.message });
    return false;
  }

  // 4. Trigger push notification if user has it enabled
  if (pushEnabled) {
    fetch(`${supabaseUrl}/functions/v1/push-service`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        action: "send_push",
        user_id: target.user_id,
        title: target.title,
        body: target.body,
        action_url: target.action_url,
        tag: target.tag,
      }),
    }).catch((err) => {
      log.error("Push notification call failed", { userId: target.user_id, error: String(err) });
    });
  }

  return true;
}

// ── Constant-time string comparison ───────────────────────────────────────────

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify this is an internal call — must supply the service role key as Bearer
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const expectedKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const provided = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  if (!expectedKey || !timingSafeEqual(provided, expectedKey)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseAdmin = createClient(supabaseUrl, expectedKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const APP_URL = Deno.env.get("APP_URL") || "https://advisor.mpb.health";
  const SUPPORT_TEAM_EMAIL = Deno.env.get("SUPPORT_TEAM_EMAIL") || "support@mpb.health";
  const FROM_EMAIL = Deno.env.get("TICKET_FROM_EMAIL") || "noreply@mpb.health";
  const FROM_NAME = Deno.env.get("TICKET_FROM_NAME") || "MPB Health Support";

  try {
    const payload: TicketNotificationPayload = await req.json();

    if (!payload.event || !payload.advisor_email || !payload.ticket_number) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: event, advisor_email, ticket_number" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    log.info("Sending ticket notification", {
      event: payload.event,
      ticket: payload.ticket_number,
      advisor: payload.advisor_email,
    });

    // ── 1. Email notifications ────────────────────────────────────────────────
    // Only send email for events initiated by ITSTS (staff actions directed at
    // advisors). Ticket creation confirmations are handled by ITSTS directly,
    // so "created" and "created_for_advisor" do NOT trigger email here.
    const EMAILABLE_EVENTS: NotificationEvent[] = ["staff_replied", "status_changed"];
    let emailSent = 0;
    let emailFailed = 0;

    if (RESEND_API_KEY && EMAILABLE_EVENTS.includes(payload.event)) {
      const messages = buildMessages(payload, APP_URL, SUPPORT_TEAM_EMAIL);
      for (const msg of messages) {
        try {
          await sendEmail(RESEND_API_KEY, FROM_EMAIL, FROM_NAME, msg);
          emailSent++;
        } catch (emailErr) {
          emailFailed++;
          log.error("Failed to send email", { to: msg.to, error: String(emailErr) });
        }
      }
    } else if (!RESEND_API_KEY && EMAILABLE_EVENTS.includes(payload.event)) {
      log.warn("RESEND_API_KEY not set — email skipped for event", { event: payload.event });
    }

    // ── 2. In-app + Push notifications ───────────────────────────────────────
    let pushSent = 0;

    try {
      // Resolve advisor user_id
      const advisorUserId = await getUserIdByEmail(supabaseAdmin, payload.advisor_email);

      // Resolve admin user_ids for staff-facing events
      const staffEvents: NotificationEvent[] = ["created", "advisor_replied"];
      const adminUserIds = staffEvents.includes(payload.event)
        ? await getAdminUserIds(supabaseAdmin)
        : [];

      const targets = buildPushTargets(payload, advisorUserId, adminUserIds);

      // Fire all push + in-app notifications concurrently (with dedup)
      const results = await Promise.allSettled(
        targets.map((target) =>
          sendInAppAndPush(supabaseAdmin, target, payload.ticket_id, supabaseUrl, expectedKey!)
        ),
      );

      const actualSent = results.filter(
        (r) => r.status === "fulfilled" && r.value === true,
      ).length;
      const deduped = results.filter(
        (r) => r.status === "fulfilled" && r.value === false,
      ).length;
      pushSent = actualSent;

      log.info("In-app + push notifications sent", {
        targets: targets.length,
        sent: actualSent,
        deduplicated: deduped,
        advisorResolved: !!advisorUserId,
        adminCount: adminUserIds.length,
      });
    } catch (pushErr) {
      // Push failures should never block the response
      log.error("In-app/push notification error", pushErr);
    }

    log.info("Notification complete", {
      emailSent,
      emailFailed,
      pushTargets: pushSent,
    });

    return new Response(
      JSON.stringify({ success: true, emailSent, emailFailed, pushTargets: pushSent }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    log.error("Notification handler error", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
