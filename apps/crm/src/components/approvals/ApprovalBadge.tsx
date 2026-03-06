import { CheckCircle2, XCircle, Clock, Undo2 } from 'lucide-react';
import type { ApprovalStatus } from '@mpbhealth/crm-core';

interface ApprovalBadgeProps {
  status: ApprovalStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; bg: string; text: string; icon: typeof Clock }> = {
  pending: { label: 'Pending Approval', bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock },
  approved: { label: 'Approved', bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
  recalled: { label: 'Recalled', bg: 'bg-gray-100', text: 'text-gray-700', icon: Undo2 },
};

export default function ApprovalBadge({ status, size = 'sm' }: ApprovalBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${config.bg} ${config.text} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
}
