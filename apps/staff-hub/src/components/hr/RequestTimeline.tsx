import { format, parseISO } from 'date-fns';
import type { StaffTimeRequestEvent } from '../../lib/hr';

function actionLabel(action: string): string {
  switch (action) {
    case 'created':
      return 'Submitted';
    case 'cancelled':
      return 'Cancelled';
    case 'approved':
      return 'Approved';
    case 'denied':
      return 'Denied';
    case 'commented':
      return 'Commented';
    case 'document_uploaded':
      return 'Document uploaded';
    default:
      return action.replace(/_/g, ' ');
  }
}

function actorLabel(event: StaffTimeRequestEvent): string {
  if (event.actor_name) return event.actor_name;
  if (event.actor_email) return event.actor_email;
  return 'Someone';
}

function detailText(event: StaffTimeRequestEvent): string | null {
  const d = event.detail ?? {};
  if (event.action === 'commented' && typeof d.body === 'string') {
    return d.body;
  }
  if (
    (event.action === 'approved' || event.action === 'denied') &&
    typeof d.decision_note === 'string' &&
    d.decision_note.trim()
  ) {
    return d.decision_note;
  }
  if (event.action === 'document_uploaded' && typeof d.file_name === 'string') {
    return d.file_name;
  }
  return null;
}

export function RequestTimeline({ events }: { events: StaffTimeRequestEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-400">No activity yet.</p>;
  }

  return (
    <ol className="relative space-y-0 border-l border-slate-200 pl-4">
      {events.map((event) => {
        const text = detailText(event);
        return (
          <li key={event.id} className="relative pb-5 last:pb-0">
            <span className="absolute -left-[1.3rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[#0A4E8E] ring-4 ring-white" />
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-slate-800">
                {actionLabel(event.action)}
              </span>
              <span className="text-xs text-slate-500">by {actorLabel(event)}</span>
              <span className="font-mono text-[11px] text-slate-400">
                {format(parseISO(event.created_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            {text ? (
              <p className="mt-1.5 whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {text}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
