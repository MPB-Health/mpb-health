import { CheckCircle2, XCircle, Clock, Circle } from 'lucide-react';
import { format } from 'date-fns';
import type { ApprovalStep, ApprovalAction } from '@mpbhealth/crm-core';

interface ApprovalTimelineProps {
  steps: ApprovalStep[];
  actions: ApprovalAction[];
  currentStep: number;
  status: string;
}

export default function ApprovalTimeline({ steps, actions, currentStep, status }: ApprovalTimelineProps) {
  const getStepStatus = (step: ApprovalStep) => {
    const action = actions.find((a) => a.step_id === step.id);
    if (action) return action.action; // 'approved' | 'rejected' | 'delegated'
    if (status === 'recalled') return 'recalled';
    if (step.step_order === currentStep && status === 'pending') return 'current';
    if (step.step_order < currentStep) return 'approved'; // past steps assumed approved
    return 'waiting';
  };

  const getStepIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case 'approved':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'current':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'recalled':
        return <Circle className="w-5 h-5 text-gray-400" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getApproverLabel = (step: ApprovalStep) => {
    if (step.approver_type === 'user') return `User: ${step.approver_id?.slice(0, 8) ?? 'N/A'}...`;
    if (step.approver_type === 'role') return `Role: ${step.role_name ?? 'N/A'}`;
    return 'Manager';
  };

  return (
    <div className="space-y-0">
      {steps.map((step, idx) => {
        const stepStatus = getStepStatus(step);
        const action = actions.find((a) => a.step_id === step.id);
        const isLast = idx === steps.length - 1;

        return (
          <div key={step.id} className="flex gap-3">
            {/* Vertical line + icon */}
            <div className="flex flex-col items-center">
              {getStepIcon(stepStatus)}
              {!isLast && (
                <div className="w-0.5 flex-1 bg-gray-200 my-1" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-4 ${isLast ? '' : ''}`}>
              <p className="text-sm font-medium text-th-text-primary">
                Step {step.step_order}: {getApproverLabel(step)}
              </p>
              {action && (
                <div className="mt-1">
                  <p className="text-xs text-th-text-tertiary">
                    {action.action === 'approved' ? 'Approved' : action.action === 'rejected' ? 'Rejected' : 'Delegated'}
                    {' '}on {format(new Date(action.acted_at), 'MMM d, yyyy h:mm a')}
                  </p>
                  {action.comments && (
                    <p className="text-xs text-th-text-secondary mt-0.5 italic">
                      &ldquo;{action.comments}&rdquo;
                    </p>
                  )}
                </div>
              )}
              {stepStatus === 'current' && (
                <p className="text-xs text-amber-600 mt-1">Awaiting approval</p>
              )}
              {stepStatus === 'waiting' && (
                <p className="text-xs text-th-text-tertiary mt-1">Pending</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
