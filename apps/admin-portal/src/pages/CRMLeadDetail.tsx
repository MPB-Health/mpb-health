import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, User, Mail, Phone, Building2,
  CheckCircle, Circle, Calendar, Activity,
} from 'lucide-react';
import { crmBridgeService, type CRMLeadDetail as CRMLeadDetailType } from '@mpbhealth/admin-core';

export default function CRMLeadDetail() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<CRMLeadDetailType | null>(null);
  const [stages, setStages] = useState<{ id: string; name: string; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leadId) return;

    const load = async () => {
      try {
        const [leadData, stageData] = await Promise.all([
          crmBridgeService.getLead(leadId),
          crmBridgeService.getPipelineStages(),
        ]);

        if (!leadData) {
          toast.error('Lead not found');
          navigate('/crm/leads');
          return;
        }
        setLead(leadData);
        setStages(stageData);
      } catch {
        toast.error('Failed to load lead');
        navigate('/crm/leads');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [leadId, navigate]);

  const handleStageChange = async (stageId: string) => {
    if (!leadId) return;
    try {
      await crmBridgeService.updateLeadStage(leadId, stageId);
      setLead((prev) => prev ? { ...prev, pipeline_stage_id: stageId } : prev);
      toast.success('Stage updated');
    } catch {
      toast.error('Failed to update stage');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/crm/leads')}
          className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-th-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">
            {lead.first_name} {lead.last_name}
          </h1>
          {lead.company && (
            <p className="text-sm text-th-text-tertiary">{lead.company}</p>
          )}
        </div>
        {lead.status && (
          <span className="px-3 py-1 text-sm rounded-full font-medium bg-blue-100 text-blue-700">
            {lead.status}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact info */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={Mail} label="Email" value={lead.email || '-'} />
              <InfoRow icon={Phone} label="Phone" value={lead.phone || '-'} />
              <InfoRow icon={Building2} label="Company" value={lead.company || '-'} />
              <InfoRow icon={User} label="Source" value={lead.source || '-'} />
            </div>
          </div>

          {/* Pipeline stage */}
          {stages.length > 0 && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <h2 className="text-lg font-semibold text-th-text-primary mb-4">Pipeline Stage</h2>
              <div className="flex flex-wrap gap-2">
                {stages.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => handleStageChange(stage.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      lead.pipeline_stage_id === stage.id
                        ? 'ring-2 ring-offset-2 ring-th-accent-500 text-white'
                        : 'bg-surface-tertiary text-th-text-secondary hover:bg-surface-secondary'
                    }`}
                    style={lead.pipeline_stage_id === stage.id ? { backgroundColor: stage.color } : {}}
                  >
                    {stage.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Activities */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">
              Activities ({lead.activities.length})
            </h2>
            {lead.activities.length > 0 ? (
              <div className="space-y-3">
                {lead.activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 py-2 border-b border-th-border-subtle last:border-0">
                    <Activity className="w-4 h-4 text-th-text-tertiary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-th-text-primary capitalize">{activity.type}</p>
                      {activity.description && (
                        <p className="text-sm text-th-text-tertiary">{activity.description}</p>
                      )}
                      <p className="text-xs text-th-text-tertiary mt-1">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-th-text-tertiary">No activities recorded</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tasks */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">
              Tasks ({lead.tasks.length})
            </h2>
            {lead.tasks.length > 0 ? (
              <div className="space-y-2">
                {lead.tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-2 py-1.5">
                    {task.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-th-text-tertiary mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className={`text-sm ${task.completed ? 'line-through text-th-text-tertiary' : 'text-th-text-primary'}`}>
                        {task.title}
                      </p>
                      {task.due_date && (
                        <p className="text-xs text-th-text-tertiary flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-th-text-tertiary">No tasks</p>
            )}
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="bg-surface-primary rounded-xl border border-th-border p-6">
              <h2 className="text-lg font-semibold text-th-text-primary mb-4">Notes</h2>
              <p className="text-sm text-th-text-secondary whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <h2 className="text-lg font-semibold text-th-text-primary mb-4">Timeline</h2>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-th-text-tertiary">Created</p>
                <p className="text-sm text-th-text-primary">{new Date(lead.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-th-text-tertiary">Last Updated</p>
                <p className="text-sm text-th-text-primary">{new Date(lead.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-th-text-tertiary shrink-0" />
      <div>
        <p className="text-xs text-th-text-tertiary">{label}</p>
        <p className="text-sm text-th-text-primary">{value}</p>
      </div>
    </div>
  );
}
