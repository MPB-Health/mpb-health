// ─── Entity & status enums ─────────────────────────────────────────────

export type ApprovalEntityType = 'deal' | 'quote' | 'invoice' | 'discount';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'recalled';

export type ApproverType = 'user' | 'role' | 'manager';

export type RejectAction = 'reject' | 'go_back' | 'notify';

export type ApprovalActionType = 'approved' | 'rejected' | 'delegated';

// ─── Trigger condition ─────────────────────────────────────────────────

export interface TriggerCondition {
  field: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'contains';
  value: string | number | boolean;
}

// ─── Approval Process ──────────────────────────────────────────────────

export interface ApprovalProcess {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  entity_type: ApprovalEntityType;
  trigger_conditions: TriggerCondition[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalProcessWithSteps extends ApprovalProcess {
  steps: ApprovalStep[];
}

export interface ApprovalProcessCreateInput {
  org_id: string;
  name: string;
  description?: string;
  entity_type: ApprovalEntityType;
  trigger_conditions: TriggerCondition[];
  is_active?: boolean;
  steps: ApprovalStepCreateInput[];
}

export interface ApprovalProcessUpdateInput {
  name?: string;
  description?: string;
  entity_type?: ApprovalEntityType;
  trigger_conditions?: TriggerCondition[];
  is_active?: boolean;
}

// ─── Approval Step ─────────────────────────────────────────────────────

export interface ApprovalStep {
  id: string;
  process_id: string;
  step_order: number;
  approver_type: ApproverType;
  approver_id: string | null;
  role_name: string | null;
  action_on_reject: RejectAction;
  auto_approve_after_hours: number | null;
  created_at: string;
}

export interface ApprovalStepCreateInput {
  step_order: number;
  approver_type: ApproverType;
  approver_id?: string;
  role_name?: string;
  action_on_reject?: RejectAction;
  auto_approve_after_hours?: number;
}

// ─── Approval Request ──────────────────────────────────────────────────

export interface ApprovalRequest {
  id: string;
  process_id: string;
  org_id: string;
  entity_type: ApprovalEntityType;
  entity_id: string;
  requested_by: string;
  status: ApprovalStatus;
  current_step: number;
  notes: string | null;
  submitted_at: string;
  completed_at: string | null;
}

export interface ApprovalRequestWithRelations extends ApprovalRequest {
  process: ApprovalProcess;
  actions: ApprovalAction[];
  steps: ApprovalStep[];
}

// ─── Approval Action ───────────────────────────────────────────────────

export interface ApprovalAction {
  id: string;
  request_id: string;
  step_id: string;
  approver_id: string;
  action: ApprovalActionType;
  comments: string | null;
  acted_at: string;
}
