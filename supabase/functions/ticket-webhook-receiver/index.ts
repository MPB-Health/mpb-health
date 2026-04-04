/**
 * ticket-webhook-receiver — DISABLED
 * ────────────────────────────────────────────────────────────────────────────
 * This endpoint is intentionally disabled to eliminate duplicate notifications.
 *
 * Previously, ITSTS DB triggers called this webhook which inserted into the
 * `notifications` table (Alerts tab). But ticket-proxy already calls
 * send-ticket-notification which inserts into `notification_events` (Activity
 * tab). The same ticket event was producing entries in BOTH tables, causing
 * staff to receive 2x in-app notifications, 2x push notifications, and
 * multiple emails per event.
 *
 * All ticket notifications now flow exclusively through:
 *   ticket-proxy → send-ticket-notification → notification_events + push
 *
 * This function accepts webhooks silently (200 OK) so ITSTS callers don't
 * error out, but performs no writes.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("ticket-webhook-receiver");

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let ticketNumber: unknown = "unknown";
  let eventType: unknown = "unknown";
  try {
    const body = await req.json();
    ticketNumber = body.ticket_number;
    eventType = body.type;
  } catch {
    // Body parse failure is fine — we're not processing it
  }

  log.info("Webhook received but DISABLED — notification handled by send-ticket-notification", {
    ticket: ticketNumber,
    type: eventType,
  });

  return new Response(
    JSON.stringify({
      success: true,
      skipped: true,
      reason: "deprecated_duplicate_path",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
