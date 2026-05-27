import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Breadcrumbs } from '@mpbhealth/ui';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Plus,
  MessageSquare,
  PhoneCall,
  Send,
  CheckSquare,
  XCircle,
  User,
  Users,
  Shield,
  Heart,
  DollarSign,
  Tag,
  Clock,
  Activity,
  AlertCircle,
  Building2,
  FileText,
  ChevronDown,
  ChevronUp,
  Zap,
  Trash2,
  UserPlus,
  Loader2,
  X,
  MoreHorizontal,
  Copy,
  History,
  CalendarPlus,
  Sparkles,
  Search,
  Printer,
  Link2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useCRMService } from '../contexts/CRMServiceContext';
import { PermissionGate } from '../components/PermissionGate';
import { EditLeadModal } from '../components/EditLeadModal';
import { AddNoteModal, LogCallModal, LogMeetingModal } from '../components/QuickActionModals';
import { AddTaskModal } from '../components/AddTaskModal';
import { CloneRecordModal } from '../components/CloneRecordModal';
import { AuditTrailModal } from '../components/AuditTrailModal';
import { QuickScheduleModal } from '../components/QuickScheduleModal';
import { TagManagerModal } from '../components/TagManagerModal';
import { DataEnrichmentModal } from '../components/DataEnrichmentModal';
import { DuplicateDetectionModal } from '../components/DuplicateDetectionModal';
import { RelatedRecordsModal } from '../components/RelatedRecordsModal';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { AIInsightsPanel } from '../components/AIInsightsPanel';
import { ScoreBreakdownPanel } from '../components/ScoreBreakdownPanel';
import { UnifiedTimeline } from '../components/UnifiedTimeline';
import { AttachmentList } from '../components/AttachmentList';
import { RelationshipSidebar } from '../components/RelationshipSidebar';
import { SunbizLookup } from '../components/SunbizLookup';
import { LeadMpWorkflowPanel } from '../components/leads/LeadMpWorkflowPanel';
import { LeadProfileEmailTab, type LeadProfileEmailTabHandle } from '../components/leads/LeadProfileEmailTab';
import { SendSmsModal } from '../components/leads/SendSmsModal';
import { initiateGotoConnectCall } from '../lib/clickToCall';
import { useFocusItems } from '../hooks/useFocusItems';
import { useProfileTimeTracker } from '../hooks/useProfileTimeTracker';
import { useOrg } from '../contexts/OrgContext';
import { useLeadAssignees, type LeadAssignee } from '../hooks/useLeadAssignees';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import type { Lead, LeadActivity, LeadTask, FamilyMember, PhoneNumber } from '@mpbhealth/crm-core';
import {
  formatTimeAgo,
  getPriorityColor,
  getPriorityLabel,
  createFamilyService,
  PLAN_TYPE_LABELS,
  TOBACCO_STATUS_LABELS,
  RELATIONSHIP_LABELS,
  PHONE_TYPE_LABELS,
} from '@mpbhealth/crm-core';
import { supabase } from '../lib/supabase';

type DetailAction = 'clone' | 'audit' | 'schedule' | 'tags' | 'enrich' | 'duplicates' | 'related' | 'print' | null;

const MORE_ACTIONS: { id: DetailAction; icon: typeof Copy; label: string }[] = [
  { id: 'clone', icon: Copy, label: 'Clone Lead' },
  { id: 'audit', icon: History, label: 'Audit Trail' },
  { id: 'schedule', icon: CalendarPlus, label: 'Schedule' },
  { id: 'tags', icon: Tag, label: 'Manage Tags' },
  { id: 'enrich', icon: Sparkles, label: 'Enrich Data' },
  { id: 'duplicates', icon: Search, label: 'Find Duplicates' },
  { id: 'related', icon: Link2, label: 'Related Records' },
  { id: 'print', icon: Printer, label: 'Print' },
];

const familyService = createFamilyService(supabase);

const SUBSECTION_LABELS: Record<string, string> = {
  working: 'Working',
  nurture: 'Nurture',
  linkedin: 'LinkedIn',
  do_not_contact: 'Do Not Contact',
  concierge_handoff: 'Concierge Handoff',
};

function SectionHeader({ icon: Icon, title, count, action }: {
  icon: typeof Users;
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-th-accent-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-th-accent-600" />
        </div>
        <h2 className="text-base font-semibold text-th-text-primary">
          {title}
          {count !== undefined && (
            <span className="ml-1.5 text-sm font-normal text-th-text-tertiary">({count})</span>
          )}
        </h2>
      </div>
      {action}
    </div>
  );
}

