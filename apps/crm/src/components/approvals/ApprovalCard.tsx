import { useState } from 'react';
import { CheckCircle2, XCircle, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import type { ApprovalRequestWithRelations } from '@mpbhealth/crm-core';
import ApprovalBadge from './ApprovalBadge';
import ApprovalTimeline from './ApprovalTimeline';

interface ApprovalCardProps {
  request: ApprovalRequestWithRelations;
  onApprove: (requestId: string, comments: string) => Promise<void>;
  onReject: (requestId: string, comments: string) => Promise<void>;
  showActions?: boolean;
}

const ENTITY_LABELS: Record<string, string> = {
  deal: 'Deal',
  quote: 'Quote',
  invoice: 'Invoice',
  discount: 'Discount',
};

export default function ApprovalCard({ request, onApprove, onReject, showActions = true }: ApprovalCardProps) {
  const [comments, setComments] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [acting, setActing] = useState(false);

  const handleApprove = async () => {
    setActing(true);
    try {
      await onApprove(request.id, comments);
      setComments('');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    setActing(true);
    try {
      await onReject(request.id, comments);
      setComments('');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="bg-surface-primary border border-th-border rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-th-text-primary">
              {request.process?.name ?? 'Approval Request'}
            </span>
            <ApprovalBadge status={request.status} />
          </div>
          <p className="text-xs text-th-text-tertiary mt-0.5">
            {ENTITY_LABELS[request.entity_type] ?? request.entity_type} &middot;{' '}
            Submitted {format(new Date(request.submitted_at), 'MMM d, yyyy h:mm a')}
          </p>
          {request.notes && (
            <p className="text-xs text-th-text-secondary mt-1">
              Note: {request.notes}
            </p>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-th-text-tertiary hover:text-th-text-secondary rounded"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable timeline */}
      {expanded && request.steps?.length > 0 && (
        <div className="pt-2 border-t border-th-border">
          <ApprovalTimeline
            steps={request.steps}
            actions={request.actions || []}
            currentStep={request.current_step}
            status={request.status}
          />
        </div>
      )}

      {/* Actions */}
      {showActions && request.status === 'pending' && (
        <div className="pt-2 border-t border-th-border space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-th-text-tertiary" />
            <input
              type="text"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add a comment (optional)..."
              className="flex-1 text-sm px-2 py-1.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={acting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={handleReject}
              disabled={acting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
