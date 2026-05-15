import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { LeadForm } from './LeadForm';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { useDirtyFlag, useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { useSaveStatus } from '../hooks/useSaveStatus';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import type { Lead } from '@mpbhealth/crm-core';

interface EditLeadModalProps {
  open: boolean;
  onClose: () => void;
  lead: Lead;
  onSuccess?: () => void;
}

export function EditLeadModal({ open, onClose, lead, onSuccess }: EditLeadModalProps) {
  const { leadService } = useCRM();
  const { activeOrgId } = useOrg();
  const { markDirty, confirmClose, dirtyRef } = useDirtyFlag(open);
  const { status, errorMessage, markSaving, markSaved, markError } = useSaveStatus();

  useUnsavedChanges(dirtyRef.current && open);

  // Round 10 Addendum (Section 17): hydrate Group-only extras from the
  // existing `form_data.coverage_preferred_group` blob if present.
  const groupExtras = (() => {
    const raw = (lead.form_data ?? {}) as Record<string, unknown>;
    const block = raw['coverage_preferred_group'];
    if (block && typeof block === 'object') {
      const g = block as Record<string, unknown>;
      return {
        business_name: typeof g.business_name === 'string' ? g.business_name : '',
        website: typeof g.website === 'string' ? g.website : '',
        account_id: typeof g.account_id === 'string' ? g.account_id : '',
      };
    }
    return { business_name: '', website: '', account_id: '' };
  })();

  const initialValues = {
    first_name: lead.first_name,
    last_name: lead.last_name,
    email: lead.email,
    phone: lead.phone || '',
    household_size: lead.household_size?.toString() || '',
    zip_code: lead.zip_code || '',
    state: lead.state || '',
    city: lead.city || '',
    current_insurance: lead.current_insurance || '',
    monthly_premium: lead.monthly_premium || '',
    coverage_preference: lead.coverage_preference || '',
    primary_concern: lead.primary_concern || '',
    contact_preference: lead.contact_preference || 'phone',
    source_cta: lead.source_cta || '',
    tags: (lead.tags || []).join(', '),
    plan_type: lead.plan_type || '',
    carrier_id: lead.carrier_id || '',
    tobacco_status: lead.tobacco_status || '',
    group_type: lead.group_type || '',
    original_effective_date: lead.original_effective_date || '',
    premium_amount: lead.premium_amount?.toString() || '',
    subsidy_amount: lead.subsidy_amount?.toString() || '',
    member_responsibility: lead.member_responsibility?.toString() || '',
    priority: lead.priority || 'medium',
    lead_score: lead.lead_score?.toString() || '0',
    next_followup_at: lead.next_followup_at
      ? new Date(lead.next_followup_at).toISOString().slice(0, 16)
      : '',
    business_name: groupExtras.business_name,
    website: groupExtras.website,
    account_id: groupExtras.account_id,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (values: any) => {
    markSaving();

    const tags = values.tags
      ? String(values.tags).split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];

    // Round 10 Addendum (Section 17 + Section 15): merge the Group-only
    // extras into the lead's existing form_data so unrelated keys (e.g.
    // intake-form payloads) are preserved untouched. When Coverage Preferred
    // moves away from Group, drop the block entirely so reporting doesn't
    // see stale business fields on a non-Group lead.
    const isGroup = values.coverage_preference === 'group';
    const existingFormData = (lead.form_data ?? {}) as Record<string, unknown>;
    const { coverage_preferred_group: _drop, ...preservedFormData } = existingFormData;
    void _drop;
    const nextFormData: Record<string, unknown> = isGroup
      ? {
          ...preservedFormData,
          coverage_preferred_group: {
            business_name: (values.business_name || '').trim() || null,
            website: (values.website || '').trim() || null,
            account_id: values.account_id || null,
          },
        }
      : preservedFormData;

    const result = await leadService.updateLead(lead.id, {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone || undefined,
      household_size: values.household_size ? Number(values.household_size) : undefined,
      zip_code: values.zip_code || undefined,
      state: values.state || undefined,
      city: values.city || undefined,
      current_insurance: values.current_insurance || undefined,
      monthly_premium: values.monthly_premium || undefined,
      coverage_preference: values.coverage_preference || undefined,
      primary_concern: values.primary_concern || undefined,
      contact_preference: values.contact_preference || undefined,
      priority: values.priority || undefined,
      lead_score: values.lead_score ? Number(values.lead_score) : undefined,
      next_followup_at: values.next_followup_at || undefined,
      tags,
      plan_type: values.plan_type || undefined,
      carrier_id: values.carrier_id || undefined,
      tobacco_status: values.tobacco_status || undefined,
      group_type: values.group_type || undefined,
      original_effective_date: values.original_effective_date || undefined,
      premium_amount: values.premium_amount ? Number(values.premium_amount) : undefined,
      subsidy_amount: values.subsidy_amount ? Number(values.subsidy_amount) : undefined,
      member_responsibility: values.member_responsibility ? Number(values.member_responsibility) : undefined,
      form_data: nextFormData,
    });

    if (!result.success) {
      markError(result.error || 'Failed to update lead');
      toast.error(result.error || 'Failed to update lead');
      throw new Error(result.error || 'Failed to update lead');
    }

    markSaved();
    toast.success('Lead updated');
    logAuditEvent({
      orgId: activeOrgId || '',
      action: AUDIT_ACTIONS.LEAD_UPDATED,
      entityType: 'lead',
      entityId: lead.id,
      before: { first_name: lead.first_name, last_name: lead.last_name, email: lead.email },
      after: { first_name: values.first_name as string, last_name: values.last_name as string, email: values.email as string },
    }).catch(console.error);
    onSuccess?.();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={() => confirmClose(onClose)}
      title="Edit Lead"
      description={`${lead.first_name} ${lead.last_name}`}
      variant="slideOver"
      size="lg"
    >
      <LeadForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={() => confirmClose(onClose)}
        submitLabel="Save Changes"
        isEdit
        onDirty={markDirty}
        saveStatus={status}
        saveErrorMessage={errorMessage}
      />
    </Modal>
  );
}
