import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createLogger } from '../_shared/logger.ts';
const log = createLogger('zoho-crm');

interface ZohoLead {
  First_Name: string;
  Last_Name: string;
  Email: string;
  Phone: string;
  Company?: string;
  Lead_Source: string;
  Lead_Status?: string;
  Description?: string;
  Street?: string;
  City?: string;
  State?: string;
  Zip_Code?: string;
  Country?: string;
  Industry?: string;
  Annual_Revenue?: string;
  No_of_Employees?: string;
  Website?: string;
  Household_Size?: string;
  Current_Insurance?: string;
  Monthly_Premium?: string;
  Coverage_Preference?: string;
  Primary_Concern?: string;
  Contact_Preference?: string;
  Submitted_From?: string;
}

interface ZohoTokenResponse {
  access_token: string;
  api_domain: string;
  token_type: string;
  expires_in: number;
}

const ZOHO_CLIENT_ID = Deno.env.get("ZOHO_CLIENT_ID");
const ZOHO_CLIENT_SECRET = Deno.env.get("ZOHO_CLIENT_SECRET");
const ZOHO_REFRESH_TOKEN = Deno.env.get("ZOHO_REFRESH_TOKEN");
const ZOHO_API_DOMAIN = Deno.env.get("ZOHO_API_DOMAIN") || "https://www.zohoapis.com";

let accessToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAccessToken(): Promise<string> {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await fetch("https://accounts.zoho.com/oauth/v2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: ZOHO_REFRESH_TOKEN!,
        client_id: ZOHO_CLIENT_ID!,
        client_secret: ZOHO_CLIENT_SECRET!,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh Zoho token: ${error}`);
    }

    const data: ZohoTokenResponse = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;

    return accessToken;
  } catch (error) {
    log.error("Zoho token refresh error:", error);
    throw error;
  }
}

async function createLead(leadData: ZohoLead): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    const token = await getAccessToken();

    const payload = {
      data: [
        {
          ...leadData,
          Lead_Source: leadData.Lead_Source || "Website",
          Lead_Status: leadData.Lead_Status || "New",
        },
      ],
    };

    const response = await fetch(`${ZOHO_API_DOMAIN}/crm/v3/Leads`, {
      method: "POST",
      headers: {
        "Authorization": `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error("Zoho CRM API error:", errorText);
      throw new Error(`Zoho API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (result.data && result.data.length > 0 && result.data[0].code === "SUCCESS") {
      return {
        success: true,
        leadId: result.data[0].details.id,
      };
    } else {
      const errorMessage = result.data?.[0]?.message || "Unknown error creating lead";
      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (error) {
    log.error("Create lead error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create lead in Zoho CRM",
    };
  }
}

async function updateLead(leadId: string, updates: Partial<ZohoLead>): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAccessToken();

    const payload = {
      data: [
        {
          id: leadId,
          ...updates,
        },
      ],
    };

    const response = await fetch(`${ZOHO_API_DOMAIN}/crm/v3/Leads`, {
      method: "PUT",
      headers: {
        "Authorization": `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zoho API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (result.data && result.data.length > 0 && result.data[0].code === "SUCCESS") {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.data?.[0]?.message || "Failed to update lead",
      };
    }
  } catch (error) {
    log.error("Update lead error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update lead in Zoho CRM",
    };
  }
}

