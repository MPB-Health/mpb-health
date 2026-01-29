import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  UserGoal,
  GoalCreateInput,
  GoalUpdateInput,
  GoalStatus,
  ServiceResult,
} from './types';

// ============================================================================
// User Goals Service
// Goals tracking for the Goals widget
// ============================================================================

export class UserGoalsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all goals for the current user in an organization
   */
  async getGoals(orgId: string, options?: {
    status?: GoalStatus;
    includeExpired?: boolean;
  }): Promise<UserGoal[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return [];

      let query = this.supabase
        .from('crm_user_goals')
        .select('*')
        .eq('org_id', orgId)
        .or(`user_id.eq.${user.id},assigned_by.eq.${user.id}`)
        .order('end_date', { ascending: true });

      if (options?.status) {
        query = query.eq('status', options.status);
      } else if (!options?.includeExpired) {
        // By default, only show active goals
        query = query.eq('status', 'active');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get goals:', error);
        return [];
      }

      return (data || []) as UserGoal[];
    } catch (error) {
      console.error('Get goals error:', error);
      return [];
    }
  }

  /**
   * Get active goals for the current user
   */
  async getActiveGoals(orgId: string): Promise<UserGoal[]> {
    return this.getGoals(orgId, { status: 'active' });
  }

  /**
   * Get completed goals
   */
  async getCompletedGoals(orgId: string): Promise<UserGoal[]> {
    return this.getGoals(orgId, { status: 'completed' });
  }

  /**
   * Get a single goal by ID
   */
  async getGoal(goalId: string): Promise<UserGoal | null> {
    try {
      const { data, error } = await this.supabase
        .from('crm_user_goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (error) {
        console.error('Failed to get goal:', error);
        return null;
      }

      return data as UserGoal;
    } catch (error) {
      console.error('Get goal error:', error);
      return null;
    }
  }

  /**
   * Create a new goal (personal or admin-assigned)
   */
  async createGoal(
    orgId: string,
    input: GoalCreateInput
  ): Promise<ServiceResult<UserGoal>> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Determine if this is a personal goal or assigned to someone else
      const isPersonal = !input.assigned_to || input.assigned_to === user.id;
      const targetUserId = input.assigned_to || user.id;

      const { data, error } = await this.supabase
        .from('crm_user_goals')
        .insert({
          user_id: targetUserId,
          org_id: orgId,
          name: input.name,
          description: input.description,
          target_value: input.target_value,
          current_value: 0,
          metric_type: input.metric_type,
          period: input.period,
          start_date: input.start_date,
          end_date: input.end_date,
          is_personal: isPersonal,
          assigned_by: isPersonal ? null : user.id,
          status: 'active',
          icon: input.icon || 'target',
          color: input.color || 'violet',
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as UserGoal };
    } catch (error) {
      console.error('Create goal error:', error);
      return { success: false, error: 'Failed to create goal' };
    }
  }

  /**
   * Update a goal
   */
  async updateGoal(
    goalId: string,
    input: GoalUpdateInput
  ): Promise<ServiceResult<UserGoal>> {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.target_value !== undefined) updateData.target_value = input.target_value;
      if (input.current_value !== undefined) updateData.current_value = input.current_value;
      if (input.status !== undefined) {
        updateData.status = input.status;
        if (input.status === 'completed') {
          updateData.completed_at = new Date().toISOString();
        }
      }
      if (input.icon !== undefined) updateData.icon = input.icon;
      if (input.color !== undefined) updateData.color = input.color;

      const { data, error } = await this.supabase
        .from('crm_user_goals')
        .update(updateData)
        .eq('id', goalId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as UserGoal };
    } catch (error) {
      console.error('Update goal error:', error);
      return { success: false, error: 'Failed to update goal' };
    }
  }

  /**
   * Increment goal progress
   */
  async incrementProgress(goalId: string, amount: number = 1): Promise<ServiceResult<UserGoal>> {
    try {
      // Get current goal
      const goal = await this.getGoal(goalId);
      if (!goal) {
        return { success: false, error: 'Goal not found' };
      }

      const newValue = goal.current_value + amount;
      const isCompleted = newValue >= goal.target_value;

      return this.updateGoal(goalId, {
        current_value: newValue,
        status: isCompleted ? 'completed' : 'active',
      });
    } catch (error) {
      console.error('Increment progress error:', error);
      return { success: false, error: 'Failed to increment progress' };
    }
  }

  /**
   * Mark a goal as completed
   */
  async completeGoal(goalId: string): Promise<ServiceResult<UserGoal>> {
    return this.updateGoal(goalId, { status: 'completed' });
  }

  /**
   * Cancel a goal
   */
  async cancelGoal(goalId: string): Promise<ServiceResult<UserGoal>> {
    return this.updateGoal(goalId, { status: 'cancelled' });
  }

  /**
   * Reactivate a goal
   */
  async reactivateGoal(goalId: string): Promise<ServiceResult<UserGoal>> {
    try {
      const { data, error } = await this.supabase
        .from('crm_user_goals')
        .update({
          status: 'active',
          completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as UserGoal };
    } catch (error) {
      console.error('Reactivate goal error:', error);
      return { success: false, error: 'Failed to reactivate goal' };
    }
  }

  /**
   * Delete a goal
   */
  async deleteGoal(goalId: string): Promise<ServiceResult> {
    try {
      const { error } = await this.supabase
        .from('crm_user_goals')
        .delete()
        .eq('id', goalId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete goal error:', error);
      return { success: false, error: 'Failed to delete goal' };
    }
  }

  /**
   * Get goals assigned by the current user to others (admin view)
   */
  async getAssignedGoals(orgId: string): Promise<UserGoal[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('crm_user_goals')
        .select('*')
        .eq('org_id', orgId)
        .eq('assigned_by', user.id)
        .eq('is_personal', false)
        .order('end_date', { ascending: true });

      if (error) {
        console.error('Failed to get assigned goals:', error);
        return [];
      }

      return (data || []) as UserGoal[];
    } catch (error) {
      console.error('Get assigned goals error:', error);
      return [];
    }
  }

  /**
   * Check and update expired goals
   */
  async checkExpiredGoals(orgId: string): Promise<number> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return 0;

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await this.supabase
        .from('crm_user_goals')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .lt('end_date', today)
        .select('id');

      if (error) {
        console.error('Failed to check expired goals:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Check expired goals error:', error);
      return 0;
    }
  }

  /**
   * Get goal progress percentage
   */
  getProgressPercentage(goal: UserGoal): number {
    if (goal.target_value <= 0) return 0;
    return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  }

  /**
   * Get days remaining for a goal
   */
  getDaysRemaining(goal: UserGoal): number {
    const endDate = new Date(goal.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// Factory function
export function createUserGoalsService(supabase: SupabaseClient): UserGoalsService {
  return new UserGoalsService(supabase);
}
