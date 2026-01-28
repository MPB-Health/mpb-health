import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { useOrg } from '../contexts/OrgContext';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import { supabase } from '../lib/supabase';
import { UserPlus, Building2, Mail, Phone, User } from 'lucide-react';
import {
  createContactService,
  createAccountService,
  type AccountWithRelations,
  type Lead,
} from '@mpbhealth/crm-core';

const contactService = createContactService(supabase);
const accountService = createAccountService(supabase);

interface ConvertLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (contactId: string, accountId?: string) => void;
  lead: Lead | null;
}

export function ConvertLeadModal({ open, onClose, onSuccess, lead }: ConvertLeadModalProps) {
  const { activeOrgId } = useOrg();

  const [accounts, setAccounts] = useState<AccountWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Form state
  const [accountMode, setAccountMode] = useState<'new' | 'existing'>('new');
  const [newAccountName, setNewAccountName] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
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
      // Pre-fill account name with lead name if creating new
      if (lead) {
        setNewAccountName(`${lead.first_name} ${lead.last_name}`);
      }
    }
  }, [open, loadAccounts, lead]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setAccountMode('new');
      setSelectedAccountId('');
      setErrors({});
      if (lead) {
        setNewAccountName(`${lead.first_name} ${lead.last_name}`);
      }
    }
  }, [open, lead]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (accountMode === 'new' && !newAccountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }

    if (accountMode === 'existing' && !selectedAccountId) {
      newErrors.accountId = 'Please select an account';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConvert = async () => {
    if (!lead) return;

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const result = await contactService.convertLeadToContact({
        leadId: lead.id,
        accountId: accountMode === 'existing' ? selectedAccountId : undefined,
        createAccount: accountMode === 'new',
        accountName: accountMode === 'new' ? newAccountName.trim() : undefined,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to convert lead');
        setLoading(false);
        return;
      }

      toast.success('Lead converted to contact successfully');

      // Log audit events
      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.LEAD_CONVERTED || 'lead.converted',
        entityType: 'lead',
        entityId: lead.id,
        after: {
          contactId: result.contactId,
          accountId: result.accountId,
        },
      }).catch(console.error);

      if (result.accountId && accountMode === 'new') {
        logAuditEvent({
          orgId: activeOrgId || '',
          action: AUDIT_ACTIONS.ACCOUNT_CREATED || 'account.created',
          entityType: 'account',
          entityId: result.accountId,
          after: { name: newAccountName },
        }).catch(console.error);
      }

      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.CONTACT_CREATED || 'contact.created',
        entityType: 'contact',
        entityId: result.contactId,
        after: {
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          converted_from_lead_id: lead.id,
        },
      }).catch(console.error);

      onSuccess?.(result.contactId!, result.accountId);
      onClose();
    } catch (error) {
      console.error('Convert lead error:', error);
      toast.error('An error occurred during conversion');
    } finally {
      setLoading(false);
    }
  };

  if (!lead) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Convert Lead to Contact"
      description="Convert this lead into a contact and optionally create an account"
      variant="modal"
      size="lg"
    >
      <div className="space-y-6">
        {/* Lead Info Summary */}
        <div className="bg-surface-secondary rounded-lg p-4">
          <h3 className="text-sm font-semibold text-th-text-tertiary uppercase tracking-wider mb-3">
            Lead Information
          </h3>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-th-accent-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-th-accent-700" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-medium text-th-text-primary">
                {lead.first_name} {lead.last_name}
              </p>
              <div className="flex items-center space-x-4 text-sm text-th-text-secondary mt-1">
                {lead.email && (
                  <span className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {lead.email}
                  </span>
                )}
                {lead.phone && (
                  <span className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {lead.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Options */}
        <div>
          <h3 className="text-sm font-semibold text-th-text-tertiary uppercase tracking-wider mb-3">
            Account Association
          </h3>

          {/* Toggle between new and existing */}
          <div className="flex items-center space-x-4 mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="accountMode"
                value="new"
                checked={accountMode === 'new'}
                onChange={() => setAccountMode('new')}
                className="w-4 h-4 text-th-accent-600 focus:ring-th-accent-500"
              />
              <span className="text-sm text-th-text-secondary">Create New Account</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="accountMode"
                value="existing"
                checked={accountMode === 'existing'}
                onChange={() => setAccountMode('existing')}
                className="w-4 h-4 text-th-accent-600 focus:ring-th-accent-500"
              />
              <span className="text-sm text-th-text-secondary">Use Existing Account</span>
            </label>
          </div>

          {/* New Account Name Input */}
          {accountMode === 'new' && (
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Account Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => {
                    setNewAccountName(e.target.value);
                    if (errors.accountName) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.accountName;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Enter account name"
                  className={`w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 ${
                    errors.accountName ? 'border-red-500' : 'border-th-border'
                  }`}
                />
              </div>
              {errors.accountName && (
                <p className="text-xs text-red-500 mt-1">{errors.accountName}</p>
              )}
              <p className="text-xs text-th-text-tertiary mt-1">
                A new account will be created with this name
              </p>
            </div>
          )}

          {/* Existing Account Selector */}
          {accountMode === 'existing' && (
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Select Account <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => {
                  setSelectedAccountId(e.target.value);
                  if (errors.accountId) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.accountId;
                      return newErrors;
                    });
                  }
                }}
                disabled={loadingAccounts}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 disabled:opacity-50 ${
                  errors.accountId ? 'border-red-500' : 'border-th-border'
                }`}
              >
                <option value="">Select an account...</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              {errors.accountId && (
                <p className="text-xs text-red-500 mt-1">{errors.accountId}</p>
              )}
              {loadingAccounts && (
                <p className="text-xs text-th-text-tertiary mt-1">Loading accounts...</p>
              )}
            </div>
          )}
        </div>

        {/* Conversion Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">What will happen:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>- A new contact will be created with the lead's information</li>
            {accountMode === 'new' ? (
              <li>- A new account "{newAccountName || '...'}" will be created</li>
            ) : (
              <li>
                - The contact will be linked to{' '}
                {selectedAccountId
                  ? accounts.find((a) => a.id === selectedAccountId)?.name || 'the selected account'
                  : 'the selected account'}
              </li>
            )}
            <li>- The lead will be marked as converted</li>
          </ul>
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
            onClick={handleConvert}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white text-sm font-medium rounded-lg hover:bg-th-accent-700 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Converting...' : 'Convert Lead'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
