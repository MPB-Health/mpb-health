import { useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Loader2,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
} from 'lucide-react';
import { Button, cn } from '@mpbhealth/ui';
import {
  advisorLeadService,
  type LeadActivity,
  type LeadDetail,
  type LeadTask,
} from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorQueryReady } from '../hooks/useAdvisorQueryReady';
import { useAdvisorPageDebugLog } from '../hooks/useAdvisorPageDebugLog';
import { useInboxActions } from '../hooks/useInbox';
import { AdvisorPageLoader } from '../components/loading';

type TabId = 'overview' | 'activity' | 'tasks' | 'messages';

export default function AssignedLeadDetail() {
  useAdvisorPageDebugLog('AssignedLeadDetail');
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const userId = profile?.id;
  const orgId = profile?.org_id;
  const queryClient = useQueryClient();
  const { getOrCreateConversation } = useInboxActions();

  const [tab, setTab] = useState<TabId>('overview');
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [openingInbox, setOpeningInbox] = useState(false);

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['assignedLead', leadId, userId],
    queryFn: () => advisorLeadService.getLead(leadId!, userId),
    enabled: Boolean(advisorReady && leadId && userId),
  });

  const { data: activities = [], refetch: refetchActivities } = useQuery({
    queryKey: ['leadActivities', leadId],
    queryFn: () => advisorLeadService.getLeadActivities(leadId!),
    enabled: Boolean(advisorReady && leadId && tab === 'activity'),
  });

  const { data: tasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['leadTasks', leadId],
    queryFn: () => advisorLeadService.getLeadTasks(leadId!, true),
    enabled: Boolean(advisorReady && leadId && tab === 'tasks'),
  });

  const invalidateLead = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['assignedLead', leadId, userId] });
    void queryClient.invalidateQueries({ queryKey: ['assignedLeads', userId] });
    void queryClient.invalidateQueries({ queryKey: ['advisorOverview'] });
  }, [queryClient, leadId, userId]);

  const handleLogNote = async () => {
    if (!leadId || !userId || !noteText.trim()) return;
    setSavingNote(true);
    const result = await advisorLeadService.logActivity(
      leadId,
      { activity_type: 'note', title: 'Note', description: noteText.trim(), org_id: orgId },
      userId,
    );
    setSavingNote(false);
    if (result.success) {
      setNoteText('');
      toast.success('Note logged');
      void refetchActivities();
      invalidateLead();
    } else {
      toast.error(result.error ?? 'Failed to save note');
    }
  };

  const handleCreateTask = async () => {
    if (!leadId || !userId || !newTaskTitle.trim()) return;
    setCreatingTask(true);
    const result = await advisorLeadService.createLeadTask(
      {
        lead_id: leadId,
        title: newTaskTitle.trim(),
        org_id: orgId,
        assigned_to: userId,
      },
      userId,
    );
    setCreatingTask(false);
    if (result.success) {
      setNewTaskTitle('');
      toast.success('Task created');
      void refetchTasks();
      invalidateLead();
    } else {
      toast.error(result.error ?? 'Failed to create task');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!userId) return;
    const result = await advisorLeadService.completeLeadTask(taskId, userId);
    if (result.success) {
      toast.success('Task completed');
      void refetchTasks();
      void refetchActivities();
    } else {
      toast.error(result.error ?? 'Failed to complete task');
    }
  };

  const handleOpenMessages = async (channel: 'sms' | 'email' | 'both' = 'both') => {
    if (!leadId || !orgId) {
      toast.error('Organization not configured on your profile');
      return;
    }
    setOpeningInbox(true);
    try {
      const conversationId = await getOrCreateConversation(leadId, channel);
      navigate(`/inbox/${conversationId}`);
    } catch {
      toast.error('Could not open conversation');
    } finally {
      setOpeningInbox(false);
    }
  };

  const handleMarkContacted = async () => {
    if (!leadId) return;
    const result = await advisorLeadService.markContacted(leadId);
    if (result.success) {
      toast.success('Marked as contacted');
      invalidateLead();
    } else {
      toast.error(result.error ?? 'Update failed');
    }
  };

  if (!advisorReady || isLoading) {
    return <AdvisorPageLoader message="Loading lead…" />;
  }

  if (error || !lead) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-th-text-primary font-medium">Lead not found</p>
        <p className="text-sm text-th-text-secondary mt-2">
          This lead may not be assigned to you or no longer exists.
        </p>
        <Link to="/leads" className="inline-block mt-6 text-th-accent-600 font-medium">
          Back to assigned leads
        </Link>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'messages', label: 'Messages' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          to="/leads"
          className="p-2 rounded-lg border border-th-border hover:bg-surface-secondary"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-th-text-primary truncate">
            {lead.first_name} {lead.last_name}
          </h1>
          <p className="text-sm text-th-text-secondary truncate">{lead.email}</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-th-border overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-th-accent-600 text-th-accent-700'
                : 'border-transparent text-th-text-secondary hover:text-th-text-primary',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <OverviewTab lead={lead} onMarkContacted={handleMarkContacted} onOpenMessages={handleOpenMessages} openingInbox={openingInbox} />
      )}
      {tab === 'activity' && (
        <ActivityTab
          activities={activities}
          noteText={noteText}
          setNoteText={setNoteText}
          onSaveNote={handleLogNote}
          savingNote={savingNote}
        />
      )}
      {tab === 'tasks' && (
        <TasksTab
          tasks={tasks}
          newTaskTitle={newTaskTitle}
          setNewTaskTitle={setNewTaskTitle}
          onCreateTask={handleCreateTask}
          creatingTask={creatingTask}
          onCompleteTask={handleCompleteTask}
        />
      )}
      {tab === 'messages' && (
        <MessagesTab lead={lead} onOpen={handleOpenMessages} opening={openingInbox} />
      )}
    </div>
  );
}

