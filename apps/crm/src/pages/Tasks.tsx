import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, CheckCircle2, Clock, AlertCircle, Calendar, ClipboardList,
  BarChart3, Users, GitBranch, TrendingUp,
  CheckSquare, Layout, Zap, CalendarDays,
  Brain, Gauge, GitMerge, Download,
} from 'lucide-react';
import { GradientHeader } from '@mpbhealth/ui';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { PermissionGate } from '../components/PermissionGate';
import { AddTaskModal } from '../components/AddTaskModal';
import type { LeadTask } from '@mpbhealth/crm-core';
import {
  TaskAnalyticsModal,
  TaskProductivityModal,
  TaskTimelineModal,
  TaskTrendModal,
  BulkTaskActionModal,
  TaskTemplatesModal,
  TaskAutomationModal,
  TaskCalendarModal,
  TaskPrioritizationModal,
  TaskWorkloadModal,
  TaskDependencyModal,
  TaskExportBuilderModal,
} from '../components/tasks';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

export default function Tasks() {
  const { taskService, refreshTasks, tasksDueToday, overdueTasks } = useCRM();
  const [allTasks, setAllTasks] = useState<LeadTask[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showProductivity, setShowProductivity] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPrioritization, setShowPrioritization] = useState(false);
  const [showWorkload, setShowWorkload] = useState(false);
  const [showDependency, setShowDependency] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const TOOLBAR_ACTIONS = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-blue-500', action: () => setShowAnalytics(true) },
    { id: 'productivity', label: 'Productivity', icon: Users, color: 'text-green-500', action: () => setShowProductivity(true) },
    { id: 'timeline', label: 'Timeline', icon: GitBranch, color: 'text-violet-500', action: () => setShowTimeline(true) },
    { id: 'trends', label: 'Trends', icon: TrendingUp, color: 'text-amber-500', action: () => setShowTrend(true) },
    { id: 'bulk', label: 'Bulk Actions', icon: CheckSquare, color: 'text-pink-500', action: () => setShowBulkActions(true) },
    { id: 'templates', label: 'Templates', icon: Layout, color: 'text-cyan-500', action: () => setShowTemplates(true) },
    { id: 'automation', label: 'Automation', icon: Zap, color: 'text-emerald-500', action: () => setShowAutomation(true) },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays, color: 'text-orange-500', action: () => setShowCalendar(true) },
    { id: 'priority', label: 'AI Priority', icon: Brain, color: 'text-fuchsia-500', action: () => setShowPrioritization(true) },
    { id: 'workload', label: 'Workload', icon: Gauge, color: 'text-red-500', action: () => setShowWorkload(true) },
    { id: 'dependency', label: 'Dependencies', icon: GitMerge, color: 'text-teal-500', action: () => setShowDependency(true) },
    { id: 'export', label: 'Export', icon: Download, color: 'text-indigo-500', action: () => setShowExport(true) },
  ];

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
      <GradientHeader
        title="Tasks"
        subtitle={`${incompleteTasks} pending, ${completedTasks} completed`}
        icon={<ClipboardList className="w-5 h-5" />}
        size="sm"
        actions={
          <PermissionGate permission="tasks.create">
            <button
              onClick={() => setShowAddTask(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-xl text-sm font-medium text-white hover:bg-th-accent-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </PermissionGate>
        }
      />

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

      {/* Power Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-th-border bg-surface-primary p-2">
        {TOOLBAR_ACTIONS.map((a) => (
          <button key={a.id} onClick={a.action} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-th-text-secondary hover:text-th-text-primary hover:bg-surface-tertiary/80 transition-colors">
            <a.icon className={cn('w-3.5 h-3.5', a.color)} />
            <span className="hidden sm:inline">{a.label}</span>
          </button>
        ))}
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

      {/* ---- Task Power Modals ---- */}
      <TaskAnalyticsModal open={showAnalytics} onClose={() => setShowAnalytics(false)} total={allTasks.length} completed={completedTasks} overdue={overdueTasks.length} dueToday={tasksDueToday.length} />
      <TaskProductivityModal open={showProductivity} onClose={() => setShowProductivity(false)} />
      <TaskTimelineModal open={showTimeline} onClose={() => setShowTimeline(false)} />
      <TaskTrendModal open={showTrend} onClose={() => setShowTrend(false)} />
      <BulkTaskActionModal open={showBulkActions} onClose={() => setShowBulkActions(false)} />
      <TaskTemplatesModal open={showTemplates} onClose={() => setShowTemplates(false)} />
      <TaskAutomationModal open={showAutomation} onClose={() => setShowAutomation(false)} />
      <TaskCalendarModal open={showCalendar} onClose={() => setShowCalendar(false)} />
      <TaskPrioritizationModal open={showPrioritization} onClose={() => setShowPrioritization(false)} />
      <TaskWorkloadModal open={showWorkload} onClose={() => setShowWorkload(false)} />
      <TaskDependencyModal open={showDependency} onClose={() => setShowDependency(false)} />
      <TaskExportBuilderModal open={showExport} onClose={() => setShowExport(false)} />

      <AddTaskModal
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        onSuccess={() => loadTasks()}
      />
    </div>
  );
}
