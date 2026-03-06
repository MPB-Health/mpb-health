import { X, User, Globe, Clock, Monitor } from 'lucide-react';
import type { WebFormSubmission, FormField, SubmissionStatus } from '@mpbhealth/crm-core';

const statusColors: Record<SubmissionStatus, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-100', text: 'text-blue-700' },
  converted: { bg: 'bg-green-100', text: 'text-green-700' },
  duplicate: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  spam: { bg: 'bg-red-100', text: 'text-red-700' },
};

interface SubmissionDetailProps {
  open: boolean;
  onClose: () => void;
  submission: WebFormSubmission | null;
  fields: FormField[];
  onConvert: (id: string) => void;
}

export function SubmissionDetail({ open, onClose, submission, fields, onConvert }: SubmissionDetailProps) {
  if (!open || !submission) return null;

  const data = submission.data as Record<string, unknown>;
  const statusStyle = statusColors[submission.status] || statusColors.new;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[480px] bg-surface-primary shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-surface-primary border-b border-th-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-th-text-primary">Submission Detail</h2>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${statusStyle.bg} ${statusStyle.text}`}
            >
              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-secondary">
            <X className="w-5 h-5 text-th-text-tertiary" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Meta info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-th-text-secondary">
              <Clock className="w-4 h-4 text-th-text-tertiary" />
              <span>{formatDate(submission.created_at)}</span>
            </div>
            {submission.source_url && (
              <div className="flex items-center gap-2 text-sm text-th-text-secondary">
                <Globe className="w-4 h-4 text-th-text-tertiary" />
                <span className="truncate">{submission.source_url}</span>
              </div>
            )}
            {submission.ip_address && (
              <div className="flex items-center gap-2 text-sm text-th-text-secondary">
                <User className="w-4 h-4 text-th-text-tertiary" />
                <span>{submission.ip_address}</span>
              </div>
            )}
            {submission.user_agent && (
              <div className="flex items-center gap-2 text-sm text-th-text-secondary">
                <Monitor className="w-4 h-4 text-th-text-tertiary" />
                <span className="truncate text-xs">{submission.user_agent}</span>
              </div>
            )}
          </div>

          {/* Field data */}
          <div>
            <h3 className="text-sm font-semibold text-th-text-primary mb-3">Submitted Data</h3>
            <div className="space-y-3">
              {fields
                .filter((f) => f.type !== 'heading' && f.type !== 'paragraph')
                .map((field) => {
                  const value = data[field.id];
                  return (
                    <div key={field.id} className="border-b border-th-border pb-2">
                      <p className="text-xs font-medium text-th-text-tertiary">{field.label}</p>
                      <p className="text-sm text-th-text-primary mt-0.5">
                        {value !== undefined && value !== null && value !== ''
                          ? String(value)
                          : '-'}
                      </p>
                    </div>
                  );
                })}

              {/* Show any data that doesn't match form fields */}
              {Object.entries(data)
                .filter(([key]) => !fields.find((f) => f.id === key))
                .map(([key, value]) => (
                  <div key={key} className="border-b border-th-border pb-2">
                    <p className="text-xs font-medium text-th-text-tertiary">{key}</p>
                    <p className="text-sm text-th-text-primary mt-0.5">{String(value)}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Actions */}
          {submission.status === 'new' && (
            <div className="border-t border-th-border pt-4">
              <button
                onClick={() => onConvert(submission.id)}
                className="w-full px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700"
              >
                Convert to Lead
              </button>
            </div>
          )}

          {submission.lead_id && (
            <div className="border-t border-th-border pt-4">
              <p className="text-xs text-th-text-tertiary">
                Linked Lead ID: <span className="font-mono">{submission.lead_id}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
