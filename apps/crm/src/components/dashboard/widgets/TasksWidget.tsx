// ============================================================================
// Tasks Widget
// Shows tasks due today and overdue
// ============================================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckSquare, Circle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useCRM } from '../../../contexts/CRMContext';
import type { BaseWidgetProps } from '../types';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Tasks Widget Component
// ============================================================================

type TaskView = 'due-today' | 'overdue' | 'all';

export default function TasksWidget({ config }: BaseWidgetProps) {
  const { tasksDueToday, overdueTasks, taskService } = useCRM();

  const defaultView = (config.view as TaskView) || 'due-today';
  const showCompleted = config.showCompleted === true;

  const [view, setView] = useState<TaskView>(defaultView);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const tasks = view === 'overdue' ? overdueTasks : view === 'due-today' ? tasksDueToday : [...tasksDueToday, ...overdueTasks];

  const handleComplete = async (taskId: string) => {
    setCompletingId(taskId);
    try {
      await taskService.completeTask(taskId);
    } finally {
      setCompletingId(null);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <ViewButton active={view === 'due-today'} onClick={() => setView('due-today')}>Due Today</ViewButton>
          <ViewButton active={view === 'overdue'} onClick={() => setView('overdue')}>Overdue</ViewButton>
        </div>
        <div className="text-center py-6 text-th-text-secondary">
          <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No {view === 'overdue' ? 'overdue' : ''} tasks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* View Tabs */}
      <div className="flex gap-2 mb-4">
        <ViewButton active={view === 'due-today'} onClick={() => setView('due-today')}>
          <Clock className="h-3 w-3" />
          Due Today ({tasksDueToday.length})
        </ViewButton>
        <ViewButton active={view === 'overdue'} onClick={() => setView('overdue')}>
          <AlertTriangle className="h-3 w-3" />
          Overdue ({overdueTasks.length})
        </ViewButton>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {tasks.slice(0, 5).map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <button
              onClick={() => handleComplete(task.id)}
              disabled={completingId === task.id}
              className="mt-0.5 text-th-text-tertiary hover:text-green-500 transition-colors"
            >
              {completingId === task.id ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 animate-pulse" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              <p className="text-xs text-th-text-secondary mt-0.5">
                Due: {formatDate(task.due_date)}
              </p>
            </div>
            <PriorityBadge priority={task.priority} />
          </div>
        ))}
      </div>

      <Link
        to="/tasks"
        className="flex items-center justify-center gap-1 mt-4 pt-4 border-t border-th-border text-sm text-blue-600 hover:text-blue-700 transition-colors"
      >
        View all tasks
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ============================================================================
// Sub Components
// ============================================================================

function ViewButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
        active
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'text-th-text-secondary hover:bg-surface-tertiary'
      )}
    >
      {children}
    </button>
  );
}

function PriorityBadge({ priority }: { priority?: string }) {
  const colors: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-surface-tertiary text-th-text-secondary',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', colors[priority || 'medium'])}>
      {priority || 'medium'}
    </span>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString();
}
