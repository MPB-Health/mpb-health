import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabase, supabasePublicAnonKey } from '@mpbhealth/database';

/**
 * Membership analytics lives in the mobile app Supabase project. Querying it
 * straight from the browser returned 401s because that project's `anon` role
 * has no grants on these objects, and its `authenticated` role can read every
 * member record — so no key for it may ship in a public bundle. Requests go
 * through the membership-analytics-proxy edge function, which authorizes the
 * caller's admin session and holds the service-role key server-side.
 *
 * The proxy mirrors PostgREST's `/rest/v1/<table>` shape, so supabase-js can
 * treat it as an ordinary Supabase URL and existing queries work unchanged.
 * The key below is the primary project's anon key, which only satisfies the
 * edge gateway's `apikey` header; authorization comes from the admin session
 * token attached per request.
 */
const primarySupabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(
  /\/$/,
  '',
);

const proxyUrl = primarySupabaseUrl
  ? `${primarySupabaseUrl}/functions/v1/membership-analytics-proxy`
  : undefined;

export const isMembershipAnalyticsConfigured = Boolean(proxyUrl && supabasePublicAnonKey);

async function fetchWithAdminSession(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export const membershipAnalyticsSupabase: SupabaseClient | null = isMembershipAnalyticsConfigured
  ? createClient(proxyUrl!, supabasePublicAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: fetchWithAdminSession },
    })
  : null;

const PAGE = 1000;

export async function paginateSelect(
  client: SupabaseClient,
  table: string,
  columns: string,
  filter?: (q: any) => any,
): Promise<any[]> {
  const all: any[] = [];
  let from = 0;
  for (;;) {
    let q = client.from(table).select(columns).range(from, from + PAGE - 1);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}
