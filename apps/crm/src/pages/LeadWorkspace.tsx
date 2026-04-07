import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  MessageSquare,
  PhoneCall,
  Video,
  Users,
  Shield,
  Clock,
  AlertCircle,
  Building2,
  Zap,
  CheckCircle2,
  Plus,
  Send,
  Sparkles,
  Paperclip,
  ChevronRight,
  Loader2,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';
import { useCelebration } from '../components/CelebrationSystem';
import { useGamification } from '../hooks/useGamification';
import { PermissionGate } from '../components/PermissionGate';
import { EditLeadModal } from '../components/EditLeadModal';
import { AddNoteModal, LogCallModal, LogMeetingModal } from '../components/QuickActionModals';
import { AddTaskModal } from '../components/AddTaskModal';
import { AIInsightsPanel } from '../components/AIInsightsPanel';
import { AICoach } from '../components/AICoach';
import { LivePresenceBar } from '../components/LivePresence';
import { ScoreBreakdownPanel } from '../components/ScoreBreakdownPanel';
import { UnifiedTimeline } from '../components/UnifiedTimeline';
import { AttachmentList } from '../components/AttachmentList';
import { EmailComposer } from '../components/email/EmailComposer';
import { useFocusItems } from '../hooks/useFocusItems';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import type { Lead, LeadActivity, LeadTask, FamilyMember, PhoneNumber } from '@mpbhealth/crm-core';
import {
  formatTimeAgo,
  getPriorityColor,
  getPriorityLabel,
  createFamilyService,
  PLAN_TYPE_LABELS,
  RELATIONSHIP_LABELS,
  PHONE_TYPE_LABELS,
} from '@mpbhealth/crm-core';
import { supabase } from '../lib/supabase';

const familyService = createFamilyService(supabase);

type RightTab = 'timeline' | 'email' | 'ai' | 'files';

const CALL_DURATIONS = [
  { value: '1', label: '1 min' },
  { value: '2', label: '2 min' },
  { value: '5', label: '5 min' },
  { value: '10', label: '10 min' },
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
];

