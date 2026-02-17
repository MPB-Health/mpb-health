import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from '../_shared/logger.ts';
const log = createLogger('trigger-n8n-webhook');

interface WebhookPayload {
  eventType: string;
  webhookUrl: string;
  data: Record<string, any>;
  retryConfig?: {
    maxRetries?: number;
    retryDelay?: number;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const N8N_WEBHOOK_SECRET = Deno.env.get("N8N_WEBHOOK_SECRET");

    // ========================================================================
    // Authentication: require either a valid Supabase user JWT or an API key.
    //
    // - Browser clients send the Supabase access_token as a Bearer token.
    //   We verify it by calling supabase.auth.getUser() with the token.
    // - Server-to-server callers can send "Bearer <N8N_WEBHOOK_SECRET>" or
    //   pass it as an "x-webhook-secret" header.
    // ========================================================================

    const authHeader = req.headers.get("Authorization") ?? "";
    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";
    const webhookSecretHeader = req.headers.get("x-webhook-secret") ?? "";

    let authenticated = false;

    // Path 1: Server-to-server API key via x-webhook-secret header
    if (N8N_WEBHOOK_SECRET && webhookSecretHeader) {
      if (webhookSecretHeader === N8N_WEBHOOK_SECRET) {
        authenticated = true;
      } else {
        log.warn("Invalid x-webhook-secret");
      }
    }

    // Path 2: Server-to-server API key as Bearer token
    if (!authenticated && N8N_WEBHOOK_SECRET && bearerToken === N8N_WEBHOOK_SECRET) {
      authenticated = true;
    }

    // Path 3: Supabase user JWT (browser clients)
    if (!authenticated && bearerToken) {
      const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(bearerToken);
      if (authError || !user) {
        log.warn("Invalid Supabase JWT:", authError?.message);
      } else {
        authenticated = true;
      }
    }

    if (!authenticated) {
      log.error("Unauthorized request rejected");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: corsHeaders },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody: WebhookPayload = await req.json();
    const { eventType, webhookUrl, data, retryConfig } = requestBody;

    if (!eventType || !webhookUrl || !data) {
      throw new Error("Missing required fields: eventType, webhookUrl, or data");
    }

    const maxRetries = retryConfig?.maxRetries || 3;
    const retryDelay = retryConfig?.retryDelay || 1000;

    let lastError: Error | null = null;
    let responseStatus = 0;
    let responseBody = "";
    let success = false;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Event-Type": eventType,
            "X-Source": "mpb-health-supabase",
          },
          body: JSON.stringify({
            event: eventType,
            timestamp: new Date().toISOString(),
            data: data,
          }),
        });

        responseStatus = webhookResponse.status;
        responseBody = await webhookResponse.text();

        if (webhookResponse.ok) {
          success = true;
          break;
        } else {
          lastError = new Error(`Webhook returned ${responseStatus}: ${responseBody}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        log.error(`Webhook attempt ${attempt + 1} failed:`, lastError);
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }

    await supabase.from("webhook_delivery_logs").insert({
      webhook_url: webhookUrl,
      event_type: eventType,
      payload: data,
      response_status: responseStatus,
      response_body: responseBody.substring(0, 1000),
      success: success,
      retry_count: success ? 0 : maxRetries,
      error_message: lastError ? lastError.message : null,
    });

    if (!success) {
      throw lastError || new Error("Webhook delivery failed");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook delivered successfully",
        responseStatus: responseStatus,
        responseBody: responseBody,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    log.error("Webhook trigger error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});
