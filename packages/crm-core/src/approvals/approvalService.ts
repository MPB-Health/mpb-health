import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ApprovalProcess,
  ApprovalProcessWithSteps,
  ApprovalProcessCreateInput,
  ApprovalProcessUpdateInput,
  ApprovalRequest,
  ApprovalRequestWithRelations,
  ApprovalAction,
  ApprovalStep,
  ApprovalEntityType,
  TriggerCondition,
} from './types';

export class ApprovalService {
  constructor(private supabase: SupabaseClient) {}

  // ─── Process CRUD ──────────────────────────────────────────────────

  async getProcesses(orgId: string): Promise<ApprovalProcess[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_approval_processes')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to list approval processes:', error);
        return [];
      }
      return data as ApprovalProcess[];
    } catch (err) {
      console.error('List approval processes error:', err);
      return [];
    }
  }

  async getProcess(id: string): Promise<ApprovalProcessWithSteps | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_approval_processes')
        .select(`
          *,
          steps:crm_approval_steps(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get approval process:', error);
        return null;
      }

      const process = data as ApprovalProcessWithSteps;
      // Sort steps by order
      process.steps = (process.steps || []).sort((a, b) => a.step_order - b.step_order);
      return process;
    } catch (err) {
      console.error('Get approval process error:', err);
      return null;
    }
  }

  async createProcess(
    input: ApprovalProcessCreateInput,
  ): Promise<{ success: boolean; data?: ApprovalProcess; error?: string }> {
    try {
      // Insert the process
      const { data: process, error: processError } = await this.supabase
        .from('crm_approval_processes')
        .insert({
          org_id: input.org_id,
          name: input.name,
          description: input.description ?? null,
          entity_type: input.entity_type,
          trigger_conditions: input.trigger_conditions,
          is_active: input.is_active ?? true,
        })
        .select()
        .single();

      if (processError) return { success: false, error: processError.message };

      // Insert steps
      if (input.steps.length > 0) {
        const stepsToInsert = input.steps.map((s) => ({
          process_id: process.id,
          step_order: s.step_order,
          approver_type: s.approver_type,
          approver_id: s.approver_id ?? null,
          role_name: s.role_name ?? null,
          action_on_reject: s.action_on_reject ?? 'reject',
          auto_approve_after_hours: s.auto_approve_after_hours ?? null,
        }));

        const { error: stepsError } = await this.supabase
          .from('crm_approval_steps')
          .insert(stepsToInsert);

        if (stepsError) {
          console.error('Failed to insert approval steps:', stepsError);
          // Process was created, but steps failed — still return process
        }
      }

      return { success: true, data: process as ApprovalProcess };
    } catch (err) {
      console.error('Create approval process error:', err);
      return { success: false, error: 'Failed to create process' };
    }
  }

  async updateProcess(
    id: string,
    updates: ApprovalProcessUpdateInput,
  ): Promise<{ success: boolean; data?: ApprovalProcess; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('crm_approval_processes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: data as ApprovalProcess };
    } catch (err) {
      console.error('Update approval process error:', err);
      return { success: false, error: 'Failed to update process' };
    }
  }

  async deleteProcess(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_approval_processes')
        .delete()
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      console.error('Delete approval process error:', err);
      return { success: false, error: 'Failed to delete process' };
    }
  }

  async toggleProcess(
    id: string,
    isActive: boolean,
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateProcess(id, { is_active: isActive });
  }

  // ─── Steps management ─────────────────────────────────────────────

  async replaceSteps(
    processId: string,
    steps: ApprovalProcessCreateInput['steps'],
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete existing steps
      await this.supabase
        .from('crm_approval_steps')
        .delete()
        .eq('process_id', processId);

      // Insert new steps
      if (steps.length > 0) {
        const stepsToInsert = steps.map((s) => ({
          process_id: processId,
          step_order: s.step_order,
          approver_type: s.approver_type,
          approver_id: s.approver_id ?? null,
          role_name: s.role_name ?? null,
          action_on_reject: s.action_on_reject ?? 'reject',
          auto_approve_after_hours: s.auto_approve_after_hours ?? null,
        }));

        const { error } = await this.supabase
          .from('crm_approval_steps')
          .insert(stepsToInsert);

        if (error) return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Replace approval steps error:', err);
      return { success: false, error: 'Failed to replace steps' };
    }
  }

  // ─── Submission & Matching ─────────────────────────────────────────

  async submitForApproval(
    orgId: string,
    entityType: ApprovalEntityType,
    entityId: string,
    requestedBy: string,
    notes?: string,
  ): Promise<{ success: boolean; data?: ApprovalRequest; error?: string }> {
    try {
      // Find matching active process
      const { data: processes, error: pErr } = await this.supabase
        .from('crm_approval_processes')
        .select('*')
        .eq('org_id', orgId)
        .eq('entity_type', entityType)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1);

      if (pErr || !processes?.length) {
        return { success: false, error: 'No active approval process found for this entity type' };
      }

      const process = processes[0];

      const { data, error } = await this.supabase
        .from('crm_approval_requests')
        .insert({
          process_id: process.id,
          org_id: orgId,
          entity_type: entityType,
          entity_id: entityId,
          requested_by: requestedBy,
          status: 'pending',
          current_step: 1,
          notes: notes ?? null,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: data as ApprovalRequest };
    } catch (err) {
      console.error('Submit for approval error:', err);
      return { success: false, error: 'Failed to submit for approval' };
    }
  }

  // ─── My pending approvals (approvals waiting for my action) ────────

  async getMyPendingApprovals(userId: string, orgId: string): Promise<ApprovalRequestWithRelations[]> {
    try {
      // Get all pending requests for the org
      const { data: requests, error } = await this.supabase
        .from('crm_approval_requests')
        .select(`
          *,
          process:crm_approval_processes(*),
          actions:crm_approval_actions(*),
          steps:crm_approval_processes!inner(
            steps:crm_approval_steps(*)
          )
        `)
        .eq('org_id', orgId)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Failed to get pending approvals:', error);
        return [];
      }

      // Filter to only requests where the current step's approver matches the user
      const result: ApprovalRequestWithRelations[] = [];
      for (const req of (requests || [])) {
        const allSteps: ApprovalStep[] = req.steps?.steps || [];
        const currentStep = allSteps.find((s: ApprovalStep) => s.step_order === req.current_step);
        if (!currentStep) continue;

        const isMyApproval =
          (currentStep.approver_type === 'user' && currentStep.approver_id === userId) ||
          currentStep.approver_type === 'manager' || // simplified: all managers can approve
          currentStep.approver_type === 'role'; // simplified: anyone with the role can approve

        if (isMyApproval) {
          result.push({
            ...req,
            process: req.process,
            actions: req.actions || [],
            steps: allSteps.sort((a: ApprovalStep, b: ApprovalStep) => a.step_order - b.step_order),
          });
        }
      }

      return result;
    } catch (err) {
      console.error('Get my pending approvals error:', err);
      return [];
    }
  }

  // ─── My submissions ───────────────────────────────────────────────

  async getMySubmissions(userId: string, orgId: string): Promise<ApprovalRequestWithRelations[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_approval_requests')
        .select(`
          *,
          process:crm_approval_processes(*),
          actions:crm_approval_actions(*)
        `)
        .eq('org_id', orgId)
        .eq('requested_by', userId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Failed to get my submissions:', error);
        return [];
      }

      // Fetch steps for each process
      const processIds = [...new Set((data || []).map((r: ApprovalRequest) => r.process_id))];
      const { data: allSteps } = await this.supabase
        .from('crm_approval_steps')
        .select('*')
        .in('process_id', processIds)
        .order('step_order', { ascending: true });

      const stepsByProcess = new Map<string, ApprovalStep[]>();
      for (const step of (allSteps || [])) {
        const arr = stepsByProcess.get(step.process_id) || [];
        arr.push(step as ApprovalStep);
        stepsByProcess.set(step.process_id, arr);
      }

      return (data || []).map((req: any) => ({
        ...req,
        steps: stepsByProcess.get(req.process_id) || [],
      }));
    } catch (err) {
      console.error('Get my submissions error:', err);
      return [];
    }
  }

  // ─── All requests (admin) ─────────────────────────────────────────

  async getAllRequests(orgId: string): Promise<ApprovalRequestWithRelations[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_approval_requests')
        .select(`
          *,
          process:crm_approval_processes(*),
          actions:crm_approval_actions(*)
        `)
        .eq('org_id', orgId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Failed to get all requests:', error);
        return [];
      }

      const processIds = [...new Set((data || []).map((r: ApprovalRequest) => r.process_id))];
      const { data: allSteps } = await this.supabase
        .from('crm_approval_steps')
        .select('*')
        .in('process_id', processIds)
        .order('step_order', { ascending: true });

      const stepsByProcess = new Map<string, ApprovalStep[]>();
      for (const step of (allSteps || [])) {
        const arr = stepsByProcess.get(step.process_id) || [];
        arr.push(step as ApprovalStep);
        stepsByProcess.set(step.process_id, arr);
      }

      return (data || []).map((req: any) => ({
        ...req,
        steps: stepsByProcess.get(req.process_id) || [],
      }));
    } catch (err) {
      console.error('Get all requests error:', err);
      return [];
    }
  }

  // ─── Approve / Reject / Recall ────────────────────────────────────

  async approveStep(
    requestId: string,
    approverId: string,
    comments?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get request with steps
      const { data: request, error: reqErr } = await this.supabase
        .from('crm_approval_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (reqErr || !request) return { success: false, error: 'Request not found' };
      if (request.status !== 'pending') return { success: false, error: 'Request is not pending' };

      // Get current step
      const { data: steps } = await this.supabase
        .from('crm_approval_steps')
        .select('*')
        .eq('process_id', request.process_id)
        .order('step_order', { ascending: true });

      const currentStep = (steps || []).find((s: ApprovalStep) => s.step_order === request.current_step);
      if (!currentStep) return { success: false, error: 'Current step not found' };

      // Record the action
      const { error: actionErr } = await this.supabase
        .from('crm_approval_actions')
        .insert({
          request_id: requestId,
          step_id: currentStep.id,
          approver_id: approverId,
          action: 'approved',
          comments: comments ?? null,
        });

      if (actionErr) return { success: false, error: actionErr.message };

      // Check if there's a next step
      const maxStep = Math.max(...(steps || []).map((s: ApprovalStep) => s.step_order));
      if (request.current_step >= maxStep) {
        // All steps approved — mark as approved
        await this.supabase
          .from('crm_approval_requests')
          .update({ status: 'approved', completed_at: new Date().toISOString() })
          .eq('id', requestId);
      } else {
        // Advance to next step
        await this.supabase
          .from('crm_approval_requests')
          .update({ current_step: request.current_step + 1 })
          .eq('id', requestId);
      }

      return { success: true };
    } catch (err) {
      console.error('Approve step error:', err);
      return { success: false, error: 'Failed to approve' };
    }
  }

  async rejectStep(
    requestId: string,
    approverId: string,
    comments?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: request, error: reqErr } = await this.supabase
        .from('crm_approval_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (reqErr || !request) return { success: false, error: 'Request not found' };
      if (request.status !== 'pending') return { success: false, error: 'Request is not pending' };

      // Get current step
      const { data: steps } = await this.supabase
        .from('crm_approval_steps')
        .select('*')
        .eq('process_id', request.process_id)
        .order('step_order', { ascending: true });

      const currentStep = (steps || []).find((s: ApprovalStep) => s.step_order === request.current_step);
      if (!currentStep) return { success: false, error: 'Current step not found' };

      // Record the action
      const { error: actionErr } = await this.supabase
        .from('crm_approval_actions')
        .insert({
          request_id: requestId,
          step_id: currentStep.id,
          approver_id: approverId,
          action: 'rejected',
          comments: comments ?? null,
        });

      if (actionErr) return { success: false, error: actionErr.message };

      // Handle rejection based on step config
      if (currentStep.action_on_reject === 'go_back' && request.current_step > 1) {
        await this.supabase
          .from('crm_approval_requests')
          .update({ current_step: request.current_step - 1 })
          .eq('id', requestId);
      } else {
        // Default: reject the entire request
        await this.supabase
          .from('crm_approval_requests')
          .update({ status: 'rejected', completed_at: new Date().toISOString() })
          .eq('id', requestId);
      }

      return { success: true };
    } catch (err) {
      console.error('Reject step error:', err);
      return { success: false, error: 'Failed to reject' };
    }
  }

  async recallRequest(
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: request, error: reqErr } = await this.supabase
        .from('crm_approval_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (reqErr || !request) return { success: false, error: 'Request not found' };
      if (request.requested_by !== userId) return { success: false, error: 'Only the submitter can recall' };
      if (request.status !== 'pending') return { success: false, error: 'Can only recall pending requests' };

      const { error } = await this.supabase
        .from('crm_approval_requests')
        .update({ status: 'recalled', completed_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      console.error('Recall request error:', err);
      return { success: false, error: 'Failed to recall' };
    }
  }

  // ─── History & checks ─────────────────────────────────────────────

  async getApprovalHistory(
    entityType: ApprovalEntityType,
    entityId: string,
  ): Promise<ApprovalRequestWithRelations[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_approval_requests')
        .select(`
          *,
          process:crm_approval_processes(*),
          actions:crm_approval_actions(*)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Failed to get approval history:', error);
        return [];
      }

      const processIds = [...new Set((data || []).map((r: ApprovalRequest) => r.process_id))];
      let allSteps: ApprovalStep[] = [];
      if (processIds.length > 0) {
        const { data: stepsData } = await this.supabase
          .from('crm_approval_steps')
          .select('*')
          .in('process_id', processIds)
          .order('step_order', { ascending: true });
        allSteps = (stepsData || []) as ApprovalStep[];
      }

      const stepsByProcess = new Map<string, ApprovalStep[]>();
      for (const step of allSteps) {
        const arr = stepsByProcess.get(step.process_id) || [];
        arr.push(step);
        stepsByProcess.set(step.process_id, arr);
      }

      return (data || []).map((req: any) => ({
        ...req,
        steps: stepsByProcess.get(req.process_id) || [],
      }));
    } catch (err) {
      console.error('Get approval history error:', err);
      return [];
    }
  }

  async checkNeedsApproval(
    orgId: string,
    entityType: ApprovalEntityType,
    entityData: Record<string, unknown>,
  ): Promise<{ needsApproval: boolean; process?: ApprovalProcess }> {
    try {
      const { data: processes, error } = await this.supabase
        .from('crm_approval_processes')
        .select('*')
        .eq('org_id', orgId)
        .eq('entity_type', entityType)
        .eq('is_active', true);

      if (error || !processes?.length) {
        return { needsApproval: false };
      }

      for (const process of processes as ApprovalProcess[]) {
        const conditions = process.trigger_conditions || [];
        if (conditions.length === 0) continue;

        const allMatch = conditions.every((cond: TriggerCondition) => {
          const fieldValue = entityData[cond.field];
          if (fieldValue === undefined || fieldValue === null) return false;

          switch (cond.operator) {
            case 'gt': return Number(fieldValue) > Number(cond.value);
            case 'gte': return Number(fieldValue) >= Number(cond.value);
            case 'lt': return Number(fieldValue) < Number(cond.value);
            case 'lte': return Number(fieldValue) <= Number(cond.value);
            case 'eq': return String(fieldValue) === String(cond.value);
            case 'neq': return String(fieldValue) !== String(cond.value);
            case 'contains': return String(fieldValue).toLowerCase().includes(String(cond.value).toLowerCase());
            default: return false;
          }
        });

        if (allMatch) {
          return { needsApproval: true, process };
        }
      }

      return { needsApproval: false };
    } catch (err) {
      console.error('Check needs approval error:', err);
      return { needsApproval: false };
    }
  }
}

export function createApprovalService(supabase: SupabaseClient): ApprovalService {
  return new ApprovalService(supabase);
}
