import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    console.error("Zoho token refresh error:", error);
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
      console.error("Zoho CRM API error:", errorText);
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
    console.error("Create lead error:", error);
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
    console.error("Update lead error:", error);
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
    console.error("Search lead error:", error);
    return { found: false };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
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
            ...corsHeaders,
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
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      }

      if (action === "update") {
        const result = await updateLead(body.leadId, body.updates);
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      }
    }

    if (req.method === "GET" && action === "search") {
      const email = url.searchParams.get("email");
      if (!email) {
        return new Response(
          JSON.stringify({ success: false, error: "Email is required" }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const result = await searchLeadByEmail(email);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
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
