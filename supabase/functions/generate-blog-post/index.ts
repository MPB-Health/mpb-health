import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
const log = createLogger('generate-blog-post');

interface GenerateBlogRequest {
  promptId?: string;
  customPrompt?: string;
  variables: Record<string, string>;
  geminiEndpoint: string;
  saveToBlog?: boolean;
}

interface _GeminiResponse {
  content: string;
  tokensUsed: number;
  generationTime: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  // Rate limit: AI generation endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: 'generate-blog-post',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["superadmin", "admin"].includes(profile.role)) {
      throw new Error("Insufficient permissions");
    }

    const requestBody: GenerateBlogRequest = await req.json();
    const { promptId, customPrompt, variables, geminiEndpoint, saveToBlog = true } = requestBody;

    if (!geminiEndpoint) {
      throw new Error("Gemini endpoint is required");
    }

    // SECURITY: Prevent SSRF by validating geminiEndpoint against allowlist
    const ALLOWED_AI_ENDPOINTS = [
      'https://generativelanguage.googleapis.com/',
      'https://aiplatform.googleapis.com/',
    ];
    try {
      const endpointUrl = new URL(geminiEndpoint);
      if (!ALLOWED_AI_ENDPOINTS.some(allowed => geminiEndpoint.startsWith(allowed))) {
        throw new Error(`Endpoint not in allowlist: ${endpointUrl.hostname}`);
      }
    } catch (e) {
      throw new Error("Invalid or disallowed Gemini endpoint");
    }

    let finalPrompt = customPrompt || "";
    let promptRef = null;

    if (promptId) {
      const { data: promptData, error: promptError } = await supabase
        .from("gemini_prompts")
        .select("*")
        .eq("id", promptId)
        .eq("is_active", true)
        .single();

      if (promptError || !promptData) {
        throw new Error("Prompt template not found or inactive");
      }

      finalPrompt = promptData.template;
      promptRef = promptData.id;

      for (const [key, value] of Object.entries(variables)) {
        finalPrompt = finalPrompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
      }

      await supabase
        .from("gemini_prompts")
        .update({ usage_count: promptData.usage_count + 1 })
        .eq("id", promptId);
    } else if (!customPrompt) {
      throw new Error("Either promptId or customPrompt must be provided");
    }

    const startTime = Date.now();
    
    const geminiResponse = await fetch(geminiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    const generationTime = Date.now() - startTime;

    const generatedContent = geminiData.content || geminiData.text || geminiData.response || "";
    const tokensUsed = geminiData.tokens_used || geminiData.usage?.total_tokens || 0;

    const { data: logData, error: logError } = await supabase
      .from("blog_generation_logs")
      .insert({
        prompt_id: promptRef,
        prompt_used: finalPrompt,
        tokens_used: tokensUsed,
        content_generated: generatedContent,
        success: true,
        generation_time_ms: generationTime,
        metadata: {
          endpoint: geminiEndpoint,
          variables: variables,
        },
        created_by: user.id,
      })
      .select()
      .single();

    if (logError) {
      log.error("Failed to log generation:", logError);
    }

    let blogPostId = null;

    if (saveToBlog && generatedContent) {
      const title = variables.topic || "Untitled Post";
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      
      const excerpt = generatedContent
        .replace(/<[^>]*>/g, "")
        .substring(0, 200) + "...";

      const { data: blogPost, error: blogError } = await supabase
        .from("blog_articles")
        .insert({
          title: title,
          slug: `${slug}-${Date.now()}`,
          excerpt: excerpt,
          content: generatedContent,
          featured_image_url: variables.featured_image || "/assets/placeholder.jpg",
          category: variables.category || "Healthcare",
          author: variables.author || "MPB Health AI",
          is_published: false,
          gemini_generated: true,
          generation_log_id: logData?.id,
          published_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (blogError) {
        log.error("Failed to save blog post:", blogError);
      } else {
        blogPostId = blogPost?.id;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
        tokensUsed: tokensUsed,
        generationTime: generationTime,
        logId: logData?.id,
        blogPostId: blogPostId,
      }),
      {
        status: 200,
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    log.error("Blog generation error:", error);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase.from("blog_generation_logs").insert({
          prompt_used: "Error occurred before prompt execution",
          success: false,
          error_message: error instanceof Error ? error.message : "Unknown error",
        });
      } catch (logError) {
        log.error("Failed to log error:", logError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json",
        },
      }
    );
  }
});
