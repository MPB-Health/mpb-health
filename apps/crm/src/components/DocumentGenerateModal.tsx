import { useState } from 'react';
import { Modal } from './Modal';
import {
  FileText, Download, Send, Eye, Edit3, Check, Loader2,
  PenTool, FileCheck, Shield, User, Calendar, Sparkles,
  Copy, ChevronDown, ChevronRight, Mail, Clock, Hash,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface MergeField {
  key: string;
  label: string;
  value: string;
  editable: boolean;
}

interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
  fields: MergeField[];
}

interface SignatureRequest {
  signerName: string;
  signerEmail: string;
  status: 'pending' | 'sent' | 'viewed' | 'signed' | 'declined';
  sentAt?: string;
  signedAt?: string;
}

interface DocumentGenerateModalProps {
  open: boolean;
  onClose: () => void;
  clientName: string;
  clientEmail: string;
  leadId?: string;
  templates?: DocumentTemplate[];
  onGenerate?: (templateId: string, fields: Record<string, string>) => Promise<{ documentUrl: string }>;
  onSendForSignature?: (documentUrl: string, signerEmail: string) => Promise<void>;
}

const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'soa', name: 'Scope of Appointment (SOA)', category: 'Compliance',
    description: 'CMS-required document signed before discussing specific plans', icon: Shield,
    fields: [
      { key: 'client_name', label: 'Beneficiary Name', value: '', editable: false },
      { key: 'client_address', label: 'Address', value: '', editable: true },
      { key: 'appointment_date', label: 'Appointment Date', value: new Date().toISOString().split('T')[0], editable: true },
      { key: 'appointment_time', label: 'Appointment Time', value: '10:00 AM', editable: true },
      { key: 'products_discussed', label: 'Products to Discuss', value: 'Medicare Advantage, Medicare Supplement', editable: true },
      { key: 'agent_name', label: 'Agent Name', value: '', editable: false },
      { key: 'agent_npn', label: 'Agent NPN', value: '', editable: true },
    ],
  },
  {
    id: 'bor', name: 'Broker of Record Letter', category: 'Administration',
    description: 'Transfer agent of record for an existing policy', icon: FileCheck,
    fields: [
      { key: 'client_name', label: 'Policyholder Name', value: '', editable: false },
      { key: 'policy_number', label: 'Policy Number', value: '', editable: true },
      { key: 'carrier_name', label: 'Insurance Carrier', value: '', editable: true },
      { key: 'new_agent_name', label: 'New Agent Name', value: '', editable: false },
      { key: 'new_agent_npn', label: 'New Agent NPN', value: '', editable: true },
      { key: 'effective_date', label: 'Effective Date', value: new Date().toISOString().split('T')[0], editable: true },
    ],
  },
  {
    id: 'enrollment', name: 'Enrollment Application', category: 'Enrollment',
    description: 'Pre-filled enrollment application with client data', icon: FileText,
    fields: [
      { key: 'client_name', label: 'Applicant Name', value: '', editable: false },
      { key: 'dob', label: 'Date of Birth', value: '', editable: true },
      { key: 'medicare_id', label: 'Medicare ID', value: '', editable: true },
      { key: 'plan_name', label: 'Plan Name', value: '', editable: true },
      { key: 'carrier', label: 'Carrier', value: '', editable: true },
      { key: 'effective_date', label: 'Coverage Start Date', value: '', editable: true },
    ],
  },
  {
    id: 'disclosure', name: 'Agent Disclosure Form', category: 'Compliance',
    description: 'Compensation and relationship disclosure document', icon: User,
    fields: [
      { key: 'client_name', label: 'Client Name', value: '', editable: false },
      { key: 'agent_name', label: 'Agent Name', value: '', editable: false },
      { key: 'agency_name', label: 'Agency Name', value: 'MPB Health', editable: false },
      { key: 'compensation_type', label: 'Compensation Type', value: 'Commission from carrier', editable: true },
    ],
  },
  {
    id: 'plan_summary', name: 'Plan Summary Letter', category: 'Client Communication',
    description: 'AI-generated personalized plan recommendation letter', icon: Sparkles,
    fields: [
      { key: 'client_name', label: 'Client Name', value: '', editable: false },
      { key: 'plan_names', label: 'Recommended Plans', value: '', editable: true },
      { key: 'key_benefits', label: 'Key Benefits to Highlight', value: '', editable: true },
      { key: 'next_steps', label: 'Next Steps', value: 'Schedule enrollment call', editable: true },
    ],
  },
];

