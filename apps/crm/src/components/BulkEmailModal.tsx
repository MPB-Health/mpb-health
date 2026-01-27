import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import type { CRMTemplate } from '@mpbhealth/crm-core';

interface Props {
  open: boolean;
  onClose: () => void;
  leadIds: string[];
  onSuccess: () => void;
}

export function BulkEmailModal({ open, onClose, leadIds, onSuccess }: Props) {
  const { templateService, emailService } = useCRM();
  const [templates, setTemplates] = useState<CRMTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoadingTemplates(true);
      const data = await templateService.listTemplates();
      setTemplates(data);
      setLoadingTemplates(false);
    };
    load();
  }, [open, templateService]);

  const handleSend = async () => {
    if (!selectedTemplateId) {
      toast.error('Please select a template');
      return;
    }

    setSending(true);
    setProgress(0);
    const batchSize = 10;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < leadIds.length; i += batchSize) {
      const batch = leadIds.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((leadId) =>
          emailService.sendFromTemplate(selectedTemplateId, leadId)
        )
      );

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.success) {
          sent++;
        } else {
          failed++;
        }
      }

      setProgress(Math.min(i + batchSize, leadIds.length));

      // Brief pause between batches
      if (i + batchSize < leadIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setSending(false);
    setProgress(0);
    setSelectedTemplateId('');

    if (failed === 0) {
      toast.success(`Sent emails to ${sent} leads`);
    } else {
      toast.success(`Sent ${sent} emails, ${failed} failed`);
    }
    onSuccess();
    onClose();
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <Modal open={open} onClose={onClose} title={`Send Email to ${leadIds.length} Leads`}>
      <div className="space-y-4">
        <p className="text-sm text-th-text-secondary">
          Send an email template to {leadIds.length} selected lead{leadIds.length !== 1 ? 's' : ''}.
        </p>

        {loadingTemplates ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-th-accent-600" />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Email Template
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              >
                <option value="">Select a template...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedTemplate && (
              <div className="bg-surface-secondary rounded-lg p-4 border border-th-border">
                <p className="text-xs text-th-text-tertiary mb-1">Preview</p>
                <p className="text-sm font-medium text-th-text-primary">{selectedTemplate.subject}</p>
                <p className="text-sm text-th-text-secondary mt-2 line-clamp-3">
                  {selectedTemplate.body.replace(/<[^>]*>/g, '').slice(0, 200)}
                </p>
              </div>
            )}
          </>
        )}

        {sending && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-th-text-tertiary">
              <span>Sending emails...</span>
              <span>{progress} / {leadIds.length}</span>
            </div>
            <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-th-accent-600 rounded-full transition-all duration-300"
                style={{ width: `${(progress / leadIds.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !selectedTemplateId}
            className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Emails'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
