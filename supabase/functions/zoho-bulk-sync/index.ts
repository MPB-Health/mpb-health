import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("zoho-bulk-sync");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const { leadIds } = await req.json();
    log.info("zoho-bulk-sync invoked (Zoho CRM sync not configured)", { count: leadIds?.length });

    return new Response(
      JSON.stringify({ success: true, synced: 0, failed: 0, errors: [], message: "Zoho CRM sync is not configured" }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    log.error("zoho-bulk-sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: corsHeaders },
    );
  }
});
