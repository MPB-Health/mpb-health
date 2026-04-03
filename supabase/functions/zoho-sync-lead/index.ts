import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("zoho-sync-lead");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const { leadId } = await req.json();
    log.info("zoho-sync-lead invoked (Zoho CRM sync not configured)", { leadId });

    return new Response(
      JSON.stringify({ success: true, leadId, message: "Zoho CRM sync is not configured" }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    log.error("zoho-sync-lead error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: corsHeaders },
    );
  }
});
