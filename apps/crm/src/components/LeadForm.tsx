import { InputField, SelectField, TextareaField, SubmitButton } from './FormField';
import { useForm } from '../hooks/useForm';

interface LeadFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  household_size: string;
  zip_code: string;
  current_insurance: string;
  monthly_premium: string;
  coverage_preference: string;
  primary_concern: string;
  contact_preference: string;
  source_cta: string;
  tags: string;
  // Edit-only fields
  priority: string;
  lead_score: string;
  next_followup_at: string;
}

interface LeadFormProps {
  initialValues?: Partial<LeadFormValues>;
  onSubmit: (values: LeadFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isEdit?: boolean;
}

const COVERAGE_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'individual', label: 'Individual' },
  { value: 'family', label: 'Family' },
  { value: 'group', label: 'Group' },
  { value: 'medicare', label: 'Medicare' },
  { value: 'medicaid', label: 'Medicaid' },
  { value: 'dental', label: 'Dental' },
  { value: 'vision', label: 'Vision' },
  { value: 'life', label: 'Life' },
  { value: 'other', label: 'Other' },
];

const CONCERN_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'cost', label: 'Cost / Affordability' },
  { value: 'coverage', label: 'Coverage Quality' },
  { value: 'dental_vision', label: 'Dental & Vision' },
  { value: 'prescription', label: 'Prescription Costs' },
  { value: 'network', label: 'Provider Network' },
  { value: 'switching', label: 'Switching Plans' },
  { value: 'enrollment', label: 'Enrollment Help' },
  { value: 'other', label: 'Other' },
];

const CONTACT_PREF_OPTIONS = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS/Text' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const defaultValues: LeadFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  household_size: '',
  zip_code: '',
  current_insurance: '',
  monthly_premium: '',
  coverage_preference: '',
  primary_concern: '',
  contact_preference: 'phone',
  source_cta: '',
  tags: '',
  priority: 'medium',
  lead_score: '0',
  next_followup_at: '',
};

export function LeadForm({ initialValues, onSubmit, onCancel, submitLabel = 'Save', isEdit }: LeadFormProps) {
  const { values, errors, loading, handleChange, handleSubmit } = useForm<LeadFormValues>({
    initialValues: { ...defaultValues, ...initialValues } as LeadFormValues,
    validate: (vals) => {
      const errs: Partial<Record<keyof LeadFormValues, string>> = {};
      if (!vals.first_name.trim()) errs.first_name = 'First name is required';
      if (!vals.last_name.trim()) errs.last_name = 'Last name is required';
      if (!vals.email.trim()) errs.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) errs.email = 'Invalid email format';
      return errs;
    },
    onSubmit,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name row */}
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="First Name"
          name="first_name"
          value={values.first_name}
          onChange={handleChange}
          error={errors.first_name}
          required
          placeholder="John"
        />
        <InputField
          label="Last Name"
          name="last_name"
          value={values.last_name}
          onChange={handleChange}
          error={errors.last_name}
          required
          placeholder="Doe"
        />
      </div>

      {/* Contact row */}
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          required
          placeholder="john@example.com"
        />
        <InputField
          label="Phone"
          name="phone"
          type="tel"
          value={values.phone}
          onChange={handleChange}
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Location row */}
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Zip Code"
          name="zip_code"
          value={values.zip_code}
          onChange={handleChange}
          placeholder="12345"
        />
        <InputField
          label="Household Size"
          name="household_size"
          type="number"
          value={values.household_size}
          onChange={handleChange}
          placeholder="1"
        />
      </div>

      {/* Insurance info */}
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Current Insurance"
          name="current_insurance"
          value={values.current_insurance}
          onChange={handleChange}
          placeholder="e.g. Blue Cross"
        />
        <InputField
          label="Monthly Premium"
          name="monthly_premium"
          value={values.monthly_premium}
          onChange={handleChange}
          placeholder="e.g. $350"
        />
      </div>

      {/* Preferences */}
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Coverage Preference"
          name="coverage_preference"
          value={values.coverage_preference}
          onChange={handleChange}
          options={COVERAGE_OPTIONS}
        />
        <SelectField
          label="Primary Concern"
          name="primary_concern"
          value={values.primary_concern}
          onChange={handleChange}
          options={CONCERN_OPTIONS}
        />
      </div>

      <SelectField
        label="Contact Preference"
        name="contact_preference"
        value={values.contact_preference}
        onChange={handleChange}
        options={CONTACT_PREF_OPTIONS}
      />

      <InputField
        label="Source / CTA"
        name="source_cta"
        value={values.source_cta}
        onChange={handleChange}
        placeholder="e.g. Website Hero Banner"
      />

      <InputField
        label="Tags"
        name="tags"
        value={values.tags}
        onChange={handleChange}
        placeholder="Comma-separated tags, e.g. family, urgent"
      />

      {/* Edit-only fields */}
      {isEdit && (
        <>
          <hr className="border-neutral-200" />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Priority"
              name="priority"
              value={values.priority}
              onChange={handleChange}
              options={PRIORITY_OPTIONS}
            />
            <InputField
              label="Lead Score"
              name="lead_score"
              type="number"
              value={values.lead_score}
              onChange={handleChange}
              placeholder="0-100"
            />
          </div>
          <InputField
            label="Next Follow-up"
            name="next_followup_at"
            type="datetime-local"
            value={values.next_followup_at}
            onChange={handleChange}
          />
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <SubmitButton loading={loading} label={submitLabel} loadingLabel="Saving..." />
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