function OverviewTab({
  lead,
  onMarkContacted,
  onOpenMessages,
  openingInbox,
}: {
  lead: LeadDetail;
  onMarkContacted: () => void;
  onOpenMessages: (channel?: 'sms' | 'email' | 'both') => void;
  openingInbox: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-th-border bg-surface-primary p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {lead.pipeline_stage && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-th-accent-50 text-th-accent-700">
              {lead.pipeline_stage}
            </span>
          )}
          {lead.priority && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-800">
              {lead.priority} priority
            </span>
          )}
          {lead.lead_score != null && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-secondary text-th-text-secondary">
              Score {lead.lead_score}
            </span>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-th-accent-600 hover:underline">
              <Phone className="w-4 h-4" />
              {lead.phone}
            </a>
          )}
          <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-th-accent-600 hover:underline">
            <Mail className="w-4 h-4" />
            {lead.email}
          </a>
          {(lead.city || lead.state || lead.zip_code) && (
            <p className="flex items-center gap-2 text-th-text-secondary sm:col-span-2">
              <MapPin className="w-4 h-4 shrink-0" />
              {[lead.city, lead.state, lead.zip_code].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm border-t border-th-border pt-4">
          {lead.lead_source && (
            <>
              <dt className="text-th-text-tertiary">Source</dt>
              <dd className="text-th-text-primary">{lead.lead_source}</dd>
            </>
          )}
          {lead.plan_type && (
            <>
              <dt className="text-th-text-tertiary">Plan type</dt>
              <dd className="text-th-text-primary">{lead.plan_type}</dd>
            </>
          )}
          {lead.primary_concern && (
            <>
              <dt className="text-th-text-tertiary">Primary concern</dt>
              <dd className="text-th-text-primary">{lead.primary_concern}</dd>
            </>
          )}
          {lead.last_contacted_at && (
            <>
              <dt className="text-th-text-tertiary">Last contacted</dt>
              <dd className="text-th-text-primary">
                {format(new Date(lead.last_contacted_at), 'PPp')}
              </dd>
            </>
          )}
          {lead.next_followup_at && (
            <>
              <dt className="text-th-text-tertiary">Next follow-up</dt>
              <dd className="text-th-text-primary flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(lead.next_followup_at), 'PPp')}
              </dd>
            </>
          )}
        </dl>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="primary" size="sm" onClick={() => onOpenMessages('both')} disabled={openingInbox}>
          {openingInbox ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
          Message lead
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onMarkContacted}>
          Mark contacted
        </Button>
      </div>
    </div>
  );
}

function ActivityTab({
  activities,
  noteText,
  setNoteText,
  onSaveNote,
  savingNote,
}: {
  activities: LeadActivity[];
  noteText: string;
  setNoteText: (v: string) => void;
  onSaveNote: () => void;
  savingNote: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-th-border bg-surface-primary p-4 space-y-3">
        <label className="text-sm font-medium text-th-text-primary">Add note</label>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-th-border px-3 py-2 text-sm"
          placeholder="Log a call outcome, meeting notes…"
        />
        <Button type="button" size="sm" onClick={onSaveNote} disabled={savingNote || !noteText.trim()}>
          {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save note'}
        </Button>
      </div>

      <div className="space-y-2">
        {activities.length === 0 ? (
          <p className="text-sm text-th-text-tertiary text-center py-8">No activity yet</p>
        ) : (
          activities.map((a) => (
            <div key={a.id} className="rounded-lg border border-th-border bg-surface-primary p-4">
              <div className="flex justify-between gap-2">
                <p className="font-medium text-th-text-primary text-sm">{a.title}</p>
                <span className="text-xs text-th-text-tertiary shrink-0">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-th-text-tertiary mt-0.5 capitalize">{a.activity_type.replace(/_/g, ' ')}</p>
              {a.description && (
                <p className="text-sm text-th-text-secondary mt-2 whitespace-pre-wrap">{a.description}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TasksTab({
  tasks,
  newTaskTitle,
  setNewTaskTitle,
  onCreateTask,
  creatingTask,
  onCompleteTask,
}: {
  tasks: LeadTask[];
  newTaskTitle: string;
  setNewTaskTitle: (v: string) => void;
  onCreateTask: () => void;
  creatingTask: boolean;
  onCompleteTask: (id: string) => void;
}) {
  const open = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="New task title…"
          className="flex-1 rounded-lg border border-th-border px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && onCreateTask()}
        />
        <Button type="button" size="sm" onClick={onCreateTask} disabled={creatingTask || !newTaskTitle.trim()}>
          {creatingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add
        </Button>
      </div>

      {open.length === 0 && done.length === 0 ? (
        <p className="text-sm text-th-text-tertiary text-center py-8">No tasks</p>
      ) : (
        <>
          {open.map((t) => (
            <TaskRow key={t.id} task={t} onComplete={() => onCompleteTask(t.id)} />
          ))}
          {done.map((t) => (
            <TaskRow key={t.id} task={t} done />
          ))}
        </>
      )}
    </div>
  );
}

function TaskRow({ task, onComplete, done }: { task: LeadTask; onComplete?: () => void; done?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-th-border bg-surface-primary p-4">
      {done ? (
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
      ) : (
        <button type="button" onClick={onComplete} className="shrink-0 mt-0.5 text-th-text-tertiary hover:text-th-accent-600">
          <Circle className="w-5 h-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium', done && 'line-through text-th-text-tertiary')}>{task.title}</p>
        {task.due_date && (
          <p className="text-xs text-th-text-tertiary mt-1">
            Due {format(new Date(task.due_date), 'MMM d, yyyy')}
          </p>
        )}
      </div>
    </div>
  );
}

function MessagesTab({
  lead,
  onOpen,
  opening,
}: {
  lead: LeadDetail;
  onOpen: (channel?: 'sms' | 'email' | 'both') => void;
  opening: boolean;
}) {
  return (
    <div className="rounded-xl border border-th-border bg-surface-primary p-8 text-center space-y-4">
      <MessageSquare className="w-12 h-12 mx-auto text-th-accent-600" />
      <p className="text-th-text-primary font-medium">Continue in Inbox</p>
      <p className="text-sm text-th-text-secondary max-w-md mx-auto">
        Send SMS or email to {lead.first_name} using your advisor inbox. Conversation history stays linked to this lead.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" variant="primary" onClick={() => onOpen('both')} disabled={opening}>
          {opening ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Open conversation'}
        </Button>
        {lead.phone && (
          <Button type="button" variant="secondary" onClick={() => onOpen('sms')} disabled={opening}>
            SMS only
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={() => onOpen('email')} disabled={opening}>
          Email only
        </Button>
      </div>
    </div>
  );
}
