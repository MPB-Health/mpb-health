import type { SupabaseClient } from '@supabase/supabase-js';

export type LeadAssigneeKind = 'rep' | 'advisor';

export interface LeadAssignee {
  user_id: string;
  display_name: string;
  email: string | null;
  kind: LeadAssigneeKind;
}

/**
 * Active users who can own a lead: org members (inside sales) plus MPB field advisors.
 */
export async function getLeadAssignees(
  supabase: SupabaseClient,
  orgId: string,
): Promise<LeadAssignee[]> {
  const [repsResult, advisorsResult] = await Promise.all([
    supabase
      .from('org_memberships')
      .select('user_id, role, status, profile:profiles(id, first_name, last_name, display_name, email)')
      .eq('org_id', orgId)
      .eq('status', 'active'),
    supabase
      .from('advisor_profiles')
      .select('id, first_name, last_name, email')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('last_name', { ascending: true }),
  ]);

  if (repsResult.error) throw repsResult.error;
  if (advisorsResult.error) throw advisorsResult.error;

  const byId = new Map<string, LeadAssignee>();

  for (const row of repsResult.data ?? []) {
    const profile = row.profile as
      | {
          display_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
        }
      | null;
    const userId = row.user_id as string;
    const displayName =
      profile?.display_name ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
      profile?.email ||
      userId.slice(0, 8);
    byId.set(userId, {
      user_id: userId,
      display_name: displayName,
      email: profile?.email ?? null,
      kind: 'rep',
    });
  }

  for (const ap of advisorsResult.data ?? []) {
    const userId = ap.id as string;
    const displayName =
      [ap.first_name, ap.last_name].filter(Boolean).join(' ').trim() ||
      (ap.email as string) ||
      userId.slice(0, 8);
    const existing = byId.get(userId);
    if (existing) {
      if (existing.kind === 'rep') {
        byId.set(userId, { ...existing, kind: 'advisor' });
      }
      continue;
    }
    byId.set(userId, {
      user_id: userId,
      display_name: displayName,
      email: (ap.email as string) || null,
      kind: 'advisor',
    });
  }

  return [...byId.values()].sort((a, b) => a.display_name.localeCompare(b.display_name));
}
