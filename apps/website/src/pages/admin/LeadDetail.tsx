import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  RefreshCw,
  Download,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  User,
  Tag,
  Edit2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Star,
  Shield,
  Globe,
  Trash2,
  Upload
} from 'lucide-react';
import { SEOHead } from '../../components/SEOHead';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LeadActivityTimeline } from '../../components/admin/crm/LeadActivityTimeline';
import { LeadQuickActions } from '../../components/admin/crm/LeadQuickActions';
import { ExportModal } from '../../components/admin/crm/ExportModal';
import { crmService, type Lead, type LeadActivity, type LeadTask, type PipelineStage } from '../../lib/crmService';
import { cn } from '../../lib/utils';

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [tasks, setTasks] = useState<LeadTask[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isSyncingToZoho, setIsSyncingToZoho] = useState(false);

  useEffect(() => {
    if (id) {
      loadLeadData();
    }
  }, [id]);

  const loadLeadData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [leadData, activitiesData, tasksData, stagesData] = await Promise.all([
        crmService.getLead(id),
        crmService.getActivities(id),
        crmService.getTasks(id, true),
        crmService.getPipelineStages(),
      ]);

      setLead(leadData);
      setActivities(activitiesData);
      setTasks(tasksData);
      setStages(stagesData);
      setEditedLead(leadData || {});
    } catch (error) {
      console.error('Failed to load lead data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !lead) return;

    setIsSaving(true);
    const result = await crmService.updateLead(id, editedLead);
    setIsSaving(false);

    if (result.success) {
      setIsEditing(false);
      loadLeadData();
    } else {
      alert('Failed to save changes: ' + result.error);
    }
  };

  const handleStageChange = async (newStage: string) => {
    if (!id) return;

    const result = await crmService.updateLeadStage(id, newStage);
    if (result.success) {
      loadLeadData();
    }
  };

  const handleSyncToZoho = async () => {
    if (!id) return;

    setIsSyncingToZoho(true);
    try {
      const result = await crmService.syncLeadToZoho(id);
      if (result.success) {
        loadLeadData();
      } else {
        alert('Failed to sync to Zoho: ' + result.error);
      }
    } catch (error) {
      console.error('Sync to Zoho error:', error);
      alert('Failed to sync to Zoho');
    } finally {
      setIsSyncingToZoho(false);
    }
  };

  const handleAddTag = async () => {
    if (!id || !newTag.trim()) return;

    const result = await crmService.addTagsToLead(id, [newTag.trim()]);
    if (result.success) {
      setNewTag('');
      loadLeadData();
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!id) return;

    const result = await crmService.removeTagFromLead(id, tag);
    if (result.success) {
      loadLeadData();
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    const result = await crmService.completeTask(taskId);
    if (result.success) {
      loadLeadData();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const result = await crmService.deleteTask(taskId);
    if (result.success) {
      loadLeadData();
    }
  };

  const currentStage = stages.find(s => s.name === lead?.pipeline_stage);

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700 border-slate-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    urgent: 'bg-red-100 text-red-700 border-red-200',
  };

  if (loading) {
    return (
      <AdminLayout activeView="crm-leads" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
        <div className="flex items-center justify-center h-screen">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </AdminLayout>
    );
  }

  if (!lead) {
    return (
      <AdminLayout activeView="crm-leads" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
        <div className="flex flex-col items-center justify-center h-screen">
          <AlertCircle className="h-16 w-16 text-neutral-300 mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900">Lead not found</h2>
          <p className="text-neutral-500 mb-4">The lead you're looking for doesn't exist.</p>
          <Link to="/admin/crm/leads">
            <Button>Back to Leads</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeView="crm-leads" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <SEOHead
        title={`${lead.first_name} ${lead.last_name} | CRM | MPB Health Admin`}
        description="Lead details and activity"
      />

      <div className="p-6">
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'CRM', href: '/admin/crm' },
            { label: 'Leads', href: '/admin/crm/leads' },
            { label: `${lead.first_name} ${lead.last_name}` },
          ]}
        />

        {/* Header */}
        <div className="flex items-start justify-between mt-4 mb-6">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate(-1)}
              className="mt-1 p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-neutral-600" />
            </button>

            <div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold text-lg">
                  {lead.first_name?.charAt(0)}{lead.last_name?.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900">
                    {lead.first_name} {lead.last_name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    {currentStage && (
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: currentStage.color }}
                      >
                        {currentStage.display_name}
                      </span>
                    )}
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium border',
                      priorityColors[lead.priority || 'medium']
                    )}>
                      {(lead.priority || 'medium').toUpperCase()}
                    </span>
                    {lead.lead_score > 0 && (
                      <span className="flex items-center gap-1 text-sm text-amber-600">
                        <Star className="h-4 w-4 fill-current" />
                        Score: {lead.lead_score}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowExportModal(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            {isEditing ? (
              <>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="mb-6 p-4 bg-white rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-neutral-700">Quick Actions:</span>
              <LeadQuickActions
                lead={lead}
                onActionComplete={loadLeadData}
                variant="horizontal"
                size="sm"
              />
            </div>
            <div className="flex items-center gap-2">
              {lead.zoho_lead_id && lead.zoho_sync_status === 'synced' ? (
                <>
                  <a
                    href={`https://crm.zoho.com/crm/org123/tab/Leads/${lead.zoho_lead_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Synced to Zoho
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSyncToZoho}
                    disabled={isSyncingToZoho}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <RefreshCw className={cn('h-4 w-4 mr-1', isSyncingToZoho && 'animate-spin')} />
                    {isSyncingToZoho ? 'Syncing...' : 'Re-sync'}
                  </Button>
                </>
              ) : lead.zoho_sync_status === 'failed' ? (
                <>
                  <span className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    Sync failed
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSyncToZoho}
                    disabled={isSyncingToZoho}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <RefreshCw className={cn('h-4 w-4 mr-1', isSyncingToZoho && 'animate-spin')} />
                    {isSyncingToZoho ? 'Retrying...' : 'Retry'}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncToZoho}
                  disabled={isSyncingToZoho}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <Upload className={cn('h-4 w-4 mr-1', isSyncingToZoho && 'animate-pulse')} />
                  {isSyncingToZoho ? 'Pushing...' : 'Push to Zoho CRM'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pipeline Stage Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stages.map((stage) => (
                    <button
                      key={stage.name}
                      onClick={() => handleStageChange(stage.name)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        lead.pipeline_stage === stage.name
                          ? 'text-white shadow-md'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      )}
                      style={lead.pipeline_stage === stage.name ? { backgroundColor: stage.color } : undefined}
                    >
                      {stage.display_name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-neutral-500" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={editedLead.first_name || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, first_name: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={editedLead.last_name || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, last_name: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editedLead.email || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={editedLead.phone || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        value={editedLead.zip_code || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, zip_code: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Priority</label>
                      <select
                        value={editedLead.priority || 'medium'}
                        onChange={(e) => setEditedLead({ ...editedLead, priority: e.target.value as Lead['priority'] })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500">Email</p>
                        <a href={`mailto:${lead.email}`} className="text-primary-600 hover:text-primary-700">
                          {lead.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500">Phone</p>
                        <a href={`tel:${lead.phone}`} className="text-primary-600 hover:text-primary-700">
                          {lead.phone}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500">ZIP Code</p>
                        <p className="text-neutral-900">{lead.zip_code || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500">Created</p>
                        <p className="text-neutral-900">{new Date(lead.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coverage Details */}
            {(lead.coverage_preference || lead.current_insurance || lead.primary_concern) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-neutral-500" />
                    Coverage Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {lead.coverage_preference && (
                      <div>
                        <p className="text-sm text-neutral-500">Coverage Preference</p>
                        <p className="font-medium text-neutral-900">{lead.coverage_preference}</p>
                      </div>
                    )}
                    {lead.current_insurance && (
                      <div>
                        <p className="text-sm text-neutral-500">Current Insurance</p>
                        <p className="font-medium text-neutral-900">{lead.current_insurance}</p>
                      </div>
                    )}
                    {lead.monthly_premium && (
                      <div>
                        <p className="text-sm text-neutral-500">Monthly Premium</p>
                        <p className="font-medium text-neutral-900">{lead.monthly_premium}</p>
                      </div>
                    )}
                    {lead.primary_concern && (
                      <div>
                        <p className="text-sm text-neutral-500">Primary Concern</p>
                        <p className="font-medium text-neutral-900">{lead.primary_concern}</p>
                      </div>
                    )}
                    {lead.contact_preference && (
                      <div>
                        <p className="text-sm text-neutral-500">Contact Preference</p>
                        <p className="font-medium text-neutral-900 capitalize">{lead.contact_preference}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <LeadActivityTimeline
                  leadId={lead.id}
                  activities={activities}
                  onActivityAdded={loadLeadData}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tasks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-neutral-500" />
                    Tasks
                  </CardTitle>
                  <span className="text-sm text-neutral-500">
                    {tasks.filter(t => !t.completed).length} open
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-6 text-neutral-500">
                    <Calendar className="h-10 w-10 mx-auto mb-2 text-neutral-300" />
                    <p className="text-sm">No tasks yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          'p-3 rounded-lg border',
                          task.completed
                            ? 'bg-neutral-50 border-neutral-200'
                            : new Date(task.due_date) < new Date()
                              ? 'bg-red-50 border-red-200'
                              : 'bg-white border-neutral-200'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => !task.completed && handleCompleteTask(task.id)}
                              className={cn(
                                'mt-0.5 p-0.5 rounded',
                                task.completed
                                  ? 'text-green-500'
                                  : 'text-neutral-300 hover:text-green-500'
                              )}
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <div>
                              <p className={cn(
                                'font-medium',
                                task.completed && 'line-through text-neutral-400'
                              )}>
                                {task.title}
                              </p>
                              <p className={cn(
                                'text-xs',
                                new Date(task.due_date) < new Date() && !task.completed
                                  ? 'text-red-500'
                                  : 'text-neutral-500'
                              )}>
                                {new Date(task.due_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 text-neutral-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-neutral-500" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(lead.tags || []).map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-primary-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {(!lead.tags || lead.tags.length === 0) && (
                    <span className="text-sm text-neutral-400">No tags</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button size="sm" onClick={handleAddTag} disabled={!newTag.trim()}>
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Source Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-neutral-500" />
                  Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-neutral-500">Source CTA</p>
                    <p className="font-medium text-neutral-900">{lead.source_cta || 'Direct'}</p>
                  </div>
                  {lead.source_page && (
                    <div>
                      <p className="text-neutral-500">Source Page</p>
                      <p className="font-medium text-neutral-900 truncate">{lead.source_page}</p>
                    </div>
                  )}
                  {lead.utm_source && (
                    <div>
                      <p className="text-neutral-500">UTM Source</p>
                      <p className="font-medium text-neutral-900">{lead.utm_source}</p>
                    </div>
                  )}
                  {lead.utm_medium && (
                    <div>
                      <p className="text-neutral-500">UTM Medium</p>
                      <p className="font-medium text-neutral-900">{lead.utm_medium}</p>
                    </div>
                  )}
                  {lead.utm_campaign && (
                    <div>
                      <p className="text-neutral-500">UTM Campaign</p>
                      <p className="font-medium text-neutral-900">{lead.utm_campaign}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-neutral-500" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-neutral-500">Created</p>
                    <p className="font-medium text-neutral-900">
                      {new Date(lead.created_at).toLocaleString()}
                    </p>
                  </div>
                  {lead.stage_changed_at && (
                    <div>
                      <p className="text-neutral-500">Stage Changed</p>
                      <p className="font-medium text-neutral-900">
                        {new Date(lead.stage_changed_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {lead.last_contacted_at && (
                    <div>
                      <p className="text-neutral-500">Last Contacted</p>
                      <p className="font-medium text-neutral-900">
                        {new Date(lead.last_contacted_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {lead.next_followup_at && (
                    <div>
                      <p className="text-neutral-500">Next Follow-up</p>
                      <p className={cn(
                        'font-medium',
                        new Date(lead.next_followup_at) < new Date()
                          ? 'text-red-600'
                          : 'text-neutral-900'
                      )}>
                        {new Date(lead.next_followup_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {lead.converted_at && (
                    <div>
                      <p className="text-neutral-500">Converted</p>
                      <p className="font-medium text-green-600">
                        {new Date(lead.converted_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        exportType="single"
        singleLead={lead}
      />
    </AdminLayout>
  );
};

export default LeadDetail;
