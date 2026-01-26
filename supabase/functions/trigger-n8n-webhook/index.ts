import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
        console.error(`Webhook attempt ${attempt + 1} failed:`, lastError);
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
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Webhook trigger error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
