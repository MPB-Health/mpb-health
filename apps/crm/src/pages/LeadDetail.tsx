import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Video,
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useCelebration } from '../components/CelebrationSystem';
import { useGamification } from '../hooks/useGamification';
import { LivePresenceBar } from '../components/LivePresence';
import { PermissionGate } from '../components/PermissionGate';
import { EditLeadModal } from '../components/EditLeadModal';
import { AddNoteModal, LogCallModal, LogMeetingModal } from '../components/QuickActionModals';
import { AddTaskModal } from '../components/AddTaskModal';
import { AIInsightsPanel } from '../components/AIInsightsPanel';
import { ScoreBreakdownPanel } from '../components/ScoreBreakdownPanel';
import { UnifiedTimeline } from '../components/UnifiedTimeline';
import { AttachmentList } from '../components/AttachmentList';
import { RelationshipSidebar } from '../components/RelationshipSidebar';
import { useFocusItems } from '../hooks/useFocusItems';
import { useOrg } from '../contexts/OrgContext';
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

const familyService = createFamilyService(supabase);

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
  const { celebrate } = useCelebration();
  const { earnXP } = useGamification();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [tasks, setTasks] = useState<LeadTask[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'activities' | 'tasks' | 'timeline' | 'attachments'>('activities');
  const [showEditLead, setShowEditLead] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showLogCall, setShowLogCall] = useState(false);
  const [showLogMeeting, setShowLogMeeting] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showFinancials, setShowFinancials] = useState(false);
  const focusItems = useFocusItems();

  const loadLead = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    const [leadData, activityData, taskData, familyData, phoneData] = await Promise.all([
      leadService.getLead(id),
      activityService.getActivities(id),
      taskService.getTasks(id, true),
      familyService.getFamilyMembers('lead', id),
      familyService.getPhoneNumbers('lead', id),
    ]);

    setLead(leadData);
    setActivities(activityData);
    setTasks(taskData);
    setFamilyMembers(familyData);
    setPhoneNumbers(phoneData);
    setLoading(false);
  }, [id, leadService, activityService, taskService, familyService]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

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
      if (newStage === 'won') {
        celebrate('deal_closed', `${lead.first_name} ${lead.last_name} — Won!`);
        earnXP('deal_won', 'lead', lead.id, `Won: ${lead.first_name} ${lead.last_name}`);
      } else {
        celebrate('stage_won', `Moved to ${pipelineStages.find(s => s.name === newStage)?.display_name || newStage}`);
        earnXP('stage_advanced', 'lead', lead.id, `${lead.first_name} ${lead.last_name} → ${newStage}`);
      }
      toast.success('Stage updated');
      loadLead();
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
      earnXP('task_completed', 'task', taskId, 'Completed task from lead detail');
      toast.success('Task completed');
      loadLead();
    } else {
      toast.error('Failed to complete task');
    }
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
      {/* Breadcrumbs + Presence */}
      <div className="flex items-center justify-between">
        <Breadcrumbs
          items={[
            { label: 'Leads', href: '/leads' },
            { label: `${lead.first_name} ${lead.last_name}` },
          ]}
        />
        {id && <LivePresenceBar entityType="lead" entityId={id} />}
      </div>

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
              {/* Advisor / Carrier / Created */}
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
                {lead.original_effective_date && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Effective {new Date(lead.original_effective_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center bg-surface-secondary rounded-xl p-1 gap-1">
              <button onClick={() => setShowAddNote(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-th-text-secondary hover:bg-surface-primary hover:shadow-sm transition-all">
                <MessageSquare className="w-3.5 h-3.5" /> Note
              </button>
              <button onClick={() => setShowLogCall(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-th-text-secondary hover:bg-surface-primary hover:shadow-sm transition-all">
                <PhoneCall className="w-3.5 h-3.5" /> Call
              </button>
              <button onClick={() => setShowLogMeeting(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-th-text-secondary hover:bg-surface-primary hover:shadow-sm transition-all">
                <Video className="w-3.5 h-3.5" /> Meeting
              </button>
            </div>
            <button
              onClick={() => {
                if (id && !focusItems.isPinned('lead', id)) {
                  focusItems.pinItem('lead', id);
                  toast.success('Pinned to Today');
                }
              }}
              disabled={!id || focusItems.isPinned('lead', id!)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                id && focusItems.isPinned('lead', id)
                  ? 'bg-amber-50 border-amber-200 text-amber-700 cursor-default'
                  : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
              }`}
              title="Pin to Today"
            >
              <Zap className="w-4 h-4" />
              {id && focusItems.isPinned('lead', id) ? 'Pinned' : 'Pin to Today'}
            </button>
            <Link
              to={`/leads/workspace/${id}`}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
              title="Open Lead Workspace"
            >
              <Zap className="w-4 h-4" />
              Workspace
            </Link>
            <PermissionGate permission="leads.update">
              <button
                onClick={() => setShowEditLead(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-th-accent-600 text-white rounded-xl text-sm font-medium hover:bg-th-accent-700 transition-colors shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit Lead
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* Stage Progression Stepper */}
        <div className="mt-6 pt-6 border-t border-th-border">
          <div className="flex items-center gap-2 mb-3">
            <label className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">Pipeline Stage</label>
            {lead.next_followup_at && (
              <span className="text-xs text-th-text-tertiary flex items-center gap-1 ml-auto">
                <Clock className="w-3 h-3" />
                Follow-up {new Date(lead.next_followup_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {pipelineStages.map((s, idx) => {
              const currentIdx = pipelineStages.findIndex(ps => ps.name === lead.pipeline_stage);
              const isActive = s.name === lead.pipeline_stage;
              const isPast = idx < currentIdx;
              const isNext = idx === currentIdx + 1;
              const isWon = s.name === 'won';
              const isLost = s.name === 'lost';

              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (!isActive) handleStageChange(s.name);
                  }}
                  disabled={isActive}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap
                    ${isActive
                      ? 'bg-th-accent-600 text-white shadow-md shadow-th-accent-500/25 ring-2 ring-th-accent-400/30 scale-105'
                      : isPast
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : isNext
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-700 border-dashed hover:border-solid hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer'
                          : isWon
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer'
                            : isLost
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer'
                              : 'bg-surface-secondary text-th-text-secondary border border-th-border hover:bg-surface-tertiary cursor-pointer'
                    }
                  `}
                  title={isActive ? 'Current stage' : `Move to ${s.display_name}`}
                >
                  {isPast && (
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: isActive || isPast ? 'currentColor' : s.color }}
                  />
                  {s.display_name}
                  {isNext && (
                    <svg className="w-3 h-3 ml-0.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          {/* Meta info row */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {lead.lead_score > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">Score</span>
                <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${
                  lead.lead_score >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  lead.lead_score >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>{lead.lead_score}</span>
              </div>
            )}
            {lead.tobacco_status && lead.tobacco_status !== 'none' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                {TOBACCO_STATUS_LABELS[lead.tobacco_status as keyof typeof TOBACCO_STATUS_LABELS] || lead.tobacco_status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Main Content + Sidebar ─── */}
      <div className="flex gap-6">
      <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ─── Left Column ─── */}
        <div className="space-y-6">

          {/* AI Insights — prominent position */}
          <AIInsightsPanel leadId={lead.id} leadEmail={lead.email} />

          {/* Health Score — prominent position */}
          <ScoreBreakdownPanel leadId={lead.id} />

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

          {/* AI + Score panels moved to top of left column for prominence */}
        </div>

        {/* ─── Right Column (2/3 width) ─── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-primary rounded-2xl border border-th-border overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-th-border">
              {([
                { key: 'activities' as const, label: 'Activities', count: activities.length },
                { key: 'tasks' as const, label: 'Tasks', count: pendingTaskCount },
                { key: 'timeline' as const, label: 'Timeline', count: undefined as number | undefined },
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
              {activeTab === 'activities' ? (
                activities.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-10 h-10 text-th-text-tertiary mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium text-th-text-secondary">No activities yet</p>
                    <p className="text-xs text-th-text-tertiary mt-1">Log a call, note, or meeting to start tracking interactions</p>
                  </div>
                ) : (
                  <div className="activity-timeline">
                    {activities.map((activity) => (
                      <div key={activity.id} className="activity-item">
                        <p className="text-sm font-medium text-th-text-primary">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-th-text-tertiary mt-1 leading-relaxed">{activity.description}</p>
                        )}
                        <p className="text-xs text-th-text-tertiary mt-1.5">{formatTimeAgo(activity.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )
              ) : activeTab === 'timeline' ? (
                <UnifiedTimeline leadId={id} />
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
      <EditLeadModal open={showEditLead} onClose={() => setShowEditLead(false)} lead={lead} onSuccess={() => loadLead()} />
      <AddNoteModal open={showAddNote} onClose={() => setShowAddNote(false)} leadId={lead.id} onSuccess={() => loadLead()} />
      <LogCallModal open={showLogCall} onClose={() => setShowLogCall(false)} leadId={lead.id} onSuccess={() => loadLead()} />
      <LogMeetingModal open={showLogMeeting} onClose={() => setShowLogMeeting(false)} leadId={lead.id} onSuccess={() => loadLead()} />
      <AddTaskModal open={showAddTask} onClose={() => setShowAddTask(false)} leadId={lead.id} onSuccess={() => loadLead()} />
    </div>
  );
}