const NEXT_BEST_ACTIONS = [
  { id: 'follow-up', label: 'Schedule a follow-up call', icon: PhoneCall, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'email', label: 'Send a personalized email', icon: Send, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'proposal', label: 'Prepare a proposal', icon: FileText, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'meeting', label: 'Book a meeting', icon: Video, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

export default function LeadWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leadService, activityService, taskService, automationService, pipelineStages } = useCRM();
  const { activeOrgId } = useOrg();
  const { user } = useAuth();
  const { celebrate } = useCelebration();
  const { earnXP } = useGamification();
  const focusItems = useFocusItems();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [tasks, setTasks] = useState<LeadTask[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);

  const [rightTab, setRightTab] = useState<RightTab>('timeline');
  const [showEditLead, setShowEditLead] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showLogCall, setShowLogCall] = useState(false);
  const [showLogMeeting, setShowLogMeeting] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  // Inline quick action state
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [callExpanded, setCallExpanded] = useState(false);
  const [callDuration, setCallDuration] = useState('5');
  const [callNotes, setCallNotes] = useState('');
  const [callSaving, setCallSaving] = useState(false);

  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const callNotesRef = useRef<HTMLTextAreaElement>(null);

  // ── Data Loading ──────────────────────────────────────────────────────────

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
  }, [id, leadService, activityService, taskService]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  // ── Keyboard Shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case 'n':
          e.preventDefault();
          setNoteExpanded(true);
          setTimeout(() => noteInputRef.current?.focus(), 50);
          break;
        case 'c':
          e.preventDefault();
          setCallExpanded(true);
          setTimeout(() => callNotesRef.current?.focus(), 50);
          break;
        case 'e':
          e.preventDefault();
          setRightTab('email');
          break;
        case 't':
          e.preventDefault();
          setShowAddTask(true);
          break;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  // ── Stage Change Handler ──────────────────────────────────────────────────

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

  // ── Task Complete Handler ─────────────────────────────────────────────────

  const handleCompleteTask = async (taskId: string) => {
    const result = await taskService.completeTask(taskId);
    if (result.success) {
      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.TASK_COMPLETED,
        entityType: 'task',
        entityId: taskId,
      }).catch(console.error);
      earnXP('task_completed', 'task', taskId, 'Completed task from workspace');
      toast.success('Task completed');
      loadLead();
    } else {
      toast.error('Failed to complete task');
    }
  };

  // ── Inline Note Save ──────────────────────────────────────────────────────

  const handleSaveNote = async () => {
    if (!id || !noteText.trim()) return;
    setNoteSaving(true);
    const result = await activityService.addNote(id, 'Quick Note', noteText.trim());
    if (result.success) {
      earnXP('note_logged', 'lead', id, 'Quick note from workspace');
      toast.success('Note saved');
      setNoteText('');
      setNoteExpanded(false);
      loadLead();
    } else {
      toast.error('Failed to save note');
    }
    setNoteSaving(false);
  };

  // ── Inline Call Log ───────────────────────────────────────────────────────

  const handleSaveCall = async () => {
    if (!id) return;
    setCallSaving(true);
    const result = await activityService.logCall(id, parseInt(callDuration, 10), callNotes.trim() || undefined);
    if (result.success) {
      earnXP('call_logged', 'lead', id, 'Quick call from workspace');
      toast.success('Call logged');
      setCallNotes('');
      setCallDuration('5');
      setCallExpanded(false);
      loadLead();
    } else {
      toast.error('Failed to log call');
    }
    setCallSaving(false);
  };

  // ── Loading State ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col animate-pulse">
        <div className="p-4 border-b border-th-border bg-surface-primary">
          <div className="h-6 w-48 bg-surface-tertiary rounded mb-3" />
          <div className="h-10 w-80 bg-surface-tertiary rounded-lg" />
        </div>
        <div className="flex-1 flex gap-0">
          <div className="w-2/5 p-6 space-y-4 border-r border-th-border">
            <div className="h-48 bg-surface-tertiary rounded-xl" />
            <div className="h-32 bg-surface-tertiary rounded-xl" />
            <div className="h-24 bg-surface-tertiary rounded-xl" />
          </div>
          <div className="w-3/5 p-6">
            <div className="h-96 bg-surface-tertiary rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── 404 State ─────────────────────────────────────────────────────────────

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
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

  const priorityColors = getPriorityColor(lead.priority as any || 'normal');
  const pendingTasks = tasks.filter((t) => !t.completed);
  const initials = `${lead.first_name.charAt(0)}${lead.last_name.charAt(0)}`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-surface-secondary overflow-hidden">

      {/* ═══ HEADER ═══ */}
      <div className="bg-surface-primary border-b border-th-border shrink-0">
        <div className="px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between gap-4">
            {/* Left: back + identity */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/leads"
                className="p-1.5 -ml-1.5 rounded-lg hover:bg-surface-tertiary transition-colors shrink-0"
                aria-label="Back to leads"
              >
                <ArrowLeft className="w-4.5 h-4.5 text-th-text-tertiary" />
              </Link>

              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-th-accent-400 to-th-accent-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">{initials}</span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-th-text-primary truncate">
                    {lead.first_name} {lead.last_name}
                  </h1>
                  {lead.plan_type && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      lead.plan_type === 'healthshare'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      <Shield className="w-3 h-3" />
                      {PLAN_TYPE_LABELS[lead.plan_type as keyof typeof PLAN_TYPE_LABELS] || lead.plan_type}
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColors.bg} ${priorityColors.text}`}>
                    {getPriorityLabel(lead.priority as any || 'normal')}
                  </span>
                  {lead.carrier && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs text-th-text-tertiary">
                      <Building2 className="w-3 h-3" />
                      {lead.carrier.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-th-text-tertiary mt-0.5">
                  <a href={`mailto:${lead.email}`} className="hover:text-th-accent-600 transition-colors truncate">{lead.email}</a>
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="hover:text-th-accent-600 transition-colors hidden sm:inline">{lead.phone}</a>
                  )}
                </div>
              </div>
            </div>

            {/* Right: quick action buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="hidden md:flex items-center bg-surface-secondary rounded-xl p-1 gap-0.5">
                <button onClick={() => setShowAddNote(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-th-text-secondary hover:bg-surface-primary hover:shadow-sm transition-all" title="Add Note (N)">
                  <MessageSquare className="w-3.5 h-3.5" /> Note
                </button>
                <button onClick={() => setShowLogCall(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-th-text-secondary hover:bg-surface-primary hover:shadow-sm transition-all" title="Log Call (C)">
                  <PhoneCall className="w-3.5 h-3.5" /> Call
                </button>
                <button onClick={() => setRightTab('email')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-th-text-secondary hover:bg-surface-primary hover:shadow-sm transition-all" title="Email (E)">
                  <Send className="w-3.5 h-3.5" /> Email
                </button>
                <button onClick={() => setShowAddTask(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-th-text-secondary hover:bg-surface-primary hover:shadow-sm transition-all" title="Add Task (T)">
                  <Plus className="w-3.5 h-3.5" /> Task
                </button>
                <button onClick={() => setShowLogMeeting(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-th-text-secondary hover:bg-surface-primary hover:shadow-sm transition-all">
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
                className={`p-2 rounded-xl text-sm transition-colors border ${
                  id && focusItems.isPinned('lead', id)
                    ? 'bg-amber-50 border-amber-200 text-amber-700 cursor-default'
                    : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
                }`}
                title={id && focusItems.isPinned('lead', id) ? 'Pinned' : 'Pin to Today'}
              >
                <Zap className="w-4 h-4" />
              </button>

              <PermissionGate permission="leads.update">
                <button
                  onClick={() => setShowEditLead(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-th-accent-600 text-white rounded-xl text-xs font-medium hover:bg-th-accent-700 transition-colors shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </PermissionGate>
            </div>
          </div>
        </div>

        {/* ═══ PRESENCE + STAGE PROGRESSION ═══ */}
        <div className="px-4 pt-1 lg:px-6 flex items-center justify-between">
          {id && <LivePresenceBar entityType="lead" entityId={id} />}
        </div>
        <div className="px-4 pb-3 lg:px-6">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
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
                  onClick={() => { if (!isActive) handleStageChange(s.name); }}
                  disabled={isActive}
                  className={`
                    relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap
                    ${isActive
                      ? 'bg-th-accent-600 text-white shadow-md shadow-th-accent-500/25 ring-2 ring-th-accent-400/30 scale-105'
                      : isPast
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : isNext
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-700 border-dashed hover:border-solid hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer'
                          : isWon
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer'
                            : isLost
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-100 cursor-pointer'
                              : 'bg-surface-secondary text-th-text-secondary border border-th-border hover:bg-surface-tertiary cursor-pointer'
                    }
                  `}
                  title={isActive ? 'Current stage' : `Move to ${s.display_name}`}
                >
                  {isPast && (
                    <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: isActive || isPast ? 'currentColor' : s.color }} />
                  {s.display_name}
                  {isNext && (
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ SPLIT PANELS ═══ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* ─── LEFT PANEL (40%) ─── */}
        <div className="lg:w-2/5 border-r border-th-border overflow-y-auto scrollbar-thin">
          <div className="p-4 lg:p-5 space-y-4">

            {/* ── Contact Card ── */}
            <div className="bg-surface-primary rounded-xl border border-th-border p-4">
              <h3 className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider mb-3">Contact Information</h3>
              <div className="space-y-2">
                <ContactRow icon={Mail} label="Email" value={lead.email} href={`mailto:${lead.email}`} />
                <ContactRow icon={Phone} label="Phone" value={lead.phone} href={lead.phone ? `tel:${lead.phone}` : undefined} />
                {phoneNumbers.filter(pn => pn.phone_number !== lead.phone).map(pn => (
                  <ContactRow
                    key={pn.id}
                    icon={Phone}
                    label={PHONE_TYPE_LABELS[pn.phone_type as keyof typeof PHONE_TYPE_LABELS] || pn.phone_type}
                    value={pn.phone_number}
                    href={`tel:${pn.phone_number}`}
                    badge={pn.do_not_call ? 'DNC' : undefined}
                  />
                ))}
                {(lead.city || lead.state || lead.zip_code) && (
                  <ContactRow icon={MapPin} label="Location" value={[lead.city, lead.state, lead.zip_code].filter(Boolean).join(', ')} />
                )}
                {lead.carrier && (
                  <ContactRow icon={Building2} label="Carrier" value={lead.carrier.name} />
                )}
                <ContactRow icon={Calendar} label="Created" value={formatTimeAgo(lead.created_at)} />
                {lead.original_effective_date && (
                  <ContactRow icon={Clock} label="Effective Date" value={new Date(lead.original_effective_date).toLocaleDateString()} />
                )}
              </div>
            </div>

            {/* ── Quick Actions (Inline) ── */}
            <div className="bg-surface-primary rounded-xl border border-th-border p-4">
              <h3 className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider mb-3">Quick Actions</h3>
              <div className="space-y-2">

                {/* Log a Note */}
                <div className="rounded-lg border border-th-border-subtle overflow-hidden">
                  <button
                    onClick={() => {
                      setNoteExpanded(!noteExpanded);
                      if (!noteExpanded) setTimeout(() => noteInputRef.current?.focus(), 50);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-th-accent-600" />
                    Log a Note
                    <span className="ml-auto text-[10px] text-th-text-tertiary bg-surface-tertiary px-1.5 py-0.5 rounded font-mono">N</span>
                  </button>
                  {noteExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t border-th-border-subtle pt-2">
                      <textarea
                        ref={noteInputRef}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Type your note..."
                        rows={3}
                        className="w-full rounded-lg border border-th-border bg-surface-secondary px-3 py-2 text-sm text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500/30 focus:border-th-accent-400 resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setNoteExpanded(false); setNoteText(''); }}
                          className="px-3 py-1.5 text-xs font-medium text-th-text-secondary hover:text-th-text-primary transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveNote}
                          disabled={!noteText.trim() || noteSaving}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-th-accent-600 text-white rounded-lg text-xs font-medium hover:bg-th-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {noteSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Log a Call */}
                <div className="rounded-lg border border-th-border-subtle overflow-hidden">
                  <button
                    onClick={() => {
                      setCallExpanded(!callExpanded);
                      if (!callExpanded) setTimeout(() => callNotesRef.current?.focus(), 50);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                    Log a Call
                    <span className="ml-auto text-[10px] text-th-text-tertiary bg-surface-tertiary px-1.5 py-0.5 rounded font-mono">C</span>
                  </button>
                  {callExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t border-th-border-subtle pt-2">
                      <div>
                        <label htmlFor="workspace-call-duration" className="text-xs text-th-text-tertiary mb-1 block">Duration</label>
                        <select
                          id="workspace-call-duration"
                          value={callDuration}
                          onChange={(e) => setCallDuration(e.target.value)}
                          className="w-full rounded-lg border border-th-border bg-surface-secondary px-3 py-1.5 text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500/30"
                        >
                          {CALL_DURATIONS.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        ref={callNotesRef}
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value)}
                        placeholder="Call notes (optional)..."
                        rows={2}
                        className="w-full rounded-lg border border-th-border bg-surface-secondary px-3 py-2 text-sm text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500/30 focus:border-th-accent-400 resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setCallExpanded(false); setCallNotes(''); }}
                          className="px-3 py-1.5 text-xs font-medium text-th-text-secondary hover:text-th-text-primary transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveCall}
                          disabled={callSaving}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {callSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <PhoneCall className="w-3 h-3" />}
                          Log Call
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Health Score ── */}
            <ScoreBreakdownPanel leadId={lead.id} />

            {/* ── Open Tasks ── */}
            <div className="bg-surface-primary rounded-xl border border-th-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">
                  Open Tasks
                  {pendingTasks.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-xs bg-th-accent-50 text-th-accent-600 normal-case tracking-normal">
                      {pendingTasks.length}
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="flex items-center gap-1 text-xs font-medium text-th-accent-600 hover:text-th-accent-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {pendingTasks.length === 0 ? (
                <p className="text-xs text-th-text-tertiary text-center py-4">No open tasks</p>
              ) : (
                <div className="space-y-1.5">
                  {pendingTasks.slice(0, 8).map((task) => (
                    <div key={task.id} className="flex items-start gap-2.5 group py-1.5">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => handleCompleteTask(task.id)}
                        aria-label={`Mark "${task.title}" as complete`}
                        className="mt-0.5 w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500 shrink-0 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-th-text-primary truncate group-hover:text-th-accent-600 transition-colors">
                          {task.title}
                        </p>
                        <p className="text-xs text-th-text-tertiary">
                          Due {new Date(task.due_date).toLocaleDateString()}
                          {task.priority === 'high' && (
                            <span className="ml-1.5 text-red-600 font-medium">High</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                  {pendingTasks.length > 8 && (
                    <p className="text-xs text-th-text-tertiary text-center pt-1">
                      +{pendingTasks.length - 8} more
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Family Members ── */}
            <div className="bg-surface-primary rounded-xl border border-th-border p-4">
              <h3 className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider mb-3">
                Family Members
                {familyMembers.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-xs bg-surface-tertiary normal-case tracking-normal">
                    {familyMembers.length}
                  </span>
                )}
              </h3>
              {familyMembers.length === 0 ? (
                <div className="text-center py-4">
                  <Users className="w-6 h-6 text-th-text-tertiary mx-auto mb-1.5 opacity-40" />
                  <p className="text-xs text-th-text-tertiary">No family members</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {familyMembers.map((fm) => (
                    <div key={fm.id} className="flex items-center gap-2.5 py-1.5">
                      <div className="w-7 h-7 rounded-full bg-th-accent-50 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold text-th-accent-700">
                          {fm.first_name.charAt(0)}{fm.last_name.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-th-text-primary truncate">
                          {fm.first_name} {fm.last_name}
                        </p>
                        <p className="text-xs text-th-text-tertiary">
                          {RELATIONSHIP_LABELS[fm.relationship as keyof typeof RELATIONSHIP_LABELS] || fm.relationship}
                          {fm.date_of_birth && ` · ${new Date(fm.date_of_birth).toLocaleDateString()}`}
                        </p>
                      </div>
                      {fm.is_covered && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 shrink-0">
                          Covered
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ─── RIGHT PANEL (60%) ─── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Tab bar */}
          <div className="bg-surface-primary border-b border-th-border px-4 lg:px-5 flex items-center gap-0 overflow-x-auto shrink-0 scrollbar-none">
            {([
              { key: 'timeline' as RightTab, label: 'Timeline', icon: Clock },
              { key: 'email' as RightTab, label: 'Compose Email', icon: Send },
              { key: 'ai' as RightTab, label: 'AI Coach', icon: Sparkles },
              { key: 'files' as RightTab, label: 'Files', icon: Paperclip },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRightTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  rightTab === tab.key
                    ? 'text-th-accent-600'
                    : 'text-th-text-tertiary hover:text-th-text-secondary'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {rightTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-th-accent-600" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {rightTab === 'timeline' && (
              <div className="p-4 lg:p-5">
                <UnifiedTimeline leadId={id!} showFilters={true} />
              </div>
            )}

            {rightTab === 'email' && (
              <div className="p-4 lg:p-5 min-h-[500px]">
                <EmailComposer
                  leadId={id}
                  initialTo={lead.email ? [lead.email] : undefined}
                  mode="compose"
                  onSent={() => {
                    earnXP('email_sent', 'lead', id, `Email to ${lead.first_name} ${lead.last_name}`);
                    loadLead();
                  }}
                />
              </div>
            )}

            {rightTab === 'ai' && (
              <div className="p-4 lg:p-5">
                <AICoach leadId={lead.id} mode="panel" />
              </div>
            )}

            {rightTab === 'files' && (
              <div className="p-4 lg:p-5">
                <AttachmentList entityType="lead" entityId={id!} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MODALS ═══ */}
      <EditLeadModal open={showEditLead} onClose={() => setShowEditLead(false)} lead={lead} onSuccess={() => loadLead()} />
      <AddNoteModal open={showAddNote} onClose={() => setShowAddNote(false)} leadId={lead.id} onSuccess={() => loadLead()} />
      <LogCallModal open={showLogCall} onClose={() => setShowLogCall(false)} leadId={lead.id} onSuccess={() => loadLead()} />
      <LogMeetingModal open={showLogMeeting} onClose={() => setShowLogMeeting(false)} leadId={lead.id} onSuccess={() => loadLead()} />
      <AddTaskModal open={showAddTask} onClose={() => setShowAddTask(false)} leadId={lead.id} onSuccess={() => loadLead()} />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ContactRow({ icon: Icon, label, value, href, badge }: {
  icon: typeof Mail;
  label: string;
  value?: string | null;
  href?: string;
  badge?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5 py-1">
      <Icon className="w-3.5 h-3.5 text-th-text-tertiary shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-th-text-tertiary uppercase tracking-wider">{label}</p>
        {href ? (
          <a href={href} className="text-sm text-th-accent-600 hover:text-th-accent-700 hover:underline transition-colors truncate block">
            {value}
          </a>
        ) : (
          <p className="text-sm text-th-text-primary truncate">{value}</p>
        )}
      </div>
      {badge && (
        <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded shrink-0">{badge}</span>
      )}
    </div>
  );
}
