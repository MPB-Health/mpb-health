import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
const log = createLogger('image-proxy');

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  // SECURITY: Rate limit to prevent abuse as open proxy (100 per minute per IP)
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 100,
    windowSeconds: 60,
    keyPrefix: 'image-proxy',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get("url");

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Missing 'url' parameter" }),
        {
          status: 400,
          headers: {
            ...getCorsHeaders(req),
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
            ...getCorsHeaders(req),
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
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        }
      );
    }

    const imageBlob = await imageResponse.blob();
    const contentType = imageResponse.headers.get("Content-Type") || "image/jpeg";

    return new Response(imageBlob, {
      headers: {
        ...getCorsHeaders(req),
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    log.error("Image proxy error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error"
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
