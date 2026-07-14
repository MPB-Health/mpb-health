/**
 * Recurring advisor Teams meetings — single source of truth.
 *
 * Healthcare Advisor Meetings: 2nd and 4th Tuesday each month, each with its
 * own Teams join link (Sept 2025 advisor bulletin). Secure HSA Webinars are a
 * separate series. All portal surfaces (Live Meeting button, Dashboard, Quick
 * Links) must read from this module — do not hardcode Teams URLs elsewhere.
 */

/** Healthcare Advisor Meeting — 2nd Tuesday of each month */
export const TEAMS_URL_SECOND_TUESDAY =
  'https://teams.microsoft.com/l/meetup-join/19%3ameeting_OThlYThjZmUtNzA1YS00NDIyLWJjYjMtNDAxYjgwYWQ5ODE0%40thread.v2/0?context=%7b%22Tid%22%3a%22ad4e49c8-3dea-4d37-8be6-ee2fdc324f04%22%2c%22Oid%22%3a%22ad01a7ba-787a-4389-97d2-90b3ec45896c%22%7d';

/** Healthcare Advisor Meeting — 4th Tuesday of each month */
export const TEAMS_URL_FOURTH_TUESDAY =
  'https://teams.microsoft.com/l/meetup-join/19%3ameeting_ODY1ZGM0NjEtYWIwNi00YzdmLTg1MjEtZWRiODEwZDc3NDVh%40thread.v2/0?context=%7b%22Tid%22%3a%22ad4e49c8-3dea-4d37-8be6-ee2fdc324f04%22%2c%22Oid%22%3a%22ad01a7ba-787a-4389-97d2-90b3ec45896c%22%7d';

/** Secure HSA Webinar — 1st & 3rd Tuesday at 12 PM ET */
export const TEAMS_URL_HSA_WEBINAR_TUESDAY =
  'https://teams.microsoft.com/l/meetup-join/19%3ameeting_NzZkOTcxZWQtMTJmOC00MThlLWEwZWQtNTI3MTM4NjZkZjcx%40thread.v2/0?context=%7b%22Tid%22%3a%22ad4e49c8-3dea-4d37-8be6-ee2fdc324f04%22%2c%22Oid%22%3a%22790aa558-4c20-46ec-8708-30d8168cfa5d%22%7d';

/** Secure HSA Webinar — 2nd & 4th Thursday at 4 PM ET */
export const TEAMS_URL_HSA_WEBINAR_THURSDAY =
  'https://teams.microsoft.com/l/meetup-join/19%3ameeting_ODgxYmZiOTItZjBlMy00NWE4LWE3ZjUtMWFkZTBmYjEwZWEy%40thread.v2/0?context=%7b%22Tid%22%3a%22ad4e49c8-3dea-4d37-8be6-ee2fdc324f04%22%2c%22Oid%22%3a%22790aa558-4c20-46ec-8708-30d8168cfa5d%22%7d';

export type MeetingLinkRow = {
  id: string;
  label: string;
  schedule: string;
  url: string;
};

/** Static schedule rows for Resource Center / Quick Links. */
export const HEALTHCARE_ADVISOR_MEETING_LINKS: readonly MeetingLinkRow[] = [
  {
    id: 'second-tuesday',
    label: '2nd Tuesday',
    schedule: '2nd Tuesday each month',
    url: TEAMS_URL_SECOND_TUESDAY,
  },
  {
    id: 'fourth-tuesday',
    label: '4th Tuesday',
    schedule: '4th Tuesday each month',
    url: TEAMS_URL_FOURTH_TUESDAY,
  },
];

export const SECURE_HSA_WEBINAR_LINKS: readonly MeetingLinkRow[] = [
  {
    id: 'hsa-tuesday',
    label: 'Tuesdays at 12 PM ET',
    schedule: '1st & 3rd Tuesday each month',
    url: TEAMS_URL_HSA_WEBINAR_TUESDAY,
  },
  {
    id: 'hsa-thursday',
    label: 'Thursdays at 4 PM ET',
    schedule: '2nd & 4th Thursday each month',
    url: TEAMS_URL_HSA_WEBINAR_THURSDAY,
  },
];

