import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Case,
  CaseWithRelations,
  CaseComment,
  CaseFilters,
  CaseCreateInput,
  CaseUpdateInput,
  CaseCommentCreateInput,
} from './caseTypes';
import { sanitizeSearchInput } from '../utils/sanitize';

export class CaseService {
  constructor(private supabase: SupabaseClient) {}

  async getCases(
    filters: CaseFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<{ cases: CaseWithRelations[]; total: number }> {
    try {
      let query = this.supabase
        .from('crm_cases')
        .select(`
          *,
          account:crm_accounts(id, name),
          contact:crm_contacts(id, first_name, last_name, email)
        `, { count: 'exact' });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.origin) {
        query = query.eq('origin', filters.origin);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.account_id) {
        query = query.eq('account_id', filters.account_id);
      }
      if (filters.contact_id) {
        query = query.eq('contact_id', filters.contact_id);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.search) {
        const safe = sanitizeSearchInput(filters.search);
        query = query.or(
          `subject.ilike.%${safe}%,case_number.ilike.%${safe}%,description.ilike.%${safe}%`
        );
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Failed to get cases:', error);
        return { cases: [], total: 0 };
      }

      return { cases: data as CaseWithRelations[], total: count || 0 };
    } catch (error) {
      console.error('Get cases error:', error);
      return { cases: [], total: 0 };
    }
  }

  async getCase(id: string): Promise<CaseWithRelations | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_cases')
        .select(`
          *,
          account:crm_accounts(id, name),
          contact:crm_contacts(id, first_name, last_name, email),
          owner:profiles!crm_cases_owner_id_fkey(id, full_name, email),
          assigned_user:profiles!crm_cases_assigned_to_fkey(id, full_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get case:', error);
        return null;
      }

      return data as CaseWithRelations;
    } catch (error) {
      console.error('Get case error:', error);
      return null;
    }
  }

  async createCase(
    input: CaseCreateInput
  ): Promise<{ success: boolean; case?: Case; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('crm_cases')
        .insert({
          ...input,
          case_number: '',
          status: input.status || 'new',
          priority: input.priority || 'medium',
          origin: input.origin || 'web',
          tags: input.tags || [],
          metadata: {},
          created_by: user.user.id,
          owner_id: user.user.id,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, case: data as Case };
    } catch (error) {
      console.error('Create case error:', error);
      return { success: false, error: 'Failed to create case' };
    }
  }

  async updateCase(
    id: string,
    updates: CaseUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const payload: Record<string, unknown> = { ...updates };

      if (updates.status === 'resolved') {
        payload.resolved_at = new Date().toISOString();
      }
      if (updates.status === 'closed') {
        payload.closed_at = new Date().toISOString();
      }
      if (updates.status === 'escalated') {
        payload.escalated_at = new Date().toISOString();
      }

      const { error } = await this.supabase
        .from('crm_cases')
        .update(payload)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update case error:', error);
      return { success: false, error: 'Failed to update case' };
    }
  }

  async deleteCase(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_cases')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete case error:', error);
      return { success: false, error: 'Failed to delete case' };
    }
  }

  async assignCase(
    id: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: existing } = await this.supabase
        .from('crm_cases')
        .select('status')
        .eq('id', id)
        .single();

      if (!existing) {
        return { success: false, error: 'Case not found' };
      }

      const updates: Record<string, unknown> = { assigned_to: userId };
      if (existing.status === 'new') {
        updates.status = 'assigned';
      }

      const { error } = await this.supabase
        .from('crm_cases')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Assign case error:', error);
      return { success: false, error: 'Failed to assign case' };
    }
  }

  async escalateCase(
    id: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_cases')
        .update({
          status: 'escalated',
          escalated_to: userId,
          escalated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Escalate case error:', error);
      return { success: false, error: 'Failed to escalate case' };
    }
  }

  async resolveCase(
    id: string,
    resolution: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_cases')
        .update({
          status: 'resolved',
          resolution,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Resolve case error:', error);
      return { success: false, error: 'Failed to resolve case' };
    }
  }

  async closeCase(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('crm_cases')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Close case error:', error);
      return { success: false, error: 'Failed to close case' };
    }
  }

  async getCaseComments(caseId: string): Promise<CaseComment[]> {
    try {
      const { data, error } = await this.supabase
        .from('crm_case_comments')
        .select(`
          *,
          author:profiles(id, full_name, email)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to get case comments:', error);
        return [];
      }

      return data as CaseComment[];
    } catch (error) {
      console.error('Get case comments error:', error);
      return [];
    }
  }

  async addComment(
    caseId: string,
    input: CaseCommentCreateInput
  ): Promise<{ success: boolean; comment?: CaseComment; error?: string }> {
    try {
      const { data: user } = await this.supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await this.supabase
        .from('crm_case_comments')
        .insert({
          case_id: caseId,
          body: input.body,
          is_internal: input.is_internal ?? false,
          author_id: user.user.id,
        })
        .select(`
          *,
          author:profiles(id, full_name, email)
        `)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // If this is the first response, update first_response_at on the case
      const { data: caseData } = await this.supabase
        .from('crm_cases')
        .select('first_response_at')
        .eq('id', caseId)
        .single();

      if (caseData && !caseData.first_response_at) {
        await this.supabase
          .from('crm_cases')
          .update({ first_response_at: new Date().toISOString() })
          .eq('id', caseId);
      }

      return { success: true, comment: data as CaseComment };
    } catch (error) {
      console.error('Add comment error:', error);
      return { success: false, error: 'Failed to add comment' };
    }
  }
}

export function createCaseService(supabase: SupabaseClient): CaseService {
  return new CaseService(supabase);
}
