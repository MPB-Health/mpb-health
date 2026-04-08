/**
 * Mandatory portal training applies only to advisors whose account/profile
 * exists on or after the cutoff. Everyone strictly before the cutoff is exempt
 * (grandfathered) even if training_completed is still false in the DB.
 */
export const DEFAULT_ADVISOR_TRAINING_GATE_CUTOFF_ISO = '2026-04-07T00:00:00.000Z';

export function resolveAdvisorTrainingGateCutoffMs(overrideIso?: string | null): number | null {
  const s = (overrideIso ?? '').trim();
  const iso = s.length > 0 ? s : DEFAULT_ADVISOR_TRAINING_GATE_CUTOFF_ISO;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

function createdBeforeCutoff(createdAtIso: string | undefined, cutoffMs: number | null): boolean {
  if (cutoffMs == null) return false;
  const t = createdAtIso ? Date.parse(createdAtIso) : NaN;
  if (Number.isNaN(t)) return false;
  return t < cutoffMs;
}

/** True if the advisor may use the full portal without completing the new training flow. */
export function isAdvisorExemptFromTrainingGate(
  profile: { training_completed: boolean; created_at?: string | null },
  cutoffMs: number | null,
  authUserCreatedAt?: string | null
): boolean {
  if (profile.training_completed) return true;
  if (cutoffMs == null) return false;
  if (createdBeforeCutoff(authUserCreatedAt ?? undefined, cutoffMs)) return true;
  if (createdBeforeCutoff(profile.created_at ?? undefined, cutoffMs)) return true;
  return false;
}