export type RecurringAdvisorMeetingInfo = {
  isMeetingDay: boolean;
  /** 1-based Tuesday index within the month (1 = first Tuesday, etc.) */
  tuesdayOfMonth: number;
  teamsUrl: string | null;
  nextMeeting: Date | null;
  /** Teams URL for the next upcoming meeting (usable on non-meeting days). */
  nextMeetingUrl: string | null;
};

/** Which Tuesday of the month (1–5) the given date falls on; 0 if not a Tuesday. */
export function getTuesdayOfMonth(date: Date): number {
  if (date.getDay() !== 2) return 0;

  let count = 0;
  for (let d = 1; d <= date.getDate(); d++) {
    const probe = new Date(date.getFullYear(), date.getMonth(), d);
    if (probe.getDay() === 2) count++;
  }
  return count;
}

/** Teams join URL for a 2nd- or 4th-Tuesday meeting date; null otherwise. */
export function getTeamsMeetingUrlForDate(date: Date): string | null {
  const tuesday = getTuesdayOfMonth(date);
  if (tuesday === 2) return TEAMS_URL_SECOND_TUESDAY;
  if (tuesday === 4) return TEAMS_URL_FOURTH_TUESDAY;
  return null;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Next 2nd or 4th Tuesday strictly after `after` (defaults to start of today). */
export function getNextRecurringMeetingDate(after: Date = new Date()): Date | null {
  const cursor = startOfDay(after);
  let month = cursor.getMonth();
  let year = cursor.getFullYear();

  for (let attempts = 0; attempts < 24; attempts++) {
    const tuesdays: Date[] = [];
    for (let d = 1; d <= 31; d++) {
      const date = new Date(year, month, d);
      if (date.getMonth() !== month) break;
      if (date.getDay() === 2) tuesdays.push(date);
    }

    for (const t of [tuesdays[1], tuesdays[3]].filter(Boolean)) {
      if (t && t > cursor) {
        t.setHours(16, 0, 0, 0);
        return t;
      }
    }

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return null;
}

/** Meeting-day state for the advisor portal Live Meeting button. */
export function getRecurringAdvisorMeetingInfo(
  when: Date = new Date(),
): RecurringAdvisorMeetingInfo {
  const today = startOfDay(when);
  const tuesdayOfMonth = getTuesdayOfMonth(today);
  const isMeetingDay = tuesdayOfMonth === 2 || tuesdayOfMonth === 4;
  const nextMeeting = getNextRecurringMeetingDate(today);

  return {
    isMeetingDay,
    tuesdayOfMonth,
    teamsUrl: isMeetingDay ? getTeamsMeetingUrlForDate(today) : null,
    nextMeeting,
    nextMeetingUrl: nextMeeting ? getTeamsMeetingUrlForDate(nextMeeting) : null,
  };
}

/** Next N upcoming 2nd and 4th Tuesdays (4 PM local), including today if applicable. */
export function getUpcomingRecurringMeetings(count = 4): Date[] {
  const meetings: Date[] = [];
  const now = new Date();
  let month = now.getMonth();
  let year = now.getFullYear();
  const todayStart = startOfDay(now);

  while (meetings.length < count) {
    const tuesdays: Date[] = [];
    for (let d = 1; d <= 31; d++) {
      const date = new Date(year, month, d);
      if (date.getMonth() !== month) break;
      if (date.getDay() === 2) tuesdays.push(date);
    }

    for (const t of [tuesdays[1], tuesdays[3]].filter(Boolean)) {
      if (t && t >= todayStart && meetings.length < count) {
        t.setHours(16, 0, 0, 0);
        meetings.push(t);
      }
    }

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return meetings;
}
