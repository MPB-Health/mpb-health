import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, User, Mail, Phone, Building2,
  CheckCircle, Circle, Calendar, Activity,
  UserCheck, X,
} from 'lucide-react';
import {
  crmBridgeService,
  type CRMLeadDetail as CRMLeadDetailType,
  type ConvertLeadInput,
} from '@mpbhealth/admin-core';

export default function CRMLeadDetail() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<CRMLeadDetailType | null>(null);
  const [stages, setStages] = useState<{ id: string; name: string; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [alreadyConverted, setAlreadyConverted] = useState(false);
  const [convertedContactId, setConvertedContactId] = useState<string | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (!leadId) return;

    const load = async () => {
      try {
        const [leadData, stageData, conversionStatus] = await Promise.all([
          crmBridgeService.getLead(leadId),
          crmBridgeService.getPipelineStages(),
          crmBridgeService.isLeadConverted(leadId),
        ]);

        if (!leadData) {
          toast.error('Lead not found');
          navigate('/crm/leads');
          return;
        }
        setLead(leadData);
        setStages(stageData);
        setAlreadyConverted(conversionStatus.converted);
        setConvertedContactId(conversionStatus.contactId ?? null);
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
      setLead((prev) => prev ? { ...prev, pipeline_stage: stageId } : prev);
      toast.success('Stage updated');
    } catch {
      toast.error('Failed to update stage');
    }
  };

  const handleConvert = async (extras: ConvertLeadInput) => {
    if (!leadId) return;
    setConverting(true);
    try {
      const contact = await crmBridgeService.convertLeadToContact(leadId, extras);
      setAlreadyConverted(true);
      setConvertedContactId(contact.id);
      setShowConvertModal(false);
      // Update lead state to reflect conversion
      setLead((prev) => prev ? { ...prev, pipeline_stage: 'closed_won' } : prev);
      const wonStage = stages.find((s) => s.name.toLowerCase() === 'won');
      if (wonStage) {
        setLead((prev) => prev ? { ...prev, pipeline_stage: wonStage.id } : prev);
      }
      toast.success('Lead converted to contact successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to convert lead');
    } finally {
      setConverting(false);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Back to leads"
            onClick={() => navigate('/crm/leads')}
            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-th-text-secondary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">
              {lead.first_name} {lead.last_name}
            </h1>
          </div>
          {lead.pipeline_stage && (
            <span className={`px-3 py-1 text-sm rounded-full font-medium ${
              lead.pipeline_stage === 'closed_won'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {lead.pipeline_stage}
            </span>
          )}
        </div>

        {/* Convert button */}
        {alreadyConverted ? (
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800">
            <UserCheck className="w-4 h-4" />
            Converted to Contact
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setShowConvertModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-th-accent-600 hover:bg-th-accent-700 rounded-lg transition-colors shadow-sm"
          >
            <UserCheck className="w-4 h-4" />
            Convert to Contact
          </button>
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
              <InfoRow icon={User} label="Source" value={lead.lead_source || '-'} />
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
                      lead.pipeline_stage === stage.id
                        ? 'ring-2 ring-offset-2 ring-th-accent-500 text-white'
                        : 'bg-surface-tertiary text-th-text-secondary hover:bg-surface-secondary'
                    }`}
                    style={lead.pipeline_stage === stage.id ? { backgroundColor: stage.color } : {}}
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
              {alreadyConverted && convertedContactId && (
                <div>
                  <p className="text-xs text-th-text-tertiary">Converted</p>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Contact ID: {convertedContactId.slice(0, 8)}...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Convert to Contact Modal */}
      {showConvertModal && lead && (
        <ConvertToContactModal
          lead={lead}
          converting={converting}
          onConvert={handleConvert}
          onClose={() => setShowConvertModal(false)}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

function ConvertToContactModal({
  lead,
  converting,
  onConvert,
  onClose,
}: {
  lead: CRMLeadDetailType;
  converting: boolean;
  onConvert: (extras: ConvertLeadInput) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ConvertLeadInput>({
    salutation: '',
    title: '',
    department: '',
    mobile: '',
    description: lead.notes || '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConvert({
      ...form,
      tags: tagInput ? tagInput.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface-primary rounded-2xl border border-th-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-th-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-th-accent-50 dark:bg-th-accent-900/30 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-th-accent-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-th-text-primary">Convert to Contact</h2>
              <p className="text-xs text-th-text-tertiary">
                {lead.first_name} {lead.last_name}
              </p>
            </div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors">
            <X className="w-5 h-5 text-th-text-secondary" />
          </button>
        </div>

        {/* Pre-filled info */}
        <div className="px-6 py-4 bg-surface-secondary border-b border-th-border">
          <p className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-2">
            From Lead
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-th-text-tertiary">Name:</span>{' '}
              <span className="text-th-text-primary font-medium">{lead.first_name} {lead.last_name}</span>
            </div>
            <div>
              <span className="text-th-text-tertiary">Email:</span>{' '}
              <span className="text-th-text-primary">{lead.email || '—'}</span>
            </div>
            <div>
              <span className="text-th-text-tertiary">Phone:</span>{' '}
              <span className="text-th-text-primary">{lead.phone || '—'}</span>
            </div>
            <div>
              <span className="text-th-text-tertiary">Source:</span>{' '}
              <span className="text-th-text-primary">{lead.lead_source || '—'}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <p className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
            Additional Contact Info (optional)
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="convert-salutation" className="block text-sm font-medium text-th-text-secondary mb-1">
                Salutation
              </label>
              <select
                id="convert-salutation"
                value={form.salutation}
                onChange={(e) => setForm((f) => ({ ...f, salutation: e.target.value }))}
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary"
              >
                <option value="">None</option>
                <option value="Mr.">Mr.</option>
                <option value="Ms.">Ms.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Dr.">Dr.</option>
                <option value="Prof.">Prof.</option>
              </select>
            </div>

            <div>
              <label htmlFor="convert-mobile" className="block text-sm font-medium text-th-text-secondary mb-1">
                Mobile
              </label>
              <input
                id="convert-mobile"
                type="text"
                value={form.mobile}
                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                placeholder="Mobile number"
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="convert-title" className="block text-sm font-medium text-th-text-secondary mb-1">
                Job Title
              </label>
              <input
                id="convert-title"
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Sales Manager"
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary"
              />
            </div>

            <div>
              <label htmlFor="convert-department" className="block text-sm font-medium text-th-text-secondary mb-1">
                Department
              </label>
              <input
                id="convert-department"
                type="text"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                placeholder="e.g. Sales"
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="convert-tags" className="block text-sm font-medium text-th-text-secondary mb-1">
              Tags
            </label>
            <input
              id="convert-tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Comma-separated tags"
              className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary"
            />
          </div>

          <div>
            <label htmlFor="convert-description" className="block text-sm font-medium text-th-text-secondary mb-1">
              Description / Notes
            </label>
            <textarea
              id="convert-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={converting}
              className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:text-th-text-primary rounded-lg hover:bg-surface-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={converting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-th-accent-600 hover:bg-th-accent-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {converting ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Converting...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Convert to Contact
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
