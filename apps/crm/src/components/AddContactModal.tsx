import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { useOrg } from '../contexts/OrgContext';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import { supabase } from '../lib/supabase';
import {
  createContactService,
  createAccountService,
  type ContactWithRelations,
  type ContactCreateInput,
  type AccountWithRelations,
} from '@mpbhealth/crm-core';

const contactService = createContactService(supabase);
const accountService = createAccountService(supabase);

interface AddContactModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (contactId: string) => void;
  contact?: ContactWithRelations | null; // For edit mode
}

const SALUTATION_OPTIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
const LEAD_SOURCE_OPTIONS = [
  'Website',
  'Referral',
  'Cold Call',
  'LinkedIn',
  'Trade Show',
  'Partner',
  'Advertisement',
  'Other',
];

export function AddContactModal({ open, onClose, onSuccess, contact }: AddContactModalProps) {
  const { activeOrgId } = useOrg();
  const isEditMode = !!contact;

  const [accounts, setAccounts] = useState<AccountWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    salutation: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile: '',
    account_id: '',
    title: '',
    department: '',
    lead_source: '',
    // Address fields
    mailing_street: '',
    mailing_city: '',
    mailing_state: '',
    mailing_zip: '',
    mailing_country: '',
    // Communication preferences
    do_not_call: false,
    do_not_email: false,
    // Additional
    tags: '',
    description: '',
    linkedin_url: '',
    twitter_handle: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load accounts for dropdown
  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    const { accounts: data } = await accountService.getAccounts({}, 200, 0);
    setAccounts(data);
    setLoadingAccounts(false);
  }, []);

  useEffect(() => {
    if (open) {
      loadAccounts();
    }
  }, [open, loadAccounts]);

  // Populate form when editing
  useEffect(() => {
    if (contact && open) {
      setFormData({
        salutation: contact.salutation || '',
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        mobile: contact.mobile || '',
        account_id: contact.account_id || '',
        title: contact.title || '',
        department: contact.department || '',
        lead_source: contact.lead_source || '',
        mailing_street: contact.mailing_address?.street || '',
        mailing_city: contact.mailing_address?.city || '',
        mailing_state: contact.mailing_address?.state || '',
        mailing_zip: contact.mailing_address?.zip || '',
        mailing_country: contact.mailing_address?.country || '',
        do_not_call: contact.do_not_call || false,
        do_not_email: contact.do_not_email || false,
        tags: contact.tags?.join(', ') || '',
        description: contact.description || '',
        linkedin_url: contact.linkedin_url || '',
        twitter_handle: contact.twitter_handle || '',
      });
    } else if (!contact && open) {
      // Reset form for new contact
      setFormData({
        salutation: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        mobile: '',
        account_id: '',
        title: '',
        department: '',
        lead_source: '',
        mailing_street: '',
        mailing_city: '',
        mailing_state: '',
        mailing_zip: '',
        mailing_country: '',
        do_not_call: false,
        do_not_email: false,
        tags: '',
        description: '',
        linkedin_url: '',
        twitter_handle: '',
      });
    }
    setErrors({});
  }, [contact, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const tags = formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const contactData: ContactCreateInput = {
        salutation: formData.salutation || undefined,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        mobile: formData.mobile || undefined,
        account_id: formData.account_id || undefined,
        title: formData.title || undefined,
        department: formData.department || undefined,
        lead_source: formData.lead_source || undefined,
        mailing_address: {
          street: formData.mailing_street,
          city: formData.mailing_city,
          state: formData.mailing_state,
          zip: formData.mailing_zip,
          country: formData.mailing_country,
        },
        do_not_call: formData.do_not_call,
        do_not_email: formData.do_not_email,
        tags: tags.length > 0 ? tags : undefined,
        description: formData.description || undefined,
        linkedin_url: formData.linkedin_url || undefined,
        twitter_handle: formData.twitter_handle || undefined,
      };

      if (isEditMode && contact) {
        // Update existing contact
        const result = await contactService.updateContact(contact.id, contactData);

        if (!result.success) {
          toast.error(result.error || 'Failed to update contact');
          setLoading(false);
          return;
        }

        toast.success('Contact updated');
        logAuditEvent({
          orgId: activeOrgId || '',
          action: AUDIT_ACTIONS.CONTACT_UPDATED || 'contact.updated',
          entityType: 'contact',
          entityId: contact.id,
          after: { first_name: formData.first_name, last_name: formData.last_name },
        }).catch(console.error);

        onSuccess?.(contact.id);
      } else {
        // Create new contact
        const result = await contactService.createContact(contactData);

        if (!result.success) {
          toast.error(result.error || 'Failed to create contact');
          setLoading(false);
          return;
        }

        toast.success('Contact created');
        logAuditEvent({
          orgId: activeOrgId || '',
          action: AUDIT_ACTIONS.CONTACT_CREATED || 'contact.created',
          entityType: 'contact',
          entityId: result.contactId,
          after: { first_name: formData.first_name, last_name: formData.last_name, email: formData.email },
        }).catch(console.error);

        onSuccess?.(result.contactId!);
      }

      onClose();
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditMode ? 'Edit Contact' : 'Add New Contact'}
      description={isEditMode ? 'Update contact details' : 'Enter contact information'}
      variant="slideOver"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-semibold text-th-text-secondary uppercase tracking-wider mb-3">
            Basic Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Salutation
              </label>
              <select
                name="salutation"
                value={formData.salutation}
                onChange={handleChange}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              >
                <option value="">Select...</option>
                {SALUTATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1" />
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 ${
                  errors.first_name ? 'border-red-500' : 'border-th-border'
                }`}
              />
              {errors.first_name && (
                <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 ${
                  errors.last_name ? 'border-red-500' : 'border-th-border'
                }`}
              />
              {errors.last_name && (
                <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 ${
                  errors.email ? 'border-red-500' : 'border-th-border'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Mobile
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
          </div>
        </div>

        {/* Account Selection */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Account
          </label>
          <select
            name="account_id"
            value={formData.account_id}
            onChange={handleChange}
            disabled={loadingAccounts}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 disabled:opacity-50"
          >
            <option value="">Select an account...</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Work Info */}
        <div>
          <h3 className="text-sm font-semibold text-th-text-secondary uppercase tracking-wider mb-3">
            Work Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. VP of Sales"
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Sales"
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Lead Source
              </label>
              <select
                name="lead_source"
                value={formData.lead_source}
                onChange={handleChange}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              >
                <option value="">Select...</option>
                {LEAD_SOURCE_OPTIONS.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-sm font-semibold text-th-text-secondary uppercase tracking-wider mb-3">
            Mailing Address
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Street
              </label>
              <input
                type="text"
                name="mailing_street"
                value={formData.mailing_street}
                onChange={handleChange}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                City
              </label>
              <input
                type="text"
                name="mailing_city"
                value={formData.mailing_city}
                onChange={handleChange}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                State
              </label>
              <input
                type="text"
                name="mailing_state"
                value={formData.mailing_state}
                onChange={handleChange}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                name="mailing_zip"
                value={formData.mailing_zip}
                onChange={handleChange}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Country
              </label>
              <input
                type="text"
                name="mailing_country"
                value={formData.mailing_country}
                onChange={handleChange}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
          </div>
        </div>

        {/* Communication Preferences */}
        <div>
          <h3 className="text-sm font-semibold text-th-text-secondary uppercase tracking-wider mb-3">
            Communication Preferences
          </h3>
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="do_not_call"
                checked={formData.do_not_call}
                onChange={handleChange}
                className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
              />
              <span className="text-sm text-th-text-secondary">Do Not Call</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="do_not_email"
                checked={formData.do_not_email}
                onChange={handleChange}
                className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
              />
              <span className="text-sm text-th-text-secondary">Do Not Email</span>
            </label>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Tags
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="Enter tags separated by commas"
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
          <p className="text-xs text-th-text-tertiary mt-1">
            Separate multiple tags with commas
          </p>
        </div>

        {/* Social Links */}
        <div>
          <h3 className="text-sm font-semibold text-th-text-secondary uppercase tracking-wider mb-3">
            Social Links
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/..."
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Twitter Handle
              </label>
              <input
                type="text"
                name="twitter_handle"
                value={formData.twitter_handle}
                onChange={handleChange}
                placeholder="username (without @)"
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-th-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-th-accent-600 text-white text-sm font-medium rounded-lg hover:bg-th-accent-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Contact' : 'Create Contact'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
