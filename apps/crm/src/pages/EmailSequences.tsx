// ============================================================================
// Email Sequences — Automated multi-step email outreach cadences
// Enterprise-grade sequence management with visual builder & analytics
// ============================================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Plus,
  Play,
  Pause,
  Archive,
  Copy,
  Trash2,
  Pencil,
  Loader2,
  BarChart3,
  Users,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Search,
  ArrowDown,
  GripVertical,
  X,
  Settings,
  GitBranch,
  ListChecks,
  Timer,
  MousePointerClick,
  MessageSquareReply,
  Eye,
  TrendingUp,
  Tag,
  UserPlus,
  MoreHorizontal,
  RefreshCw,
  Activity,
  Target,
  ChevronUp,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';

// ============================================================================
// Types
// ============================================================================

type SequenceStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
type StepType = 'email' | 'wait' | 'condition' | 'task';
type TriggerType = 'manual' | 'lead_created' | 'stage_changed' | 'tag_added';
type EnrollmentStatus = 'active' | 'paused' | 'completed' | 'replied' | 'bounced' | 'unsubscribed' | 'removed';

interface EmailSequence {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  status: SequenceStatus;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown> | null;
  exit_conditions: ExitConditions;
  settings: SequenceSettings;
  total_enrolled: number;
  total_completed: number;
  total_replied: number;
  total_bounced: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface SequenceStep {
  id: string;
  sequence_id: string;
  step_number: number;
  step_type: StepType;
  template_id: string | null;
  subject_override: string | null;
  body_override: string | null;
  delay_days: number;
  delay_hours: number;
  condition_config: ConditionConfig | null;
  task_config: TaskConfig | null;
  is_active: boolean;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_replied: number;
  created_at: string;
}

interface SequenceEnrollment {
  id: string;
  sequence_id: string;
  lead_id: string | null;
  contact_id: string | null;
  status: EnrollmentStatus;
  current_step: number;
  next_action_at: string | null;
  enrolled_by: string | null;
  enrolled_at: string;
  completed_at: string | null;
  last_activity_at: string | null;
  metadata: Record<string, unknown> | null;
  // Joined fields
  lead_name?: string;
  lead_email?: string;
  contact_name?: string;
  contact_email?: string;
}

interface ExitConditions {
  on_reply: boolean;
  on_bounce: boolean;
  on_unsubscribe: boolean;
  on_manual_removal: boolean;
}

interface SequenceSettings {
  business_hours_only: boolean;
  timezone: string;
  max_emails_per_day: number;
  send_window_start: string;
  send_window_end: string;
}

interface ConditionConfig {
  type: 'opened' | 'clicked' | 'replied' | 'custom_field';
  field?: string;
  operator?: string;
  value?: string;
}

interface TaskConfig {
  title: string;
  description: string;
  due_offset_days: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

type ViewMode = 'list' | 'builder' | 'analytics';

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG: Record<SequenceStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-100' },
  active: { label: 'Active', color: 'text-green-700', bg: 'bg-green-100' },
  paused: { label: 'Paused', color: 'text-amber-700', bg: 'bg-amber-100' },
  completed: { label: 'Completed', color: 'text-blue-700', bg: 'bg-blue-100' },
  archived: { label: 'Archived', color: 'text-gray-500', bg: 'bg-gray-50' },
};

const TRIGGER_LABELS: Record<TriggerType, { label: string; icon: typeof Zap }> = {
  manual: { label: 'Manual Enrollment', icon: UserPlus },
  lead_created: { label: 'Lead Created', icon: Plus },
  stage_changed: { label: 'Stage Changed', icon: GitBranch },
  tag_added: { label: 'Tag Added', icon: Tag },
};

const STEP_TYPE_CONFIG: Record<StepType, { label: string; icon: typeof Mail; color: string; bg: string }> = {
  email: { label: 'Email', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
  wait: { label: 'Wait', icon: Timer, color: 'text-amber-600', bg: 'bg-amber-50' },
  condition: { label: 'Condition', icon: GitBranch, color: 'text-blue-600', bg: 'bg-blue-50' },
  task: { label: 'Task', icon: ListChecks, color: 'text-green-600', bg: 'bg-green-50' },
};

const ENROLLMENT_STATUS_CONFIG: Record<EnrollmentStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-green-700', bg: 'bg-green-100' },
  paused: { label: 'Paused', color: 'text-amber-700', bg: 'bg-amber-100' },
  completed: { label: 'Completed', color: 'text-blue-700', bg: 'bg-blue-100' },
  replied: { label: 'Replied', color: 'text-blue-700', bg: 'bg-blue-100' },
  bounced: { label: 'Bounced', color: 'text-red-700', bg: 'bg-red-100' },
  unsubscribed: { label: 'Unsubscribed', color: 'text-gray-700', bg: 'bg-gray-100' },
  removed: { label: 'Removed', color: 'text-gray-500', bg: 'bg-gray-50' },
};

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'UTC',
];

const DEFAULT_EXIT_CONDITIONS: ExitConditions = {
  on_reply: true,
  on_bounce: true,
  on_unsubscribe: true,
  on_manual_removal: true,
};

const DEFAULT_SETTINGS: SequenceSettings = {
  business_hours_only: true,
  timezone: 'America/New_York',
  max_emails_per_day: 50,
  send_window_start: '09:00',
  send_window_end: '17:00',
};

// ============================================================================
// Helpers
// ============================================================================

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

function newStepDefaults(type: StepType, stepNumber: number): Omit<SequenceStep, 'id' | 'sequence_id' | 'created_at'> {
  return {
    step_number: stepNumber,
    step_type: type,
    template_id: null,
    subject_override: null,
    body_override: null,
    delay_days: type === 'email' && stepNumber > 1 ? 1 : 0,
    delay_hours: 0,
    condition_config: type === 'condition' ? { type: 'opened' } : null,
    task_config: type === 'task' ? { title: '', description: '', due_offset_days: 0 } : null,
    is_active: true,
    total_sent: 0,
    total_opened: 0,
    total_clicked: 0,
    total_replied: 0,
  };
}

// ============================================================================
// Sub-components
// ============================================================================

