// ============================================================================
// UnifiedTimeline — Unified Activity Timeline Component
// Shows a combined, chronological timeline of ALL interactions with a lead/contact
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Mail,
  MailOpen,
  Inbox,
  Send,
  Phone,
  Video,
  Calendar,
  StickyNote,
  CheckSquare,
  ArrowRightLeft,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Reply,
  Search,
  Filter,
  Loader2,
  Clock,
  MapPin,
  Link as LinkIcon,
  Users,
  Paperclip,
  Eye,
  MousePointerClick,
  AlertCircle,
  CheckCircle2,
  Circle,
  X,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { EmailComposerModal } from './email/EmailComposerModal';

// ============================================================================
// Types
// ============================================================================

export interface UnifiedTimelineProps {
  leadId?: string;
  contactId?: string;
  accountId?: string;
  dealId?: string;
  limit?: number;
  showFilters?: boolean;
}

type TimelineEntryType =
  | 'email_outbound'
  | 'email_inbound'
  | 'call'
  | 'meeting'
  | 'note'
  | 'task'
  | 'stage_change'
  | 'deal'
  | 'calendar_event';

type FilterType = 'email' | 'call' | 'meeting' | 'note' | 'task' | 'stage_change';

interface TimelineEntry {
  id: string;
  type: TimelineEntryType;
  timestamp: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  raw?: Record<string, any>;
}

// ============================================================================
// Constants
// ============================================================================

const TYPE_CONFIG: Record<
  TimelineEntryType,
  { icon: typeof Mail; color: string; bgColor: string; label: string }
> = {
  email_outbound: {
    icon: Send,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Email Sent',
  },
  email_inbound: {
    icon: Inbox,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Email Received',
  },
  call: {
    icon: Phone,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    label: 'Call',
  },
  meeting: {
    icon: Video,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Meeting',
  },
  note: {
    icon: StickyNote,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Note',
  },
  task: {
    icon: CheckSquare,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Task',
  },
  stage_change: {
    icon: ArrowRightLeft,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    label: 'Stage Change',
  },
  deal: {
    icon: DollarSign,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    label: 'Deal',
  },
  calendar_event: {
    icon: Calendar,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Event',
  },
};

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'call', label: 'Call' },
  { key: 'meeting', label: 'Meeting' },
  { key: 'note', label: 'Note' },
  { key: 'task', label: 'Task' },
  { key: 'stage_change', label: 'Stage Change' },
];

// ============================================================================
// Helpers
// ============================================================================

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function groupByDate(entries: TimelineEntry[]): Map<string, TimelineEntry[]> {
  const groups = new Map<string, TimelineEntry[]>();
  for (const entry of entries) {
    const dateKey = new Date(entry.timestamp).toISOString().split('T')[0];
    const existing = groups.get(dateKey) || [];
    existing.push(entry);
    groups.set(dateKey, existing);
  }
  return groups;
}

function mapActivityType(type: string): TimelineEntryType {
  switch (type) {
    case 'call':
      return 'call';
    case 'email':
      return 'email_outbound';
    case 'meeting':
      return 'meeting';
    case 'note':
      return 'note';
    case 'stage_change':
      return 'stage_change';
    default:
      return 'note';
  }
}

function matchesFilterType(entryType: TimelineEntryType, filter: FilterType): boolean {
  switch (filter) {
    case 'email':
      return entryType === 'email_outbound' || entryType === 'email_inbound';
    case 'call':
      return entryType === 'call';
    case 'meeting':
      return entryType === 'meeting' || entryType === 'calendar_event';
    case 'note':
      return entryType === 'note';
    case 'task':
      return entryType === 'task';
    case 'stage_change':
      return entryType === 'stage_change' || entryType === 'deal';
    default:
      return false;
  }
}

// ============================================================================
// Sub-components
// ============================================================================

function TimelineSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-surface-secondary" />
            <div className="w-0.5 flex-1 bg-surface-secondary mt-2" />
          </div>
          <div className="flex-1 pb-6">
            <div className="bg-surface-primary rounded-xl border border-th-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-20 bg-surface-secondary rounded-full" />
                <div className="h-4 w-32 bg-surface-secondary rounded" />
              </div>
              <div className="h-4 w-3/4 bg-surface-secondary rounded" />
              <div className="h-3 w-1/2 bg-surface-secondary rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mb-4">
        <Clock className="w-8 h-8 text-th-text-tertiary" />
      </div>
      <h3 className="text-lg font-medium text-th-text-primary mb-1">No activity yet</h3>
      <p className="text-sm text-th-text-tertiary text-center max-w-sm">
        Interactions like emails, calls, meetings, and notes will appear here in chronological order.
      </p>
    </div>
  );
}

