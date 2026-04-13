import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
  const { communityEventService } = useCRMService();
  const { activeOrgId } = useOrg();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: crmQueryKeys.communityEvent(activeOrgId, id ?? ''),
    queryFn: () => communityEventService.getEvent(id!),
    enabled: !!activeOrgId && !!id,
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
