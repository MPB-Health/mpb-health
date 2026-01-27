import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { PermissionGate } from '../components/PermissionGate';
import { AddTaskModal } from '../components/AddTaskModal';
import type { LeadTask } from '@mpbhealth/crm-core';

export default function Tasks() {
  const { taskService, refreshTasks, tasksDueToday, overdueTasks } = useCRM();
  const [allTasks, setAllTasks] = useState<LeadTask[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    const tasks = await taskService.getTasks(undefined, true);
    setAllTasks(tasks);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCompleteTask = async (taskId: string) => {
    const result = await taskService.completeTask(taskId);
    if (result.success) {
      toast.success('Task completed');
      loadTasks();
      refreshTasks();
    } else {
      toast.error('Failed to complete task');
    }
  };

  const handleReopenTask = async (taskId: string) => {
    const result = await taskService.reopenTask(taskId);
    if (result.success) {
      toast.success('Task reopened');
      loadTasks();
      refreshTasks();
    } else {
      toast.error('Failed to reopen task');
    }
  };

  const filteredTasks = allTasks.filter((task) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDate = new Date(task.due_date);

    switch (filter) {
      case 'today':
        return !task.completed && dueDate >= today && dueDate < tomorrow;
      case 'overdue':
        return !task.completed && dueDate < today;
      case 'completed':
        return task.completed;
      default:
        return true;
    }
  });

  const incompleteTasks = allTasks.filter((t) => !t.completed).length;
  const completedTasks = allTasks.filter((t) => t.completed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Tasks</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            {incompleteTasks} pending, {completedTasks} completed
          </p>
        </div>
        <PermissionGate permission="tasks.create">
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </PermissionGate>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border text-left transition-colors ${
            filter === 'all'
              ? 'border-th-accent-500 bg-th-accent-50'
              : 'border-th-border bg-surface-primary hover:bg-surface-secondary'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-th-text-tertiary">All Tasks</span>
            <CheckCircle2 className="w-5 h-5 text-th-text-tertiary" />
          </div>
          <p className="text-2xl font-bold text-th-text-primary mt-2">{allTasks.length}</p>
        </button>

        <button
          onClick={() => setFilter('today')}
          className={`p-4 rounded-xl border text-left transition-colors ${
            filter === 'today'
              ? 'border-th-accent-500 bg-th-accent-50'
              : 'border-th-border bg-surface-primary hover:bg-surface-secondary'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-th-text-tertiary">Due Today</span>
            <Calendar className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-th-text-primary mt-2">
            {tasksDueToday.length}
          </p>
        </button>

        <button
          onClick={() => setFilter('overdue')}
          className={`p-4 rounded-xl border text-left transition-colors ${
            filter === 'overdue'
              ? 'border-th-accent-500 bg-th-accent-50'
              : 'border-th-border bg-surface-primary hover:bg-surface-secondary'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-th-text-tertiary">Overdue</span>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {overdueTasks.length}
          </p>
        </button>

        <button
          onClick={() => setFilter('completed')}
          className={`p-4 rounded-xl border text-left transition-colors ${
            filter === 'completed'
              ? 'border-th-accent-500 bg-th-accent-50'
              : 'border-th-border bg-surface-primary hover:bg-surface-secondary'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-th-text-tertiary">Completed</span>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600 mt-2">{completedTasks}</p>
        </button>
      </div>

      {/* Task list */}
      <div className="bg-surface-primary rounded-xl border border-th-border divide-y divide-th-border">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-th-text-tertiary">
            No tasks found
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isOverdue =
              !task.completed && new Date(task.due_date) < new Date();

            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-4 hover:bg-surface-secondary ${
                  task.completed ? 'bg-surface-secondary' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() =>
                      task.completed
                        ? handleReopenTask(task.id)
                        : handleCompleteTask(task.id)
                    }
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      task.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-th-border hover:border-th-accent-500'
                    }`}
                  >
                    {task.completed && (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                  <div>
                    <p
                      className={`font-medium ${
                        task.completed
                          ? 'text-th-text-tertiary line-through'
                          : 'text-th-text-primary'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-th-text-tertiary mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Link
                    to={`/leads/${task.lead_id}`}
                    className="text-sm text-th-accent-600 hover:underline"
                  >
                    View Lead
                  </Link>
                  <div
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${
                      task.completed
                        ? 'bg-surface-tertiary text-th-text-tertiary'
                        : isOverdue
                        ? 'bg-red-100 text-red-700'
                        : 'bg-surface-tertiary text-th-text-secondary'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddTaskModal
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        onSuccess={() => loadTasks()}
      />
    </div>
  );
}
