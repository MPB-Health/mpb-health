import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get("url");

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Missing 'url' parameter" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const allowedDomains = [
      "mpb.health",
      "mympb.com",
      "pexels.com",
      "unsplash.com",
    ];

    const imageUrlObj = new URL(imageUrl);
    const isAllowed = allowedDomains.some(domain =>
      imageUrlObj.hostname.endsWith(domain)
    );

    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: "Domain not allowed" }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "MPB-Health-Image-Proxy/1.0",
      },
    });

    if (!imageResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch image: ${imageResponse.status}` }),
        {
          status: imageResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const imageBlob = await imageResponse.blob();
    const contentType = imageResponse.headers.get("Content-Type") || "image/jpeg";

    return new Response(imageBlob, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
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
