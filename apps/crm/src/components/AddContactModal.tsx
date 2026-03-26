import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Modal } from './Modal';
import { SaveIndicator } from './SaveIndicator';
import { useOrg } from '../contexts/OrgContext';
import { useDirtyFlag, useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { useSaveStatus } from '../hooks/useSaveStatus';
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
  contact?: ContactWithRelations | null;
}

const SALUTATION_OPTIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
const LEAD_SOURCE_OPTIONS = [
  'Website', 'Referral', 'Cold Call', 'LinkedIn', 'Trade Show', 'Partner', 'Advertisement', 'Other',
];

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="pt-1">
      <h3 className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="h-px flex-1 bg-th-border" />
        <span>{label}</span>
        <span className="h-px flex-1 bg-th-border" />
      </h3>
    </div>
  );
}

export function AddContactModal({ open, onClose, onSuccess, contact }: AddContactModalProps) {
  const { activeOrgId } = useOrg();
  const isEditMode = !!contact;
  const { markDirty, confirmClose, dirtyRef } = useDirtyFlag(open);
  const { status, errorMessage, markSaving, markSaved, markError } = useSaveStatus();

  useUnsavedChanges(dirtyRef.current && open);

  const [accounts, setAccounts] = useState<AccountWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    salutation: '', first_name: '', last_name: '', email: '', phone: '', mobile: '',
    account_id: '', title: '', department: '', lead_source: '',
    mailing_street: '', mailing_city: '', mailing_state: '', mailing_zip: '', mailing_country: '',
    do_not_call: false, do_not_email: false,
    tags: '', description: '', linkedin_url: '', twitter_handle: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    const { accounts: data } = await accountService.getAccounts({}, 200, 0);
    setAccounts(data);
    setLoadingAccounts(false);
  }, []);

  useEffect(() => {
    if (open) loadAccounts();
  }, [open, loadAccounts]);

  useEffect(() => {
    if (contact && open) {
      setFormData({
        salutation: contact.salutation || '', first_name: contact.first_name || '',
        last_name: contact.last_name || '', email: contact.email || '',
        phone: contact.phone || '', mobile: contact.mobile || '',
        account_id: contact.account_id || '', title: contact.title || '',
        department: contact.department || '', lead_source: contact.lead_source || '',
        mailing_street: contact.mailing_address?.street || '',
        mailing_city: contact.mailing_address?.city || '',
        mailing_state: contact.mailing_address?.state || '',
        mailing_zip: contact.mailing_address?.zip || '',
        mailing_country: contact.mailing_address?.country || '',
        do_not_call: contact.do_not_call || false, do_not_email: contact.do_not_email || false,
        tags: contact.tags?.join(', ') || '', description: contact.description || '',
        linkedin_url: contact.linkedin_url || '', twitter_handle: contact.twitter_handle || '',
      });
    } else if (!contact && open) {
      setFormData({
        salutation: '', first_name: '', last_name: '', email: '', phone: '', mobile: '',
        account_id: '', title: '', department: '', lead_source: '',
        mailing_street: '', mailing_city: '', mailing_state: '', mailing_zip: '', mailing_country: '',
        do_not_call: false, do_not_email: false,
        tags: '', description: '', linkedin_url: '', twitter_handle: '',
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [contact, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    markDirty();
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) {
      setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }
    if (submitError) setSubmitError(null);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const executeSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setSubmitError(null);
    markSaving();

    try {
      const tags = formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const contactData: ContactCreateInput = {
        salutation: formData.salutation || undefined,
        first_name: formData.first_name.trim(), last_name: formData.last_name.trim(),
        email: formData.email || undefined, phone: formData.phone || undefined,
        mobile: formData.mobile || undefined, account_id: formData.account_id || undefined,
        title: formData.title || undefined, department: formData.department || undefined,
        lead_source: formData.lead_source || undefined,
        mailing_address: {
          street: formData.mailing_street, city: formData.mailing_city,
          state: formData.mailing_state, zip: formData.mailing_zip,
          country: formData.mailing_country,
        },
        do_not_call: formData.do_not_call, do_not_email: formData.do_not_email,
        tags: tags.length > 0 ? tags : undefined,
        description: formData.description || undefined,
        linkedin_url: formData.linkedin_url || undefined,
        twitter_handle: formData.twitter_handle || undefined,
      };

      if (isEditMode && contact) {
        const result = await contactService.updateContact(contact.id, contactData);
        if (!result.success) {
          markError(result.error || 'Failed to update contact');
          setSubmitError(result.error || 'Failed to update contact');
          toast.error(result.error || 'Failed to update contact');
          setLoading(false);
          return;
        }
        markSaved();
        toast.success('Contact updated');
        logAuditEvent({
          orgId: activeOrgId || '',
          action: AUDIT_ACTIONS.CONTACT_UPDATED || 'contact.updated',
          entityType: 'contact', entityId: contact.id,
          after: { first_name: formData.first_name, last_name: formData.last_name },
        }).catch(console.error);
        onSuccess?.(contact.id);
      } else {
        const result = await contactService.createContact(contactData);
        if (!result.success) {
          markError(result.error || 'Failed to create contact');
          setSubmitError(result.error || 'Failed to create contact');
          toast.error(result.error || 'Failed to create contact');
          setLoading(false);
          return;
        }
        markSaved();
        toast.success('Contact created');
        logAuditEvent({
          orgId: activeOrgId || '',
          action: AUDIT_ACTIONS.CONTACT_CREATED || 'contact.created',
          entityType: 'contact', entityId: result.contactId,
          after: { first_name: formData.first_name, last_name: formData.last_name, email: formData.email },
        }).catch(console.error);
        onSuccess?.(result.contactId!);
      }
      onClose();
    } catch (error) {
      console.error('Contact form error:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      markError(message);
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSubmit();
  };

  const handleRetry = () => {
    setSubmitError(null);
    executeSubmit();
  };

  const fieldClass = (field: string) =>
    `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent transition-colors ${
      errors[field] ? 'border-red-300' : 'border-th-border'
    }`;

  return (
    <Modal
      open={open}
      onClose={() => confirmClose(onClose)}
      title={isEditMode ? 'Edit Contact' : 'Add New Contact'}
      description={isEditMode ? 'Update contact details' : 'Enter contact information'}
      variant="slideOver"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ─── Identity ─── */}
        <SectionDivider label="Identity" />
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="salutation" className="block text-sm font-medium text-th-text-secondary mb-1">Salutation</label>
            <select id="salutation" name="salutation" value={formData.salutation} onChange={handleChange} className={fieldClass('salutation')}>
              <option value="">Select...</option>
              {SALUTATION_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-th-text-secondary mb-1">First Name <span className="text-red-500">*</span></label>
            <input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} className={fieldClass('first_name')} />
            {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-th-text-secondary mb-1">Last Name <span className="text-red-500">*</span></label>
            <input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} className={fieldClass('last_name')} />
            {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-th-text-secondary mb-1">Email</label>
            <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} className={fieldClass('email')} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-th-text-secondary mb-1">Phone</label>
            <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} className={fieldClass('phone')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-th-text-secondary mb-1">Mobile</label>
            <input id="mobile" type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className={fieldClass('mobile')} />
          </div>
          <div>
            <label htmlFor="account_id" className="block text-sm font-medium text-th-text-secondary mb-1">Account</label>
            <select id="account_id" name="account_id" value={formData.account_id} onChange={handleChange} disabled={loadingAccounts} className={`${fieldClass('account_id')} disabled:opacity-50`}>
              <option value="">Select an account...</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>

        {/* ─── Work ─── */}
        <SectionDivider label="Work Information" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-th-text-secondary mb-1">Title</label>
            <input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. VP of Sales" className={fieldClass('title')} />
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-th-text-secondary mb-1">Department</label>
            <input id="department" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Sales" className={fieldClass('department')} />
          </div>
        </div>
        <div>
          <label htmlFor="lead_source" className="block text-sm font-medium text-th-text-secondary mb-1">Lead Source</label>
          <select id="lead_source" name="lead_source" value={formData.lead_source} onChange={handleChange} className={fieldClass('lead_source')}>
            <option value="">Select...</option>
            {LEAD_SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* ─── Address ─── */}
        <SectionDivider label="Mailing Address" />
        <div>
          <label htmlFor="mailing_street" className="block text-sm font-medium text-th-text-secondary mb-1">Street</label>
          <input id="mailing_street" name="mailing_street" value={formData.mailing_street} onChange={handleChange} className={fieldClass('mailing_street')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="mailing_city" className="block text-sm font-medium text-th-text-secondary mb-1">City</label>
            <input id="mailing_city" name="mailing_city" value={formData.mailing_city} onChange={handleChange} className={fieldClass('mailing_city')} />
          </div>
          <div>
            <label htmlFor="mailing_state" className="block text-sm font-medium text-th-text-secondary mb-1">State</label>
            <input id="mailing_state" name="mailing_state" value={formData.mailing_state} onChange={handleChange} className={fieldClass('mailing_state')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="mailing_zip" className="block text-sm font-medium text-th-text-secondary mb-1">ZIP Code</label>
            <input id="mailing_zip" name="mailing_zip" value={formData.mailing_zip} onChange={handleChange} className={fieldClass('mailing_zip')} />
          </div>
          <div>
            <label htmlFor="mailing_country" className="block text-sm font-medium text-th-text-secondary mb-1">Country</label>
            <input id="mailing_country" name="mailing_country" value={formData.mailing_country} onChange={handleChange} className={fieldClass('mailing_country')} />
          </div>
        </div>

        {/* ─── Communication ─── */}
        <SectionDivider label="Communication Preferences" />
        <div className="flex items-center gap-6">
          <label htmlFor="do_not_call" className="flex items-center gap-2 cursor-pointer">
            <input id="do_not_call" type="checkbox" name="do_not_call" checked={formData.do_not_call} onChange={handleChange} className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500" />
            <span className="text-sm text-th-text-secondary">Do Not Call</span>
          </label>
          <label htmlFor="do_not_email" className="flex items-center gap-2 cursor-pointer">
            <input id="do_not_email" type="checkbox" name="do_not_email" checked={formData.do_not_email} onChange={handleChange} className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500" />
            <span className="text-sm text-th-text-secondary">Do Not Email</span>
          </label>
        </div>

        {/* ─── Tags ─── */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-th-text-secondary mb-1">Tags</label>
          <input id="tags" name="tags" value={formData.tags} onChange={handleChange} placeholder="Comma-separated tags" className={fieldClass('tags')} />
          <p className="text-xs text-th-text-tertiary mt-1">Separate multiple tags with commas</p>
        </div>

        {/* ─── Social ─── */}
        <SectionDivider label="Social Links" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="linkedin_url" className="block text-sm font-medium text-th-text-secondary mb-1">LinkedIn URL</label>
            <input id="linkedin_url" type="url" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/..." className={fieldClass('linkedin_url')} />
          </div>
          <div>
            <label htmlFor="twitter_handle" className="block text-sm font-medium text-th-text-secondary mb-1">Twitter Handle</label>
            <input id="twitter_handle" name="twitter_handle" value={formData.twitter_handle} onChange={handleChange} placeholder="username (without @)" className={fieldClass('twitter_handle')} />
          </div>
        </div>

        {/* ─── Description ─── */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-th-text-secondary mb-1">Description / Notes</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            placeholder="Additional context, background, or notes about this contact..."
            className={`${fieldClass('description')} resize-y min-h-[120px] leading-relaxed`}
          />
        </div>

        {/* ─── Error Recovery ─── */}
        {submitError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400 flex-1">{submitError}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 dark:hover:bg-red-500/20 rounded transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* ─── Actions (sticky) ─── */}
        <div className="flex items-center gap-3 pt-4 border-t border-th-border sticky bottom-0 bg-surface-primary pb-2 z-10">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-th-accent-600 text-white text-sm font-semibold rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? 'Saving...' : isEditMode ? 'Update Contact' : 'Create Contact'}
          </button>
          <button
            type="button"
            onClick={() => confirmClose(onClose)}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-th-text-secondary bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
          >
            Cancel
          </button>
          <SaveIndicator status={status} errorMessage={errorMessage} />
        </div>
      </form>
    </Modal>
  );
}