function StatusBadge({ status }: { status: SequenceStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  const cfg = ENROLLMENT_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon: typeof BarChart3;
  trend?: string;
}) {
  return (
    <div className="bg-surface-primary border border-th-border rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-th-accent-600/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-th-accent-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-th-text-secondary uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-th-text-primary">{value}</p>
        {trend && <p className="text-xs text-green-600 font-medium">{trend}</p>}
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  loading,
  destructive,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  destructive?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-surface-primary rounded-xl border border-th-border shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full ${destructive ? 'bg-red-100' : 'bg-amber-100'} flex items-center justify-center`}>
            <AlertTriangle className={`w-5 h-5 ${destructive ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-th-text-primary">{title}</h3>
          </div>
        </div>
        <p className="text-sm text-th-text-secondary mb-6">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${
              destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-th-accent-600 hover:bg-th-accent-700'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sequence Card
// ============================================================================

function SequenceCard({
  sequence,
  stepCount,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onArchive,
  onDelete,
  onViewAnalytics,
}: {
  sequence: EmailSequence;
  stepCount: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleStatus: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onViewAnalytics: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const completionRate = pct(sequence.total_completed, sequence.total_enrolled);
  const replyRate = pct(sequence.total_replied, sequence.total_enrolled);
  const TriggerIcon = TRIGGER_LABELS[sequence.trigger_type].icon;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  return (
    <div className="bg-surface-primary border border-th-border rounded-xl p-5 hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="text-base font-semibold text-th-text-primary truncate cursor-pointer hover:text-th-accent-600 transition-colors"
              onClick={onEdit}
            >
              {sequence.name}
            </h3>
            <StatusBadge status={sequence.status} />
          </div>
          {sequence.description && (
            <p className="text-sm text-th-text-secondary truncate">{sequence.description}</p>
          )}
        </div>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg hover:bg-surface-secondary text-th-text-secondary"
            title="Sequence actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 z-20 w-48 bg-surface-primary border border-th-border rounded-xl shadow-lg py-1">
              <button
                onClick={() => { setShowMenu(false); onEdit(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-th-text-primary hover:bg-surface-secondary"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Sequence
              </button>
              <button
                onClick={() => { setShowMenu(false); onViewAnalytics(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-th-text-primary hover:bg-surface-secondary"
              >
                <BarChart3 className="w-3.5 h-3.5" /> View Analytics
              </button>
              <button
                onClick={() => { setShowMenu(false); onDuplicate(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-th-text-primary hover:bg-surface-secondary"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              <button
                onClick={() => { setShowMenu(false); onToggleStatus(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-th-text-primary hover:bg-surface-secondary"
              >
                {sequence.status === 'active' ? (
                  <><Pause className="w-3.5 h-3.5" /> Pause</>
                ) : (
                  <><Play className="w-3.5 h-3.5" /> Activate</>
                )}
              </button>
              {sequence.status !== 'archived' && (
                <button
                  onClick={() => { setShowMenu(false); onArchive(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-th-text-primary hover:bg-surface-secondary"
                >
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
              )}
              <div className="border-t border-th-border my-1" />
              <button
                onClick={() => { setShowMenu(false); onDelete(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-th-text-secondary mb-4">
        <span className="flex items-center gap-1">
          <TriggerIcon className="w-3.5 h-3.5" />
          {TRIGGER_LABELS[sequence.trigger_type].label}
        </span>
        <span className="flex items-center gap-1">
          <Mail className="w-3.5 h-3.5" />
          {stepCount} step{stepCount !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formatDate(sequence.updated_at)}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center">
          <p className="text-lg font-bold text-th-text-primary">{sequence.total_enrolled}</p>
          <p className="text-[10px] uppercase tracking-wider text-th-text-secondary font-medium">Enrolled</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-600">{sequence.total_completed}</p>
          <p className="text-[10px] uppercase tracking-wider text-th-text-secondary font-medium">Completed</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-blue-600">{sequence.total_replied}</p>
          <p className="text-[10px] uppercase tracking-wider text-th-text-secondary font-medium">Replied</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-red-500">{sequence.total_bounced}</p>
          <p className="text-[10px] uppercase tracking-wider text-th-text-secondary font-medium">Bounced</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-th-text-secondary">Completion</span>
          <span className="font-medium text-th-text-primary">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs mt-1.5">
          <span className="text-th-text-secondary">Reply Rate</span>
          <span className="font-medium text-blue-600">{replyRate}%</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Step Card (Builder)
// ============================================================================

function StepCard({
  step,
  index,
  templates,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  step: Omit<SequenceStep, 'id' | 'sequence_id' | 'created_at'> & { _tempId?: string; id?: string };
  index: number;
  templates: EmailTemplate[];
  onUpdate: (updates: Partial<typeof step>) => void;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const cfg = STEP_TYPE_CONFIG[step.step_type];
  const Icon = cfg.icon;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`border rounded-xl transition-all ${
        step.is_active ? 'border-th-border bg-surface-primary' : 'border-dashed border-gray-300 bg-gray-50 opacity-60'
      }`}
    >
      {/* Step header */}
      <div className="flex items-center gap-3 p-4">
        <div className="cursor-grab active:cursor-grabbing text-th-text-secondary hover:text-th-text-primary">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-th-text-secondary uppercase tracking-wider">
              Step {index + 1}
            </span>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            {step.delay_days > 0 || step.delay_hours > 0 ? (
              <span className="text-xs text-th-text-secondary flex items-center gap-1">
                <Timer className="w-3 h-3" />
                {step.delay_days > 0 && `${step.delay_days}d`}
                {step.delay_days > 0 && step.delay_hours > 0 && ' '}
                {step.delay_hours > 0 && `${step.delay_hours}h`}
                {' '}delay
              </span>
            ) : null}
          </div>
          {step.step_type === 'email' && step.subject_override && (
            <p className="text-sm text-th-text-primary truncate mt-0.5">{step.subject_override}</p>
          )}
          {step.step_type === 'task' && step.task_config?.title && (
            <p className="text-sm text-th-text-primary truncate mt-0.5">{step.task_config.title}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onUpdate({ is_active: !step.is_active })}
            className={`p-1.5 rounded-lg text-xs ${step.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
            title={step.is_active ? 'Disable step' : 'Enable step'}
          >
            {step.is_active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-th-text-secondary hover:bg-surface-secondary"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
            title="Remove step"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Step body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-th-border pt-4 space-y-4">
          {/* Delay config (shown for all except first step) */}
          {index > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-th-text-secondary w-20 shrink-0">Delay after prev</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={step.delay_days}
                  onChange={(e) => onUpdate({ delay_days: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-16 px-2 py-1.5 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary"
                  title="Delay days"
                />
                <span className="text-xs text-th-text-secondary">days</span>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={step.delay_hours}
                  onChange={(e) => onUpdate({ delay_hours: Math.min(23, Math.max(0, parseInt(e.target.value) || 0)) })}
                  className="w-16 px-2 py-1.5 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary"
                  title="Delay hours"
                />
                <span className="text-xs text-th-text-secondary">hours</span>
              </div>
            </div>
          )}

          {/* EMAIL step */}
          {step.step_type === 'email' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Template (optional)</label>
                <select
                  value={step.template_id || ''}
                  title="Email template"
                  onChange={(e) => {
                    const tmpl = templates.find((t) => t.id === e.target.value);
                    onUpdate({
                      template_id: e.target.value || null,
                      subject_override: tmpl ? tmpl.subject : step.subject_override,
                      body_override: tmpl ? tmpl.body : step.body_override,
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary"
                >
                  <option value="">Custom email</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Subject</label>
                <input
                  type="text"
                  value={step.subject_override || ''}
                  onChange={(e) => onUpdate({ subject_override: e.target.value })}
                  placeholder="Email subject line..."
                  className="w-full px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder:text-th-text-secondary/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Body</label>
                <textarea
                  rows={5}
                  value={step.body_override || ''}
                  onChange={(e) => onUpdate({ body_override: e.target.value })}
                  placeholder="Email body content. Use {{first_name}}, {{company}} for personalization..."
                  className="w-full px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder:text-th-text-secondary/50 resize-y"
                />
              </div>
            </div>
          )}

          {/* WAIT step */}
          {step.step_type === 'wait' && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <Timer className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="text-sm text-amber-700">
                Wait {step.delay_days > 0 ? `${step.delay_days} day${step.delay_days !== 1 ? 's' : ''}` : ''}
                {step.delay_days > 0 && step.delay_hours > 0 ? ' and ' : ''}
                {step.delay_hours > 0 ? `${step.delay_hours} hour${step.delay_hours !== 1 ? 's' : ''}` : ''}
                {step.delay_days === 0 && step.delay_hours === 0 ? 'Configure delay above' : ''} before proceeding
              </span>
            </div>
          )}

          {/* CONDITION step */}
          {step.step_type === 'condition' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Branch if lead has...</label>
                <select
                  value={step.condition_config?.type || 'opened'}
                  title="Condition type"
                  onChange={(e) =>
                    onUpdate({
                      condition_config: { ...step.condition_config, type: e.target.value as ConditionConfig['type'] },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary"
                >
                  <option value="opened">Opened previous email</option>
                  <option value="clicked">Clicked a link</option>
                  <option value="replied">Replied to email</option>
                  <option value="custom_field">Custom field value</option>
                </select>
              </div>
              {step.condition_config?.type === 'custom_field' && (
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Field name"
                    value={step.condition_config.field || ''}
                    onChange={(e) =>
                      onUpdate({
                        condition_config: { ...step.condition_config!, field: e.target.value },
                      })
                    }
                    className="px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary"
                  />
                  <select
                    value={step.condition_config.operator || 'equals'}
                    title="Condition operator"
                    onChange={(e) =>
                      onUpdate({
                        condition_config: { ...step.condition_config!, operator: e.target.value },
                      })
                    }
                    className="px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary"
                  >
                    <option value="equals">Equals</option>
                    <option value="not_equals">Not equals</option>
                    <option value="contains">Contains</option>
                    <option value="is_empty">Is empty</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Value"
                    value={step.condition_config.value || ''}
                    onChange={(e) =>
                      onUpdate({
                        condition_config: { ...step.condition_config!, value: e.target.value },
                      })
                    }
                    className="px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary"
                  />
                </div>
              )}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-700">
                <GitBranch className="w-4 h-4 inline-block mr-1.5" />
                Leads matching this condition continue; others skip to next non-condition step.
              </div>
            </div>
          )}

          {/* TASK step */}
          {step.step_type === 'task' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Task Title</label>
                <input
                  type="text"
                  value={step.task_config?.title || ''}
                  onChange={(e) =>
                    onUpdate({ task_config: { ...step.task_config!, title: e.target.value } })
                  }
                  placeholder="e.g., Call lead if no reply"
                  className="w-full px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder:text-th-text-secondary/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={step.task_config?.description || ''}
                  onChange={(e) =>
                    onUpdate({ task_config: { ...step.task_config!, description: e.target.value } })
                  }
                  placeholder="Instructions for the sales rep..."
                  className="w-full px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder:text-th-text-secondary/50 resize-y"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-th-text-secondary shrink-0">Due in</label>
                <input
                  type="number"
                  min={0}
                  value={step.task_config?.due_offset_days || 0}
                  onChange={(e) =>
                    onUpdate({ task_config: { ...step.task_config!, due_offset_days: parseInt(e.target.value) || 0 } })
                  }
                  className="w-16 px-2 py-1.5 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary"
                  title="Due offset days"
                />
                <span className="text-xs text-th-text-secondary">days after enrollment reaches this step</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Add Step Menu
// ============================================================================

function AddStepButton({ onAdd }: { onAdd: (type: StepType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="flex justify-center py-2 relative" ref={ref}>
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-th-border -translate-x-1/2" />
      <button
        onClick={() => setOpen(!open)}
        className="relative z-10 w-7 h-7 rounded-full bg-th-accent-600 text-white flex items-center justify-center hover:bg-th-accent-700 shadow-sm transition-colors"
        title="Add step"
      >
        <Plus className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute top-9 z-20 bg-surface-primary border border-th-border rounded-xl shadow-lg py-1 w-48">
          {(Object.keys(STEP_TYPE_CONFIG) as StepType[]).map((type) => {
            const c = STEP_TYPE_CONFIG[type];
            const StepIcon = c.icon;
            return (
              <button
                key={type}
                onClick={() => { onAdd(type); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-th-text-primary hover:bg-surface-secondary"
              >
                <div className={`w-6 h-6 rounded ${c.bg} flex items-center justify-center`}>
                  <StepIcon className={`w-3.5 h-3.5 ${c.color}`} />
                </div>
                {c.label} Step
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Settings Panel (within Builder)
// ============================================================================

function SettingsPanel({
  name,
  description,
  triggerType,
  exitConditions,
  settings,
  onNameChange,
  onDescriptionChange,
  onTriggerTypeChange,
  onExitConditionsChange,
  onSettingsChange,
}: {
  name: string;
  description: string;
  triggerType: TriggerType;
  exitConditions: ExitConditions;
  settings: SequenceSettings;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onTriggerTypeChange: (v: TriggerType) => void;
  onExitConditionsChange: (v: ExitConditions) => void;
  onSettingsChange: (v: SequenceSettings) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Basic info */}
      <div>
        <h4 className="text-sm font-semibold text-th-text-primary mb-3">Sequence Details</h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g., New Lead Welcome Series"
              className="w-full px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Brief description of the sequence purpose..."
              className="w-full px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary resize-y"
            />
          </div>
        </div>
      </div>

      {/* Trigger */}
      <div>
        <h4 className="text-sm font-semibold text-th-text-primary mb-3">Trigger</h4>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map((t) => {
            const TIcon = TRIGGER_LABELS[t].icon;
            return (
              <button
                key={t}
                onClick={() => onTriggerTypeChange(t)}
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm text-left transition-colors ${
                  triggerType === t
                    ? 'border-th-accent-600 bg-th-accent-600/5 text-th-accent-600'
                    : 'border-th-border text-th-text-secondary hover:border-th-accent-600/30'
                }`}
              >
                <TIcon className="w-4 h-4 shrink-0" />
                <span className="font-medium">{TRIGGER_LABELS[t].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Exit conditions */}
      <div>
        <h4 className="text-sm font-semibold text-th-text-primary mb-3">Exit Conditions</h4>
        <div className="space-y-2">
          {[
            { key: 'on_reply' as const, label: 'Reply received' },
            { key: 'on_bounce' as const, label: 'Email bounced' },
            { key: 'on_unsubscribe' as const, label: 'Unsubscribed' },
            { key: 'on_manual_removal' as const, label: 'Manual removal' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={exitConditions[key]}
                onChange={(e) => onExitConditionsChange({ ...exitConditions, [key]: e.target.checked })}
                className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-600"
              />
              <span className="text-sm text-th-text-primary group-hover:text-th-accent-600 transition-colors">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Send settings */}
      <div>
        <h4 className="text-sm font-semibold text-th-text-primary mb-3">Send Settings</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.business_hours_only}
              onChange={(e) => onSettingsChange({ ...settings, business_hours_only: e.target.checked })}
              className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-600"
            />
            <span className="text-sm text-th-text-primary">Business hours only</span>
          </label>
          {settings.business_hours_only && (
            <div className="flex items-center gap-2 ml-6">
              <input
                type="time"
                value={settings.send_window_start}
                onChange={(e) => onSettingsChange({ ...settings, send_window_start: e.target.value })}
                className="px-2 py-1.5 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary"
                title="Send window start time"
              />
              <span className="text-xs text-th-text-secondary">to</span>
              <input
                type="time"
                value={settings.send_window_end}
                onChange={(e) => onSettingsChange({ ...settings, send_window_end: e.target.value })}
                className="px-2 py-1.5 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary"
                title="Send window end time"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => onSettingsChange({ ...settings, timezone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary"
              title="Timezone"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1">Max emails per day</label>
            <input
              type="number"
              min={1}
              max={500}
              value={settings.max_emails_per_day}
              onChange={(e) => onSettingsChange({ ...settings, max_emails_per_day: parseInt(e.target.value) || 50 })}
              className="w-24 px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary"
              title="Max emails per day"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Enrollment Panel (within Builder)
// ============================================================================

function EnrollmentPanel({
  enrollments,
  loading,
  onPause,
  onResume,
  onRemove,
  onEnrollLeads,
}: {
  enrollments: SequenceEnrollment[];
  loading: boolean;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRemove: (id: string) => void;
  onEnrollLeads: () => void;
}) {
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    enrollments.forEach((e) => {
      counts[e.status] = (counts[e.status] || 0) + 1;
    });
    return counts;
  }, [enrollments]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-th-text-primary">
          Enrollments ({enrollments.length})
        </h4>
        <button
          onClick={onEnrollLeads}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Enroll Leads
        </button>
      </div>

      {/* Status summary */}
      {enrollments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => {
            const cfg = ENROLLMENT_STATUS_CONFIG[status as EnrollmentStatus];
            return cfg ? (
              <span key={status} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                {cfg.label}: {count}
              </span>
            ) : null;
          })}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-th-text-secondary" />
        </div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-8 text-th-text-secondary">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No leads enrolled yet</p>
          <p className="text-xs mt-1">Click "Enroll Leads" to add leads to this sequence</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {enrollments.map((enrollment) => (
            <div key={enrollment.id} className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-th-text-primary truncate">
                  {enrollment.lead_name || enrollment.contact_name || 'Unknown'}
                </p>
                <p className="text-xs text-th-text-secondary truncate">
                  {enrollment.lead_email || enrollment.contact_email || ''}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <EnrollmentStatusBadge status={enrollment.status} />
                  <span className="text-[10px] text-th-text-secondary">
                    Step {enrollment.current_step}
                  </span>
                  {enrollment.next_action_at && (
                    <span className="text-[10px] text-th-text-secondary flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      Next: {formatDateTime(enrollment.next_action_at)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {enrollment.status === 'active' && (
                  <button
                    onClick={() => onPause(enrollment.id)}
                    className="p-1 rounded text-amber-500 hover:bg-amber-50"
                    title="Pause"
                  >
                    <Pause className="w-3.5 h-3.5" />
                  </button>
                )}
                {enrollment.status === 'paused' && (
                  <button
                    onClick={() => onResume(enrollment.id)}
                    className="p-1 rounded text-green-500 hover:bg-green-50"
                    title="Resume"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}
                {(enrollment.status === 'active' || enrollment.status === 'paused') && (
                  <button
                    onClick={() => onRemove(enrollment.id)}
                    className="p-1 rounded text-red-400 hover:bg-red-50"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Lead Picker Modal
// ============================================================================

function LeadPickerModal({
  supabase,
  orgId: orgIdProp,
  existingLeadIds,
  onEnroll,
  onClose,
}: {
  supabase: ReturnType<typeof useCRM>['supabase'];
  orgId: string;
  existingLeadIds: Set<string>;
  onEnroll: (leadIds: string[]) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [leads, setLeads] = useState<{ id: string; name: string; email: string; company: string | null }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const searchLeads = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('crm_leads')
      .select('id, first_name, last_name, email, company')
      .eq('org_id', orgIdProp)
      .order('created_at', { ascending: false })
      .limit(50);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }

    const { data } = await query;
    setLeads(
      (data || []).map((l: Record<string, string | null>) => ({
        id: l.id as string,
        name: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Unknown',
        email: (l.email as string) || '',
        company: l.company as string | null,
      }))
    );
    setLoading(false);
  }, [supabase, orgIdProp, search]);

  useEffect(() => {
    const timer = setTimeout(searchLeads, 300);
    return () => clearTimeout(timer);
  }, [searchLeads]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="bg-surface-primary rounded-xl border border-th-border shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-th-border">
          <h3 className="text-lg font-semibold text-th-text-primary">Enroll Leads</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-secondary text-th-text-secondary" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 border-b border-th-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by name, email, or company..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-th-text-secondary" />
            </div>
          ) : leads.length === 0 ? (
            <p className="text-center py-8 text-sm text-th-text-secondary">No leads found</p>
          ) : (
            <div className="space-y-1">
              {leads.map((lead) => {
                const alreadyEnrolled = existingLeadIds.has(lead.id);
                return (
                  <label
                    key={lead.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                      alreadyEnrolled
                        ? 'opacity-50 cursor-not-allowed'
                        : selected.has(lead.id)
                          ? 'bg-th-accent-600/5 border border-th-accent-600/20'
                          : 'hover:bg-surface-secondary border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(lead.id)}
                      disabled={alreadyEnrolled}
                      onChange={() => toggle(lead.id)}
                      className="w-4 h-4 rounded border-th-border text-th-accent-600"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-th-text-primary truncate">{lead.name}</p>
                      <p className="text-xs text-th-text-secondary truncate">
                        {lead.email}
                        {lead.company && ` · ${lead.company}`}
                      </p>
                    </div>
                    {alreadyEnrolled && (
                      <span className="text-[10px] uppercase tracking-wider text-th-text-secondary font-medium">
                        Already enrolled
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between p-4 border-t border-th-border">
          <span className="text-sm text-th-text-secondary">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => onEnroll(Array.from(selected))}
              disabled={selected.size === 0}
              className="px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50"
            >
              Enroll {selected.size > 0 ? `(${selected.size})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sequence Analytics
// ============================================================================

function SequenceAnalytics({
  sequence,
  steps,
  enrollments,
  onBack,
}: {
  sequence: EmailSequence;
  steps: SequenceStep[];
  enrollments: SequenceEnrollment[];
  onBack: () => void;
}) {
  // Enrollment status breakdown
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    enrollments.forEach((e) => {
      counts[e.status] = (counts[e.status] || 0) + 1;
    });
    return counts;
  }, [enrollments]);

  // Recent activity
  const recentActivity = useMemo(() => {
    return [...enrollments]
      .filter((e) => e.last_activity_at)
      .sort((a, b) => new Date(b.last_activity_at!).getTime() - new Date(a.last_activity_at!).getTime())
      .slice(0, 10);
  }, [enrollments]);

  const emailSteps = steps.filter((s) => s.step_type === 'email');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-surface-secondary text-th-text-secondary"
          title="Back to sequences"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-th-text-primary">{sequence.name}</h2>
          <p className="text-sm text-th-text-secondary">Sequence Analytics</p>
        </div>
        <StatusBadge status={sequence.status} />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Enrolled" value={sequence.total_enrolled} icon={Users} />
        <StatCard label="Completed" value={sequence.total_completed} icon={CheckCircle2} />
        <StatCard label="Replied" value={sequence.total_replied} icon={MessageSquareReply} />
        <StatCard label="Reply Rate" value={`${pct(sequence.total_replied, sequence.total_enrolled)}%`} icon={TrendingUp} />
      </div>

      {/* Funnel visualization */}
      <div className="bg-surface-primary border border-th-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-th-text-primary mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-th-accent-600" />
          Email Step Funnel
        </h3>
        {emailSteps.length === 0 ? (
          <p className="text-sm text-th-text-secondary text-center py-8">No email steps to display</p>
        ) : (
          <div className="space-y-3">
            {emailSteps.map((step, i) => {
              const prevSent = i > 0 ? emailSteps[i - 1].total_sent : step.total_sent;
              const dropOff = prevSent > 0 ? pct(prevSent - step.total_sent, prevSent) : 0;
              const maxSent = Math.max(...emailSteps.map((s) => s.total_sent), 1);
              const barWidth = pct(step.total_sent, maxSent);

              return (
                <div key={step.id}>
                  {i > 0 && (
                    <div className="flex items-center gap-2 py-1.5 pl-4">
                      <ArrowDown className="w-3.5 h-3.5 text-th-text-secondary" />
                      {dropOff > 0 && (
                        <span className="text-[10px] text-red-500 font-medium">
                          -{dropOff}% drop-off
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-20 shrink-0 text-right">
                      <span className="text-xs font-medium text-th-text-secondary">Step {step.step_number}</span>
                    </div>
                    <div className="flex-1 relative">
                      <div className="w-full bg-gray-100 rounded-full h-8">
                        <div
                          className="bg-th-accent-600/20 h-8 rounded-full flex items-center px-3 transition-all"
                          style={{ width: `${Math.max(barWidth, 8)}%` }}
                        >
                          <span className="text-xs font-medium text-th-text-primary whitespace-nowrap">
                            {step.total_sent} sent
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-48 shrink-0">
                      <div className="flex items-center gap-1 text-xs" title="Opened">
                        <Eye className="w-3 h-3 text-blue-500" />
                        <span className="text-th-text-secondary">{step.total_opened}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs" title="Clicked">
                        <MousePointerClick className="w-3 h-3 text-green-500" />
                        <span className="text-th-text-secondary">{step.total_clicked}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs" title="Replied">
                        <MessageSquareReply className="w-3 h-3 text-blue-500" />
                        <span className="text-th-text-secondary">{step.total_replied}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per-step metrics table */}
      <div className="bg-surface-primary border border-th-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-th-border">
          <h3 className="text-sm font-semibold text-th-text-primary flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-th-accent-600" />
            Per-Step Metrics
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-th-border bg-surface-secondary">
                <th className="text-left px-4 py-2.5 font-medium text-th-text-secondary text-xs uppercase tracking-wider">Step</th>
                <th className="text-left px-4 py-2.5 font-medium text-th-text-secondary text-xs uppercase tracking-wider">Type</th>
                <th className="text-right px-4 py-2.5 font-medium text-th-text-secondary text-xs uppercase tracking-wider">Sent</th>
                <th className="text-right px-4 py-2.5 font-medium text-th-text-secondary text-xs uppercase tracking-wider">Opened</th>
                <th className="text-right px-4 py-2.5 font-medium text-th-text-secondary text-xs uppercase tracking-wider">Open %</th>
                <th className="text-right px-4 py-2.5 font-medium text-th-text-secondary text-xs uppercase tracking-wider">Clicked</th>
                <th className="text-right px-4 py-2.5 font-medium text-th-text-secondary text-xs uppercase tracking-wider">Click %</th>
                <th className="text-right px-4 py-2.5 font-medium text-th-text-secondary text-xs uppercase tracking-wider">Replied</th>
                <th className="text-right px-4 py-2.5 font-medium text-th-text-secondary text-xs uppercase tracking-wider">Reply %</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step) => {
                const cfg = STEP_TYPE_CONFIG[step.step_type];
                return (
                  <tr key={step.id} className="border-b border-th-border last:border-0">
                    <td className="px-4 py-2.5 font-medium text-th-text-primary">#{step.step_number}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-th-text-primary">{step.total_sent}</td>
                    <td className="px-4 py-2.5 text-right text-th-text-primary">{step.total_opened}</td>
                    <td className="px-4 py-2.5 text-right text-blue-600 font-medium">{pct(step.total_opened, step.total_sent)}%</td>
                    <td className="px-4 py-2.5 text-right text-th-text-primary">{step.total_clicked}</td>
                    <td className="px-4 py-2.5 text-right text-green-600 font-medium">{pct(step.total_clicked, step.total_sent)}%</td>
                    <td className="px-4 py-2.5 text-right text-th-text-primary">{step.total_replied}</td>
                    <td className="px-4 py-2.5 text-right text-blue-600 font-medium">{pct(step.total_replied, step.total_sent)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrollment breakdown & Recent activity side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment status breakdown */}
        <div className="bg-surface-primary border border-th-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-th-text-primary mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-th-accent-600" />
            Enrollment Breakdown
          </h3>
          {Object.keys(statusBreakdown).length === 0 ? (
            <p className="text-sm text-th-text-secondary text-center py-4">No enrollment data</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusBreakdown).map(([status, count]) => {
                const cfg = ENROLLMENT_STATUS_CONFIG[status as EnrollmentStatus];
                if (!cfg) return null;
                const w = pct(count, enrollments.length);
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-th-text-secondary">
                        {count} ({w}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`${cfg.bg} h-2 rounded-full transition-all`} style={{ width: `${w}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-surface-primary border border-th-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-th-text-primary mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-th-accent-600" />
            Recent Activity
          </h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-th-text-secondary text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-secondary">
                  <div className="w-2 h-2 rounded-full bg-th-accent-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-th-text-primary truncate">
                      {e.lead_name || e.contact_name || 'Unknown'}{' '}
                      <span className="text-th-text-secondary">— Step {e.current_step}</span>
                    </p>
                    <p className="text-xs text-th-text-secondary">
                      {formatRelativeTime(e.last_activity_at!)}
                    </p>
                  </div>
                  <EnrollmentStatusBadge status={e.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sequence Builder Modal (full screen)
// ============================================================================

type BuilderStep = Omit<SequenceStep, 'id' | 'sequence_id' | 'created_at'> & {
  _tempId: string;
  id?: string;
};

function SequenceBuilderModal({
  sequence,
  initialSteps,
  supabase: sb,
  orgId: orgIdProp,
  templates,
  onSave,
  onClose,
}: {
  sequence: EmailSequence | null;
  initialSteps: SequenceStep[];
  supabase: ReturnType<typeof useCRM>['supabase'];
  orgId: string;
  templates: EmailTemplate[];
  onSave: () => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'steps' | 'settings' | 'enrollments'>('steps');
  const [name, setName] = useState(sequence?.name || '');
  const [description, setDescription] = useState(sequence?.description || '');
  const [triggerType, setTriggerType] = useState<TriggerType>(sequence?.trigger_type || 'manual');
  const [exitConditions, setExitConditions] = useState<ExitConditions>(
    sequence?.exit_conditions || { ...DEFAULT_EXIT_CONDITIONS }
  );
  const [settings, setSettings] = useState<SequenceSettings>(
    sequence?.settings || { ...DEFAULT_SETTINGS }
  );
  const [steps, setSteps] = useState<BuilderStep[]>(() =>
    initialSteps.map((s) => ({
      ...s,
      _tempId: s.id,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [enrollments, setEnrollments] = useState<SequenceEnrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [showLeadPicker, setShowLeadPicker] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Load enrollments
  useEffect(() => {
    if (!sequence?.id) return;
    setEnrollmentsLoading(true);
    (async () => {
      const { data } = await sb
        .from('crm_email_sequence_enrollments')
        .select('*')
        .eq('sequence_id', sequence.id)
        .order('enrolled_at', { ascending: false });
      if (data && data.length > 0) {
        // Resolve lead names
        const leadIds = data.filter((e: Record<string, unknown>) => e.lead_id).map((e: Record<string, unknown>) => e.lead_id as string);
        let leadMap: Record<string, { name: string; email: string }> = {};
        if (leadIds.length > 0) {
          const { data: leads } = await sb
            .from('crm_leads')
            .select('id, first_name, last_name, email')
            .in('id', leadIds);
          if (leads) {
            leadMap = Object.fromEntries(
              leads.map((l: Record<string, string | null>) => [
                l.id,
                {
                  name: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Unknown',
                  email: l.email || '',
                },
              ])
            );
          }
        }
        setEnrollments(
          data.map((e: Record<string, unknown>) => ({
            ...(e as unknown as SequenceEnrollment),
            lead_name: e.lead_id ? leadMap[e.lead_id as string]?.name : undefined,
            lead_email: e.lead_id ? leadMap[e.lead_id as string]?.email : undefined,
          }))
        );
      } else {
        setEnrollments([]);
      }
      setEnrollmentsLoading(false);
    })();
  }, [sequence?.id, sb]);

  const existingLeadIds = useMemo(
    () => new Set(enrollments.filter((e) => e.lead_id).map((e) => e.lead_id!)),
    [enrollments]
  );

  const addStep = useCallback((type: StepType, atIndex?: number) => {
    setSteps((prev) => {
      const idx = atIndex !== undefined ? atIndex : prev.length;
      const newStep: BuilderStep = {
        ...newStepDefaults(type, idx + 1),
        _tempId: crypto.randomUUID(),
      };
      const updated = [...prev];
      updated.splice(idx, 0, newStep);
      // Renumber
      return updated.map((s, i) => ({ ...s, step_number: i + 1 }));
    });
  }, []);

  const updateStep = useCallback((tempId: string, updates: Partial<BuilderStep>) => {
    setSteps((prev) => prev.map((s) => (s._tempId === tempId ? { ...s, ...updates } : s)));
  }, []);

  const removeStep = useCallback((tempId: string) => {
    setSteps((prev) => {
      const filtered = prev.filter((s) => s._tempId !== tempId);
      return filtered.map((s, i) => ({ ...s, step_number: i + 1 }));
    });
  }, []);

  // Drag reorder
  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (dropIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;
    setSteps((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(dropIndex, 0, moved);
      return updated.map((s, i) => ({ ...s, step_number: i + 1 }));
    });
    setDragIndex(null);
  };

  // Save
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Sequence name is required');
      return;
    }
    setSaving(true);
    try {
      let seqId = sequence?.id;

      if (seqId) {
        // Update existing
        const { error } = await sb
          .from('crm_email_sequences')
          .update({
            name: name.trim(),
            description: description.trim() || null,
            trigger_type: triggerType,
            exit_conditions: exitConditions,
            settings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', seqId);
        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await sb
          .from('crm_email_sequences')
          .insert({
            org_id: orgIdProp,
            name: name.trim(),
            description: description.trim() || null,
            status: 'draft' as SequenceStatus,
            trigger_type: triggerType,
            trigger_config: null,
            exit_conditions: exitConditions,
            settings,
            total_enrolled: 0,
            total_completed: 0,
            total_replied: 0,
            total_bounced: 0,
          })
          .select('id')
          .single();
        if (error) throw error;
        seqId = data.id;
      }

      // Sync steps: delete removed, upsert existing/new
      if (sequence?.id) {
        const keepIds = steps.filter((s) => s.id).map((s) => s.id!);
        if (keepIds.length > 0) {
          await sb
            .from('crm_email_sequence_steps')
            .delete()
            .eq('sequence_id', seqId!)
            .not('id', 'in', `(${keepIds.join(',')})`);
        } else {
          await sb
            .from('crm_email_sequence_steps')
            .delete()
            .eq('sequence_id', seqId!);
        }
      }

      // Upsert steps
      for (const step of steps) {
        const payload = {
          sequence_id: seqId!,
          step_number: step.step_number,
          step_type: step.step_type,
          template_id: step.template_id,
          subject_override: step.subject_override,
          body_override: step.body_override,
          delay_days: step.delay_days,
          delay_hours: step.delay_hours,
          condition_config: step.condition_config,
          task_config: step.task_config,
          is_active: step.is_active,
        };
        if (step.id) {
          await sb.from('crm_email_sequence_steps').update(payload).eq('id', step.id);
        } else {
          await sb.from('crm_email_sequence_steps').insert(payload);
        }
      }

      toast.success(sequence ? 'Sequence updated' : 'Sequence created');
      onSave();
    } catch (err) {
      console.error('Save sequence error:', err);
      toast.error('Failed to save sequence');
    } finally {
      setSaving(false);
    }
  };

  // Enrollment actions
  const handleEnrollLeads = async (leadIds: string[]) => {
    if (!sequence?.id) {
      toast.error('Save the sequence first before enrolling leads');
      return;
    }
    try {
      const rows = leadIds.map((lid) => ({
        sequence_id: sequence.id,
        lead_id: lid,
        status: 'active' as EnrollmentStatus,
        current_step: 1,
        enrolled_at: new Date().toISOString(),
      }));
      const { error } = await sb.from('crm_email_sequence_enrollments').insert(rows);
      if (error) throw error;
      toast.success(`${leadIds.length} lead(s) enrolled`);
      setShowLeadPicker(false);
      // Refresh enrollments
      const { data } = await sb
        .from('crm_email_sequence_enrollments')
        .select('*')
        .eq('sequence_id', sequence.id)
        .order('enrolled_at', { ascending: false });
      if (data) {
        // Re-resolve names
        const ids = data.filter((e: Record<string, unknown>) => e.lead_id).map((e: Record<string, unknown>) => e.lead_id as string);
        let leadMap: Record<string, { name: string; email: string }> = {};
        if (ids.length > 0) {
          const { data: leads } = await sb.from('crm_leads').select('id, first_name, last_name, email').in('id', ids);
          if (leads) {
            leadMap = Object.fromEntries(
              leads.map((l: Record<string, string | null>) => [l.id, { name: `${l.first_name || ''} ${l.last_name || ''}`.trim(), email: l.email || '' }])
            );
          }
        }
        setEnrollments(
          data.map((e: Record<string, unknown>) => ({
            ...(e as unknown as SequenceEnrollment),
            lead_name: e.lead_id ? leadMap[e.lead_id as string]?.name : undefined,
            lead_email: e.lead_id ? leadMap[e.lead_id as string]?.email : undefined,
          }))
        );
      }
      // Update enrolled count
      await sb
        .from('crm_email_sequences')
        .update({ total_enrolled: (sequence.total_enrolled || 0) + leadIds.length })
        .eq('id', sequence.id);
    } catch (err) {
      console.error('Enroll error:', err);
      toast.error('Failed to enroll leads');
    }
  };

  const handlePauseEnrollment = async (enrollmentId: string) => {
    const { error } = await sb
      .from('crm_email_sequence_enrollments')
      .update({ status: 'paused' })
      .eq('id', enrollmentId);
    if (!error) {
      setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? { ...e, status: 'paused' as EnrollmentStatus } : e)));
      toast.success('Enrollment paused');
    }
  };

  const handleResumeEnrollment = async (enrollmentId: string) => {
    const { error } = await sb
      .from('crm_email_sequence_enrollments')
      .update({ status: 'active' })
      .eq('id', enrollmentId);
    if (!error) {
      setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? { ...e, status: 'active' as EnrollmentStatus } : e)));
      toast.success('Enrollment resumed');
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    const { error } = await sb
      .from('crm_email_sequence_enrollments')
      .update({ status: 'removed' })
      .eq('id', enrollmentId);
    if (!error) {
      setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? { ...e, status: 'removed' as EnrollmentStatus } : e)));
      toast.success('Enrollment removed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-secondary flex flex-col">
      {/* Top bar */}
      <div className="bg-surface-primary border-b border-th-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-secondary text-th-text-secondary"
            title="Close builder"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-th-text-primary">
              {sequence ? 'Edit Sequence' : 'New Sequence'}
            </h2>
            {name && <p className="text-xs text-th-text-secondary">{name}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {sequence ? 'Save Changes' : 'Create Sequence'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface-primary border-b border-th-border px-6 flex items-center gap-1 shrink-0">
        {[
          { key: 'steps' as const, label: 'Steps', icon: Mail },
          { key: 'settings' as const, label: 'Settings', icon: Settings },
          ...(sequence?.id ? [{ key: 'enrollments' as const, label: 'Enrollments', icon: Users }] : []),
        ].map(({ key, label, icon: TabIcon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-th-accent-600 text-th-accent-600'
                : 'border-transparent text-th-text-secondary hover:text-th-text-primary'
            }`}
          >
            <TabIcon className="w-4 h-4" />
            {label}
            {key === 'enrollments' && enrollments.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-th-accent-600/10 text-th-accent-600 rounded-full font-bold">
                {enrollments.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          {activeTab === 'steps' && (
            <div>
              {steps.length === 0 ? (
                <div className="text-center py-16">
                  <Mail className="w-12 h-12 mx-auto mb-3 text-th-text-secondary/30" />
                  <h3 className="text-lg font-medium text-th-text-primary mb-1">No steps yet</h3>
                  <p className="text-sm text-th-text-secondary mb-6">
                    Add your first step to start building the sequence
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {(Object.keys(STEP_TYPE_CONFIG) as StepType[]).map((type) => {
                      const c = STEP_TYPE_CONFIG[type];
                      const StepIcon = c.icon;
                      return (
                        <button
                          key={type}
                          onClick={() => addStep(type, 0)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${c.bg} ${c.color} border-current/20 hover:opacity-80`}
                        >
                          <StepIcon className="w-4 h-4" />
                          Add {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  {steps.map((step, i) => (
                    <div key={step._tempId}>
                      <StepCard
                        step={step}
                        index={i}
                        templates={templates}
                        onUpdate={(updates) => updateStep(step._tempId, updates)}
                        onRemove={() => removeStep(step._tempId)}
                        onDragStart={handleDragStart(i)}
                        onDragOver={handleDragOver(i)}
                        onDrop={handleDrop(i)}
                      />
                      <AddStepButton onAdd={(type) => addStep(type, i + 1)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsPanel
              name={name}
              description={description}
              triggerType={triggerType}
              exitConditions={exitConditions}
              settings={settings}
              onNameChange={setName}
              onDescriptionChange={setDescription}
              onTriggerTypeChange={setTriggerType}
              onExitConditionsChange={setExitConditions}
              onSettingsChange={setSettings}
            />
          )}

          {activeTab === 'enrollments' && (
            <EnrollmentPanel
              enrollments={enrollments}
              loading={enrollmentsLoading}
              onPause={handlePauseEnrollment}
              onResume={handleResumeEnrollment}
              onRemove={handleRemoveEnrollment}
              onEnrollLeads={() => setShowLeadPicker(true)}
            />
          )}
        </div>
      </div>

      {/* Lead picker modal */}
      {showLeadPicker && (
        <LeadPickerModal
          supabase={sb}
          orgId={orgIdProp}
          existingLeadIds={existingLeadIds}
          onEnroll={handleEnrollLeads}
          onClose={() => setShowLeadPicker(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function EmailSequences() {
  const { supabase: sb, templateService } = useCRM();
  const { activeOrgId } = useOrg();

  // State
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [stepCounts, setStepCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Builder state
  const [builderSequence, setBuilderSequence] = useState<EmailSequence | null>(null);
  const [builderSteps, setBuilderSteps] = useState<SequenceStep[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);

  // Analytics state
  const [analyticsSequence, setAnalyticsSequence] = useState<EmailSequence | null>(null);
  const [analyticsSteps, setAnalyticsSteps] = useState<SequenceStep[]>([]);
  const [analyticsEnrollments, setAnalyticsEnrollments] = useState<SequenceEnrollment[]>([]);

  // Confirm dialog
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    destructive?: boolean;
    action: () => Promise<void>;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Load sequences
  const loadSequences = useCallback(async () => {
    if (!activeOrgId) return;
    try {
      let query = sb
        .from('crm_email_sequences')
        .select('*')
        .eq('org_id', activeOrgId)
        .order('updated_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSequences((data || []) as EmailSequence[]);

      // Load step counts
      if (data && data.length > 0) {
        const ids = data.map((s: { id: string }) => s.id);
        const { data: stepsData } = await sb
          .from('crm_email_sequence_steps')
          .select('sequence_id')
          .in('sequence_id', ids);
        const counts: Record<string, number> = {};
        (stepsData || []).forEach((s: { sequence_id: string }) => {
          counts[s.sequence_id] = (counts[s.sequence_id] || 0) + 1;
        });
        setStepCounts(counts);
      }
    } catch (err) {
      console.error('Load sequences error:', err);
      toast.error('Failed to load sequences');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sb, activeOrgId, statusFilter, search]);

  useEffect(() => {
    loadSequences();
  }, [loadSequences]);

  // Load templates
  useEffect(() => {
    if (!activeOrgId) return;
    (async () => {
      try {
        const { data } = await sb
          .from('crm_email_templates')
          .select('id, name, subject, body')
          .eq('org_id', activeOrgId)
          .order('name');
        setTemplates((data || []) as EmailTemplate[]);
      } catch {
        // Templates are optional, don't block
      }
    })();
  }, [sb, activeOrgId]);

  // Stats
  const stats = useMemo(() => {
    const total = sequences.length;
    const active = sequences.filter((s) => s.status === 'active').length;
    const totalEnrolled = sequences.reduce((sum, s) => sum + (s.total_enrolled || 0), 0);
    const totalReplied = sequences.reduce((sum, s) => sum + (s.total_replied || 0), 0);
    const avgReplyRate = totalEnrolled > 0 ? Math.round((totalReplied / totalEnrolled) * 100) : 0;
    return { total, active, totalEnrolled, avgReplyRate };
  }, [sequences]);

  // Handlers
  const handleCreate = () => {
    setBuilderSequence(null);
    setBuilderSteps([]);
    setShowBuilder(true);
  };

  const handleEdit = async (seq: EmailSequence) => {
    const { data } = await sb
      .from('crm_email_sequence_steps')
      .select('*')
      .eq('sequence_id', seq.id)
      .order('step_number');
    setBuilderSequence(seq);
    setBuilderSteps((data || []) as SequenceStep[]);
    setShowBuilder(true);
  };

  const handleDuplicate = async (seq: EmailSequence) => {
    if (!activeOrgId) return;
    try {
      const { data: newSeq, error } = await sb
        .from('crm_email_sequences')
        .insert({
          org_id: activeOrgId,
          name: `${seq.name} (Copy)`,
          description: seq.description,
          status: 'draft' as SequenceStatus,
          trigger_type: seq.trigger_type,
          trigger_config: seq.trigger_config,
          exit_conditions: seq.exit_conditions,
          settings: seq.settings,
          total_enrolled: 0,
          total_completed: 0,
          total_replied: 0,
          total_bounced: 0,
        })
        .select('id')
        .single();
      if (error) throw error;

      // Copy steps
      const { data: existingSteps } = await sb
        .from('crm_email_sequence_steps')
        .select('*')
        .eq('sequence_id', seq.id)
        .order('step_number');
      if (existingSteps && existingSteps.length > 0) {
        const newSteps = existingSteps.map((s: Record<string, unknown>) => ({
          sequence_id: newSeq.id,
          step_number: s.step_number,
          step_type: s.step_type,
          template_id: s.template_id,
          subject_override: s.subject_override,
          body_override: s.body_override,
          delay_days: s.delay_days,
          delay_hours: s.delay_hours,
          condition_config: s.condition_config,
          task_config: s.task_config,
          is_active: s.is_active,
          total_sent: 0,
          total_opened: 0,
          total_clicked: 0,
          total_replied: 0,
        }));
        await sb.from('crm_email_sequence_steps').insert(newSteps);
      }

      toast.success('Sequence duplicated');
      loadSequences();
    } catch (err) {
      console.error('Duplicate error:', err);
      toast.error('Failed to duplicate sequence');
    }
  };

  const handleToggleStatus = async (seq: EmailSequence) => {
    const newStatus: SequenceStatus = seq.status === 'active' ? 'paused' : 'active';
    try {
      const { error } = await sb
        .from('crm_email_sequences')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', seq.id);
      if (error) throw error;
      toast.success(newStatus === 'active' ? 'Sequence activated' : 'Sequence paused');
      loadSequences();
    } catch (err) {
      console.error('Toggle status error:', err);
      toast.error('Failed to update sequence');
    }
  };

  const handleArchive = (seq: EmailSequence) => {
    setConfirmAction({
      title: 'Archive Sequence',
      message: `Are you sure you want to archive "${seq.name}"? Active enrollments will be paused.`,
      confirmLabel: 'Archive',
      action: async () => {
        const { error } = await sb
          .from('crm_email_sequences')
          .update({ status: 'archived' as SequenceStatus, updated_at: new Date().toISOString() })
          .eq('id', seq.id);
        if (error) throw error;
        toast.success('Sequence archived');
        loadSequences();
      },
    });
  };

  const handleDelete = (seq: EmailSequence) => {
    setConfirmAction({
      title: 'Delete Sequence',
      message: `Are you sure you want to permanently delete "${seq.name}"? This will also remove all steps and enrollment data. This action cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
      action: async () => {
        // Delete enrollments, steps, then sequence
        await sb.from('crm_email_sequence_enrollments').delete().eq('sequence_id', seq.id);
        await sb.from('crm_email_sequence_steps').delete().eq('sequence_id', seq.id);
        const { error } = await sb.from('crm_email_sequences').delete().eq('id', seq.id);
        if (error) throw error;
        toast.success('Sequence deleted');
        loadSequences();
      },
    });
  };

  const handleViewAnalytics = async (seq: EmailSequence) => {
    const [stepsRes, enrollRes] = await Promise.all([
      sb.from('crm_email_sequence_steps').select('*').eq('sequence_id', seq.id).order('step_number'),
      sb.from('crm_email_sequence_enrollments').select('*').eq('sequence_id', seq.id).order('enrolled_at', { ascending: false }),
    ]);

    // Resolve lead names for enrollments
    const enrollData = (enrollRes.data || []) as unknown as SequenceEnrollment[];
    if (enrollData.length > 0) {
      const leadIds = enrollData.filter((e) => e.lead_id).map((e) => e.lead_id!);
      if (leadIds.length > 0) {
        const { data: leads } = await sb.from('crm_leads').select('id, first_name, last_name, email').in('id', leadIds);
        if (leads) {
          const leadMap = Object.fromEntries(
            leads.map((l: Record<string, string | null>) => [l.id, { name: `${l.first_name || ''} ${l.last_name || ''}`.trim(), email: l.email || '' }])
          );
          enrollData.forEach((e) => {
            if (e.lead_id && leadMap[e.lead_id]) {
              e.lead_name = leadMap[e.lead_id].name;
              e.lead_email = leadMap[e.lead_id].email;
            }
          });
        }
      }
    }

    setAnalyticsSequence(seq);
    setAnalyticsSteps((stepsRes.data || []) as SequenceStep[]);
    setAnalyticsEnrollments(enrollData);
    setViewMode('analytics');
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      await confirmAction.action();
    } catch (err) {
      console.error('Confirm action error:', err);
      toast.error('Operation failed');
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };

  // Filtered sequences
  const filtered = sequences;

  // ============================================================================
  // Render
  // ============================================================================

  if (showBuilder) {
    return (
      <SequenceBuilderModal
        sequence={builderSequence}
        initialSteps={builderSteps}
        supabase={sb}
        orgId={activeOrgId!}
        templates={templates}
        onSave={() => {
          setShowBuilder(false);
          loadSequences();
        }}
        onClose={() => setShowBuilder(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics view */}
      {viewMode === 'analytics' && analyticsSequence ? (
        <SequenceAnalytics
          sequence={analyticsSequence}
          steps={analyticsSteps}
          enrollments={analyticsEnrollments}
          onBack={() => {
            setViewMode('list');
            setAnalyticsSequence(null);
          }}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-th-text-primary">Email Sequences</h1>
              <p className="text-sm text-th-text-secondary mt-0.5">
                Automated multi-step email outreach
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setRefreshing(true); loadSequences(); }}
                disabled={refreshing}
                className="p-2 rounded-lg border border-th-border hover:bg-surface-secondary text-th-text-secondary disabled:opacity-50"
                title="Refresh sequences"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white text-sm font-medium rounded-lg hover:bg-th-accent-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Sequence
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Sequences" value={stats.total} icon={Mail} />
            <StatCard label="Active" value={stats.active} icon={Play} />
            <StatCard label="Total Enrolled" value={stats.totalEnrolled} icon={Users} />
            <StatCard label="Avg Reply Rate" value={`${stats.avgReplyRate}%`} icon={TrendingUp} />
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-secondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sequences..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary placeholder:text-th-text-secondary/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-th-border rounded-lg bg-surface-primary text-th-text-primary"
              title="Filter by status"
            >
              <option value="">All Statuses</option>
              {(Object.keys(STATUS_CONFIG) as SequenceStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>

          {/* Sequence list */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-surface-primary border border-th-border rounded-xl p-12 text-center">
              <Mail className="w-12 h-12 mx-auto mb-3 text-th-text-secondary/30" />
              <h3 className="text-lg font-medium text-th-text-primary mb-1">
                {search || statusFilter ? 'No sequences match your filters' : 'No sequences yet'}
              </h3>
              <p className="text-sm text-th-text-secondary mb-6">
                {search || statusFilter
                  ? 'Try adjusting your search or filters'
                  : 'Create your first email sequence to automate outreach'}
              </p>
              {!search && !statusFilter && (
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white text-sm font-medium rounded-lg hover:bg-th-accent-700"
                >
                  <Plus className="w-4 h-4" />
                  Create Sequence
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((seq) => (
                <SequenceCard
                  key={seq.id}
                  sequence={seq}
                  stepCount={stepCounts[seq.id] || 0}
                  onEdit={() => handleEdit(seq)}
                  onDuplicate={() => handleDuplicate(seq)}
                  onToggleStatus={() => handleToggleStatus(seq)}
                  onArchive={() => handleArchive(seq)}
                  onDelete={() => handleDelete(seq)}
                  onViewAnalytics={() => handleViewAnalytics(seq)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Confirm dialog */}
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
          loading={confirmLoading}
          destructive={confirmAction.destructive}
        />
      )}
    </div>
  );
}