async function searchLeadByEmail(email: string): Promise<{ found: boolean; leadId?: string; lead?: any }> {
  try {
    const token = await getAccessToken();

    const response = await fetch(
      `${ZOHO_API_DOMAIN}/crm/v3/Leads/search?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Zoho-oauthtoken ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 204) {
        return { found: false };
      }
      throw new Error(`Zoho search error: ${response.status}`);
    }

    const result = await response.json();

    if (result.data && result.data.length > 0) {
      return {
        found: true,
        leadId: result.data[0].id,
        lead: result.data[0],
      };
    }

    return { found: false };
  } catch (error) {
    log.error("Search lead error:", error);
    return { found: false };
  }
}

// List all leads with pagination
async function listLeads(params: {
  page?: number;
  per_page?: number;
  modified_since?: string;
  sort_by?: string;
  sort_order?: string;
}): Promise<{ success: boolean; data?: any[]; info?: any; error?: string }> {
  try {
    const token = await getAccessToken();

    const url = new URL(`${ZOHO_API_DOMAIN}/crm/v3/Leads`);
    if (params.page) url.searchParams.set("page", params.page.toString());
    if (params.per_page) url.searchParams.set("per_page", params.per_page.toString());
    if (params.modified_since) url.searchParams.set("modified_since", params.modified_since);
    if (params.sort_by) url.searchParams.set("sort_by", params.sort_by);
    if (params.sort_order) url.searchParams.set("sort_order", params.sort_order);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Zoho-oauthtoken ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 204) {
        return { success: true, data: [], info: { count: 0 } };
      }
      const errorText = await response.text();
      throw new Error(`Zoho API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data || [],
      info: result.info || { count: result.data?.length || 0 },
    };
  } catch (error) {
    log.error("List leads error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list leads from Zoho CRM",
    };
  }
}

// Get a single lead by ID
async function getLead(leadId: string): Promise<{ success: boolean; lead?: any; error?: string }> {
  try {
    const token = await getAccessToken();

    const response = await fetch(`${ZOHO_API_DOMAIN}/crm/v3/Leads/${leadId}`, {
      method: "GET",
      headers: {
        "Authorization": `Zoho-oauthtoken ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zoho API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (result.data && result.data.length > 0) {
      return { success: true, lead: result.data[0] };
    }

    return { success: false, error: "Lead not found" };
  } catch (error) {
    log.error("Get lead error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get lead from Zoho CRM",
    };
  }
}

// Health check - verify Zoho connection
async function healthCheck(): Promise<{ success: boolean; configured: boolean; connected: boolean; error?: string }> {
  // Check if configured
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    return {
      success: false,
      configured: false,
      connected: false,
      error: "Zoho CRM credentials not configured",
    };
  }

  try {
    // Try to get access token
    await getAccessToken();

    // Try a simple API call
    const url = new URL(`${ZOHO_API_DOMAIN}/crm/v3/Leads`);
    url.searchParams.set("per_page", "1");

    const token = await getAccessToken();
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Zoho-oauthtoken ${token}`,
      },
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`API test failed: ${response.status}`);
    }

    return {
      success: true,
      configured: true,
      connected: true,
    };
  } catch (error) {
    return {
      success: false,
      configured: true,
      connected: false,
      error: error instanceof Error ? error.message : "Connection test failed",
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  try {
    if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Zoho CRM is not configured",
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

    if (req.method === "POST") {
      const body = await req.json();

      if (action === "create") {
        const result = await createLead(body.leadData);
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        });
      }

      if (action === "update") {
        const result = await updateLead(body.leadId, body.updates);
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        });
      }
    }

    if (req.method === "GET") {
      // Health check
      if (action === "health") {
        const result = await healthCheck();
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 503,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        });
      }

      // Search by email
      if (action === "search") {
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

        const result = await searchLeadByEmail(email);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        });
      }

      // List leads (for import)
      if (action === "list") {
        const page = url.searchParams.get("page");
        const per_page = url.searchParams.get("per_page");
        const modified_since = url.searchParams.get("modified_since");
        const sort_by = url.searchParams.get("sort_by");
        const sort_order = url.searchParams.get("sort_order");

        const result = await listLeads({
          page: page ? parseInt(page) : undefined,
          per_page: per_page ? parseInt(per_page) : undefined,
          modified_since: modified_since || undefined,
          sort_by: sort_by || undefined,
          sort_order: sort_order || undefined,
        });

        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        });
      }

      // Get single lead
      if (action === "get") {
        const leadId = url.searchParams.get("id");
        if (!leadId) {
          return new Response(
            JSON.stringify({ success: false, error: "Lead ID is required" }),
            {
              status: 400,
              headers: {
                ...getCorsHeaders(req),
                "Content-Type": "application/json",
              },
            }
          );
        }

        const result = await getLead(leadId);
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        });
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
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
