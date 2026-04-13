import { parseISO } from 'date-fns';

export type UnifiedPrimaryRow = {
  member_id: string;
  source: 'live' | 'past';
  active_date?: string | null;
  inactive_date?: string | null;
  is_active?: boolean | null;
  created_date?: string | null;
};

function parseDay(s?: string | null): Date | null {
  if (!s) return null;
  try {
    return parseISO(s);
  } catch {
    return null;
  }
}

export function buildUnifiedPrimaryForSnapshot(
  allMembers: any[],
  pastInactives: any[],
): UnifiedPrimaryRow[] {
  const liveIds = new Set(allMembers.map((m) => m.member_id));
  const unified: UnifiedPrimaryRow[] = [];

  for (const m of allMembers) {
    unified.push({
      member_id: m.member_id,
      source: 'live',
      active_date: m.active_date,
      inactive_date: m.inactive_date,
      is_active: m.is_active,
      created_date: m.created_date,
    });
  }

  for (const pi of pastInactives) {
    if (liveIds.has(pi.member_id)) continue;
    unified.push({
      member_id: pi.member_id,
      source: 'past',
      active_date: pi.active_date ?? null,
      inactive_date: pi.inactive_date,
      is_active: false,
      created_date: pi.member_created_date ?? null,
    });
  }

  return unified;
}

export function primaryActiveInactiveAsOfCutoff(
  unified: UnifiedPrimaryRow[],
  cutoff: Date,
): { active: number; inactive: number } {
  let active = 0;
  let inactive = 0;
  const cutoffTime = cutoff.getTime();

  for (const row of unified) {
    const activeD = parseDay(row.active_date);
    const inactiveD = parseDay(row.inactive_date);

    let started = false;
    if (activeD) {
      started = activeD.getTime() <= cutoffTime;
    } else if (row.is_active) {
      started = true;
    }

    if (!started) continue;

    if (activeD && inactiveD && inactiveD.getTime() <= activeD.getTime()) {
      continue;
    }

    const stillActive = !inactiveD || inactiveD.getTime() > cutoffTime;
    if (stillActive) active++;
    else inactive++;
  }

  return { active, inactive };
}

export function primaryCancellationsInCalendarYear(unified: UnifiedPrimaryRow[], year: number): number {
  let n = 0;
  for (const row of unified) {
    const inactiveD = parseDay(row.inactive_date);
    if (!inactiveD || inactiveD.getFullYear() !== year) continue;
    const activeD = parseDay(row.active_date);
    if (activeD && inactiveD.getTime() <= activeD.getTime()) continue;
    n++;
  }
  return n;
}

export function primarySalesByMemberCreatedYear(
  allMembers: any[],
  pastInactives: any[],
  year: number,
): number {
  const liveIds = new Set(allMembers.map((m) => m.member_id));
  let n = 0;

  for (const m of allMembers) {
    const cd = parseDay(m.created_date);
    if (cd && cd.getFullYear() === year) n++;
  }

  for (const pi of pastInactives) {
    if (liveIds.has(pi.member_id)) continue;
    const cd = parseDay(pi.member_created_date);
    if (cd && cd.getFullYear() === year) n++;
  }

  return n;
}