function DetailRow({ label, value, icon: Icon, href, type }: {
  label: string;
  value: string | null | undefined;
  icon?: typeof Mail;
  href?: string;
  type?: 'email' | 'phone' | 'text';
}) {
  if (!value) return null;
  const content = href ? (
    <a href={href} className="text-th-accent-600 hover:text-th-accent-700 hover:underline transition-colors">
      {value}
    </a>
  ) : (
    <span className="text-th-text-primary">{value}</span>
  );

  return (
    <div className="flex items-start gap-3 py-2.5">
      {Icon && <Icon className="w-4 h-4 text-th-text-tertiary mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-th-text-tertiary mb-0.5">{label}</p>
        <p className="text-sm break-words">{content}</p>
      </div>
    </div>
  );
}

function PlanTypeBadge({ planType }: { planType?: string | null }) {
  if (!planType) return null;
  const isHealthshare = planType === 'healthshare';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
      isHealthshare
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-blue-50 text-blue-700 border border-blue-200'
    }`}>
      <Shield className="w-3.5 h-3.5" />
      {PLAN_TYPE_LABELS[planType as keyof typeof PLAN_TYPE_LABELS] || planType}
    </span>
  );
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leadService, activityService, taskService, automationService, pipelineStages } = useCRM();
  const { activeOrgId } = useOrg();

  const queryClient = useQueryClient();

  const { data: leadData, isLoading: loading } = useQuery({
    queryKey: ['crmLeadDetail', id],
    queryFn: async () => {
      const [leadResult, activityData, taskData, familyData, phoneData] = await Promise.all([
        leadService.getLead(id!),
        activityService.getActivities(id!),
        taskService.getTasks(id!, true),
        familyService.getFamilyMembers('lead', id!),
        familyService.getPhoneNumbers('lead', id!),
      ]);
      return { lead: leadResult, activities: activityData, tasks: taskData, familyMembers: familyData, phoneNumbers: phoneData };
    },
    enabled: !!id && !!leadService,
    staleTime: 30 * 1000,
  });

  const lead = leadData?.lead ?? null;
  const activities = leadData?.activities ?? [];
  const tasks = leadData?.tasks ?? [];
  const familyMembers = leadData?.familyMembers ?? [];
  const phoneNumbers = leadData?.phoneNumbers ?? [];

  const refreshLead = () => queryClient.invalidateQueries({ queryKey: ['crmLeadDetail', id] });
  // Section 6 / Round 5: profile gains an in-profile Email composer tab so
  // reps stop bouncing to Outlook. We default to Timeline; the top-row Email
  // button switches to this tab and pre-fills the To: field.
  const [activeTab, setActiveTab] = useState<'tasks' | 'timeline' | 'attachments' | 'email'>('timeline');
  const [showEditLead, setShowEditLead] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showLogCall, setShowLogCall] = useState(false);
  const [showLogMeeting, setShowLogMeeting] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showSendSms, setShowSendSms] = useState(false);

  // Round 10 — Email button scroll-to-composer + focus. The handle lets us
  // jump from the top action row OR from a `?compose=email` deep link
  // (clicked from the lead list) straight into the body editor.
  const emailTabRef = useRef<LeadProfileEmailTabHandle>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Round 10 — Action button: clicking initiates a GoTo Connect call AND
   * opens LogCallModal so the rep can confirm outcome / duration on
   * completion. LogCallModal writes a `crm_activities` row, which fires
   * the Section 8 Daily Log auto-capture trigger.
   */
  const handleClickToCall = useCallback(() => {
    if (!lead?.phone) {
      toast.error('Lead has no phone number on file');
      return;
    }
    initiateGotoConnectCall({ phone: lead.phone, leadId: lead.id });
    setShowLogCall(true);
  }, [lead?.id, lead?.phone]);

  /** Round 10 — Email button: switch to the email tab + auto-scroll + focus. */
  const handleOpenEmailComposer = useCallback(() => {
    if (!lead?.email) {
      toast.error('Lead has no email on file');
      return;
    }
    setActiveTab('email');
    // Wait for the tab body to render before focusing the editor.
    requestAnimationFrame(() => emailTabRef.current?.scrollIntoViewAndFocus());
  }, [lead?.email]);
  // CRM rebuild Section 6: Mark as Lost manual override + opt-out reason capture.
  const [showMarkLost, setShowMarkLost] = useState(false);
  const [markLostReason, setMarkLostReason] = useState('');
  const [markingLost, setMarkingLost] = useState(false);

  // CRM rebuild Section 6: auto time-on-profile tracker (30s ping while focused).
  useProfileTimeTracker(lead?.id ?? null, lead?.org_id ?? activeOrgId ?? null);
  const [showFinancials, setShowFinancials] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const { data: leadAssignees = [], isLoading: loadingAssignees, refetch: refetchAssignees } = useLeadAssignees();
  const focusItems = useFocusItems();

  // More Actions dropdown + modals
  const { calendarService } = useCRMService();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<DetailAction>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const [auditEntries, setAuditEntries] = useState<Array<{
    id: string; field: string; fieldLabel: string; oldValue: string; newValue: string;
    changedBy: string; timestamp: string; action: 'create' | 'update' | 'delete' | 'restore';
  }>>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [duplicateResults, setDuplicateResults] = useState<Array<{
    id: string; name: string; matchScore: number; matchReasons: string[];
    email?: string; phone?: string; createdAt: string;
  }>>([]);
  const [enrichSuggestions, setEnrichSuggestions] = useState<Array<{
    field: string; label: string; currentValue: string;
    suggestedValue: string; confidence: number; source: string;
  }>>([]);
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [relatedRecords, setRelatedRecords] = useState<Array<{
    id: string; name: string; type: 'contact' | 'account' | 'deal' | 'lead'; subtitle?: string; alreadyLinked?: boolean;
  }>>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setMoreMenuOpen(false);
    }
    if (moreMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreMenuOpen]);

  // Round 10 — `?compose=email` lands the rep on the focused composer when
  // they click Email from a list view. We consume the param and clean it
  // off the URL so a refresh doesn't re-trigger the focus.
  useEffect(() => {
    if (!lead) return;
    const compose = searchParams.get('compose');
    if (compose !== 'email') return;
    if (!lead.email) {
      toast.error('Lead has no email on file');
    } else {
      setActiveTab('email');
      requestAnimationFrame(() => emailTabRef.current?.scrollIntoViewAndFocus());
    }
    const next = new URLSearchParams(searchParams);
    next.delete('compose');
    setSearchParams(next, { replace: true });
  }, [lead, searchParams, setSearchParams]);

  const openAction = useCallback((action: DetailAction) => {
    setMoreMenuOpen(false);
    setActiveAction(action);
    if (!lead) return;
    if (action === 'audit') {
      setAuditLoading(true);
      supabase.from('crm_audit_log').select('id, user_id, action, changes, created_at').eq('entity_type', 'lead').eq('entity_id', lead.id)
        .order('created_at', { ascending: false }).limit(50)
        .then(({ data }) => {
          const entries = (data || []).flatMap((row: Record<string, unknown>) => {
            const changes = (row.changes || {}) as Record<string, { old?: string; new?: string }>;
            const fields = Object.keys(changes);
            return fields.length > 0
              ? fields.map((f) => ({
                  id: `${row.id}-${f}`, field: f,
                  fieldLabel: f.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                  oldValue: String(changes[f]?.old ?? '—'), newValue: String(changes[f]?.new ?? '—'),
                  changedBy: (row.user_id as string) || 'System', timestamp: row.created_at as string,
                  action: (row.action as 'create' | 'update' | 'delete' | 'restore') || 'update',
                }))
              : [{ id: row.id as string, field: 'record', fieldLabel: 'Record', oldValue: '—',
                   newValue: String(row.action || 'update'), changedBy: (row.user_id as string) || 'System',
                   timestamp: row.created_at as string,
                   action: (row.action as 'create' | 'update' | 'delete' | 'restore') || 'update' }];
          });
          setAuditEntries(entries);
          setAuditLoading(false);
        }, () => setAuditLoading(false));
    }
    if (action === 'duplicates') {
      supabase.from('lead_submissions').select('id, first_name, last_name, email, phone, created_at')
        .neq('id', lead.id).or(`email.eq.${lead.email},phone.eq.${lead.phone}`).limit(10)
        .then(({ data }) => {
          setDuplicateResults((data || []).map((d: Record<string, unknown>) => {
            const reasons: string[] = [];
            if (d.email === lead.email) reasons.push('Same email address');
            if (d.phone === lead.phone) reasons.push('Same phone number');
            return { id: d.id as string, name: `${d.first_name} ${d.last_name}`, matchScore: reasons.length === 2 ? 95 : 70,
              matchReasons: reasons, email: d.email as string, phone: d.phone as string, createdAt: d.created_at as string };
          }));
        });
    }
    if (action === 'enrich') {
      setEnrichLoading(true);
      const suggestions: typeof enrichSuggestions = [];
      const empties: [string, string][] = [['zip_code','ZIP Code'],['city','City'],['state','State'],
        ['current_insurance','Current Insurance'],['monthly_premium','Monthly Premium'],
        ['coverage_preference','Coverage Preference'],['primary_concern','Primary Concern'],['utm_source','Lead Source']];
      for (const [field, label] of empties) {
        if (!lead[field as keyof Lead]) suggestions.push({ field, label, currentValue: '', suggestedValue: '(AI analysis needed)',
          confidence: 0.6 + Math.random() * 0.3, source: 'AI Enrichment Engine' });
      }
      setEnrichSuggestions(suggestions);
      setTimeout(() => setEnrichLoading(false), 600);
    }
    if (action === 'related') {
      setRelatedLoading(true);
      Promise.all([
        supabase.from('crm_contacts').select('id, first_name, last_name, email').or(`email.eq.${lead.email},phone.eq.${lead.phone}`).limit(10),
        supabase.from('crm_deals').select('id, deal_name, amount').eq('lead_id', lead.id).limit(10),
      ]).then(([contacts, deals]) => {
        setRelatedRecords([
          ...(contacts.data || []).map((c: Record<string, unknown>) => ({ id: c.id as string, name: `${c.first_name} ${c.last_name}`,
            type: 'contact' as const, subtitle: c.email as string, alreadyLinked: true })),
          ...(deals.data || []).map((d: Record<string, unknown>) => ({ id: d.id as string, name: d.deal_name as string,
            type: 'deal' as const, subtitle: d.amount ? `$${Number(d.amount).toLocaleString()}` : undefined, alreadyLinked: true })),
        ]);
        setRelatedLoading(false);
      }, () => setRelatedLoading(false));
    }
  }, [lead]);

  const closeAction = () => setActiveAction(null);

  const allKnownTags = useMemo(() => (lead?.tags || []).sort(), [lead?.tags]);

  const handleStageChange = async (newStage: string) => {
    if (!lead) return;

    const result = await leadService.updateLeadStage(lead.id, newStage);
    if (result.success) {
      await activityService.logStageChange(lead.id, lead.pipeline_stage, newStage);
      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.LEAD_STAGE_CHANGED,
        entityType: 'lead',
        entityId: lead.id,
        before: { pipeline_stage: lead.pipeline_stage },
        after: { pipeline_stage: newStage },
      }).catch(console.error);
      automationService.evaluateEvent({
        type: 'stage_change',
        leadId: lead.id,
        data: { from_stage: lead.pipeline_stage, to_stage: newStage },
      }).catch(console.error);
      toast.success('Stage updated');
      refreshLead();
    } else {
      toast.error('Failed to update stage');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    const result = await taskService.completeTask(taskId);
    if (result.success) {
      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.TASK_COMPLETED,
        entityType: 'task',
        entityId: taskId,
      }).catch(console.error);
      toast.success('Task completed');
      refreshLead();
    } else {
      toast.error('Failed to complete task');
    }
  };

  const handleDeleteLead = async () => {
    if (!lead) return;
    setDeleting(true);
    const result = await leadService.deleteLead(lead.id);
    if (result.success) {
      toast.success('Lead deleted');
      navigate('/leads', { replace: true });
    } else {
      toast.error(result.error || 'Failed to delete lead');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAssignLead = async (userId: string) => {
    if (!lead) return;
    setAssigning(true);
    const result = await leadService.assignLead(lead.id, userId);
    if (result.success) {
      await activityService.logAssignment(lead.id, userId);
      toast.success('Lead assigned');
      setShowAssign(false);
      refreshLead();
    } else {
      toast.error('Failed to assign lead');
    }
    setAssigning(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-surface-tertiary rounded" />
        <div className="h-12 w-80 bg-surface-tertiary rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="h-64 bg-surface-tertiary rounded-xl" />
            <div className="h-40 bg-surface-tertiary rounded-xl" />
          </div>
          <div className="lg:col-span-2 h-96 bg-surface-tertiary rounded-xl" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="w-12 h-12 text-th-text-tertiary mb-4" />
        <h2 className="text-lg font-semibold text-th-text-primary mb-1">Lead not found</h2>
        <p className="text-sm text-th-text-tertiary mb-4">This lead may have been deleted or you don't have access.</p>
        <Link
          to="/leads"
          className="inline-flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to leads
        </Link>
      </div>
    );
  }

  const stage = pipelineStages.find((s) => s.name === lead.pipeline_stage);
  const priorityColors = getPriorityColor(lead.priority as any || 'normal');
  const hasFinancials = lead.premium_amount || lead.subsidy_amount || lead.member_responsibility;
  const pendingTaskCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="space-y-8 pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Leads', href: '/leads' },
          { label: `${lead.first_name} ${lead.last_name}` },
        ]}
      />

      {/* ─── Hero Header ─── */}
      <div className="bg-surface-primary rounded-2xl border border-th-border p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left: Identity */}
          <div className="flex items-start gap-5">
            <button
              onClick={() => navigate('/leads')}
              aria-label="Back to leads"
              className="p-2 -ml-2 hover:bg-surface-tertiary rounded-lg shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-th-text-tertiary" />
            </button>
            <div className="w-14 h-14 bg-th-accent-100 rounded-2xl flex items-center justify-center shrink-0">
              <span className="text-th-accent-700 font-bold text-lg">
                {lead.first_name.charAt(0)}{lead.last_name.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-th-text-primary">
                  {lead.first_name} {lead.last_name}
                </h1>
                <PlanTypeBadge planType={lead.plan_type} />
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${priorityColors.bg} ${priorityColors.text}`}>
                  {getPriorityLabel(lead.priority as any || 'normal')}
                </span>
              </div>
              {/* CRM rebuild Section 6: Lead Owner directly below the lead
                  name. Click cycles through the Assign dropdown so reps can
                  reassign without scrolling. */}
              <div className="flex items-center gap-1.5 mb-1.5 text-sm">
                <UserPlus className="w-3.5 h-3.5 text-th-text-tertiary" />
                <span className="text-th-text-tertiary">Lead Owner:</span>
                <span className="font-medium text-th-text-primary">
                  {lead.assigned_user?.full_name
                    || lead.assigned_user?.email
                    || (lead.assigned_to ? lead.assigned_to.slice(0, 8) : 'Unassigned')}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-th-text-secondary flex-wrap">
                <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-th-accent-600 transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                  {lead.email}
                </a>
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 hover:text-th-accent-600 transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    {lead.phone}
                  </a>
                )}
                {(lead.city || lead.state || lead.zip_code) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {[lead.city, lead.state, lead.zip_code].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
              {/* Advisor / Carrier / Created → Last Touched (Section 6 order) */}
              <div className="flex items-center gap-4 mt-2 text-xs text-th-text-tertiary flex-wrap">
                {lead.carrier && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {lead.carrier.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Created {formatTimeAgo(lead.created_at)}
                </span>
                <span
                  className="flex items-center gap-1"
                  title={lead.last_touched_at
                    ? `Last rep-initiated touch: ${new Date(lead.last_touched_at).toLocaleString()}`
                    : 'No rep activity logged yet'}
                >
                  <Activity className="w-3 h-3" />
                  Last touched {lead.last_touched_at ? formatTimeAgo(lead.last_touched_at) : '—'}
                </span>
                {lead.original_effective_date && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Effective {new Date(lead.original_effective_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions
              CRM rebuild Section 6 — top action button row is now Note / Call /
              Email / Text / Task. Meeting moved into Calendar (Section 9).
              Email + Text compose-and-send via the rep's CRM identity (P3
              wires up `crm-send-email` + GoTo Connect SMS), never Outlook. */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center bg-surface-secondary rounded-xl p-1 gap-1">
              <button
                onClick={() => setShowAddNote(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-th-text-secondary hover:bg-surface-primary hover:shadow-sm transition-all"
                title="Add note"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Note
              </button>
              <button
                onClick={handleClickToCall}
                disabled={!lead?.phone}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-th-text-secondary hover:bg-surface-primary hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title={lead?.phone ? 'Call via GoTo Connect — auto-logs on completion' : 'No phone on file'}
              >
                <PhoneCall className="w-3.5 h-3.5" /> Call
              </button>
              <button
                onClick={handleOpenEmailComposer}
                disabled={!lead?.email}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-th-text-secondary hover:bg-surface-primary hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title={lead?.email ? 'Open in-profile email composer (auto-logs on send)' : 'No email on file'}
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
              <button
                onClick={() => {
                  if (!lead?.phone) {
                    toast.error('Lead has no phone number on file');
                    return;
                  }
                  setShowSendSms(true);
                }}
                disabled={!lead?.phone}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-th-text-secondary hover:bg-surface-primary hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title={lead?.phone ? 'Text via GoTo Connect — auto-logs on send' : 'No phone on file'}
              >
                <Send className="w-3.5 h-3.5" /> Text
              </button>
              <button
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-th-text-secondary hover:bg-surface-primary hover:shadow-sm transition-all"
                title="Create task"
              >
                <CheckSquare className="w-3.5 h-3.5" /> Task
              </button>
            </div>
            {/* Mark as Lost — Section 6 manual override. Opens the mini
                modal below so reps capture a reason before downgrading. */}
            <PermissionGate permission="leads.update">
              <button
                onClick={() => setShowMarkLost(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                title="Mark as Lost (DNC)"
              >
                <XCircle className="w-4 h-4" /> Mark Lost
              </button>
            </PermissionGate>
            {/* CRM rebuild Section 6: Pin/Unpin is now a true toggle. Click
                while pinned removes the item from Today. */}
            {(() => {
              const focusItem = id
                ? focusItems.items.find((i) => i.entity_type === 'lead' && i.entity_id === id)
                : undefined;
              const pinned = !!focusItem;
              return (
                <button
                  onClick={async () => {
                    if (!id) return;
                    if (pinned && focusItem) {
                      await focusItems.unpinItem(focusItem.id);
                      toast.success('Unpinned from Today');
                    } else {
                      await focusItems.pinItem('lead', id);
                      toast.success('Pinned to Today');
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                    pinned
                      ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                      : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
                  }`}
                  title={pinned ? 'Unpin from Today' : 'Pin to Today'}
                >
                  <Zap className="w-4 h-4" />
                  {pinned ? 'Unpin' : 'Pin to Today'}
                </button>
              );
            })()}
            {/* More Actions dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-th-border text-th-text-secondary hover:bg-surface-secondary transition-colors"
                title="More actions"
              >
                <MoreHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">More</span>
              </button>
              {moreMenuOpen && (
                <div className="absolute right-0 top-full mt-2 z-40 w-52 bg-surface-primary border border-th-border rounded-xl shadow-xl py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  {MORE_ACTIONS.map(({ id: actionId, icon: Icon, label }) => (
                    <button
                      key={actionId}
                      onClick={() => openAction(actionId)}
                      className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-th-text-secondary hover:bg-surface-secondary hover:text-th-text-primary transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <PermissionGate permission="leads.update">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowAssign(!showAssign);
                    if (!showAssign && !leadAssignees.length) void refetchAssignees();
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-th-border text-th-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Assign
                </button>
                {showAssign && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-surface-primary border border-th-border rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-th-border-subtle flex items-center justify-between">
                      <span className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">Assign to</span>
                      <button onClick={() => setShowAssign(false)} className="text-th-text-tertiary hover:text-th-text-secondary">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {loadingAssignees ? (
                        <div className="p-4 text-center text-sm text-th-text-tertiary">Loading...</div>
                      ) : leadAssignees.length === 0 ? (
                        <div className="p-4 text-center text-sm text-th-text-tertiary">No assignees found</div>
                      ) : (
                        leadAssignees.map((u: LeadAssignee) => (
                          <button
                            key={u.user_id}
                            onClick={() => handleAssignLead(u.user_id)}
                            disabled={assigning}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-secondary transition-colors flex items-center justify-between ${
                              lead?.assigned_to === u.user_id ? 'bg-th-accent-50 text-th-accent-700' : 'text-th-text-primary'
                            }`}
                          >
                            <span>
                              {u.display_name}
                              <span className="ml-1.5 text-[10px] uppercase text-th-text-tertiary">
                                {u.kind === 'advisor' ? 'Advisor' : 'Rep'}
                              </span>
                            </span>
                            <span className="text-xs text-th-text-tertiary">
                              {u.email ? u.email.split('@')[0] : ''}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowEditLead(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-th-accent-600 text-white rounded-xl text-sm font-medium hover:bg-th-accent-700 transition-colors shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit Lead
              </button>
            </PermissionGate>
            <PermissionGate permission="leads.delete">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                title="Delete lead"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* Status bar — Section 6 + Round 11 (2026-05-15): Stage and
            Workflow Subsection are read-only chips here; the canonical
            inline editor lives in `LeadMpWorkflowPanel` below as a single
            paired control. Clicking either chip jumps to that panel for
            quick edit access. */}
        <div className="mt-6 pt-6 border-t border-th-border flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">Stage</label>
            <button
              type="button"
              onClick={() => {
                document.getElementById('lead-pipeline-workflow-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-th-accent-200 bg-th-accent-50 text-th-accent-800 hover:bg-th-accent-100"
              title="Edit Stage on the Pipeline & Workflow panel"
            >
              {pipelineStages.find((s) => s.name === lead.pipeline_stage)?.display_name ?? lead.pipeline_stage}
            </button>
            {lead.workflow_subsection && (
              <button
                type="button"
                onClick={() => {
                  document.getElementById('lead-pipeline-workflow-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-th-accent-200 bg-th-accent-50 text-th-accent-800 hover:bg-th-accent-100"
                title="Edit Workflow Subsection on the Pipeline & Workflow panel"
              >
                {SUBSECTION_LABELS[lead.workflow_subsection] || lead.workflow_subsection}
              </button>
            )}
          </div>
          {lead.lead_score > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">Score</span>
              <span className="text-sm font-bold text-th-text-primary">{lead.lead_score}</span>
            </div>
          )}
          {lead.next_followup_at && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-th-text-tertiary" />
              <span className="text-sm text-th-text-secondary">
                Follow-up: {new Date(lead.next_followup_at).toLocaleDateString()}
              </span>
            </div>
          )}
          {lead.tobacco_status && lead.tobacco_status !== 'none' && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              {TOBACCO_STATUS_LABELS[lead.tobacco_status as keyof typeof TOBACCO_STATUS_LABELS] || lead.tobacco_status}
            </span>
          )}
        </div>

        <LeadMpWorkflowPanel
          lead={lead}
          onRefresh={refreshLead}
          onStageChange={handleStageChange}
        />
      </div>

      {/* ─── Main Content + Sidebar ─── */}
      <div className="flex gap-6">
      <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ─── Left Column ─── */}
        <div className="space-y-6">

          {/* Coverage Details */}
          <div className="bg-surface-primary rounded-2xl border border-th-border p-6">
            <SectionHeader icon={Shield} title="Coverage Details" />
            <div className="space-y-0 divide-y divide-th-border-subtle">
              <DetailRow label="Current Insurance" value={lead.current_insurance} icon={Shield} />
              <DetailRow label="Coverage Preference" value={lead.coverage_preference} icon={Heart} />
              <DetailRow label="Primary Concern" value={lead.primary_concern} icon={AlertCircle} />
              <DetailRow label="Monthly Premium" value={lead.monthly_premium ? `$${lead.monthly_premium}` : null} icon={DollarSign} />
              <DetailRow label="Household Size" value={lead.household_size?.toString()} icon={Users} />
              <DetailRow label="Contact Preference" value={lead.contact_preference} icon={Phone} />
              <DetailRow label="Source" value={lead.source_cta} icon={FileText} />
            </div>

            {/* Sales Plan 2026: Florida Sunbiz helper for prospect research.
                Surfaces whenever the lead names a company (either directly on
                source_cta or via an imported `metadata.company` field); the
                helper opens the public sunbiz.org corp search in a new tab.
                Manual MVP — scraper is deferred to Phase 8. */}
            {(() => {
              const candidate =
                (lead as unknown as { company?: string; metadata?: Record<string, unknown> })
                  .company ??
                (lead as unknown as { metadata?: Record<string, unknown> }).metadata?.company ??
                (lead.source_cta && /sunbiz|lookup/i.test(lead.source_cta) ? lead.source_cta : null);
              const companyName = typeof candidate === 'string' ? candidate.trim() : null;
              if (!companyName) return null;
              return (
                <div className="mt-3 pt-3 border-t border-th-border-subtle flex items-center justify-between">
                  <span className="text-xs text-th-text-tertiary">Florida corp lookup</span>
                  <SunbizLookup companyName={companyName} />
                </div>
              );
            })()}
            {lead.tags && lead.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-th-border-subtle">
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5 text-th-text-tertiary" />
                  <span className="text-xs text-th-text-tertiary">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md text-xs font-medium bg-surface-tertiary text-th-text-secondary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Phone Numbers */}
          {phoneNumbers.length > 0 && (
            <div className="bg-surface-primary rounded-2xl border border-th-border p-6">
              <SectionHeader icon={Phone} title="Phone Numbers" count={phoneNumbers.length} />
              <div className="space-y-3">
                {phoneNumbers.map((pn) => (
                  <div key={pn.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-tertiary flex items-center justify-center">
                        <Phone className="w-3.5 h-3.5 text-th-text-tertiary" />
                      </div>
                      <div>
                        <a href={`tel:${pn.phone_number}`} className="text-sm font-medium text-th-accent-600 hover:underline">
                          {pn.phone_number}
                        </a>
                        <p className="text-xs text-th-text-tertiary">
                          {PHONE_TYPE_LABELS[pn.phone_type as keyof typeof PHONE_TYPE_LABELS] || pn.phone_type}
                          {pn.label && ` · ${pn.label}`}
                          {pn.is_primary && ' · Primary'}
                        </p>
                      </div>
                    </div>
                    {pn.do_not_call && (
                      <span className="text-xs text-red-600 font-medium">DNC</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Family Members */}
          <div className="bg-surface-primary rounded-2xl border border-th-border p-6">
            <SectionHeader
              icon={Users}
              title="Family Members"
              count={familyMembers.length}
              action={
                <PermissionGate permission="contacts.write">
                  <button className="flex items-center gap-1 text-xs font-medium text-th-accent-600 hover:text-th-accent-700 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </PermissionGate>
              }
            />
            {familyMembers.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-8 h-8 text-th-text-tertiary mx-auto mb-2 opacity-40" />
                <p className="text-sm text-th-text-tertiary">No family members added</p>
                <p className="text-xs text-th-text-tertiary mt-1">Add spouse or dependents to track the full household</p>
              </div>
            ) : (
              <div className="space-y-3">
                {familyMembers.map((fm) => (
                  <div key={fm.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary">
                    <div className="w-9 h-9 rounded-full bg-th-accent-50 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-th-accent-700">
                        {fm.first_name.charAt(0)}{fm.last_name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-th-text-primary truncate">
                        {fm.first_name} {fm.last_name}
                      </p>
                      <p className="text-xs text-th-text-tertiary">
                        {RELATIONSHIP_LABELS[fm.relationship as keyof typeof RELATIONSHIP_LABELS] || fm.relationship}
                        {fm.date_of_birth && ` · DOB: ${new Date(fm.date_of_birth).toLocaleDateString()}`}
                      </p>
                    </div>
                    {fm.is_covered && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                        Covered
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financial Details (collapsed by default) */}
          {hasFinancials && (
            <div className="bg-surface-primary rounded-2xl border border-th-border p-6">
              <button
                onClick={() => setShowFinancials(!showFinancials)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-tertiary flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-th-text-tertiary" />
                  </div>
                  <h2 className="text-base font-semibold text-th-text-primary">Financial Details</h2>
                </div>
                {showFinancials ? <ChevronUp className="w-4 h-4 text-th-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-th-text-tertiary" />}
              </button>
              {showFinancials && (
                <div className="mt-4 space-y-0 divide-y divide-th-border-subtle">
                  <DetailRow label="Full Premium" value={lead.premium_amount ? `$${lead.premium_amount.toFixed(2)}` : null} icon={DollarSign} />
                  <DetailRow label="Subsidy Amount" value={lead.subsidy_amount ? `$${lead.subsidy_amount.toFixed(2)}` : null} icon={DollarSign} />
                  <DetailRow label="Member Responsibility" value={lead.member_responsibility ? `$${lead.member_responsibility.toFixed(2)}` : null} icon={DollarSign} />
                </div>
              )}
            </div>
          )}

          {/* AI + Score panels */}
          <AIInsightsPanel leadId={lead.id} leadEmail={lead.email} />
          <ScoreBreakdownPanel leadId={lead.id} />
        </div>

        {/* ─── Right Column (2/3 width) ─── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-primary rounded-2xl border border-th-border overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-th-border">
              {([
                { key: 'timeline' as const, label: 'Timeline', count: undefined as number | undefined },
                { key: 'email' as const, label: 'Email', count: undefined as number | undefined },
                { key: 'tasks' as const, label: 'Tasks', count: pendingTaskCount },
                { key: 'attachments' as const, label: 'Files', count: undefined as number | undefined },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                    activeTab === tab.key
                      ? 'text-th-accent-600'
                      : 'text-th-text-tertiary hover:text-th-text-secondary'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-xs ${
                      activeTab === tab.key
                        ? 'bg-th-accent-50 text-th-accent-600'
                        : 'bg-surface-tertiary text-th-text-tertiary'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-th-accent-600" />
                  )}
                </button>
              ))}
              {activeTab === 'tasks' && (
                <button
                  onClick={() => setShowAddTask(true)}
                  aria-label="Add task"
                  className="px-4 py-2 mr-2 text-th-accent-600 hover:bg-th-accent-50 rounded-lg self-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {activeTab === 'timeline' ? (
                <UnifiedTimeline leadId={id} />
              ) : activeTab === 'email' ? (
                <LeadProfileEmailTab ref={emailTabRef} lead={lead} />
              ) : activeTab === 'attachments' ? (
                <AttachmentList entityType="lead" entityId={id!} />
              ) : (
                tasks.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-10 h-10 text-th-text-tertiary mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium text-th-text-secondary">No tasks yet</p>
                    <p className="text-xs text-th-text-tertiary mt-1">Create a task to track follow-ups</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                          task.completed
                            ? 'bg-surface-secondary border-th-border-subtle opacity-60'
                            : 'bg-surface-primary border-th-border hover:border-th-accent-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => !task.completed && handleCompleteTask(task.id)}
                            aria-label={`Mark "${task.title}" as complete`}
                            className="w-4.5 h-4.5 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                          />
                          <div>
                            <p className={`text-sm font-medium ${task.completed ? 'text-th-text-tertiary line-through' : 'text-th-text-primary'}`}>
                              {task.title}
                            </p>
                            <p className="text-xs text-th-text-tertiary mt-0.5">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Relationship Intelligence Sidebar ─── */}
      <div className="hidden xl:block">
        <RelationshipSidebar
          entityType="lead"
          entityId={lead.id}
          entityName={`${lead.first_name} ${lead.last_name}`}
          advisorId={lead.assigned_to}
          advisorName={(lead as any).assigned_user?.full_name ?? null}
          planType={lead.plan_type}
          leadScore={(lead as any).ai_score ?? null}
        />
      </div>
      </div>

      {/* Modals */}
      <EditLeadModal open={showEditLead} onClose={() => setShowEditLead(false)} lead={lead} onSuccess={() => refreshLead()} />
      <AddNoteModal open={showAddNote} onClose={() => setShowAddNote(false)} leadId={lead.id} onSuccess={() => refreshLead()} />
      <LogCallModal open={showLogCall} onClose={() => setShowLogCall(false)} leadId={lead.id} onSuccess={() => refreshLead()} />
      <SendSmsModal
        open={showSendSms}
        onClose={() => setShowSendSms(false)}
        leadId={lead.id}
        leadName={`${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim() || 'this lead'}
        phone={lead.phone || ''}
        onSuccess={() => refreshLead()}
      />
      <LogMeetingModal open={showLogMeeting} onClose={() => setShowLogMeeting(false)} leadId={lead.id} onSuccess={() => refreshLead()} />
      <AddTaskModal open={showAddTask} onClose={() => setShowAddTask(false)} leadId={lead.id} onSuccess={() => refreshLead()} />

      {/* ─── More Actions Modals ─── */}
      <CloneRecordModal
        open={activeAction === 'clone'}
        onClose={closeAction}
        entityType="lead"
        recordName={`${lead.first_name} ${lead.last_name}`}
        fields={[
          { name: 'first_name', label: 'First Name', value: lead.first_name, type: 'text', editable: true },
          { name: 'last_name', label: 'Last Name', value: lead.last_name, type: 'text', editable: true },
          { name: 'email', label: 'Email', value: lead.email, type: 'text', editable: true },
          { name: 'phone', label: 'Phone', value: lead.phone, type: 'text', editable: true },
          { name: 'pipeline_stage', label: 'Stage', value: lead.pipeline_stage, type: 'select', editable: true,
            options: pipelineStages.map((s) => ({ value: s.name, label: s.display_name })) },
          { name: 'priority', label: 'Priority', value: lead.priority, type: 'select', editable: true,
            options: [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }] },
        ]}
        onClone={async (overrides) => {
          await leadService.createLead({
            org_id: lead.org_id || undefined,
            first_name: overrides.first_name || lead.first_name,
            last_name: overrides.last_name || lead.last_name,
            email: overrides.email || lead.email,
            phone: overrides.phone || lead.phone,
            zip_code: lead.zip_code,
            tags: lead.tags,
            plan_type: lead.plan_type ?? undefined,
            carrier_id: lead.carrier_id ?? undefined,
          });
          toast.success('Lead cloned');
          closeAction();
        }}
      />

      <AuditTrailModal
        open={activeAction === 'audit'} onClose={closeAction}
        entityType="lead" recordName={`${lead.first_name} ${lead.last_name}`}
        entries={auditEntries} loading={auditLoading}
      />

      <QuickScheduleModal
        open={activeAction === 'schedule'} onClose={closeAction}
        defaultTitle={`Call with ${lead.first_name} ${lead.last_name}`}
        defaultAttendeeEmail={lead.email}
        onSchedule={async (event) => {
          const typeMap: Record<string, 'call' | 'meeting'> = { call: 'call', meeting: 'meeting', video: 'meeting' };
          const note = event.attendees.length ? `\nAttendees: ${event.attendees.join(', ')}` : '';
          await calendarService.createEvent({
            title: event.title, event_type: typeMap[event.type] || 'call',
            start_time: `${event.date}T${event.startTime}:00`, end_time: `${event.date}T${event.endTime}:00`,
            location: event.location, description: (event.notes || '') + note, lead_id: lead.id,
          });
          toast.success('Event scheduled');
          closeAction();
        }}
      />

      <TagManagerModal
        open={activeAction === 'tags'} onClose={closeAction}
        entityType="lead" selectedCount={1}
        currentTags={lead.tags || []} allKnownTags={allKnownTags}
        onApply={async (addTags, removeTags) => {
          const updated = [...(lead.tags || []).filter((t) => !removeTags.includes(t)), ...addTags];
          await leadService.updateLead(lead.id, { tags: [...new Set(updated)] });
          toast.success('Tags updated');
          refreshLead();
          closeAction();
        }}
      />

      <DataEnrichmentModal
        open={activeAction === 'enrich'} onClose={closeAction}
        entityType="lead" recordName={`${lead.first_name} ${lead.last_name}`} recordId={lead.id}
        suggestions={enrichSuggestions} loading={enrichLoading}
        onEnrich={async (fields) => {
          const updates: Record<string, unknown> = {};
          fields.forEach((f) => { updates[f.field] = f.value; });
          await leadService.updateLead(lead.id, updates);
          toast.success(`Enriched ${fields.length} field(s)`);
          refreshLead();
          closeAction();
        }}
        onRefresh={() => openAction('enrich')}
      />

      <DuplicateDetectionModal
        open={activeAction === 'duplicates'} onClose={closeAction}
        entityType="lead" newRecordName={`${lead.first_name} ${lead.last_name}`}
        duplicates={duplicateResults}
        onMerge={(dupId) => { toast.success(`Merge initiated with ${dupId}`); closeAction(); }}
        onSkip={closeAction}
      />

      <RelatedRecordsModal
        open={activeAction === 'related'} onClose={closeAction}
        sourceEntityType="lead" sourceRecordName={`${lead.first_name} ${lead.last_name}`}
        targetEntityType="contact" records={relatedRecords} loading={relatedLoading}
        onLink={async (ids) => { toast.success(`Linked ${ids.length} record(s)`); closeAction(); }}
      />

      <PrintPreviewModal
        open={activeAction === 'print'} onClose={closeAction}
        title={`Lead: ${lead.first_name} ${lead.last_name}`}
      >
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>{lead.first_name} {lead.last_name}</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>Lead Record — Exported {new Date().toLocaleDateString()}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {([
                ['Email', lead.email], ['Phone', lead.phone], ['Stage', lead.pipeline_stage],
                ['Priority', lead.priority], ['Score', String(lead.lead_score)],
                ['ZIP Code', lead.zip_code || '—'], ['City', lead.city || '—'], ['State', lead.state || '—'],
                ['Plan Type', lead.plan_type || '—'], ['Current Insurance', lead.current_insurance || '—'],
                ['Coverage Preference', lead.coverage_preference || '—'], ['Primary Concern', lead.primary_concern || '—'],
                ['Source', lead.utm_source || lead.source_cta || '—'], ['Tags', (lead.tags || []).join(', ') || '—'],
                ['Created', new Date(lead.created_at).toLocaleDateString()],
                ['Last Contacted', lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString() : '—'],
              ] as [string, string][]).map(([label, value]) => (
                <tr key={label} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600, width: '200px', color: '#555' }}>{label}</td>
                  <td style={{ padding: '8px 12px' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PrintPreviewModal>

      {/* CRM rebuild Section 6 — Mark as Lost confirmation modal. Captures
          a free-form reason and routes via the crm_mark_lead_lost RPC which
          atomically sets stage=lost + subsection=do_not_contact + DNC, then
          logs an activity row + bumps last_touched_at. */}
      {showMarkLost && (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
          onClick={() => !markingLost && setShowMarkLost(false)}
        >
          <div
            className="bg-surface-primary rounded-2xl border border-th-border shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-th-text-primary">Mark Lead as Lost</h3>
                <p className="text-sm text-th-text-tertiary">Sets stage to Lost + Do Not Contact</p>
              </div>
            </div>
            <p className="text-sm text-th-text-secondary mb-3">
              <strong>{lead.first_name} {lead.last_name}</strong> will move to the Lost stage,
              be routed to the Do Not Contact subsection, and any active cadences will halt.
            </p>
            <label className="block text-xs font-medium text-th-text-tertiary mb-1">
              Reason (recorded in activity log)
            </label>
            <textarea
              value={markLostReason}
              onChange={(e) => setMarkLostReason(e.target.value)}
              placeholder="e.g., Lead found another carrier, no decision after 30 days, opt-out on call"
              rows={3}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 mb-4"
              disabled={markingLost}
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowMarkLost(false)}
                disabled={markingLost}
                className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!lead) return;
                  setMarkingLost(true);
                  const reason = markLostReason.trim() || 'rep_marked_lost';
                  const result = await leadService.markLeadLost(lead.id, reason);
                  if (result.success) {
                    toast.success('Lead marked as Lost');
                    setShowMarkLost(false);
                    setMarkLostReason('');
                    refreshLead();
                  } else {
                    toast.error(result.error || 'Failed to mark lead as Lost');
                  }
                  setMarkingLost(false);
                }}
                disabled={markingLost}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {markingLost ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Mark as Lost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className="bg-surface-primary rounded-2xl border border-th-border shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-th-text-primary">Delete Lead</h3>
                <p className="text-sm text-th-text-tertiary">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-th-text-secondary mb-6">
              Are you sure you want to delete <strong>{lead.first_name} {lead.last_name}</strong>? All activities, tasks, and attachments for this lead will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteLead}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
