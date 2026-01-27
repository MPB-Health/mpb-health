import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { InputField, TextareaField, SubmitButton } from './FormField';
import { useForm } from '../hooks/useForm';
import { useCRM } from '../contexts/CRMContext';

interface SendDraftModalProps {
  open: boolean;
  onClose: () => void;
  leadId: string;
  leadEmail: string;
  subject?: string;
  body: string;
  draftType: 'email' | 'sms';
}

interface SendFormValues {
  to: string;
  subject: string;
  body: string;
  save_as_template: string;
  template_name: string;
}

export function SendDraftModal({
  open,
  onClose,
  leadId,
  leadEmail,
  subject,
  body,
  draftType,
}: SendDraftModalProps) {
  const { emailService, templateService } = useCRM();

  const { values, errors, loading, handleChange, handleSubmit } = useForm<SendFormValues>({
    initialValues: {
      to: leadEmail,
      subject: subject || '',
      body: body,
      save_as_template: 'false',
      template_name: '',
    },
    validate: (vals) => {
      const errs: Partial<Record<keyof SendFormValues, string>> = {};
      if (!vals.to.trim()) errs.to = 'Recipient is required';
      if (draftType === 'email' && !vals.subject.trim()) errs.subject = 'Subject is required';
      if (!vals.body.trim()) errs.body = 'Body is required';
      if (vals.save_as_template === 'true' && !vals.template_name.trim()) {
        errs.template_name = 'Template name is required';
      }
      return errs;
    },
    onSubmit: async (vals) => {
      // Send email
      const result = await emailService.sendDirect(vals.to, vals.subject, vals.body, leadId);

      if (!result.success) {
        toast.error(result.error || 'Failed to send email');
        return;
      }

      toast.success('Email sent');

      // Optionally save as template
      if (vals.save_as_template === 'true' && vals.template_name) {
        const templateResult = await templateService.createTemplate({
          name: vals.template_name,
          template_type: draftType === 'sms' ? 'sms' : 'email',
          subject: vals.subject || undefined,
          body: vals.body,
          is_ai_generated: true,
          category: 'general',
        });
        if (templateResult.success) {
          toast.success('Saved as template');
        }
      }

      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title={`Send ${draftType === 'sms' ? 'SMS' : 'Email'}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="To"
          name="to"
          type="email"
          value={values.to}
          onChange={handleChange}
          error={errors.to}
          required
        />

        {draftType === 'email' && (
          <InputField
            label="Subject"
            name="subject"
            value={values.subject}
            onChange={handleChange}
            error={errors.subject}
            required
          />
        )}

        <TextareaField
          label="Body"
          name="body"
          value={values.body}
          onChange={handleChange}
          error={errors.body}
          required
          rows={6}
        />

        <div className="border-t border-th-border pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values.save_as_template === 'true'}
              onChange={(e) =>
                handleChange({
                  target: { name: 'save_as_template', value: e.target.checked ? 'true' : 'false' },
                } as any)
              }
              className="w-4 h-4 rounded border-th-border"
            />
            <span className="text-sm text-th-text-secondary">Save as reusable template</span>
          </label>
          {values.save_as_template === 'true' && (
            <div className="mt-2">
              <InputField
                label="Template Name"
                name="template_name"
                value={values.template_name}
                onChange={handleChange}
                error={errors.template_name}
                placeholder="e.g. AI Follow-up Email"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton loading={loading} label="Send" />
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
