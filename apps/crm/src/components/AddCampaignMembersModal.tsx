import { useState, useEffect } from 'react';
import { Search, Users, UserPlus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { useCRM } from '../contexts/CRMContext';
import type { Lead, ContactWithRelations } from '@mpbhealth/crm-core';

interface AddCampaignMembersModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  onSuccess?: () => void;
}

type MemberType = 'leads' | 'contacts';

export function AddCampaignMembersModal({
  open,
  onClose,
  campaignId,
  onSuccess,
}: AddCampaignMembersModalProps) {
  const { campaignService, leadService, contactService } = useCRM();

  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [memberType, setMemberType] = useState<MemberType>('leads');
  const [search, setSearch] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<ContactWithRelations[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Load leads or contacts based on selected type
  useEffect(() => {
    if (!open) return;

    const loadMembers = async () => {
      setLoading(true);
      setSelectedIds(new Set());

      if (memberType === 'leads') {
        const { leads } = await leadService.getLeads(
          { search: search || undefined },
          50,
          0
        );
        setLeads(leads);
      } else {
        const { contacts } = await contactService.getContacts(
          { search: search || undefined },
          50,
          0
        );
        setContacts(contacts);
      }

      setLoading(false);
    };

    loadMembers();
  }, [open, memberType, search, leadService, contactService]);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setSearch('');
      setSelectedIds(new Set());
      setMemberType('leads');
    }
  }, [open]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const items = memberType === 'leads' ? leads : contacts;
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  };

  const handleAddMembers = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one member to add');
      return;
    }

    setAdding(true);

    let result;
    const ids = Array.from(selectedIds);

    if (memberType === 'leads') {
      result = await campaignService.addLeadsToCampaign(campaignId, ids);
    } else {
      result = await campaignService.addContactsToCampaign(campaignId, ids);
    }

    setAdding(false);

    if (result.success) {
      toast.success(`Added ${result.addedCount} member(s) to campaign`);
      onSuccess?.();
      onClose();
    } else {
      toast.error(result.error || 'Failed to add members');
    }
  };

  const items = memberType === 'leads' ? leads : contacts;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Campaign Members"
      description="Select leads or contacts to add to this campaign"
      variant="slideOver"
      size="lg"
    >
      <div className="space-y-4">
        {/* Member Type Toggle */}
        <div className="flex bg-surface-tertiary rounded-lg p-1">
          <button
            onClick={() => setMemberType('leads')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              memberType === 'leads'
                ? 'bg-surface-primary text-th-text-primary shadow-sm'
                : 'text-th-text-tertiary hover:text-th-text-secondary'
            }`}
          >
            <Users className="w-4 h-4" />
            Leads
          </button>
          <button
            onClick={() => setMemberType('contacts')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              memberType === 'contacts'
                ? 'bg-surface-primary text-th-text-primary shadow-sm'
                : 'text-th-text-tertiary hover:text-th-text-secondary'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Contacts
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center bg-surface-tertiary rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-th-text-tertiary mr-2" />
          <input
            type="text"
            placeholder={`Search ${memberType}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
          />
        </div>

        {/* Selection header */}
        <div className="flex items-center justify-between px-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={items.length > 0 && selectedIds.size === items.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-th-border"
            />
            <span className="text-sm text-th-text-secondary">Select all</span>
          </label>
          {selectedIds.size > 0 && (
            <span className="text-sm text-th-accent-600">{selectedIds.size} selected</span>
          )}
        </div>

        {/* Members list */}
        <div className="border border-th-border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-th-accent-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-th-text-tertiary">
              <Users className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No {memberType} found</p>
              {search && (
                <p className="text-xs mt-1">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-th-border">
              {memberType === 'leads'
                ? leads.map((lead) => (
                    <MemberRow
                      key={lead.id}
                      id={lead.id}
                      name={`${lead.first_name} ${lead.last_name}`}
                      email={lead.email}
                      subtitle={lead.company || undefined}
                      selected={selectedIds.has(lead.id)}
                      onToggle={() => toggleSelection(lead.id)}
                    />
                  ))
                : contacts.map((contact) => (
                    <MemberRow
                      key={contact.id}
                      id={contact.id}
                      name={`${contact.first_name} ${contact.last_name}`}
                      email={contact.email || undefined}
                      subtitle={contact.account?.name}
                      selected={selectedIds.has(contact.id)}
                      onToggle={() => toggleSelection(contact.id)}
                    />
                  ))}
            </div>
          )}
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
            onClick={handleAddMembers}
            disabled={adding || selectedIds.size === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 hover:bg-th-accent-700 rounded-lg disabled:opacity-50"
          >
            {adding ? 'Adding...' : `Add ${selectedIds.size} Member${selectedIds.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Helper component for member rows
function MemberRow({
  id,
  name,
  email,
  subtitle,
  selected,
  onToggle,
}: {
  id: string;
  name: string;
  email?: string;
  subtitle?: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
        selected ? 'bg-th-accent-50' : 'hover:bg-surface-secondary'
      }`}
    >
      <div
        className={`w-5 h-5 rounded border flex items-center justify-center ${
          selected
            ? 'bg-th-accent-600 border-th-accent-600'
            : 'border-th-border bg-surface-primary'
        }`}
      >
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>
      <div className="w-8 h-8 bg-th-accent-100 rounded-full flex items-center justify-center">
        <span className="text-th-accent-700 font-medium text-sm">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-th-text-primary truncate">{name}</p>
        {email && (
          <p className="text-xs text-th-text-tertiary truncate">{email}</p>
        )}
      </div>
      {subtitle && (
        <span className="text-xs text-th-text-tertiary bg-surface-tertiary px-2 py-0.5 rounded">
          {subtitle}
        </span>
      )}
    </div>
  );
}