interface TimelineCardProps {
  entry: TimelineEntry;
  onReply?: (entry: TimelineEntry) => void;
  onCompleteTask?: (taskId: string) => void;
}

function TimelineCard({ entry, onReply, onCompleteTask }: TimelineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = TYPE_CONFIG[entry.type];
  const IconComponent = config.icon;
  const meta = entry.metadata || {};

  const isEmail = entry.type === 'email_outbound' || entry.type === 'email_inbound';
  const isTask = entry.type === 'task';
  const hasExpandableContent = isEmail && (meta.body || meta.html_body);

  return (
    <div className="flex gap-4">
      {/* Timeline icon */}
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}
        >
          <IconComponent className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="w-0.5 flex-1 bg-th-border mt-2" />
      </div>

      {/* Content card */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4 hover:shadow-sm transition-shadow">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
              >
                {config.label}
              </span>
              <span className="text-xs text-th-text-tertiary">{formatTime(entry.timestamp)}</span>
            </div>
            {hasExpandableContent && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 hover:bg-surface-secondary rounded text-th-text-tertiary flex-shrink-0"
                title={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Title / subject */}
          <h4 className="text-sm font-medium text-th-text-primary mt-2 break-words">
            {entry.title}
          </h4>

          {/* Description / preview */}
          {entry.description && !expanded && (
            <p className="text-sm text-th-text-tertiary mt-1 line-clamp-2">{entry.description}</p>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {/* Email-specific metadata */}
            {isEmail && meta.from_address && (
              <span className="text-xs text-th-text-tertiary flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {entry.type === 'email_outbound' ? 'To' : 'From'}: {String(meta.to_address || meta.from_address)}
              </span>
            )}
            {isEmail && typeof meta.open_count === 'number' && meta.open_count > 0 && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {String(meta.open_count)} open{Number(meta.open_count) !== 1 ? 's' : ''}
              </span>
            )}
            {isEmail && typeof meta.click_count === 'number' && meta.click_count > 0 && (
              <span className="text-xs text-blue-600 flex items-center gap-1">
                <MousePointerClick className="w-3 h-3" />
                {String(meta.click_count)} click{Number(meta.click_count) !== 1 ? 's' : ''}
              </span>
            )}
            {isEmail && meta.has_attachments && (
              <span className="text-xs text-th-text-tertiary flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                Attachments
              </span>
            )}

            {/* Call-specific metadata */}
            {entry.type === 'call' && meta.duration && (
              <span className="text-xs text-th-text-tertiary flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {String(meta.duration)}
              </span>
            )}

            {/* Meeting / calendar metadata */}
            {(entry.type === 'meeting' || entry.type === 'calendar_event') && meta.location && (
              <span className="text-xs text-th-text-tertiary flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {String(meta.location)}
              </span>
            )}
            {(entry.type === 'meeting' || entry.type === 'calendar_event') && meta.meeting_link && (
              <a
                href={String(meta.meeting_link)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-th-accent-600 flex items-center gap-1 hover:underline"
              >
                <LinkIcon className="w-3 h-3" />
                Join Meeting
              </a>
            )}
            {(entry.type === 'meeting' || entry.type === 'calendar_event') && meta.attendees && (
              <span className="text-xs text-th-text-tertiary flex items-center gap-1">
                <Users className="w-3 h-3" />
                {Array.isArray(meta.attendees) ? meta.attendees.length : meta.attendees} attendee{Array.isArray(meta.attendees) && meta.attendees.length !== 1 ? 's' : ''}
              </span>
            )}

            {/* Task-specific metadata */}
            {isTask && meta.due_date && (
              <span
                className={`text-xs flex items-center gap-1 ${
                  meta.status === 'overdue' ? 'text-red-600' : 'text-th-text-tertiary'
                }`}
              >
                <Clock className="w-3 h-3" />
                Due: {new Date(String(meta.due_date)).toLocaleDateString()}
              </span>
            )}
            {isTask && meta.status && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${
                  meta.status === 'completed'
                    ? 'text-green-600'
                    : meta.status === 'overdue'
                      ? 'text-red-600'
                      : 'text-orange-600'
                }`}
              >
                {meta.status === 'completed' ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : meta.status === 'overdue' ? (
                  <AlertCircle className="w-3 h-3" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
                {String(meta.status).charAt(0).toUpperCase() + String(meta.status).slice(1)}
              </span>
            )}
            {isTask && meta.priority && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                  meta.priority === 'high' || meta.priority === 'urgent'
                    ? 'bg-red-100 text-red-700'
                    : meta.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                }`}
              >
                {String(meta.priority).charAt(0).toUpperCase() + String(meta.priority).slice(1)}
              </span>
            )}

            {/* Stage change metadata */}
            {entry.type === 'stage_change' && meta.from_stage && meta.to_stage && (
              <span className="text-xs text-th-text-tertiary flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3" />
                {String(meta.from_stage)} → {String(meta.to_stage)}
              </span>
            )}

            {/* Deal metadata */}
            {entry.type === 'deal' && meta.deal_value && (
              <span className="text-xs text-cyan-600 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${Number(meta.deal_value).toLocaleString()}
              </span>
            )}
          </div>

          {/* Expanded email body */}
          {expanded && hasExpandableContent && (
            <div className="mt-3 pt-3 border-t border-th-border">
              {meta.html_body ? (
                <div
                  className="prose prose-sm max-w-none text-th-text-secondary"
                  dangerouslySetInnerHTML={{ __html: String(meta.html_body) }}
                />
              ) : (
                <p className="text-sm text-th-text-secondary whitespace-pre-wrap">
                  {String(meta.body)}
                </p>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="flex items-center gap-2 mt-3">
            {isEmail && onReply && (
              <button
                onClick={() => onReply(entry)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-th-accent-600 bg-th-accent-600/5 hover:bg-th-accent-600/10 rounded-lg transition-colors"
              >
                <Reply className="w-3 h-3" />
                Reply
              </button>
            )}
            {isTask && !meta.completed && onCompleteTask && (
              <button
                onClick={() => onCompleteTask(entry.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" />
                Complete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function UnifiedTimeline({
  leadId,
  contactId,
  accountId,
  dealId,
  limit = 50,
  showFilters = true,
}: UnifiedTimelineProps) {
  const { supabase, taskService } = useCRM();
  const { activeOrgId } = useOrg();

  // State
  const [allEntries, setAllEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  // Filters
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(
    new Set(FILTER_OPTIONS.map((f) => f.key)),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Reply modal
  const [replyModal, setReplyModal] = useState<{
    open: boolean;
    emailId?: string;
    leadId?: string;
    contactId?: string;
    to?: string[];
    subject?: string;
  }>({ open: false });

  // ----------------------------------------------------------------
  // Data fetching
  // ----------------------------------------------------------------

  const fetchEmails = useCallback(
    async (offset: number, pageSize: number): Promise<TimelineEntry[]> => {
      if (!leadId) return [];

      const query = supabase
        .from('crm_email_log')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((email: Record<string, unknown>) => ({
        id: `email-${email.id}`,
        type: email.direction === 'inbound' ? ('email_inbound' as const) : ('email_outbound' as const),
        timestamp: String(email.sent_at || email.created_at),
        title: String(email.subject || '(No subject)'),
        description: email.preview_text ? String(email.preview_text) : undefined,
        metadata: {
          from_address: email.from_address,
          to_address: email.to_address,
          subject: email.subject,
          body: email.body_text,
          html_body: email.body_html,
          open_count: email.open_count ?? 0,
          click_count: email.click_count ?? 0,
          has_attachments: Boolean(email.has_attachments),
          email_id: email.id,
        },
        raw: email,
      }));
    },
    [leadId, supabase],
  );

  const fetchActivities = useCallback(
    async (offset: number, pageSize: number): Promise<TimelineEntry[]> => {
      if (!leadId) return [];

      const query = supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((activity: Record<string, unknown>) => {
        const actType = mapActivityType(String(activity.type || 'note'));
        const actMeta = (activity.metadata as Record<string, unknown>) || {};
        return {
          id: `activity-${activity.id}`,
          type: actType,
          timestamp: String(activity.created_at),
          title: String(activity.title || activity.description || 'Activity'),
          description: activity.description ? String(activity.description) : undefined,
          metadata: {
            ...actMeta,
            duration: actMeta.duration,
            location: actMeta.location,
            meeting_link: actMeta.meeting_link,
            attendees: actMeta.attendees,
            from_stage: actMeta.from_stage,
            to_stage: actMeta.to_stage,
          },
          raw: activity,
        };
      });
    },
    [leadId, supabase],
  );

  const fetchCalendarEvents = useCallback(
    async (offset: number, pageSize: number): Promise<TimelineEntry[]> => {
      if (!leadId) return [];

      const query = supabase
        .from('calendar_events')
        .select('*')
        .eq('lead_id', leadId)
        .order('start_time', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((event: Record<string, unknown>) => ({
        id: `event-${event.id}`,
        type: 'calendar_event' as const,
        timestamp: String(event.start_time || event.created_at),
        title: String(event.title || 'Calendar Event'),
        description: event.description ? String(event.description) : undefined,
        metadata: {
          location: event.location,
          meeting_link: event.meeting_link || event.video_link,
          attendees: event.attendees,
          end_time: event.end_time,
          event_type: event.event_type,
        },
        raw: event,
      }));
    },
    [leadId, supabase],
  );

  const fetchTasks = useCallback(
    async (offset: number, pageSize: number): Promise<TimelineEntry[]> => {
      if (!leadId) return [];

      const query = supabase
        .from('lead_tasks')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((task: Record<string, unknown>) => {
        const isCompleted = Boolean(task.completed);
        const dueDate = task.due_date ? new Date(String(task.due_date)) : null;
        const isOverdue = !isCompleted && dueDate ? dueDate < new Date() : false;
        const status = isCompleted ? 'completed' : isOverdue ? 'overdue' : 'pending';

        return {
          id: String(task.id),
          type: 'task' as const,
          timestamp: String(task.created_at),
          title: String(task.title || 'Task'),
          description: task.description ? String(task.description) : undefined,
          metadata: {
            due_date: task.due_date,
            status,
            priority: task.priority,
            completed: isCompleted,
            task_type: task.task_type,
          },
          raw: task,
        };
      });
    },
    [leadId, supabase],
  );

  const fetchDealActivities = useCallback(
    async (offset: number, pageSize: number): Promise<TimelineEntry[]> => {
      if (!dealId) return [];

      const query = supabase
        .from('lead_activities')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((activity: Record<string, unknown>) => {
        const actMeta = (activity.metadata as Record<string, unknown>) || {};
        return {
          id: `deal-${activity.id}`,
          type: (activity.type === 'stage_change' ? 'stage_change' : 'deal') as TimelineEntryType,
          timestamp: String(activity.created_at),
          title: String(activity.title || activity.description || 'Deal Activity'),
          description: activity.description ? String(activity.description) : undefined,
          metadata: {
            ...actMeta,
            deal_value: actMeta.deal_value,
            from_stage: actMeta.from_stage,
            to_stage: actMeta.to_stage,
          },
          raw: activity,
        };
      });
    },
    [dealId, supabase],
  );

  const loadTimeline = useCallback(
    async (pageNum: number, append = false) => {
      if (!leadId && !dealId) {
        setLoading(false);
        return;
      }

      if (pageNum === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const offset = pageNum * limit;
        const results = await Promise.all([
          fetchEmails(offset, limit),
          fetchActivities(offset, limit),
          fetchCalendarEvents(offset, limit),
          fetchTasks(offset, limit),
          fetchDealActivities(offset, limit),
        ]);

        const newEntries = results
          .flat()
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Deduplicate by id
        if (append) {
          setAllEntries((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const unique = newEntries.filter((e) => !existingIds.has(e.id));
            return [...prev, ...unique];
          });
        } else {
          setAllEntries(newEntries);
        }

        // If any source returned a full page, there may be more
        setHasMore(results.some((r) => r.length >= limit));
      } catch (err) {
        console.error('Error loading timeline:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [leadId, dealId, limit, fetchEmails, fetchActivities, fetchCalendarEvents, fetchTasks, fetchDealActivities],
  );

  useEffect(() => {
    setPage(0);
    loadTimeline(0);
  }, [leadId, contactId, accountId, dealId, activeOrgId]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadTimeline(nextPage, true);
  };

  // ----------------------------------------------------------------
  // Filtering
  // ----------------------------------------------------------------

  const filteredEntries = useMemo(() => {
    let entries = allEntries;

    // Type filters
    if (activeFilters.size < FILTER_OPTIONS.length) {
      entries = entries.filter((entry) =>
        Array.from(activeFilters).some((filter) => matchesFilterType(entry.type, filter)),
      );
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(
        (entry) =>
          entry.title.toLowerCase().includes(q) ||
          (entry.description && entry.description.toLowerCase().includes(q)),
      );
    }

    // Date range
    if (dateFrom) {
      const from = new Date(dateFrom);
      entries = entries.filter((entry) => new Date(entry.timestamp) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      entries = entries.filter((entry) => new Date(entry.timestamp) <= to);
    }

    return entries;
  }, [allEntries, activeFilters, searchQuery, dateFrom, dateTo]);

  const groupedEntries = useMemo(() => groupByDate(filteredEntries), [filteredEntries]);

  // ----------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------

  const toggleFilter = (key: FilterType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAllFilters = () => {
    setActiveFilters(new Set(FILTER_OPTIONS.map((f) => f.key)));
  };

  const clearAllFilters = () => {
    setActiveFilters(new Set());
  };

  const handleReply = (entry: TimelineEntry) => {
    const meta = entry.metadata || {};
    setReplyModal({
      open: true,
      emailId: meta.email_id ? String(meta.email_id) : undefined,
      leadId,
      contactId,
      to: meta.from_address ? [String(meta.from_address)] : undefined,
      subject: meta.subject ? `Re: ${String(meta.subject).replace(/^Re:\s*/i, '')}` : undefined,
    });
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const result = await taskService.completeTask(taskId);
      if (result.success) {
        // Optimistically update the entry
        setAllEntries((prev) =>
          prev.map((entry) =>
            entry.id === taskId
              ? {
                  ...entry,
                  metadata: { ...entry.metadata, status: 'completed', completed: true },
                }
              : entry,
          ),
        );
      }
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      {showFilters && (
        <div className="space-y-3">
          {/* Search + filter toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search timeline..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-600/20 focus:border-th-accent-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-th-text-tertiary hover:text-th-text-secondary"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
                showFilterPanel || activeFilters.size < FILTER_OPTIONS.length
                  ? 'border-th-accent-600 text-th-accent-600 bg-th-accent-600/5'
                  : 'border-th-border text-th-text-secondary bg-surface-primary hover:bg-surface-secondary'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilters.size < FILTER_OPTIONS.length && (
                <span className="ml-1 w-5 h-5 rounded-full bg-th-accent-600 text-white text-xs flex items-center justify-center">
                  {activeFilters.size}
                </span>
              )}
            </button>
          </div>

          {/* Filter panel */}
          {showFilterPanel && (
            <div className="bg-surface-primary border border-th-border rounded-xl p-4 space-y-4">
              {/* Type filters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Activity Type
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllFilters}
                      className="text-xs text-th-accent-600 hover:underline"
                    >
                      Select all
                    </button>
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-th-text-tertiary hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {FILTER_OPTIONS.map((opt) => {
                    const isActive = activeFilters.has(opt.key);
                    return (
                      <button
                        key={opt.key}
                        onClick={() => toggleFilter(opt.key)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          isActive
                            ? 'border-th-accent-600 bg-th-accent-600/10 text-th-accent-600'
                            : 'border-th-border bg-surface-secondary text-th-text-tertiary hover:text-th-text-secondary'
                        }`}
                      >
                        {isActive && <CheckCircle2 className="w-3 h-3" />}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date range */}
              <div>
                <span className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider block mb-2">
                  Date Range
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    title="Start date"
                    className="px-3 py-1.5 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-600/20"
                  />
                  <span className="text-th-text-tertiary text-sm">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    title="End date"
                    className="px-3 py-1.5 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-600/20"
                  />
                  {(dateFrom || dateTo) && (
                    <button
                      onClick={() => {
                        setDateFrom('');
                        setDateTo('');
                      }}
                      className="text-xs text-th-text-tertiary hover:text-th-text-secondary"
                      title="Clear date range"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <TimelineSkeleton />
      ) : filteredEntries.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          {Array.from(groupedEntries.entries()).map(([dateKey, entries]) => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4 mt-6 first:mt-0">
                <div className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider whitespace-nowrap">
                  {formatRelativeDate(dateKey)}
                </div>
                <div className="flex-1 h-px bg-th-border" />
              </div>

              {/* Entries for this date */}
              {entries.map((entry) => (
                <TimelineCard
                  key={entry.id}
                  entry={entry}
                  onReply={handleReply}
                  onCompleteTask={handleCompleteTask}
                />
              ))}
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-th-accent-600 bg-th-accent-600/5 hover:bg-th-accent-600/10 border border-th-accent-600/20 rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Email reply modal */}
      <EmailComposerModal
        open={replyModal.open}
        onClose={() => setReplyModal({ open: false })}
        mode="reply"
        replyToEmailId={replyModal.emailId}
        leadId={replyModal.leadId}
        contactId={replyModal.contactId}
        initialTo={replyModal.to}
        initialSubject={replyModal.subject}
        onSent={() => {
          setReplyModal({ open: false });
          // Refresh the timeline
          setPage(0);
          loadTimeline(0);
        }}
      />
    </div>
  );
}

export default UnifiedTimeline;
