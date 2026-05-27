import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { LeadForm } from './LeadForm';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { useDirtyFlag, useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { useSaveStatus } from '../hooks/useSaveStatus';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (leadId: string) => void;
}

export function AddLeadModal({ open, onClose, onSuccess }: AddLeadModalProps) {
  const { leadService, refreshLeads, refreshDashboard, refreshTasks } = useCRM();
  const { activeOrgId } = useOrg();
  const { markDirty, confirmClose, dirtyRef } = useDirtyFlag(open);
  const { status, errorMessage, markSaving, markSaved, markError } = useSaveStatus();

  useUnsavedChanges(dirtyRef.current && open);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (values: any) => {
    markSaving();

    const tags = values.tags
      ? String(values.tags).split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];

    // Round 10 Addendum (Section 17 + Section 15): when Coverage Preferred is
    // Group, persist business_name / website / linked account_id into
    // form_data. Stored as jsonb until a column-level migration ships, but
    // surfaces in the existing Lead Profile form_data viewer + Convert flow.
    const isGroup = values.coverage_preference === 'group';
    const groupFormData = isGroup
      ? {
          coverage_preferred_group: {
            business_name: (values.business_name || '').trim() || null,
            website: (values.website || '').trim() || null,
            account_id: values.account_id || null,
          },
        }
      : undefined;

    const result = await leadService.createLead({
      org_id: activeOrgId || undefined,
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
      source_cta: values.source_cta || undefined,
      tags: tags.length > 0 ? tags : undefined,
      plan_type: values.plan_type || undefined,
      carrier_id: values.carrier_id || undefined,
      tobacco_status: values.tobacco_status || undefined,
      group_type: values.group_type || undefined,
      original_effective_date: values.original_effective_date || undefined,
      // Sales Plan 2026 attribution
      lead_source: values.lead_source || undefined,
      outside_advisor_id: values.outside_advisor_id || undefined,
      referral_partner_id: values.referral_partner_id || undefined,
      form_data: groupFormData,
    });

    if (!result.success) {
      markError(result.error || 'Failed to create lead');
      toast.error(result.error || 'Failed to create lead');
      throw new Error(result.error || 'Failed to create lead');
    }

    markSaved();
    toast.success('Lead created');
    logAuditEvent({
      orgId: activeOrgId || '',
      action: AUDIT_ACTIONS.LEAD_CREATED,
      entityType: 'lead',
      entityId: result.leadId,
      after: { first_name: values.first_name, last_name: values.last_name, email: values.email },
    }).catch(console.error);
    refreshLeads();
    refreshDashboard();
    refreshTasks();
    onSuccess?.(result.leadId!);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={() => confirmClose(onClose)}
      title="Add New Lead"
      description="Enter lead details"
      variant="slideOver"
      size="lg"
    >
      <LeadForm
        onSubmit={handleSubmit}
        onCancel={() => confirmClose(onClose)}
        submitLabel="Create Lead"
        onDirty={markDirty}
        saveStatus={status}
        saveErrorMessage={errorMessage}
      />
    </Modal>
  );
}
