import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_MEMBERSHIP_ANALYTICS_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_MEMBERSHIP_ANALYTICS_SUPABASE_ANON_KEY as string | undefined;

export const isMembershipAnalyticsConfigured = Boolean(url && anonKey);

export const membershipAnalyticsSupabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

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
