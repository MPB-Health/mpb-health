// ============================================================================
// Action Queue Widget
// "What needs attention right now" - prioritized action items
// ============================================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  AlertTriangle,
  Clock,
  FileWarning,
  DollarSign,
  UserX,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useCRM } from '../../../contexts/CRMContext';
import { useOrg } from '../../../contexts/OrgContext';
import type { BaseWidgetProps } from '../types';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Types
// ============================================================================

interface ActionItem {
  id: string;
  type: 'overdue_task' | 'stale_deal' | 'unpaid_invoice' | 'missing_docs' | 'follow_up' | 'at_risk';
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  entityType: string;
  entityId: string;
  link: string;
  dueDate?: string;
  createdAt: string;
}

// ============================================================================
// Action Queue Widget Component
// ============================================================================

type QueueFilter = 'all' | 'urgent' | 'tasks' | 'deals' | 'invoices';

export default function ActionQueueWidget({ config, size }: BaseWidgetProps) {
  const navigate = useNavigate();
  const { tasksDueToday, overdueTasks, recentActivities, taskService } = useCRM();
  const { activeOrgId } = useOrg();
  
  const [filter, setFilter] = useState<QueueFilter>((config.filter as QueueFilter) || 'all');
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Build action items from CRM data
  useEffect(() => {
    const items: ActionItem[] = [];

    // Add overdue tasks
    overdueTasks.forEach((task) => {
      items.push({
        id: `task-${task.id}`,
        type: 'overdue_task',
        title: `Overdue: ${task.title}`,
        description: `Was due ${formatRelativeDate(task.due_date)}`,
        priority: 'urgent',
        entityType: 'task',
        entityId: task.id,
        link: '/tasks',
        dueDate: task.due_date,
        createdAt: task.created_at,
      });
    });

    // Add tasks due today
    tasksDueToday.forEach((task) => {
      items.push({
        id: `task-today-${task.id}`,
        type: 'follow_up',
        title: task.title,
        description: 'Due today',
        priority: 'high',
        entityType: 'task',
        entityId: task.id,
        link: '/tasks',
        dueDate: task.due_date,
        createdAt: task.created_at,
      });
    });

    // Sort by priority and date
    items.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setActionItems(items);
  }, [overdueTasks, tasksDueToday]);

  // Filter items
  const filteredItems = actionItems.filter((item) => {
    if (dismissedIds.has(item.id)) return false;
    if (filter === 'all') return true;
    if (filter === 'urgent') return item.priority === 'urgent';
    if (filter === 'tasks') return item.type === 'overdue_task' || item.type === 'follow_up';
    if (filter === 'deals') return item.type === 'stale_deal' || item.type === 'at_risk';
    if (filter === 'invoices') return item.type === 'unpaid_invoice';
    return true;
  });

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const handleAction = (item: ActionItem) => {
    navigate(item.link);
  };

  const maxItems = size === 'sm' ? 3 : size === 'md' ? 5 : 8;

  // Empty state
  if (filteredItems.length === 0) {
    return (
      <div className="p-4">
        <div className="flex gap-2 mb-4 flex-wrap">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterButton>
          <FilterButton active={filter === 'urgent'} onClick={() => setFilter('urgent')}>Urgent</FilterButton>
          <FilterButton active={filter === 'tasks'} onClick={() => setFilter('tasks')}>Tasks</FilterButton>
        </div>
        <div className="text-center py-8 text-gray-500">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
          <p className="font-medium text-gray-900 dark:text-gray-100">All caught up!</p>
          <p className="text-sm mt-1">No items need your attention right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
          All ({actionItems.filter((i) => !dismissedIds.has(i.id)).length})
        </FilterButton>
        <FilterButton active={filter === 'urgent'} onClick={() => setFilter('urgent')}>
          <AlertTriangle className="h-3 w-3" />
          Urgent
        </FilterButton>
        <FilterButton active={filter === 'tasks'} onClick={() => setFilter('tasks')}>
          Tasks
        </FilterButton>
      </div>

      {/* Action Items */}
      <div className="space-y-2">
        {filteredItems.slice(0, maxItems).map((item) => (
          <ActionItemCard
            key={item.id}
            item={item}
            onAction={() => handleAction(item)}
            onDismiss={() => handleDismiss(item.id)}
          />
        ))}
      </div>

      {/* See All Link */}
      {filteredItems.length > maxItems && (
        <div className="mt-4 pt-4 border-t dark:border-gray-700 text-center">
          <span className="text-sm text-gray-500">
            +{filteredItems.length - maxItems} more items
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub Components
// ============================================================================

function FilterButton({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
        active
          ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
      )}
    >
      {children}
    </button>
  );
}

interface ActionItemCardProps {
  item: ActionItem;
  onAction: () => void;
  onDismiss: () => void;
}

function ActionItemCard({ item, onAction, onDismiss }: ActionItemCardProps) {
  const Icon = getTypeIcon(item.type);
  const priorityColor = getPriorityColor(item.priority);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer',
        'hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600',
        priorityColor.border
      )}
      onClick={onAction}
    >
      {/* Icon */}
      <div className={cn('p-2 rounded-lg flex-shrink-0', priorityColor.bg)}>
        <Icon className={cn('h-4 w-4', priorityColor.icon)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {item.title}
          </p>
          {item.priority === 'urgent' && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium rounded">
              Urgent
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {item.description}
        </p>
      </div>

      {/* Action */}
      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getTypeIcon(type: ActionItem['type']) {
  switch (type) {
    case 'overdue_task':
      return AlertTriangle;
    case 'stale_deal':
      return Clock;
    case 'unpaid_invoice':
      return DollarSign;
    case 'missing_docs':
      return FileWarning;
    case 'at_risk':
      return UserX;
    case 'follow_up':
    default:
      return Clock;
  }
}

function getPriorityColor(priority: ActionItem['priority']) {
  switch (priority) {
    case 'urgent':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        icon: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
      };
    case 'high':
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        icon: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        icon: 'text-yellow-600 dark:text-yellow-400',
        border: 'border-yellow-200 dark:border-yellow-800',
      };
    case 'low':
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        icon: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-700',
      };
  }
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}
