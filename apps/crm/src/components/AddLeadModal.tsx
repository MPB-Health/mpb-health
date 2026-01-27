import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { LeadForm } from './LeadForm';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (leadId: string) => void;
}

export function AddLeadModal({ open, onClose, onSuccess }: AddLeadModalProps) {
  const { leadService, refreshLeads, refreshDashboard } = useCRM();
  const { activeOrgId } = useOrg();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (values: any) => {
    const tags = values.tags
      ? String(values.tags).split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];

    const result = await leadService.createLead({
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
      source_cta: values.source_cta || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });

    if (!result.success) {
      toast.error(result.error || 'Failed to create lead');
      return;
    }

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
    onSuccess?.(result.leadId!);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Lead" description="Enter lead details" variant="slideOver" size="lg">
      <LeadForm onSubmit={handleSubmit} onCancel={onClose} submitLabel="Create Lead" />
    </Modal>
  );
}
