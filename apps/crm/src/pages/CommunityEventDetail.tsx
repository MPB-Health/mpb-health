import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRMService } from '../contexts/CRMServiceContext';
import { useOrg } from '../contexts/OrgContext';
import { crmQueryKeys } from '../query/crmQueryKeys';
import { GradientHeader } from '@mpbhealth/ui';
import type { CommunityEventInput, CommunityEventType } from '@mpbhealth/crm-core';

const EVENT_TYPE_LABELS: Record<CommunityEventType, string> = {
  church_partnership: 'Church partnership',
  hydration_booth: 'Hydration booth',
  chamber_bni_sbdc: 'Chamber / BNI / SBDC',
  health_fair: 'Health fair',
  co_sponsored: 'Co-sponsored',
  other: 'Other',
};

const EVENT_TYPES: CommunityEventType[] = [
  'church_partnership',
  'hydration_booth',
  'chamber_bni_sbdc',
  'health_fair',
  'co_sponsored',
  'other',
];

export default function CommunityEventDetail() {
  const { id } = useParams<{ id: string }>();
  const { communityEventService, supabase } = useCRMService();
  const { activeOrgId } = useOrg();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: crmQueryKeys.communityEvent(activeOrgId, id ?? ''),
    queryFn: () => communityEventService.getEvent(id!),
    enabled: !!activeOrgId && !!id,
  });

  // Sales Plan 2026: show the leads that came in through this specific event.
  // Filtering on `community_event_id` means this only returns leads captured
  // via the public `/forms/community/:eventId` page or manual attribution.
  const { data: attributedLeads = [] } = useQuery({
    queryKey: ['communityEventLeads', activeOrgId, id],
    enabled: !!activeOrgId && !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from('lead_submissions')
        .select('id, first_name, last_name, email, phone, pipeline_stage, created_at, assigned_to')
        .eq('org_id', activeOrgId!)
        .eq('community_event_id', id!)
        .order('created_at', { ascending: false })
        .limit(100);
      return (data ?? []) as Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        phone: string | null;
        pipeline_stage: string | null;
        created_at: string;
        assigned_to: string | null;
      }>;
    },
  });

  const [editForm, setEditForm] = useState<CommunityEventInput | null>(null);

  useEffect(() => {
    if (!event) return;
    setEditForm({
      name: event.name,
      event_type: event.event_type,
      event_date: event.event_date?.slice(0, 10) ?? '',
      location: event.location ?? '',
      contacts_captured: event.contacts_captured,
      leads_generated: event.leads_generated,
      rep_id: event.rep_id ?? '',
      notes: event.notes ?? '',
    });
  }, [event?.id, event?.updated_at]);

  const updateMutation = useMutation({
    mutationFn: (input: Partial<CommunityEventInput>) =>
      communityEventService.updateEvent(id!, input),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.communityEvent(activeOrgId, id!) });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.communityEvents(activeOrgId) });
      if (row) toast.success('Event updated');
      else toast.error('Could not update event');
    },
    onError: () => toast.error('Could not update event'),
  });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm?.name.trim()) {
      toast.error('Name is required');
      return;
    }
    updateMutation.mutate({
      name: editForm.name.trim(),
      event_type: editForm.event_type,
      event_date: editForm.event_date,
      location: editForm.location?.trim() || undefined,
      contacts_captured: Number(editForm.contacts_captured) || 0,
      leads_generated: Number(editForm.leads_generated) || 0,
      rep_id: editForm.rep_id?.trim() || undefined,
      notes: editForm.notes?.trim() || undefined,
    });
  };

  if (!id) {
    return <p className="text-th-text-tertiary">Missing event id.</p>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-4">
        <Link
          to="/community-events"
          className="inline-flex items-center gap-1 text-sm text-th-accent-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to events
        </Link>
        <p className="text-th-text-tertiary">Event not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Link
          to="/community-events"
          className="inline-flex items-center gap-1 text-sm text-th-accent-600 hover:underline w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to events
        </Link>
        <GradientHeader
          title={event.name}
          subtitle={
            event.event_date
              ? `${EVENT_TYPE_LABELS[event.event_type]} · ${new Date(event.event_date).toLocaleDateString()}`
              : EVENT_TYPE_LABELS[event.event_type]
          }
        />
      </div>

      <div className="rounded-xl border border-th-border bg-surface-primary p-4 space-y-2">
        <h2 className="text-sm font-semibold text-th-text-primary">Summary</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-th-text-tertiary">Location</dt>
            <dd className="text-th-text-primary">{event.location || '—'}</dd>
          </div>
          <div>
            <dt className="text-th-text-tertiary">Rep</dt>
            <dd className="text-th-text-primary font-mono text-xs">{event.rep_id || '—'}</dd>
          </div>
          <div>
            <dt className="text-th-text-tertiary">Contacts captured</dt>
            <dd className="text-th-text-primary tabular-nums">{event.contacts_captured}</dd>
          </div>
          <div>
            <dt className="text-th-text-tertiary">Leads generated</dt>
            <dd className="text-th-text-primary tabular-nums">{event.leads_generated}</dd>
          </div>
        </dl>
        {event.notes && (
          <p className="text-sm text-th-text-secondary border-t border-th-border pt-3">{event.notes}</p>
        )}
      </div>

      {/* Sales Plan 2026: on-site capture URL. The rep opens this on a tablet
          at the booth; the public form writes a lead with lead_source='community'
          + community_event_id so attribution + counter are automatic. */}
      <div className="rounded-xl border border-th-border bg-surface-primary p-4 space-y-3">
        <h2 className="text-sm font-semibold text-th-text-primary">On-site capture URL</h2>
        <p className="text-xs text-th-text-secondary">
          Open this on a tablet at the booth. Each submission is automatically attributed to
          this event and round-robined to the next rep on rotation.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg border border-th-border bg-surface-secondary px-3 py-2 text-xs font-mono text-th-text-primary truncate">
            {`${window.location.origin}/forms/community/${event.id}`}
          </code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(`${window.location.origin}/forms/community/${event.id}`);
              toast.success('Copied');
            }}
            className="rounded-lg border border-th-border px-3 py-2 text-xs font-medium text-th-text-secondary hover:bg-surface-secondary"
          >
            <Copy className="w-3.5 h-3.5 inline mr-1" /> Copy
          </button>
          <a
            href={`/forms/community/${event.id}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-th-border px-3 py-2 text-xs font-medium text-th-text-secondary hover:bg-surface-secondary"
          >
            <ExternalLink className="w-3.5 h-3.5 inline mr-1" /> Open
          </a>
        </div>
      </div>

      {/* Attributed leads */}
      <div className="rounded-xl border border-th-border bg-surface-primary overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-th-border">
          <h2 className="text-sm font-semibold text-th-text-primary">
            Attributed leads ({attributedLeads.length})
          </h2>
          <p className="text-xs text-th-text-tertiary">Auto-updated as submissions come in</p>
        </div>
        {attributedLeads.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-th-text-tertiary">
            No leads captured yet. Share the URL above from the booth.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-th-border text-left text-xs text-th-text-tertiary">
                  <th className="px-4 py-2 font-medium">Lead</th>
                  <th className="px-4 py-2 font-medium">Contact</th>
                  <th className="px-4 py-2 font-medium">Stage</th>
                  <th className="px-4 py-2 font-medium">Captured</th>
                </tr>
              </thead>
              <tbody>
                {attributedLeads.map((l) => (
                  <tr key={l.id} className="border-b border-th-border last:border-0">
                    <td className="px-4 py-2">
                      <Link
                        to={`/leads/${l.id}`}
                        className="font-medium text-th-accent-600 hover:underline"
                      >
                        {[l.first_name, l.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-th-text-secondary">
                      {l.email || l.phone || '—'}
                    </td>
                    <td className="px-4 py-2 text-th-text-secondary">{l.pipeline_stage || '—'}</td>
                    <td className="px-4 py-2 text-th-text-secondary">
                      {new Date(l.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editForm && (
        <form
          onSubmit={save}
          className="rounded-xl border border-th-border bg-surface-primary p-4 space-y-3"
        >
          <h2 className="text-sm font-semibold text-th-text-primary">Edit event</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-th-text-secondary mb-1">Name</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p!, name: e.target.value }))}
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-th-text-secondary mb-1">Type</label>
              <select
                value={editForm.event_type}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p!,
                    event_type: e.target.value as CommunityEventType,
                  }))
                }
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EVENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-th-text-secondary mb-1">Date</label>
              <input
                type="date"
                value={editForm.event_date?.slice(0, 10) ?? ''}
                onChange={(e) => setEditForm((p) => ({ ...p!, event_date: e.target.value }))}
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-th-text-secondary mb-1">Location</label>
              <input
                value={editForm.location ?? ''}
                onChange={(e) => setEditForm((p) => ({ ...p!, location: e.target.value }))}
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-th-text-secondary mb-1">
                Contacts captured
              </label>
              <input
                type="number"
                min={0}
                value={editForm.contacts_captured ?? 0}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p!, contacts_captured: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-th-text-secondary mb-1">
                Leads generated
              </label>
              <input
                type="number"
                min={0}
                value={editForm.leads_generated ?? 0}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p!, leads_generated: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-th-text-secondary mb-1">Rep ID</label>
              <input
                value={editForm.rep_id ?? ''}
                onChange={(e) => setEditForm((p) => ({ ...p!, rep_id: e.target.value }))}
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-th-text-secondary mb-1">Notes</label>
              <textarea
                rows={3}
                value={editForm.notes ?? ''}
                onChange={(e) => setEditForm((p) => ({ ...p!, notes: e.target.value }))}
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="rounded-lg bg-th-accent-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}
    </div>
  );
}
