import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  RefreshCw,
  Plus,
  MessageSquare,
  PhoneCall,
  Video,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { PermissionGate } from '../components/PermissionGate';
import { EditLeadModal } from '../components/EditLeadModal';
import { AddNoteModal, LogCallModal, LogMeetingModal } from '../components/QuickActionModals';
import { AddTaskModal } from '../components/AddTaskModal';
import { AIInsightsPanel } from '../components/AIInsightsPanel';
import { useOrg } from '../contexts/OrgContext';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import type { Lead, LeadActivity, LeadTask } from '@mpbhealth/crm-core';
import { formatTimeAgo, getPriorityColor, getPriorityLabel } from '@mpbhealth/crm-core';

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leadService, activityService, taskService, zohoService, pipelineStages } = useCRM();
  const { activeOrgId } = useOrg();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [tasks, setTasks] = useState<LeadTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'activities' | 'tasks'>('activities');
  const [showEditLead, setShowEditLead] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showLogCall, setShowLogCall] = useState(false);
  const [showLogMeeting, setShowLogMeeting] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  const loadLead = async () => {
    if (!id) return;

    setLoading(true);
    const [leadData, activityData, taskData] = await Promise.all([
      leadService.getLead(id),
      activityService.getActivities(id),
      taskService.getTasks(id, true),
    ]);

    setLead(leadData);
    setActivities(activityData);
    setTasks(taskData);
    setLoading(false);
  };

  useEffect(() => {
    loadLead();
  }, [id]);

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
      toast.success('Stage updated');
      loadLead();
    } else {
      toast.error('Failed to update stage');
    }
  };

  const handleSyncToZoho = async () => {
    if (!lead) return;

    setSyncing(true);
    const result = await zohoService.syncLeadToZoho(lead.id);
    setSyncing(false);

    if (result.success) {
      toast.success('Synced to Zoho CRM');
      loadLead();
    } else {
      toast.error(result.error || 'Failed to sync');
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
      loadLead();
    } else {
      toast.error('Failed to complete task');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Lead not found</p>
        <Link to="/leads" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to leads
        </Link>
      </div>
    );
  }

  const stage = pipelineStages.find((s) => s.name === lead.pipeline_stage);
  const priorityColors = getPriorityColor(lead.priority as any || 'normal');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/leads')}
            className="p-2 hover:bg-neutral-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {lead.first_name} {lead.last_name}
            </h1>
            <p className="text-neutral-500 text-sm">{lead.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSyncToZoho}
            disabled={syncing}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sync to Zoho</span>
          </button>
          <PermissionGate permission="leads.update">
            <button
              onClick={() => setShowEditLead(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Lead info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact info */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Contact Info</h2>
            <div className="space-y-4">
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 text-neutral-400 mr-3" />
                <a href={`mailto:${lead.email}`} className="text-primary-600 hover:underline">
                  {lead.email}
                </a>
              </div>
              {lead.phone && (
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 text-neutral-400 mr-3" />
                  <a href={`tel:${lead.phone}`} className="text-primary-600 hover:underline">
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.zip_code && (
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 text-neutral-400 mr-3" />
                  <span className="text-neutral-600">{lead.zip_code}</span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-neutral-400 mr-3" />
                <span className="text-neutral-600">
                  Created {formatTimeAgo(lead.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-500 mb-2">Pipeline Stage</label>
                <select
                  value={lead.pipeline_stage}
                  onChange={(e) => handleStageChange(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                >
                  {pipelineStages.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-500 mb-2">Priority</label>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityColors.bg} ${priorityColors.text}`}
                >
                  {getPriorityLabel(lead.priority as any || 'normal')}
                </span>
              </div>
              <div>
                <label className="block text-sm text-neutral-500 mb-2">Zoho Status</label>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    lead.zoho_sync_status === 'synced'
                      ? 'bg-green-100 text-green-700'
                      : lead.zoho_sync_status === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {lead.zoho_sync_status}
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setShowAddNote(true)}
                className="flex flex-col items-center p-3 rounded-lg hover:bg-neutral-50 border border-neutral-200"
              >
                <MessageSquare className="w-5 h-5 text-neutral-600 mb-1" />
                <span className="text-xs text-neutral-600">Note</span>
              </button>
              <button
                onClick={() => setShowLogCall(true)}
                className="flex flex-col items-center p-3 rounded-lg hover:bg-neutral-50 border border-neutral-200"
              >
                <PhoneCall className="w-5 h-5 text-neutral-600 mb-1" />
                <span className="text-xs text-neutral-600">Call</span>
              </button>
              <button
                onClick={() => setShowLogMeeting(true)}
                className="flex flex-col items-center p-3 rounded-lg hover:bg-neutral-50 border border-neutral-200"
              >
                <Video className="w-5 h-5 text-neutral-600 mb-1" />
                <span className="text-xs text-neutral-600">Meeting</span>
              </button>
            </div>
          </div>

          {/* AI Insights */}
          <AIInsightsPanel leadId={lead.id} leadEmail={lead.email} />
        </div>

        {/* Right column - Activities and tasks */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-neutral-200">
            {/* Tabs */}
            <div className="flex border-b border-neutral-200">
              <button
                onClick={() => setActiveTab('activities')}
                className={`flex-1 px-6 py-4 text-sm font-medium ${
                  activeTab === 'activities'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Activities ({activities.length})
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex-1 px-6 py-4 text-sm font-medium ${
                  activeTab === 'tasks'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Tasks ({tasks.filter((t) => !t.completed).length})
              </button>
              {activeTab === 'tasks' && (
                <button
                  onClick={() => setShowAddTask(true)}
                  className="px-3 py-2 mr-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg self-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {activeTab === 'activities' ? (
                <div className="activity-timeline">
                  {activities.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <p className="text-sm font-medium text-neutral-900">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-sm text-neutral-500 mt-1">
                          {activity.description}
                        </p>
                      )}
                      <p className="text-xs text-neutral-400 mt-1">
                        {formatTimeAgo(activity.created_at)}
                      </p>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <p className="text-neutral-500 text-center py-8">
                      No activities yet
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        task.completed
                          ? 'bg-neutral-50 border-neutral-200'
                          : 'bg-white border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => !task.completed && handleCompleteTask(task.id)}
                          className="w-5 h-5 rounded border-neutral-300"
                        />
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              task.completed
                                ? 'text-neutral-400 line-through'
                                : 'text-neutral-900'
                            }`}
                          >
                            {task.title}
                          </p>
                          <p className="text-xs text-neutral-500">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-neutral-500 text-center py-8">
                      No tasks yet
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditLeadModal
        open={showEditLead}
        onClose={() => setShowEditLead(false)}
        lead={lead}
        onSuccess={() => loadLead()}
      />
      <AddNoteModal
        open={showAddNote}
        onClose={() => setShowAddNote(false)}
        leadId={lead.id}
        onSuccess={() => loadLead()}
      />
      <LogCallModal
        open={showLogCall}
        onClose={() => setShowLogCall(false)}
        leadId={lead.id}
        onSuccess={() => loadLead()}
      />
      <LogMeetingModal
        open={showLogMeeting}
        onClose={() => setShowLogMeeting(false)}
        leadId={lead.id}
        onSuccess={() => loadLead()}
      />
      <AddTaskModal
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        leadId={lead.id}
        onSuccess={() => loadLead()}
      />
    </div>
  );
}
