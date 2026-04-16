import { useState, useEffect } from 'react';
import { supabase } from '@mpbhealth/database';
import {
  Plus,
  Trash2,
  Check,
  Circle,
  Loader2,
  Calendar,
  AlertTriangle,
  Clock,
  CheckSquare,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done';
  completed_at: string | null;
  created_at: string;
}

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle },
  high: { label: 'High', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: ArrowUp },
  medium: { label: 'Medium', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: ArrowRight },
  low: { label: 'Low', color: 'text-slate-500 bg-slate-50 border-slate-200', icon: ArrowDown },
};

type FilterStatus = 'all' | 'active' | 'done';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  const loadTasks = async () => {
    const { data } = await supabase
      .from('staff_tasks')
      .select('id, title, description, due_date, priority, status, completed_at, created_at')
      .order('status', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    setTasks(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const createTask = async () => {
    if (!newTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    setCreating(true);
    const { data, error } = await supabase
      .from('staff_tasks')
      .insert({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        priority: newPriority,
        due_date: newDueDate || null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create task');
      setCreating(false);
      return;
    }
    setTasks((prev) => [data, ...prev]);
    setNewTitle('');
    setNewDescription('');
    setNewPriority('medium');
    setNewDueDate('');
    setShowCreate(false);
    setCreating(false);
    toast.success('Task created');
  };

  const toggleComplete = async (task: Task) => {
    const done = task.status !== 'done';
    const updates = done
      ? { status: 'done' as const, completed_at: new Date().toISOString() }
      : { status: 'todo' as const, completed_at: null };

    const { error } = await supabase.from('staff_tasks').update(updates).eq('id', task.id);
    if (error) {
      toast.error('Failed to update');
      return;
    }
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, ...updates } : t)),
    );
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('staff_tasks').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success('Task deleted');
  };

  const filtered = tasks.filter((t) => {
    if (filterStatus === 'active') return t.status !== 'done';
    if (filterStatus === 'done') return t.status === 'done';
    return true;
  });

  const overdue = tasks.filter(
    (t) => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date(),
  );

  const dueToday = tasks.filter((t) => {
    if (t.status === 'done' || !t.due_date) return false;
    const d = new Date(t.due_date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500 mt-1">
            {tasks.filter((t) => t.status !== 'done').length} active
            {overdue.length > 0 && <span className="text-red-500 font-medium"> &middot; {overdue.length} overdue</span>}
            {dueToday.length > 0 && <span className="text-amber-600 font-medium"> &middot; {dueToday.length} due today</span>}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['active', 'all', 'done'] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
              filterStatus === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Create task form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && createTask()}
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as Task['priority'])}
              className="text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <div className="flex-1" />
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={createTask}
              disabled={creating || !newTitle.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <CheckSquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">
            {filterStatus === 'done' ? 'No completed tasks' : filterStatus === 'active' ? 'All caught up!' : 'No tasks yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const pc = PRIORITY_CONFIG[task.priority];
            const PriorityIcon = pc.icon;
            const isDone = task.status === 'done';
            const isOverdue = !isDone && task.due_date && new Date(task.due_date) < new Date();

            return (
              <div
                key={task.id}
                className={`group flex items-start gap-3 bg-white rounded-xl border p-4 transition-all hover:shadow-sm ${
                  isDone ? 'border-slate-100 opacity-60' : isOverdue ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => toggleComplete(task)}
                  className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isDone
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-slate-300 hover:border-blue-500'
                  }`}
                >
                  {isDone && <Check className="w-3 h-3" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className={`text-xs mt-0.5 ${isDone ? 'text-slate-300' : 'text-slate-500'}`}>
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded border ${pc.color}`}>
                      <PriorityIcon className="w-2.5 h-2.5" />
                      {pc.label}
                    </span>
                    {task.due_date && (
                      <span className={`inline-flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                        <Clock className="w-3 h-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                        {isOverdue && ' (overdue)'}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="flex-shrink-0 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
