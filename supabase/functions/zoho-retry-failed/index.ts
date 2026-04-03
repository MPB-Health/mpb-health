import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("zoho-retry-failed");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    log.info("zoho-retry-failed invoked (Zoho CRM sync not configured)");

    return new Response(
      JSON.stringify({ success: true, synced: 0, failed: 0, message: "Zoho CRM sync is not configured" }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    log.error("zoho-retry-failed error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: corsHeaders },
    );
  }
});