export function DocumentGenerateModal({
  open, onClose, clientName, clientEmail, leadId,
  templates: propTemplates, onGenerate, onSendForSignature,
}: DocumentGenerateModalProps) {
  const templates = propTemplates && propTemplates.length > 0 ? propTemplates : DEFAULT_TEMPLATES;
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [signatureStatus, setSignatureStatus] = useState<SignatureRequest | null>(null);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<'select' | 'fill' | 'preview' | 'sign'>('select');

  const selectTemplate = (t: DocumentTemplate) => {
    setSelectedTemplate(t);
    const values: Record<string, string> = {};
    t.fields.forEach((f) => {
      if (f.key.includes('client_name')) values[f.key] = clientName;
      else values[f.key] = f.value;
    });
    setFieldValues(values);
    setDocumentUrl(null);
    setSignatureStatus(null);
    setStep('fill');
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setGenerating(true);
    try {
      const result = await onGenerate?.(selectedTemplate.id, fieldValues);
      setDocumentUrl(result?.documentUrl || `https://docs.mpb.health/generated/${selectedTemplate.id}/${Date.now()}`);
      setStep('preview');
    } catch { /* parent handles */ }
    finally { setGenerating(false); }
  };

  const handleSendForSignature = async () => {
    if (!documentUrl) return;
    setSending(true);
    try {
      await onSendForSignature?.(documentUrl, clientEmail);
      setSignatureStatus({
        signerName: clientName,
        signerEmail: clientEmail,
        status: 'sent',
        sentAt: new Date().toISOString(),
      });
      setStep('sign');
    } catch { /* parent handles */ }
    finally { setSending(false); }
  };

  const categories = [...new Set(templates.map((t) => t.category))];

  return (
    <Modal open={open} onClose={onClose} title="Document Generation & E-Signature" size="2xl">
      <div className="space-y-4">
        {/* Breadcrumb / step indicator */}
        <div className="flex items-center gap-1.5 text-xs text-th-text-tertiary">
          <button onClick={() => { setStep('select'); setSelectedTemplate(null); }} className={cn(step === 'select' ? 'text-th-accent-500 font-medium' : 'hover:text-th-text-secondary')}>Templates</button>
          {selectedTemplate && (
            <>
              <ChevronRight className="w-3 h-3" />
              <button onClick={() => setStep('fill')} className={cn(step === 'fill' ? 'text-th-accent-500 font-medium' : 'hover:text-th-text-secondary')}>{selectedTemplate.name}</button>
            </>
          )}
          {documentUrl && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className={cn(step === 'preview' ? 'text-th-accent-500 font-medium' : '')}>Preview</span>
            </>
          )}
          {signatureStatus && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className={cn(step === 'sign' ? 'text-th-accent-500 font-medium' : '')}>Signature</span>
            </>
          )}
        </div>

        <div className="min-h-[360px]">
          {/* Template selection */}
          {step === 'select' && (
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat}>
                  <p className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider mb-2">{cat}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {templates.filter((t) => t.category === cat).map((t) => {
                      const Icon = t.icon;
                      return (
                        <button key={t.id} onClick={() => selectTemplate(t)}
                          className="flex items-start gap-3 p-3 rounded-xl border border-th-border/50 hover:border-th-accent-500/30 hover:bg-th-accent-500/5 transition-all text-left">
                          <div className="w-8 h-8 rounded-lg bg-th-accent-500/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-th-accent-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-th-text-primary">{t.name}</p>
                            <p className="text-xs text-th-text-tertiary mt-0.5">{t.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Field filling */}
          {step === 'fill' && selectedTemplate && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-secondary border border-th-border/50">
                {(() => { const Icon = selectedTemplate.icon; return <Icon className="w-4 h-4 text-th-accent-500 shrink-0" />; })()}
                <div>
                  <p className="text-sm font-medium text-th-text-primary">{selectedTemplate.name}</p>
                  <p className="text-xs text-th-text-tertiary">{selectedTemplate.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-th-text-secondary">Merge Fields</p>
                {selectedTemplate.fields.map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-medium text-th-text-secondary mb-1 block">{field.label}</label>
                    <input
                      type={field.key.includes('date') ? 'date' : 'text'}
                      value={fieldValues[field.key] || ''}
                      onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      disabled={!field.editable && !!fieldValues[field.key]}
                      className={cn(
                        'w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none',
                        !field.editable && fieldValues[field.key] ? 'bg-surface-secondary text-th-text-secondary' : ''
                      )}
                    />
                  </div>
                ))}
              </div>

              <button onClick={handleGenerate} disabled={generating}
                className="w-full py-3 rounded-xl gradient-accent text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? 'Generating Document...' : 'Generate Document'}
              </button>
            </div>
          )}

          {/* Document preview */}
          {step === 'preview' && documentUrl && selectedTemplate && (
            <div className="space-y-4">
              <div className="rounded-xl border border-th-border overflow-hidden">
                <div className="bg-surface-secondary px-4 py-3 flex items-center gap-3 border-b border-th-border/50">
                  <FileText className="w-4 h-4 text-th-accent-500" />
                  <span className="text-sm font-medium text-th-text-primary">{selectedTemplate.name}</span>
                  <span className="text-[10px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full ml-auto">Generated</span>
                </div>
                <div className="p-6 bg-white dark:bg-surface-primary min-h-[200px]">
                  {/* Simulated document */}
                  <div className="max-w-md mx-auto space-y-4 text-sm text-gray-800 dark:text-th-text-primary">
                    <div className="text-center border-b pb-4 mb-4">
                      <h3 className="text-lg font-bold">{selectedTemplate.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-th-text-tertiary mt-1">Generated by MPB Health CRM</p>
                    </div>
                    {selectedTemplate.fields.map((f) => (
                      <div key={f.key} className="flex">
                        <span className="text-xs text-gray-500 dark:text-th-text-tertiary w-32 shrink-0">{f.label}:</span>
                        <span className="text-xs font-medium">{fieldValues[f.key] || '—'}</span>
                      </div>
                    ))}
                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-th-text-tertiary">
                        <PenTool className="w-3 h-3" />
                        <span>Signature line: ___________________________</span>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-th-text-tertiary mt-2">
                        Date: {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep('fill')} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
                  <Edit3 className="w-4 h-4" /> Edit
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <div className="flex-1" />
                <button onClick={handleSendForSignature} disabled={sending}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium disabled:opacity-50">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
                  {sending ? 'Sending...' : 'Send for E-Signature'}
                </button>
              </div>
            </div>
          )}

          {/* Signature tracking */}
          {step === 'sign' && signatureStatus && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-center">
                <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-th-text-primary">Signature Request Sent!</p>
                <p className="text-xs text-th-text-secondary mt-1">
                  Sent to <strong>{signatureStatus.signerEmail}</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl border border-th-border/50 space-y-3">
                <p className="text-xs font-semibold text-th-text-secondary">Signature Status</p>
                <div className="flex items-center gap-4">
                  {['sent', 'viewed', 'signed'].map((s, idx) => {
                    const active = ['sent', 'viewed', 'signed'].indexOf(signatureStatus.status) >= idx;
                    return (
                      <div key={s} className="flex items-center gap-2 flex-1">
                        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                          active ? 'bg-green-500 text-white' : 'bg-surface-tertiary text-th-text-tertiary'
                        )}>
                          {active ? <Check className="w-3 h-3" /> : idx + 1}
                        </div>
                        <span className={cn('text-xs capitalize', active ? 'text-th-text-primary font-medium' : 'text-th-text-tertiary')}>{s}</span>
                        {idx < 2 && <div className={cn('flex-1 h-px', active ? 'bg-green-500' : 'bg-th-border/50')} />}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 text-xs text-th-text-tertiary">
                  <Clock className="w-3 h-3" />
                  <span>Sent {signatureStatus.sentAt ? new Date(signatureStatus.sentAt).toLocaleString() : 'just now'}</span>
                </div>
              </div>

              <button onClick={onClose} className="w-full py-2.5 rounded-xl gradient-accent text-white text-sm font-medium">Done</button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
