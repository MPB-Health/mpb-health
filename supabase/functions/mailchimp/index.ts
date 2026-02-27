import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier } from '../_shared/security.ts';
const log = createLogger('mailchimp');

const MAILCHIMP_API_KEY = Deno.env.get("MAILCHIMP_API_KEY");
const MAILCHIMP_AUDIENCE_ID = Deno.env.get("MAILCHIMP_AUDIENCE_ID");
const MAILCHIMP_SERVER_PREFIX = Deno.env.get("MAILCHIMP_SERVER_PREFIX");

interface SubscriberRequest {
  email: string;
  status?: "subscribed" | "unsubscribed" | "cleaned" | "pending";
  firstName?: string;
  lastName?: string;
  tags?: string[];
  mergeFields?: Record<string, string>;
}

interface TagUpdateRequest {
  email: string;
  tags: string[];
  action: "add" | "remove";
}

interface MailchimpResponse {
  success: boolean;
  id?: string;
  error?: string;
  statusCode?: number;
}

function getMailchimpUrl(endpoint: string = ""): string {
  if (!MAILCHIMP_SERVER_PREFIX) {
    throw new Error("Mailchimp server prefix not configured");
  }
  const baseUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`;
  return `${baseUrl}${endpoint}`;
}

function getAuthHeader(): string {
  if (!MAILCHIMP_API_KEY) {
    throw new Error("Mailchimp API key not configured");
  }
  return `Basic ${btoa(`anystring:${MAILCHIMP_API_KEY}`)}`;
}

async function generateEmailHash(email: string): Promise<string> {
  const normalized = email.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  
  // Use Web Crypto API for MD5-like hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const _hashArray = Array.from(new Uint8Array(hashBuffer));
  // Mailchimp uses MD5, but we'll use first 32 chars of SHA-256 hex as a workaround
  // Actually, let's implement a proper MD5 for Mailchimp compatibility
  return md5(normalized);
}

// Simple MD5 implementation for Mailchimp email hash
function md5(string: string): string {
  function rotateLeft(value: number, shift: number): number {
    return (value << shift) | (value >>> (32 - shift));
  }

  function addUnsigned(x: number, y: number): number {
    const x8 = x & 0x80000000;
    const y8 = y & 0x80000000;
    const x4 = x & 0x40000000;
    const y4 = y & 0x40000000;
    const result = (x & 0x3fffffff) + (y & 0x3fffffff);
    if (x4 & y4) return result ^ 0x80000000 ^ x8 ^ y8;
    if (x4 | y4) {
      if (result & 0x40000000) return result ^ 0xc0000000 ^ x8 ^ y8;
      else return result ^ 0x40000000 ^ x8 ^ y8;
    } else {
      return result ^ x8 ^ y8;
    }
  }

  function f(x: number, y: number, z: number): number { return (x & y) | (~x & z); }
  function g(x: number, y: number, z: number): number { return (x & z) | (y & ~z); }
  function h(x: number, y: number, z: number): number { return x ^ y ^ z; }
  function i(x: number, y: number, z: number): number { return y ^ (x | ~z); }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function gg(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function hh(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function ii(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(string: string): number[] {
    const messageLength = string.length;
    const numberOfWordsTemp1 = messageLength + 8;
    const numberOfWordsTemp2 = (numberOfWordsTemp1 - (numberOfWordsTemp1 % 64)) / 64;
    const numberOfWords = (numberOfWordsTemp2 + 1) * 16;
    const wordArray: number[] = new Array(numberOfWords - 1);
    let wordCount = 0;
    let byteCount = 0;
    while (byteCount < messageLength) {
      wordCount = (byteCount - (byteCount % 4)) / 4;
      const bytePosition = (byteCount % 4) * 8;
      wordArray[wordCount] = wordArray[wordCount] | (string.charCodeAt(byteCount) << bytePosition);
      byteCount++;
    }
    wordCount = (byteCount - (byteCount % 4)) / 4;
    const bytePosition = (byteCount % 4) * 8;
    wordArray[wordCount] = wordArray[wordCount] | (0x80 << bytePosition);
    wordArray[numberOfWords - 2] = messageLength << 3;
    wordArray[numberOfWords - 1] = messageLength >>> 29;
    return wordArray;
  }

  function wordToHex(value: number): string {
    let hex = "";
    for (let count = 0; count <= 3; count++) {
      const byte = (value >>> (count * 8)) & 255;
      const hexByte = "0" + byte.toString(16);
      hex = hex + hexByte.substr(hexByte.length - 2, 2);
    }
    return hex;
  }

  const x = convertToWordArray(string);
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = ff(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = ff(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = ff(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = ff(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = ff(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = ff(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = ff(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = ff(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = ff(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = ff(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = ff(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = ff(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = ff(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = ff(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = ff(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = ff(b, c, d, a, x[k + 15], S14, 0x49b40821);
    a = gg(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = gg(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = gg(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = gg(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = gg(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = gg(d, a, b, c, x[k + 10], S22, 0x02441453);
    c = gg(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = gg(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = gg(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = gg(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = gg(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = gg(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = gg(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = gg(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = gg(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = gg(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
    a = hh(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = hh(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = hh(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = hh(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = hh(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = hh(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = hh(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = hh(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = hh(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = hh(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = hh(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = hh(b, c, d, a, x[k + 6], S34, 0x04881d05);
    a = hh(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = hh(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = hh(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = hh(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
    a = ii(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = ii(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = ii(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = ii(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = ii(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = ii(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = ii(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = ii(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = ii(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = ii(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = ii(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = ii(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = ii(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = ii(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = ii(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = ii(b, c, d, a, x[k + 9], S44, 0xeb86d391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

async function addSubscriber(data: SubscriberRequest): Promise<MailchimpResponse> {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID) {
    return {
      success: false,
      error: "Mailchimp not configured",
    };
  }

  try {
    const emailHash = await generateEmailHash(data.email);
    const url = getMailchimpUrl(`/lists/${MAILCHIMP_AUDIENCE_ID}/members/${emailHash}`);

    const payload: Record<string, unknown> = {
      email_address: data.email,
      status: data.status || "subscribed",
    };

    if (data.firstName || data.lastName) {
      payload.merge_fields = {
        FNAME: data.firstName || "",
        LNAME: data.lastName || "",
        ...data.mergeFields,
      };
    }

    if (data.tags && data.tags.length > 0) {
      payload.tags = data.tags;
    }

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      log.error("Mailchimp API error:", errorData);

      if (response.status === 400 && errorData.title === "Member Exists") {
        return {
          success: true,
          id: errorData.id,
          error: "Already subscribed",
        };
      }

      return {
        success: false,
        error: errorData.detail || errorData.title || "Failed to add subscriber",
        statusCode: response.status,
      };
    }

    const result = await response.json();
    return {
      success: true,
      id: result.id,
    };
  } catch (error) {
    log.error("Mailchimp subscription error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function unsubscribe(email: string): Promise<MailchimpResponse> {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID) {
    return {
      success: false,
      error: "Mailchimp not configured",
    };
  }

  try {
    const emailHash = await generateEmailHash(email);
    const url = getMailchimpUrl(`/lists/${MAILCHIMP_AUDIENCE_ID}/members/${emailHash}`);

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "unsubscribed",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      log.error("Mailchimp API error:", errorData);
      return {
        success: false,
        error: errorData.detail || errorData.title || "Failed to unsubscribe",
        statusCode: response.status,
      };
    }

    const result = await response.json();
    return {
      success: true,
      id: result.id,
    };
  } catch (error) {
      log.error("Mailchimp unsubscribe error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function updateTags(data: TagUpdateRequest): Promise<MailchimpResponse> {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID) {
    return {
      success: false,
      error: "Mailchimp not configured",
    };
  }

  try {
    const emailHash = await generateEmailHash(data.email);
    const url = getMailchimpUrl(`/lists/${MAILCHIMP_AUDIENCE_ID}/members/${emailHash}/tags`);

    const payload = {
      tags: data.tags.map((tag) => ({
        name: tag,
        status: data.action === "add" ? "active" : "inactive",
      })),
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      log.error("Mailchimp tag update error:", errorData);
      return {
        success: false,
        error: errorData.detail || errorData.title || "Failed to update tags",
        statusCode: response.status,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    log.error("Mailchimp tag update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function getSubscriberInfo(email: string): Promise<{ success: boolean; subscriber?: unknown; error?: string }> {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID) {
    return {
      success: false,
      error: "Mailchimp not configured",
    };
  }

  try {
    const emailHash = await generateEmailHash(email);
    const url = getMailchimpUrl(`/lists/${MAILCHIMP_AUDIENCE_ID}/members/${emailHash}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: "Subscriber not found",
        };
      }
      return {
        success: false,
        error: `Failed to get subscriber: ${response.status}`,
      };
    }

    const subscriber = await response.json();
    return {
      success: true,
      subscriber,
    };
  } catch (error) {
    log.error("Error fetching subscriber info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  // Rate limit: integration proxy endpoint
  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 60,
    windowSeconds: 60,
    keyPrefix: 'mailchimp',
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Check configuration
    if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID || !MAILCHIMP_SERVER_PREFIX) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Mailchimp is not configured. Please set MAILCHIMP_API_KEY, MAILCHIMP_AUDIENCE_ID, and MAILCHIMP_SERVER_PREFIX secrets.",
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

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // POST actions
    if (req.method === "POST") {
      const body = await req.json();

      if (action === "subscribe") {
        const result = await addSubscriber(body);
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        });
      }

      if (action === "unsubscribe") {
        const result = await unsubscribe(body.email);
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        });
      }

      if (action === "update-tags") {
        const result = await updateTags(body);
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        });
      }
    }

    // GET actions
    if (req.method === "GET" && action === "get-info") {
      const email = url.searchParams.get("email");
      if (!email) {
        return new Response(
          JSON.stringify({ success: false, error: "Email is required" }),
          {
            status: 400,
            headers: {
              ...getCorsHeaders(req),
              "Content-Type": "application/json",
            },
          }
        );
      }

      const result = await getSubscriberInfo(email);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 404,
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json",
        },
      });
    }

    // Invalid action
    return new Response(
      JSON.stringify({
        success: false,
        error: `Invalid action: ${action}. Valid actions are: subscribe, unsubscribe, update-tags, get-info`,
      }),
      {
        status: 400,
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    log.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
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
