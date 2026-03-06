import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ApprovalEntityType } from '@mpbhealth/crm-core';
import { useCRM } from '../../contexts/CRMContext';
import { useOrg } from '../../contexts/OrgContext';
import { useAuth } from '../../contexts/AuthContext';

interface SubmitForApprovalButtonProps {
  entityType: ApprovalEntityType;
  entityId: string;
  entityData?: Record<string, unknown>;
  onSubmitted?: () => void;
  className?: string;
}

export default function SubmitForApprovalButton({
  entityType,
  entityId,
  entityData,
  onSubmitted,
  className = '',
}: SubmitForApprovalButtonProps) {
  const { approvalService } = useCRM();
  const { activeOrgId } = useOrg();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [needsApproval, setNeedsApproval] = useState<boolean | null>(null);

  // Check if entity needs approval on first render
  useState(() => {
    if (!activeOrgId || !entityData) return;
    approvalService
      .checkNeedsApproval(activeOrgId, entityType, entityData)
      .then(({ needsApproval: needs }) => setNeedsApproval(needs));
  });

  const handleSubmit = async () => {
    if (!activeOrgId || !user) return;

    setSubmitting(true);
    try {
      const result = await approvalService.submitForApproval(
        activeOrgId,
        entityType,
        entityId,
        user.id,
      );

      if (result.success) {
        toast.success('Submitted for approval');
        onSubmitted?.();
      } else {
        toast.error(result.error || 'Failed to submit for approval');
      }
    } catch {
      toast.error('Failed to submit for approval');
    } finally {
      setSubmitting(false);
    }
  };

  // If we checked and it doesn't need approval, don't render
  if (needsApproval === false) return null;

  return (
    <button
      onClick={handleSubmit}
      disabled={submitting}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
        submitting
          ? 'bg-gray-100 text-gray-500'
          : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
      } ${className}`}
    >
      {submitting ? (
        <>
          <CheckCircle2 className="w-4 h-4 animate-spin" />
          Submitting...
        </>
      ) : (
        <>
          <Send className="w-4 h-4" />
          Submit for Approval
        </>
      )}
    </button>
  );
}
