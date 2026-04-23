import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { isTimeoutError, withTimeout } from '@mpbhealth/utils';
import { Modal } from './Modal';
import { useCRM } from '../contexts/CRMContext';
import { useCRMService } from '../contexts/CRMServiceContext';
import { useOrg } from '../contexts/OrgContext';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import type {
  DealWithRelations,
  DealCreateInput,
  AccountWithRelations,
  ContactWithRelations,
} from '@mpbhealth/crm-core';

const LOAD_ACCOUNTS_MS = 25_000;
const LOAD_CONTACTS_MS = 25_000;

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
  const { supabase } = useCRMService();
  const { activeOrgId } = useOrg();

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AccountWithRelations[]>([]);
  const [contacts, setContacts] = useState<ContactWithRelations[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [accountsLoadError, setAccountsLoadError] = useState<string | null>(null);
  const [accountsRetryToken, setAccountsRetryToken] = useState(0);
  const [contactsLoadError, setContactsLoadError] = useState<string | null>(null);
  const [contactsRetryToken, setContactsRetryToken] = useState(0);

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
  // Sales Plan 2026: every closed deal needs a product line so Revenue +
  // Leads Split can split Health Insurance vs Medical Cost Sharing.
  const [productLine, setProductLine] = useState('');
  const [productLines, setProductLines] = useState<{ slug: string; label: string }[]>([]);

  // Load product lines once per open — the row count is tiny (seeded + any
  // per-org overrides) so we don't need caching. Silent failure leaves the
  // picker empty rather than blocking deal creation.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('crm_product_lines')
        .select('slug, label, org_id, is_active, sort_order')
        .eq('is_active', true)
        .or(`org_id.is.null,org_id.eq.${activeOrgId ?? ''}`)
        .order('sort_order');
      if (cancelled) return;
      if (error) {
        setProductLines([]);
        return;
      }
      // Dedupe: org override wins over system seed when slug collides.
      const seen = new Map<string, { slug: string; label: string; hasOrg: boolean }>();
      for (const row of (data ?? []) as { slug: string; label: string; org_id: string | null }[]) {
        const existing = seen.get(row.slug);
        if (!existing || (!existing.hasOrg && row.org_id)) {
          seen.set(row.slug, { slug: row.slug, label: row.label, hasOrg: !!row.org_id });
        }
      }
      setProductLines(Array.from(seen.values()).map((r) => ({ slug: r.slug, label: r.label })));
    })();
    return () => {
      cancelled = true;
    };
  }, [open, supabase, activeOrgId]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    (async () => {
      setLoadingAccounts(true);
      setAccountsLoadError(null);
      try {
        const { accounts: list } = await withTimeout(
          accountService.getAccounts({}, 100, 0),
          LOAD_ACCOUNTS_MS,
          'add_deal_modal_accounts'
        );
        if (!cancelled) setAccounts(list);
      } catch (e) {
        if (cancelled) return;
        if (isTimeoutError(e)) {
          setAccountsLoadError('Loading accounts timed out.');
        } else {
          setAccountsLoadError('Could not load accounts.');
        }
        console.error(e);
      } finally {
        if (!cancelled) setLoadingAccounts(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, accountService, accountsRetryToken]);

  useEffect(() => {
    if (!accountId) {
      setContacts([]);
      setContactsLoadError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingContacts(true);
      setContactsLoadError(null);
      try {
        const { contacts: list } = await withTimeout(
          contactService.getContacts({ account_id: accountId }, 100, 0),
          LOAD_CONTACTS_MS,
          'add_deal_modal_contacts'
        );
        if (!cancelled) setContacts(list);
      } catch (e) {
        if (cancelled) return;
        if (isTimeoutError(e)) {
          setContactsLoadError('Loading contacts timed out.');
        } else {
          setContactsLoadError('Could not load contacts.');
        }
        console.error(e);
      } finally {
        if (!cancelled) setLoadingContacts(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accountId, contactService, contactsRetryToken]);

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
        setProductLine((deal as unknown as { product_line?: string }).product_line ?? '');
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
        setProductLine('');
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
      product_line: productLine || undefined,
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
          {loadingAccounts && (
            <p className="text-xs text-th-text-tertiary mt-1">Loading accounts…</p>
          )}
          {accountsLoadError && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <p>{accountsLoadError}</p>
              <button
                type="button"
                onClick={() => setAccountsRetryToken((t) => t + 1)}
                className="mt-1 font-medium text-th-accent-700 underline"
              >
                Retry
              </button>
            </div>
          )}
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
          {loadingContacts && accountId && (
            <p className="text-xs text-th-text-tertiary mt-1">Loading contacts…</p>
          )}
          {contactsLoadError && accountId && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <p>{contactsLoadError}</p>
              <button
                type="button"
                onClick={() => setContactsRetryToken((t) => t + 1)}
                className="mt-1 font-medium text-th-accent-700 underline"
              >
                Retry
              </button>
            </div>
          )}
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

        {/* Product Line (Sales Plan 2026) */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Product Line
          </label>
          <select
            value={productLine}
            onChange={(e) => setProductLine(e.target.value)}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          >
            <option value="">Select product line…</option>
            {productLines.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-th-text-tertiary">
            Required for closed deals so Revenue + Leads Split reports can split Health Insurance vs Medical Cost Sharing.
          </p>
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
