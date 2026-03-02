/**
 * send-ticket-notification
 * ─────────────────────────────────────────────────────────────────────────────
 * Internal edge function called (fire-and-forget) by ticket-proxy after every
 * write action. Sends branded notification emails via Resend to:
 *
 *   • advisor_email  — on: created, created_for_advisor, staff_replied, status_changed
 *   • SUPPORT_TEAM_EMAIL — on: created, advisor_replied
 *
 * Auth: verified against SUPABASE_SERVICE_ROLE_KEY (server-to-server only).
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createLogger } from "../_shared/logger.ts";

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
  resolved: "Resolved",
  closed: "Closed",
};

// ── Email HTML builder ────────────────────────────────────────────────────────

function wrap(title: string, preheader: string, body: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f3f4f6;">
  <!-- preheader -->
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#3b82f6 0%,#6366f1 100%);padding:28px 40px;text-align:center;">
              <img src="${appUrl}/mpb-logo-white.png" alt="MPB Health" width="120" style="max-width:120px;height:auto;display:block;margin:0 auto 10px;" onerror="this.style.display='none'" />
              <p style="color:rgba(255,255,255,.85);margin:0;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;font-weight:600;">
                MPB Health · Advisor Support
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:22px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="color:#6b7280;margin:0 0 6px;font-size:12px;">
                MPB Health · Advisor Support System
              </p>
              <p style="color:#9ca3af;margin:0;font-size:11px;">
                <a href="${appUrl}/tickets" style="color:#6b7280;text-decoration:underline;">Advisor Portal</a>
                &nbsp;&bull;&nbsp;
                <a href="${appUrl}/settings?tab=notifications" style="color:#6b7280;text-decoration:underline;">Notification preferences</a>
              </p>
              <p style="color:#d1d5db;margin:14px 0 0;font-size:11px;">
                &copy; ${new Date().getFullYear()} MPB Health. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
  const ticketUrl = `${appUrl}/tickets`;
  const adminUrl = `${appUrl}/admin/tickets`;
  const priorityLabel = PRIORITY_LABELS[p.priority || "medium"] || p.priority || "Medium";
  const statusLabel = STATUS_LABELS[p.status || "new"] || p.status || "New";

  const agentLine = [
    p.agent_id ? `Agent ID: <strong>${p.agent_id}</strong>` : null,
    p.company_name ? `Company: <strong>${p.company_name}</strong>` : null,
  ].filter(Boolean).join(" &nbsp;·&nbsp; ");

  const advisorBlock = `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:16px 0;width:100%;">
      ${ticketMetaRow("Advisor", `${p.advisor_name} (${p.advisor_email})`)}
      ${p.agent_id ? ticketMetaRow("Agent ID", p.agent_id) : ""}
      ${p.company_name ? ticketMetaRow("Company", p.company_name) : ""}
      ${ticketMetaRow("Ticket #", `${p.ticket_number}`)}
      ${ticketMetaRow("Subject", p.subject)}
      ${ticketMetaRow("Priority", priorityLabel)}
      ${ticketMetaRow("Status", statusLabel)}
      ${p.category ? ticketMetaRow("Category", p.category) : ""}
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
             Hi ${p.advisor_name.split(" ")[0]}, we've received your support request and will get back to you shortly.
           </p>
           <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 20px;width:100%;">
             ${ticketMetaRow("Ticket #", `${p.ticket_number}`)}
             ${ticketMetaRow("Subject", p.subject)}
             ${ticketMetaRow("Priority", priorityLabel)}
             ${p.category ? ticketMetaRow("Category", p.category) : ""}
           </table>
           <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">
             You can track this ticket and reply directly in the Advisor Portal.
           </p>
           ${ctaButton(ticketUrl, "View My Tickets")}`,
          appUrl,
        ),
      });

      // Alert to support team
      messages.push({
        to: supportEmail,
        subject: `🎫 New Ticket #${p.ticket_number} — ${p.subject} [${priorityLabel}]`,
        html: wrap(
          `New Ticket #${p.ticket_number}`,
          `New support ticket submitted by ${p.advisor_name}`,
          `<h2 style="margin:0 0 8px;font-size:20px;color:#111827;">New support ticket submitted</h2>
           <p style="margin:0 0 20px;color:#374151;font-size:15px;">
             A new ticket has been submitted via the Advisor Portal.
           </p>
           ${advisorBlock}
           ${ctaButton(adminUrl, "Open in Ticket Management")}`,
          appUrl,
        ),
      });
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
             Hi ${p.advisor_name.split(" ")[0]}, our support team has opened the following ticket on your behalf.
             ${p.actor_name ? `It was created by <strong>${p.actor_name}</strong>.` : ""}
           </p>
           <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 20px;width:100%;">
             ${ticketMetaRow("Ticket #", `${p.ticket_number}`)}
             ${ticketMetaRow("Subject", p.subject)}
             ${ticketMetaRow("Priority", priorityLabel)}
             ${p.category ? ticketMetaRow("Category", p.category) : ""}
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

    // ── Advisor replied to their ticket (alert support team) ─────────────────
    case "advisor_replied": {
      const preview = p.comment
        ? p.comment.slice(0, 300) + (p.comment.length > 300 ? "…" : "")
        : "";
      messages.push({
        to: supportEmail,
        subject: `💬 Advisor replied — Ticket #${p.ticket_number}: ${p.subject}`,
        html: wrap(
          `Advisor Reply — Ticket #${p.ticket_number}`,
          `${p.advisor_name} replied to ticket #${p.ticket_number}`,
          `<h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Advisor replied to a ticket</h2>
           <p style="margin:0 0 20px;color:#374151;font-size:15px;">
             ${p.advisor_name} has added a reply to their support ticket.
             ${agentLine ? `<br/><span style="color:#6b7280;font-size:13px;">${agentLine}</span>` : ""}
           </p>
           ${advisorBlock}
           ${preview ? `
           <div style="margin:16px 0;padding:16px;background:#f9fafb;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;">
             <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;white-space:pre-wrap;">${preview}</p>
           </div>` : ""}
           ${ctaButton(adminUrl, "Reply in Ticket Management")}`,
          appUrl,
        ),
      });
      break;
    }

    // ── Staff/admin replied to advisor ticket ─────────────────────────────────
    case "staff_replied": {
      const preview = p.comment
        ? p.comment.slice(0, 500) + (p.comment.length > 500 ? "…" : "")
        : "";
      messages.push({
        to: p.advisor_email,
        subject: `💬 New reply on ticket #${p.ticket_number} — ${p.subject}`,
        html: wrap(
          `New Reply — Ticket #${p.ticket_number}`,
          `Support team replied to your ticket.`,
          `<h2 style="margin:0 0 8px;font-size:20px;color:#111827;">New reply on your support ticket</h2>
           <p style="margin:0 0 20px;color:#374151;font-size:15px;">
             Hi ${p.advisor_name.split(" ")[0]}, the support team has replied to your ticket.
           </p>
           <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 16px;width:100%;">
             ${ticketMetaRow("Ticket #", `${p.ticket_number}`)}
             ${ticketMetaRow("Subject", p.subject)}
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
            `<span style="color:#6b7280;text-decoration:line-through;">${STATUS_LABELS[p.old_status] || p.old_status}</span>
             &nbsp;→&nbsp;
             <strong style="color:#111827;">${STATUS_LABELS[p.new_status] || p.new_status}</strong>`,
          ),
        );
      }
      if (p.old_priority && p.new_priority && p.old_priority !== p.new_priority) {
        changeLines.push(
          ticketMetaRow(
            "Priority",
            `<span style="color:#6b7280;text-decoration:line-through;">${PRIORITY_LABELS[p.old_priority] || p.old_priority}</span>
             &nbsp;→&nbsp;
             <strong style="color:#111827;">${PRIORITY_LABELS[p.new_priority] || p.new_priority}</strong>`,
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
             Hi ${p.advisor_name.split(" ")[0]}, your support ticket has been updated by our team.
           </p>
           <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 8px;width:100%;">
             ${ticketMetaRow("Ticket #", `${p.ticket_number}`)}
             ${ticketMetaRow("Subject", p.subject)}
             ${changeLines.join("")}
           </table>
           ${p.new_status === "resolved" ? `
           <div style="margin:16px 0;padding:14px 16px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;">
             <p style="margin:0;color:#166534;font-size:14px;">
               ✅ Your ticket has been resolved. If you have any further questions, feel free to open a new ticket.
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
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify this is an internal call — must supply the service role key as Bearer
  const expectedKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const provided = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  if (!expectedKey || provided !== expectedKey) {
    return new Response("Unauthorized", { status: 401 });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    log.warn("RESEND_API_KEY not configured — skipping notification");
    return new Response(JSON.stringify({ skipped: true, reason: "no_resend_key" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

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

    const messages = buildMessages(payload, APP_URL, SUPPORT_TEAM_EMAIL);
    const results = await Promise.allSettled(
      messages.map((msg) => sendEmail(RESEND_API_KEY, FROM_EMAIL, FROM_NAME, msg)),
    );

    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => r.reason?.message || String(r.reason));

    if (errors.length > 0) {
      log.error("Some emails failed", { errors, event: payload.event });
    }

    log.info("Notification complete", {
      sent: results.filter((r) => r.status === "fulfilled").length,
      failed: errors.length,
    });

    return new Response(
      JSON.stringify({ success: true, sent: messages.length - errors.length, failed: errors.length }),
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
