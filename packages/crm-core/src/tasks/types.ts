// Task types
export type TaskType = 'follow_up' | 'call' | 'email' | 'meeting' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high';

// Lead task record
export interface LeadTask {
  id: string;
  lead_id: string;
  title: string;
  description?: string;
  task_type: TaskType;
  due_date: string;
  due_time?: string;
  priority: TaskPriority;
  completed: boolean;
  completed_at?: string;
  completed_by?: string;
  assigned_to?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

// Task creation input
export interface TaskCreateInput {
  lead_id: string;
  title: string;
  description?: string;
  task_type: TaskType;
  due_date: string;
  due_time?: string;
  priority: TaskPriority;
  assigned_to?: string;
}

// Task update input
export interface TaskUpdateInput {
  title?: string;
  description?: string;
  task_type?: TaskType;
  due_date?: string;
  due_time?: string;
  priority?: TaskPriority;
  assigned_to?: string;
}
