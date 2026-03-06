import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Settings2,
  Plus,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GradientHeader } from '@mpbhealth/ui';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import CreateProcessModal from '../components/approvals/CreateProcessModal';
import type {
  ApprovalProcess,
  ApprovalProcessWithSteps,
  ApprovalProcessCreateInput,
  ApprovalStepCreateInput,
} from '@mpbhealth/crm-core';

const ENTITY_LABELS: Record<string, string> = {
  deal: 'Deal',
  quote: 'Quote',
  invoice: 'Invoice',
  discount: 'Discount',
};

export default function ApprovalProcesses() {
  const { approvalService } = useCRM();
  const { activeOrgId } = useOrg();

  const [processes, setProcesses] = useState<ApprovalProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<
    (ApprovalProcess & { steps?: ApprovalStepCreateInput[] }) | undefined
  >(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<ApprovalProcessWithSteps | null>(null);

  const loadProcesses = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    const data = await approvalService.getProcesses(activeOrgId);
    setProcesses(data);
    setLoading(false);
  }, [activeOrgId, approvalService]);

  useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  const handleToggle = async (process: ApprovalProcess) => {
    const result = await approvalService.toggleProcess(process.id, !process.is_active);
    if (result.success) {
      toast.success(process.is_active ? 'Process deactivated' : 'Process activated');
      loadProcesses();
    } else {
      toast.error('Failed to toggle process');
    }
  };

  const handleDelete = async (process: ApprovalProcess) => {
    if (!confirm(`Delete process "${process.name}"?`)) return;
    const result = await approvalService.deleteProcess(process.id);
    if (result.success) {
      toast.success('Process deleted');
      loadProcesses();
    } else {
      toast.error(result.error || 'Failed to delete process');
    }
  };

  const handleExpand = async (processId: string) => {
    if (expandedId === processId) {
      setExpandedId(null);
      setExpandedDetails(null);
      return;
    }
    setExpandedId(processId);
    const details = await approvalService.getProcess(processId);
    setExpandedDetails(details);
  };

  const openCreate = () => {
    setEditingProcess(undefined);
    setModalOpen(true);
  };

  const openEdit = async (process: ApprovalProcess) => {
    const details = await approvalService.getProcess(process.id);
    setEditingProcess({
      ...process,
      steps: details?.steps?.map((s) => ({
        step_order: s.step_order,
        approver_type: s.approver_type,
        approver_id: s.approver_id ?? undefined,
        role_name: s.role_name ?? undefined,
        action_on_reject: s.action_on_reject,
        auto_approve_after_hours: s.auto_approve_after_hours ?? undefined,
      })),
    });
    setModalOpen(true);
  };

  const handleSave = async (input: ApprovalProcessCreateInput) => {
    if (editingProcess) {
      // Update process
      const updateResult = await approvalService.updateProcess(editingProcess.id, {
        name: input.name,
        description: input.description,
        entity_type: input.entity_type,
        trigger_conditions: input.trigger_conditions,
        is_active: input.is_active,
      });
      if (!updateResult.success) {
        toast.error(updateResult.error || 'Failed to update');
        return;
      }
      // Replace steps
      const stepsResult = await approvalService.replaceSteps(editingProcess.id, input.steps);
      if (!stepsResult.success) {
        toast.error('Process updated but steps failed to save');
      } else {
        toast.success('Process updated');
      }
    } else {
      const result = await approvalService.createProcess(input);
      if (result.success) {
        toast.success('Process created');
      } else {
        toast.error(result.error || 'Failed to create');
        throw new Error(result.error);
      }
    }
    loadProcesses();
  };

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Approval Processes"
        subtitle="Configure multi-step approval workflows for deals, quotes, invoices, and discounts."
      >
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-white text-th-accent-700 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Process
        </button>
      </GradientHeader>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
        </div>
      )}

      {/* Empty state */}
      {!loading && processes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Settings2 className="w-12 h-12 text-th-text-tertiary mb-3" />
          <p className="text-th-text-secondary font-medium">No approval processes configured</p>
          <p className="text-sm text-th-text-tertiary mt-1">
            Create a process to require approvals for deals, quotes, and more.
          </p>
        </div>
      )}

      {/* Process list */}
      {!loading && processes.length > 0 && (
        <div className="space-y-3">
          {processes.map((process) => (
            <div
              key={process.id}
              className="bg-surface-primary border border-th-border rounded-xl overflow-hidden"
            >
              {/* Process row */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Toggle */}
                  <button onClick={() => handleToggle(process)} className="shrink-0">
                    {process.is_active ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-400" />
                    )}
                  </button>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-th-text-primary truncate">
                        {process.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {ENTITY_LABELS[process.entity_type] ?? process.entity_type}
                      </span>
                      {!process.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          Inactive
                        </span>
                      )}
                    </div>
                    {process.description && (
                      <p className="text-xs text-th-text-tertiary mt-0.5 truncate">
                        {process.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => handleExpand(process.id)}
                    className="p-1.5 text-th-text-tertiary hover:text-th-text-secondary rounded hover:bg-surface-secondary transition-colors"
                    title="View details"
                  >
                    {expandedId === process.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(process)}
                    className="p-1.5 text-th-text-tertiary hover:text-th-accent-600 rounded hover:bg-surface-secondary transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(process)}
                    className="p-1.5 text-th-text-tertiary hover:text-red-600 rounded hover:bg-surface-secondary transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === process.id && expandedDetails && (
                <div className="border-t border-th-border px-4 py-3 bg-surface-secondary space-y-3">
                  {/* Trigger conditions */}
                  <div>
                    <p className="text-xs font-medium text-th-text-secondary uppercase tracking-wider mb-1">
                      Trigger Conditions
                    </p>
                    {expandedDetails.trigger_conditions?.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {expandedDetails.trigger_conditions.map((cond, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200"
                          >
                            {cond.field} {cond.operator} {String(cond.value)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-th-text-tertiary italic">
                        No conditions (always triggers)
                      </p>
                    )}
                  </div>

                  {/* Steps */}
                  <div>
                    <p className="text-xs font-medium text-th-text-secondary uppercase tracking-wider mb-1">
                      Approval Steps ({expandedDetails.steps?.length ?? 0})
                    </p>
                    {expandedDetails.steps?.length > 0 ? (
                      <div className="space-y-1">
                        {expandedDetails.steps.map((step) => (
                          <div
                            key={step.id}
                            className="flex items-center gap-2 text-xs text-th-text-primary"
                          >
                            <span className="w-5 h-5 rounded-full bg-th-accent-100 text-th-accent-700 flex items-center justify-center font-semibold text-[10px]">
                              {step.step_order}
                            </span>
                            <span>
                              {step.approver_type === 'user'
                                ? `User: ${step.approver_id?.slice(0, 8)}...`
                                : step.approver_type === 'role'
                                ? `Role: ${step.role_name}`
                                : 'Manager'}
                            </span>
                            <span className="text-th-text-tertiary">
                              &middot; On reject: {step.action_on_reject}
                            </span>
                            {step.auto_approve_after_hours && (
                              <span className="text-th-text-tertiary">
                                &middot; Auto-approve after {step.auto_approve_after_hours}h
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-th-text-tertiary italic">No steps configured</p>
                    )}
                  </div>

                  {/* Meta */}
                  <p className="text-xs text-th-text-tertiary">
                    Created {format(new Date(process.created_at), 'MMM d, yyyy')}
                    {process.updated_at !== process.created_at &&
                      ` · Updated ${format(new Date(process.updated_at), 'MMM d, yyyy')}`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {modalOpen && activeOrgId && (
        <CreateProcessModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingProcess(undefined);
          }}
          orgId={activeOrgId}
          editingProcess={editingProcess}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
