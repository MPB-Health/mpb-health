import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  Mail,
  Phone,
  Users,
  Building2,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PermissionGate } from '../components/PermissionGate';
import { AddContactModal } from '../components/AddContactModal';
import { ImportModal } from '../components/ImportModal';
import { supabase } from '../lib/supabase';
import {
  createContactService,
  createAccountService,
  formatTimeAgo,
  type ContactWithRelations,
  type ContactFilters,
  type AccountWithRelations,
} from '@mpbhealth/crm-core';
import { SkeletonTable } from '@mpbhealth/ui';

const contactService = createContactService(supabase);
const accountService = createAccountService(supabase);

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<ContactWithRelations[]>([]);
  const [accounts, setAccounts] = useState<AccountWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ContactFilters>({});
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const pageSize = 20;

  // Bulk selection state
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  // Lead source options (common sources)
  const leadSources = useMemo(() => [
    'Website',
    'Referral',
    'Cold Call',
    'LinkedIn',
    'Trade Show',
    'Partner',
    'Advertisement',
    'Other',
  ], []);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    const { contacts: data, total: count } = await contactService.getContacts(filters, pageSize, page * pageSize);
    setContacts(data);
    setTotal(count);
    setLoading(false);
  }, [filters, page]);

  const loadAccounts = useCallback(async () => {
    const { accounts: data } = await accountService.getAccounts({}, 200, 0);
    setAccounts(data);
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Clear selection when filters or page change
  useEffect(() => {
    setSelectedContacts(new Set());
  }, [filters, page]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(0);
  };

  const handleAccountFilter = (accountId: string) => {
    setFilters((prev) => ({ ...prev, account_id: accountId || undefined }));
    setPage(0);
  };

  const handleLeadSourceFilter = (leadSource: string) => {
    setFilters((prev) => ({ ...prev, lead_source: leadSource || undefined }));
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const exportContacts = await contactService.getContactsForExport(undefined, filters);
      const csv = generateCSV(exportContacts);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success('Contacts exported successfully');
    } catch (error) {
      toast.error('Failed to export contacts');
    }
  };

  const handleExportSelected = async () => {
    try {
      const ids = Array.from(selectedContacts);
      const exportContacts = await contactService.getContactsForExport(ids);
      const csv = generateCSV(exportContacts);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-selected-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success('Selected contacts exported successfully');
    } catch (error) {
      toast.error('Failed to export contacts');
    }
  };

  const generateCSV = (contactsData: any[]): string => {
    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Mobile',
      'Title',
      'Department',
      'Account',
      'Lead Source',
      'Created At',
    ];
    const rows = contactsData.map((c) => [
      c.first_name,
      c.last_name,
      c.email || '',
      c.phone || '',
      c.mobile || '',
      c.title || '',
      c.department || '',
      c.account?.name || '',
      c.lead_source || '',
      c.created_at,
    ]);
    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  };

  const toggleSelectAll = useCallback(() => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map((c) => c.id)));
    }
  }, [contacts, selectedContacts.size]);

  const toggleSelectContact = useCallback((contactId: string) => {
    setSelectedContacts((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  }, []);

  const handleRowClick = (contactId: string) => {
    navigate(`/contacts/${contactId}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Bulk Actions Toolbar */}
      {selectedContacts.size > 0 && (
        <div className="bg-th-accent-50 border border-th-accent-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-th-accent-700">
            {selectedContacts.size} contact{selectedContacts.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportSelected}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-th-accent-700 hover:bg-th-accent-100 rounded-lg"
            >
              <Download className="w-4 h-4" />
              <span>Export Selected</span>
            </button>
            <button
              onClick={() => setSelectedContacts(new Set())}
              className="px-3 py-1.5 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary flex items-center space-x-2">
            <Users className="w-7 h-7" />
            <span>Contacts</span>
          </h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            {total} total contacts
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <PermissionGate permission="contacts.write">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
          </PermissionGate>
          <PermissionGate permission="contacts.write">
            <button
              onClick={() => setShowAddContact(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" />
              <span>New Contact</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] flex items-center bg-surface-tertiary rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-th-text-tertiary mr-2" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
            />
          </div>

          {/* Account filter */}
          <div className="relative">
            <select
              value={filters.account_id || ''}
              onChange={(e) => handleAccountFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* Lead Source filter */}
          <div className="relative">
            <select
              value={filters.lead_source || ''}
              onChange={(e) => handleLeadSourceFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Sources</option>
              {leadSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* More filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'border-th-accent-500 text-th-accent-700 bg-th-accent-50'
                : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-th-border grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Do Not Call
              </label>
              <select
                value={filters.do_not_call === undefined ? '' : filters.do_not_call ? 'true' : 'false'}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilters((prev) => ({
                    ...prev,
                    do_not_call: val === '' ? undefined : val === 'true',
                  }));
                  setPage(0);
                }}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Do Not Email
              </label>
              <select
                value={filters.do_not_email === undefined ? '' : filters.do_not_email ? 'true' : 'false'}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilters((prev) => ({
                    ...prev,
                    do_not_email: val === '' ? undefined : val === 'true',
                  }));
                  setPage(0);
                }}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Created After
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, dateFrom: e.target.value || undefined }));
                  setPage(0);
                }}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Contacts table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <SkeletonTable rows={8} cols={5} />
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <Users className="w-12 h-12 mb-3" />
            <p>No contacts found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add a new contact</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-th-border">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedContacts.size === contacts.length && contacts.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-th-border"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Account
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Title
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {contacts.map((contact) => {
                  const isSelected = selectedContacts.has(contact.id);

                  return (
                    <tr
                      key={contact.id}
                      className={`hover:bg-surface-secondary cursor-pointer ${isSelected ? 'bg-th-accent-50' : ''}`}
                      onClick={() => handleRowClick(contact.id)}
                    >
                      <td className="w-12 px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectContact(contact.id)}
                          className="w-4 h-4 rounded border-th-border"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-th-accent-100 rounded-full flex items-center justify-center">
                            <span className="text-th-accent-700 font-medium text-sm">
                              {contact.first_name.charAt(0)}
                              {contact.last_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-th-text-primary hover:text-th-accent-600">
                              {contact.salutation ? `${contact.salutation} ` : ''}
                              {contact.first_name} {contact.last_name}
                            </p>
                            {contact.department && (
                              <p className="text-xs text-th-text-tertiary">
                                {contact.department}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center text-sm text-th-text-secondary hover:text-th-accent-600"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            {contact.email}
                          </a>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {contact.phone ? (
                          <a
                            href={`tel:${contact.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center text-sm text-th-text-secondary hover:text-th-accent-600"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            {contact.phone}
                          </a>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {contact.account ? (
                          <Link
                            to={`/accounts/${contact.account.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center text-sm text-th-accent-600 hover:underline"
                          >
                            <Building2 className="w-4 h-4 mr-2" />
                            {contact.account.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-secondary">
                          {contact.title || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-secondary">
                          {contact.owner?.full_name || contact.owner?.email || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-th-text-tertiary">
                        {formatTimeAgo(contact.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-th-border">
                <p className="text-sm text-th-text-tertiary">
                  Showing {page * pageSize + 1} to{' '}
                  {Math.min((page + 1) * pageSize, total)} of {total}
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 text-sm border border-th-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1 text-sm border border-th-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddContactModal
        open={showAddContact}
        onClose={() => setShowAddContact(false)}
        onSuccess={() => loadContacts()}
      />
      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        entityType="contacts"
        onSuccess={() => loadContacts()}
      />
    </div>
  );
}
