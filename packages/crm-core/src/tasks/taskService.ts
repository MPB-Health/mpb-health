import type { SupabaseClient } from '@supabase/supabase-js';
import type { LeadTask, TaskCreateInput, TaskUpdateInput } from './types';

export class TaskService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get tasks, optionally filtered by lead
   */
  async getTasks(leadId?: string, includeCompleted: boolean = false): Promise<LeadTask[]> {
    try {
      let query = this.supabase
        .from('lead_tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      if (!includeCompleted) {
        query = query.eq('completed', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get tasks:', error);
        return [];
      }

      return data as LeadTask[];
    } catch (error) {
      console.error('Get tasks error:', error);
      return [];
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<LeadTask[]> {
    try {
      const { data, error } = await this.supabase
        .from('lead_tasks')
        .select('*')
        .eq('completed', false)
        .lt('due_date', new Date().toISOString())
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Failed to get overdue tasks:', error);
        return [];
      }

      return data as LeadTask[];
    } catch (error) {
      console.error('Get overdue tasks error:', error);
      return [];
    }
  }

  /**
   * Get tasks due today
   */
  async getTasksDueToday(): Promise<LeadTask[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      ).toISOString();
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      ).toISOString();

      const { data, error } = await this.supabase
        .from('lead_tasks')
        .select('*')
        .eq('completed', false)
        .gte('due_date', startOfDay)
        .lt('due_date', endOfDay)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Failed to get tasks due today:', error);
        return [];
      }

      return data as LeadTask[];
    } catch (error) {
      console.error('Get tasks due today error:', error);
      return [];
    }
  }

  /**
   * Get a single task by ID
   */
  async getTask(id: string): Promise<LeadTask | null> {
    try {
      const { data, error } = await this.supabase
        .from('lead_tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to get task:', error);
        return null;
      }

      return data as LeadTask;
    } catch (error) {
      console.error('Get task error:', error);
      return null;
    }
  }

  /**
   * Create a new task
   */
  async createTask(
    task: TaskCreateInput
  ): Promise<{ success: boolean; taskId?: string; error?: string }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      const { data, error } = await this.supabase
        .from('lead_tasks')
        .insert({
          ...task,
          created_by: user?.id,
          completed: false,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Update next followup date on lead
      await this.supabase
        .from('lead_submissions')
        .update({ next_followup_at: task.due_date })
        .eq('id', task.lead_id);

      // Log activity
      await this.supabase.from('lead_activities').insert({
        lead_id: task.lead_id,
        activity_type: 'task_created',
        title: 'Task Created',
        description: task.title,
        metadata: { task_id: data?.id, due_date: task.due_date },
        created_by: user?.id,
      });

      return { success: true, taskId: data?.id };
    } catch (error) {
      console.error('Create task error:', error);
      return { success: false, error: 'Failed to create task' };
    }
  }

  /**
   * Update a task
   */
  async updateTask(
    id: string,
    updates: TaskUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('lead_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update task error:', error);
      return { success: false, error: 'Failed to update task' };
    }
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      const { data: task, error: fetchError } = await this.supabase
        .from('lead_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (fetchError || !task) {
        return { success: false, error: 'Task not found' };
      }

      const { error } = await this.supabase
        .from('lead_tasks')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          completed_by: user?.id,
        })
        .eq('id', taskId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity
      await this.supabase.from('lead_activities').insert({
        lead_id: task.lead_id,
        activity_type: 'task_completed',
        title: 'Task Completed',
        description: task.title,
        metadata: { task_id: taskId },
        created_by: user?.id,
      });

      return { success: true };
    } catch (error) {
      console.error('Complete task error:', error);
      return { success: false, error: 'Failed to complete task' };
    }
  }

  /**
   * Reopen a completed task
   */
  async reopenTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('lead_tasks')
        .update({
          completed: false,
          completed_at: null,
          completed_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Reopen task error:', error);
      return { success: false, error: 'Failed to reopen task' };
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('lead_tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete task error:', error);
      return { success: false, error: 'Failed to delete task' };
    }
  }
}

// Factory function
export function createTaskService(supabase: SupabaseClient): TaskService {
  return new TaskService(supabase);
}
