import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { InputField, SelectField, TextareaField, SubmitButton } from './FormField';
import { useForm } from '../hooks/useForm';
import { useCRM } from '../contexts/CRMContext';
import { TemplatePreview } from './TemplatePreview';
import type { CRMTemplate } from '@mpbhealth/crm-core';

interface TemplateModalProps {
  open: boolean;
  onClose: () => void;
  template?: CRMTemplate | null;
  onSuccess?: () => void;
}

interface TemplateFormValues {
  name: string;
  description: string;
  template_type: string;
  category: string;
  subject: string;
  body: string;
  is_active: string;
}

const TYPE_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'both', label: 'Both' },
];

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'nurture', label: 'Nurture' },
];

const VARIABLES = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'company', label: 'Company' },
];

export function TemplateModal({ open, onClose, template, onSuccess }: TemplateModalProps) {
  const { templateService } = useCRM();
  const isEdit = !!template;

  const { values, errors, loading, handleChange, handleSubmit, setFieldValue, reset } =
    useForm<TemplateFormValues>({
      initialValues: {
        name: template?.name || '',
        description: template?.description || '',
        template_type: template?.template_type || 'email',
        category: template?.category || 'general',
        subject: template?.subject || '',
        body: template?.body || '',
        is_active: template?.is_active !== false ? 'true' : 'false',
      },
      validate: (vals) => {
        const errs: Partial<Record<keyof TemplateFormValues, string>> = {};
        if (!vals.name.trim()) errs.name = 'Name is required';
        if (!vals.body.trim()) errs.body = 'Body is required';
        if ((vals.template_type === 'email' || vals.template_type === 'both') && !vals.subject.trim()) {
          errs.subject = 'Subject is required for email templates';
        }
        return errs;
      },
      onSubmit: async (vals) => {
        const input = {
          name: vals.name,
          description: vals.description || undefined,
          template_type: vals.template_type as 'email' | 'sms' | 'both',
          category: vals.category,
          subject: vals.subject || undefined,
          body: vals.body,
          variables: VARIABLES.filter((v) => vals.body.includes(`{{${v.key}}}`)),
          is_active: vals.is_active === 'true',
        };

        const result = isEdit
          ? await templateService.updateTemplate(template!.id, input)
          : await templateService.createTemplate(input);

        if (!result.success) {
          toast.error(result.error || `Failed to ${isEdit ? 'update' : 'create'} template`);
          return;
        }

        toast.success(isEdit ? 'Template updated' : 'Template created');
        onSuccess?.();
        onClose();
      },
    });

  // Reset form when template changes
  useEffect(() => {
    if (open) {
      reset();
      setFieldValue('name', template?.name || '');
      setFieldValue('description', template?.description || '');
      setFieldValue('template_type', template?.template_type || 'email');
      setFieldValue('category', template?.category || 'general');
      setFieldValue('subject', template?.subject || '');
      setFieldValue('body', template?.body || '');
      setFieldValue('is_active', template?.is_active !== false ? 'true' : 'false');
    }
  }, [open, template]);

  const insertVariable = (key: string) => {
    setFieldValue('body', values.body + `{{${key}}}`);
  };

  const showSubject = values.template_type === 'email' || values.template_type === 'both';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Template' : 'New Template'}
      variant="slideOver"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Name"
          name="name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          required
          placeholder="e.g. Follow Up Email"
        />

        <InputField
          label="Description"
          name="description"
          value={values.description}
          onChange={handleChange}
          placeholder="Optional description"
        />

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Type"
            name="template_type"
            value={values.template_type}
            onChange={handleChange}
            options={TYPE_OPTIONS}
          />
          <SelectField
            label="Category"
            name="category"
            value={values.category}
            onChange={handleChange}
            options={CATEGORY_OPTIONS}
          />
        </div>

        {showSubject && (
          <InputField
            label="Subject"
            name="subject"
            value={values.subject}
            onChange={handleChange}
            error={errors.subject}
            required
            placeholder="e.g. Following up on your inquiry"
          />
        )}

        <div>
          <TextareaField
            label="Body"
            name="body"
            value={values.body}
            onChange={handleChange}
            error={errors.body}
            required
            rows={6}
            placeholder="Write your template content here..."
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-xs text-th-text-tertiary mr-1">Insert:</span>
            {VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => insertVariable(v.key)}
                className="px-2 py-0.5 text-xs bg-surface-tertiary text-th-text-secondary rounded hover:bg-surface-secondary transition-colors"
              >
                {`{{${v.key}}}`}
              </button>
            ))}
          </div>
        </div>

        <SelectField
          label="Status"
          name="is_active"
          value={values.is_active}
          onChange={handleChange}
          options={[
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
        />

        {/* Preview */}
        {values.body && (
          <TemplatePreview body={values.body} subject={showSubject ? values.subject : undefined} />
        )}

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton loading={loading} label={isEdit ? 'Save Changes' : 'Create Template'} />
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
