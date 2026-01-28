import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import type {
  DealWithRelations,
  DealCreateInput,
  AccountWithRelations,
  ContactWithRelations,
} from '@mpbhealth/crm-core';

interface AddDealModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (dealId: string) => void;
  deal?: DealWithRelations | null;
  defaultStageId?: string;
  defaultAccountId?: string;
}

export function AddDealModal({
  open,
  onClose,
  onSuccess,
  deal,
  defaultStageId,
  defaultAccountId,
}: AddDealModalProps) {
  const { dealService, accountService, contactService, dealStages, refreshDashboard } = useCRM();
  const { activeOrgId } = useOrg();

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AccountWithRelations[]>([]);
  const [contacts, setContacts] = useState<ContactWithRelations[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [stageId, setStageId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [contactId, setContactId] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [dealType, setDealType] = useState<'new_business' | 'existing_business' | 'renewal'>('new_business');
  const [leadSource, setLeadSource] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');

  // Load accounts
  useEffect(() => {
    if (!open) return;

    const loadAccounts = async () => {
      setLoadingAccounts(true);
      const { accounts } = await accountService.getAccounts({}, 100, 0);
      setAccounts(accounts);
      setLoadingAccounts(false);
    };

    loadAccounts();
  }, [open, accountService]);

  // Load contacts when account changes
  useEffect(() => {
    if (!accountId) {
      setContacts([]);
      return;
    }

    const loadContacts = async () => {
      setLoadingContacts(true);
      const { contacts } = await contactService.getContacts({ account_id: accountId }, 100, 0);
      setContacts(contacts);
      setLoadingContacts(false);
    };

    loadContacts();
  }, [accountId, contactService]);

  // Initialize form when deal prop changes or modal opens
  useEffect(() => {
    if (open) {
      if (deal) {
        setName(deal.name);
        setAmount(deal.amount?.toString() || '');
        setStageId(deal.stage_id);
        setAccountId(deal.account_id || '');
        setContactId(deal.contact_id || '');
        setExpectedCloseDate(deal.expected_close_date?.split('T')[0] || '');
        setDealType(deal.deal_type || 'new_business');
        setLeadSource(deal.lead_source || '');
        setNextStep(deal.next_step || '');
        setTags(deal.tags?.join(', ') || '');
        setDescription(deal.description || '');
      } else {
        // Reset form for new deal
        setName('');
        setAmount('');
        setStageId(defaultStageId || (dealStages[0]?.id || ''));
        setAccountId(defaultAccountId || '');
        setContactId('');
        setExpectedCloseDate('');
        setDealType('new_business');
        setLeadSource('');
        setNextStep('');
        setTags('');
        setDescription('');
      }
    }
  }, [open, deal, defaultStageId, defaultAccountId, dealStages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Deal name is required');
      return;
    }
    if (!stageId) {
      toast.error('Please select a stage');
      return;
    }

    setLoading(true);

    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const input: DealCreateInput = {
      name: name.trim(),
      amount: amount ? parseFloat(amount) : undefined,
      stage_id: stageId,
      account_id: accountId || undefined,
      contact_id: contactId || undefined,
      expected_close_date: expectedCloseDate || undefined,
      deal_type: dealType,
      lead_source: leadSource || undefined,
      next_step: nextStep || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      description: description || undefined,
    };

    let result;

    if (deal) {
      // Update existing deal
      result = await dealService.updateDeal(deal.id, input);
      if (result.success) {
        toast.success('Deal updated');
        logAuditEvent({
          orgId: activeOrgId || '',
          action: AUDIT_ACTIONS.DEAL_UPDATED || 'deal.updated',
          entityType: 'deal',
          entityId: deal.id,
          before: { name: deal.name, amount: deal.amount },
          after: { name: input.name, amount: input.amount },
        }).catch(console.error);
        refreshDashboard();
        onSuccess?.(deal.id);
        onClose();
      } else {
        toast.error(result.error || 'Failed to update deal');
      }
    } else {
      // Create new deal
      result = await dealService.createDeal(input);
      if (result.success && result.dealId) {
        toast.success('Deal created');
        logAuditEvent({
          orgId: activeOrgId || '',
          action: AUDIT_ACTIONS.DEAL_CREATED || 'deal.created',
          entityType: 'deal',
          entityId: result.dealId,
          after: { name: input.name, amount: input.amount },
        }).catch(console.error);
        refreshDashboard();
        onSuccess?.(result.dealId);
        onClose();
      } else {
        toast.error(result.error || 'Failed to create deal');
      }
    }

    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={deal ? 'Edit Deal' : 'New Deal'}
      description={deal ? 'Update deal details' : 'Create a new deal'}
      variant="slideOver"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deal Name */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Deal Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter deal name"
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-th-text-tertiary">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full border border-th-border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>
        </div>

        {/* Stage */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Stage <span className="text-red-500">*</span>
          </label>
          <select
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            required
          >
            <option value="">Select a stage</option>
            {dealStages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.display_name} ({stage.probability}%)
              </option>
            ))}
          </select>
        </div>

        {/* Account */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Account
          </label>
          <select
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              setContactId(''); // Reset contact when account changes
            }}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            disabled={loadingAccounts}
          >
            <option value="">Select an account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Primary Contact
          </label>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            disabled={!accountId || loadingContacts}
          >
            <option value="">{accountId ? 'Select a contact' : 'Select an account first'}</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.first_name} {contact.last_name}
                {contact.email ? ` (${contact.email})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Expected Close Date */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Expected Close Date
          </label>
          <input
            type="date"
            value={expectedCloseDate}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>

        {/* Deal Type */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Deal Type
          </label>
          <select
            value={dealType}
            onChange={(e) => setDealType(e.target.value as any)}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          >
            <option value="new_business">New Business</option>
            <option value="existing_business">Existing Business</option>
            <option value="renewal">Renewal</option>
          </select>
        </div>

        {/* Lead Source */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Lead Source
          </label>
          <input
            type="text"
            value={leadSource}
            onChange={(e) => setLeadSource(e.target.value)}
            placeholder="e.g., Website, Referral, Cold Call"
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>

        {/* Next Step */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Next Step
          </label>
          <input
            type="text"
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            placeholder="Describe the next action"
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Comma-separated tags"
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
          <p className="mt-1 text-xs text-th-text-tertiary">Separate tags with commas</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any additional details..."
            rows={3}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-th-border">
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
            className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 hover:bg-th-accent-700 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Saving...' : deal ? 'Update Deal' : 'Create Deal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
