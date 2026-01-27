import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { LeadForm } from './LeadForm';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
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

  const initialValues = {
    first_name: lead.first_name,
    last_name: lead.last_name,
    email: lead.email,
    phone: lead.phone || '',
    household_size: lead.household_size?.toString() || '',
    zip_code: lead.zip_code || '',
    current_insurance: lead.current_insurance || '',
    monthly_premium: lead.monthly_premium || '',
    coverage_preference: lead.coverage_preference || '',
    primary_concern: lead.primary_concern || '',
    contact_preference: lead.contact_preference || 'phone',
    source_cta: lead.source_cta || '',
    tags: (lead.tags || []).join(', '),
    priority: lead.priority || 'medium',
    lead_score: lead.lead_score?.toString() || '0',
    next_followup_at: lead.next_followup_at
      ? new Date(lead.next_followup_at).toISOString().slice(0, 16)
      : '',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (values: any) => {
    const tags = values.tags
      ? String(values.tags).split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];

    const result = await leadService.updateLead(lead.id, {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone || undefined,
      household_size: values.household_size ? Number(values.household_size) : undefined,
      zip_code: values.zip_code || undefined,
      current_insurance: values.current_insurance || undefined,
      monthly_premium: values.monthly_premium || undefined,
      coverage_preference: values.coverage_preference || undefined,
      primary_concern: values.primary_concern || undefined,
      contact_preference: values.contact_preference || undefined,
      priority: values.priority || undefined,
      lead_score: values.lead_score ? Number(values.lead_score) : undefined,
      next_followup_at: values.next_followup_at || undefined,
      tags,
    });

    if (!result.success) {
      toast.error(result.error || 'Failed to update lead');
      return;
    }

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
    <Modal open={open} onClose={onClose} title="Edit Lead" description={`${lead.first_name} ${lead.last_name}`} variant="slideOver" size="lg">
      <LeadForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel="Save Changes"
        isEdit
      />
    </Modal>
  );
}
