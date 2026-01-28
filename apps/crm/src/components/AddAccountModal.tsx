import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { InputField, SelectField, TextareaField, SubmitButton } from './FormField';
import { useForm } from '../hooks/useForm';
import { useOrg } from '../contexts/OrgContext';
import { logAuditEvent } from '@mpbhealth/auth';
import {
  createAccountService,
  type AccountWithRelations,
  type AccountCreateInput,
} from '@mpbhealth/crm-core';
import { supabase } from '../lib/supabase';

interface AddAccountModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (accountId: string) => void;
  account?: AccountWithRelations | null; // For edit mode
}

interface AccountFormValues {
  name: string;
  industry: string;
  website: string;
  phone: string;
  fax: string;
  account_type: string;
  rating: string;
  description: string;
  annual_revenue: string;
  employee_count: string;
  // Address fields
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  // Social
  linkedin_url: string;
  twitter_handle: string;
  // Tags
  tags: string;
  // Owner
  owner_id: string;
}

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'customer', label: 'Customer' },
  { value: 'partner', label: 'Partner' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'other', label: 'Other' },
];

const RATING_OPTIONS = [
  { value: '', label: 'Select Rating...' },
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
];

const INDUSTRY_OPTIONS = [
  { value: '', label: 'Select Industry...' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Education', label: 'Education' },
  { value: 'Government', label: 'Government' },
  { value: 'Non-Profit', label: 'Non-Profit' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Media', label: 'Media' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Energy', label: 'Energy' },
  { value: 'Agriculture', label: 'Agriculture' },
  { value: 'Construction', label: 'Construction' },
  { value: 'Hospitality', label: 'Hospitality' },
  { value: 'Other', label: 'Other' },
];

const defaultValues: AccountFormValues = {
  name: '',
  industry: '',
  website: '',
  phone: '',
  fax: '',
  account_type: 'prospect',
  rating: '',
  description: '',
  annual_revenue: '',
  employee_count: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  linkedin_url: '',
  twitter_handle: '',
  tags: '',
  owner_id: '',
};

export function AddAccountModal({ open, onClose, onSuccess, account }: AddAccountModalProps) {
  const { activeOrgId } = useOrg();
  const [accountService] = useState(() => createAccountService(supabase));
  const [teamMembers, setTeamMembers] = useState<{ id: string; email: string; full_name: string | null }[]>([]);

  const isEdit = !!account;

  // Load team members for owner selector
  useEffect(() => {
    async function loadTeamMembers() {
      try {
        const { data, error } = await supabase
          .from('org_members')
          .select('user_id, users:auth.users(id, email, raw_user_meta_data)')
          .eq('org_id', activeOrgId);

        if (!error && data) {
          const members = data
            .filter((m: any) => m.users)
            .map((m: any) => ({
              id: m.user_id,
              email: m.users.email,
              full_name: m.users.raw_user_meta_data?.full_name || null,
            }));
          setTeamMembers(members);
        }
      } catch (err) {
        console.error('Failed to load team members:', err);
      }
    }

    if (open && activeOrgId) {
      loadTeamMembers();
    }
  }, [open, activeOrgId]);

  // Get initial values from account for edit mode
  const getInitialValues = (): AccountFormValues => {
    if (!account) return defaultValues;

    return {
      name: account.name || '',
      industry: account.industry || '',
      website: account.website || '',
      phone: account.phone || '',
      fax: account.fax || '',
      account_type: account.account_type || 'prospect',
      rating: account.rating || '',
      description: account.description || '',
      annual_revenue: account.annual_revenue?.toString() || '',
      employee_count: account.employee_count?.toString() || '',
      street: account.address?.street || '',
      city: account.address?.city || '',
      state: account.address?.state || '',
      zip: account.address?.zip || '',
      country: account.address?.country || '',
      linkedin_url: account.linkedin_url || '',
      twitter_handle: account.twitter_handle || '',
      tags: account.tags?.join(', ') || '',
      owner_id: account.owner_id || '',
    };
  };

  const handleSubmit = async (values: AccountFormValues) => {
    // Parse tags
    const tags = values.tags
      ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    // Build address object
    const address: Record<string, string> = {};
    if (values.street) address.street = values.street;
    if (values.city) address.city = values.city;
    if (values.state) address.state = values.state;
    if (values.zip) address.zip = values.zip;
    if (values.country) address.country = values.country;

    const accountData: AccountCreateInput = {
      name: values.name,
      industry: values.industry || undefined,
      website: values.website || undefined,
      phone: values.phone || undefined,
      fax: values.fax || undefined,
      account_type: values.account_type as AccountCreateInput['account_type'],
      rating: values.rating ? (values.rating as AccountCreateInput['rating']) : undefined,
      description: values.description || undefined,
      annual_revenue: values.annual_revenue ? Number(values.annual_revenue) : undefined,
      employee_count: values.employee_count ? Number(values.employee_count) : undefined,
      address: Object.keys(address).length > 0 ? address : undefined,
      linkedin_url: values.linkedin_url || undefined,
      twitter_handle: values.twitter_handle || undefined,
      tags: tags.length > 0 ? tags : undefined,
      owner_id: values.owner_id || undefined,
    };

    if (isEdit && account) {
      // Update existing account
      const result = await accountService.updateAccount(account.id, accountData);
      if (!result.success) {
        toast.error(result.error || 'Failed to update account');
        return;
      }

      toast.success('Account updated');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'account.updated',
        entityType: 'account',
        entityId: account.id,
        before: { name: account.name },
        after: { name: values.name },
      }).catch(console.error);

      onSuccess?.(account.id);
      onClose();
    } else {
      // Create new account
      const result = await accountService.createAccount(accountData);
      if (!result.success) {
        toast.error(result.error || 'Failed to create account');
        return;
      }

      toast.success('Account created');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'account.created',
        entityType: 'account',
        entityId: result.accountId,
        after: { name: values.name },
      }).catch(console.error);

      onSuccess?.(result.accountId!);
      onClose();
    }
  };

  const { values, errors, loading, handleChange, handleSubmit: onFormSubmit, reset } = useForm<AccountFormValues>({
    initialValues: getInitialValues(),
    validate: (vals) => {
      const errs: Partial<Record<keyof AccountFormValues, string>> = {};
      if (!vals.name.trim()) errs.name = 'Account name is required';
      if (vals.website && !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(vals.website)) {
        errs.website = 'Invalid website URL';
      }
      if (vals.annual_revenue && isNaN(Number(vals.annual_revenue))) {
        errs.annual_revenue = 'Must be a number';
      }
      if (vals.employee_count && isNaN(Number(vals.employee_count))) {
        errs.employee_count = 'Must be a number';
      }
      return errs;
    },
    onSubmit: handleSubmit,
  });

  // Reset form when modal opens/closes or account changes
  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, account]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Account' : 'New Account'}
      description={isEdit ? 'Update account details' : 'Enter account details'}
      variant="slideOver"
      size="lg"
    >
      <form onSubmit={onFormSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wider">
            Basic Information
          </h3>
          <InputField
            label="Account Name"
            name="name"
            value={values.name}
            onChange={handleChange}
            error={errors.name}
            required
            placeholder="Acme Corporation"
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Account Type"
              name="account_type"
              value={values.account_type}
              onChange={handleChange}
              options={ACCOUNT_TYPE_OPTIONS}
              required
            />
            <SelectField
              label="Rating"
              name="rating"
              value={values.rating}
              onChange={handleChange}
              options={RATING_OPTIONS}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Industry"
              name="industry"
              value={values.industry}
              onChange={handleChange}
              options={INDUSTRY_OPTIONS}
            />
            <SelectField
              label="Owner"
              name="owner_id"
              value={values.owner_id}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select Owner...' },
                ...teamMembers.map((m) => ({
                  value: m.id,
                  label: m.full_name || m.email,
                })),
              ]}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wider">
            Contact Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Phone"
              name="phone"
              type="tel"
              value={values.phone}
              onChange={handleChange}
              placeholder="(555) 123-4567"
            />
            <InputField
              label="Fax"
              name="fax"
              type="tel"
              value={values.fax}
              onChange={handleChange}
              placeholder="(555) 123-4568"
            />
          </div>
          <InputField
            label="Website"
            name="website"
            value={values.website}
            onChange={handleChange}
            error={errors.website}
            placeholder="https://www.example.com"
          />
        </div>

        {/* Address */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wider">
            Address
          </h3>
          <InputField
            label="Street"
            name="street"
            value={values.street}
            onChange={handleChange}
            placeholder="123 Main Street"
          />
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="City"
              name="city"
              value={values.city}
              onChange={handleChange}
              placeholder="New York"
            />
            <InputField
              label="State/Province"
              name="state"
              value={values.state}
              onChange={handleChange}
              placeholder="NY"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="ZIP/Postal Code"
              name="zip"
              value={values.zip}
              onChange={handleChange}
              placeholder="10001"
            />
            <InputField
              label="Country"
              name="country"
              value={values.country}
              onChange={handleChange}
              placeholder="USA"
            />
          </div>
        </div>

        {/* Company Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wider">
            Company Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Annual Revenue"
              name="annual_revenue"
              type="number"
              value={values.annual_revenue}
              onChange={handleChange}
              error={errors.annual_revenue}
              placeholder="1000000"
            />
            <InputField
              label="Number of Employees"
              name="employee_count"
              type="number"
              value={values.employee_count}
              onChange={handleChange}
              error={errors.employee_count}
              placeholder="50"
            />
          </div>
          <TextareaField
            label="Description"
            name="description"
            value={values.description}
            onChange={handleChange}
            rows={3}
            placeholder="Enter a description of this account..."
          />
        </div>

        {/* Social & Tags */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-th-text-primary uppercase tracking-wider">
            Social & Tags
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="LinkedIn URL"
              name="linkedin_url"
              value={values.linkedin_url}
              onChange={handleChange}
              placeholder="https://linkedin.com/company/..."
            />
            <InputField
              label="Twitter Handle"
              name="twitter_handle"
              value={values.twitter_handle}
              onChange={handleChange}
              placeholder="@company"
            />
          </div>
          <InputField
            label="Tags"
            name="tags"
            value={values.tags}
            onChange={handleChange}
            placeholder="Comma-separated tags, e.g. enterprise, healthcare"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-th-border">
          <SubmitButton
            loading={loading}
            label={isEdit ? 'Update Account' : 'Create Account'}
            loadingLabel={isEdit ? 'Updating...' : 'Creating...'}
          />
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
