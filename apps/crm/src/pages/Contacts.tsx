import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Users,
  Building2,
  Upload,
  X,
  Shield,
  BarChart3,
  Sparkles,
  Tag,
  Star,
  Send,
  BarChart,
  Copy,
  Heart,
  Edit3,
  ArrowDown,
  ShieldCheck,
  FileText,
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
  PLAN_TYPE_LABELS,
  type ContactWithRelations,
  type ContactFilters,
  type AccountWithRelations,
} from '@mpbhealth/crm-core';
import { SkeletonTable, GradientHeader } from '@mpbhealth/ui';
import { useDebounce } from '../hooks/useDebounce';
import { useSavedViews } from '../hooks/useSavedViews';
import { SavedViewsBar } from '../components/SavedViewsBar';
import { HelpTooltip, HelpBanner } from '../components/help';
import {
  ContactAnalyticsModal,
  ContactEnrichmentModal,
  ContactSegmentModal,
  ContactScoreModal,
  BulkEmailModal,
  ContactActivityModal,
  ContactDuplicateModal,
  ContactRelationshipModal,
  BulkContactUpdateModal,
  ContactLifecycleModal,
  ContactComplianceModal,
  ContactExportBuilderModal,
} from '../components/contacts';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

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

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const savedViews = useSavedViews('contacts');

  // Modal state
  const [showContactAnalytics, setShowContactAnalytics] = useState(false);
  const [showEnrichment, setShowEnrichment] = useState(false);
  const [showSegments, setShowSegments] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [showBulkEmail, setShowBulkEmail] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showRelationships, setShowRelationships] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [showLifecycle, setShowLifecycle] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [showExportBuilder, setShowExportBuilder] = useState(false);

  const TOOLBAR_ACTIONS = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-blue-500', action: () => setShowContactAnalytics(true) },
    { id: 'enrich', label: 'Enrich', icon: Sparkles, color: 'text-violet-500', action: () => setShowEnrichment(true) },
    { id: 'segments', label: 'Segments', icon: Tag, color: 'text-cyan-500', action: () => setShowSegments(true) },
    { id: 'scores', label: 'Scores', icon: Star, color: 'text-amber-500', action: () => setShowScores(true) },
    { id: 'bulk-email', label: 'Bulk Email', icon: Send, color: 'text-green-500', action: () => setShowBulkEmail(true) },
    { id: 'activity', label: 'Activity', icon: BarChart, color: 'text-indigo-500', action: () => setShowActivity(true) },
    { id: 'duplicates', label: 'Duplicates', icon: Copy, color: 'text-orange-500', action: () => setShowDuplicates(true) },
    { id: 'relationships', label: 'Network', icon: Heart, color: 'text-pink-500', action: () => setShowRelationships(true) },
    { id: 'bulk-update', label: 'Bulk Update', icon: Edit3, color: 'text-teal-500', action: () => setShowBulkUpdate(true) },
    { id: 'lifecycle', label: 'Lifecycle', icon: ArrowDown, color: 'text-emerald-500', action: () => setShowLifecycle(true) },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck, color: 'text-red-500', action: () => setShowCompliance(true) },
    { id: 'export-builder', label: 'Export+', icon: FileText, color: 'text-rose-500', action: () => setShowExportBuilder(true) },
  ];

  const leadSources = useMemo(() => [
    'Website', 'Referral', 'Cold Call', 'LinkedIn', 'Trade Show', 'Partner', 'Advertisement', 'Other',
  ], []);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch || undefined }));
    setPage(0);
  }, [debouncedSearch]);

  useEffect(() => {
    const source = savedViews.activeView || savedViews.activeSmartView;
    if (source) {
      const viewFilters = source.filters as Record<string, string | boolean | undefined>;
      setFilters({
        search: debouncedSearch || undefined,
        account_id: (viewFilters.account_id as string) || undefined,
        lead_source: (viewFilters.lead_source as string) || undefined,
        do_not_call: viewFilters.do_not_call as boolean | undefined,
        do_not_email: viewFilters.do_not_email as boolean | undefined,
        planType: (viewFilters.planType as 'healthshare' | 'traditional_insurance') || undefined,
      });
      setPage(0);
    }
  }, [savedViews.activeView, savedViews.activeSmartView, debouncedSearch]);

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

  useEffect(() => { loadContacts(); }, [loadContacts]);
  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => { setSelectedContacts(new Set()); }, [filters, page]);

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
      downloadCSV(csv, `contacts-export-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Contacts exported successfully');
    } catch { toast.error('Failed to export contacts'); }
  };

  const handleExportSelected = async () => {
    try {
      const ids = Array.from(selectedContacts);
      const exportContacts = await contactService.getContactsForExport(ids);
      const csv = generateCSV(exportContacts);
      downloadCSV(csv, `contacts-selected-export-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Selected contacts exported successfully');
    } catch { toast.error('Failed to export contacts'); }
  };

  const generateCSV = (contactsData: ContactWithRelations[]): string => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Mobile', 'Title', 'Department', 'Account', 'Lead Source', 'Plan Type', 'Created At'];
    const rows = contactsData.map((c) => [
      c.first_name, c.last_name, c.email || '', c.phone || '', c.mobile || '',
      c.title || '', c.department || '', c.account?.name || '', c.lead_source || '',
      (c as unknown as Record<string, unknown>).plan_type ? String(PLAN_TYPE_LABELS[(c as unknown as Record<string, unknown>).plan_type as keyof typeof PLAN_TYPE_LABELS] || '') : '',
      c.created_at,
    ]);
    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
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
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });
  }, []);

  const handleRowClick = (contactId: string) => navigate(`/members/${contactId}`);

  const totalPages = Math.ceil(total / pageSize);

  const activeFilterCount = [
    filters.account_id,
    filters.lead_source,
    filters.do_not_call !== undefined ? 'dnc' : undefined,
    filters.do_not_email !== undefined ? 'dne' : undefined,
    filters.dateFrom,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Bulk Actions */}
      {selectedContacts.size > 0 && (
        <div className="bg-th-accent-50 border border-th-accent-200 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-th-accent-700">
            {selectedContacts.size} contact{selectedContacts.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportSelected}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-th-accent-700 hover:bg-th-accent-100 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Selected</span>
            </button>
            <button
              onClick={() => setSelectedContacts(new Set())}
              className="px-3 py-1.5 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <GradientHeader
        title="Members"
        subtitle={`${total.toLocaleString()} total members`}
        icon={<Users className="w-5 h-5" />}
        size="sm"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-surface-primary border border-th-border rounded-xl text-sm font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <PermissionGate permission="contacts.write">
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-4 py-2 bg-surface-primary border border-th-border rounded-xl text-sm font-medium text-th-text-secondary hover:bg-surface-secondary transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
            </PermissionGate>
            <PermissionGate permission="contacts.write">
              <button
                onClick={() => setShowAddContact(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-th-accent-600 rounded-xl text-sm font-semibold text-white hover:bg-th-accent-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Member</span>
              </button>
            </PermissionGate>
          </div>
        }
      />

      <HelpBanner
        pageKey="contacts"
        title="Welcome to Contacts"
        tip="Manage all your individual contacts here. Link contacts to accounts, track communication history, and use bulk actions to manage contacts efficiently."
      />

      {/* Power Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-th-border bg-surface-primary p-2">
        {TOOLBAR_ACTIONS.map((a) => (
          <button key={a.id} onClick={a.action} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-th-text-secondary hover:text-th-text-primary hover:bg-surface-tertiary/80 transition-colors">
            <a.icon className={cn('w-3.5 h-3.5', a.color)} />
            <span className="hidden sm:inline">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Saved Views */}
      <div className="bg-surface-primary rounded-2xl border border-th-border">
        <SavedViewsBar
          views={savedViews.views}
          smartViews={savedViews.smartViews}
          activeViewId={savedViews.activeViewId}
          loading={savedViews.loading}
          onApplyView={savedViews.applyView}
          onSaveView={async (name, isShared) => {
            await savedViews.saveView(name, isShared, filters as unknown as Record<string, unknown>);
          }}
          onDeleteView={savedViews.deleteView}
          onSetDefault={savedViews.setDefault}
          onClearView={() => {
            savedViews.clearView();
            setFilters({ search: debouncedSearch || undefined });
            setPage(0);
          }}
        />
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-surface-primary rounded-2xl border border-th-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[240px] relative">
            <div className="flex items-center bg-surface-tertiary rounded-xl px-3.5 py-2.5">
              <Search className="w-4 h-4 text-th-text-tertiary mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search by name, email, phone, or family member..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-th-text-primary placeholder-th-text-tertiary"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  aria-label="Clear search"
                  className="p-0.5 rounded text-th-text-tertiary hover:text-th-text-secondary transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Account filter */}
          <div className="relative">
            <select
              value={filters.account_id || ''}
              onChange={(e) => handleAccountFilter(e.target.value)}
              aria-label="Filter by account"
              className="appearance-none bg-surface-primary border border-th-border rounded-xl px-4 py-2.5 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* Lead Source filter */}
          <div className="relative">
            <select
              value={filters.lead_source || ''}
              onChange={(e) => handleLeadSourceFilter(e.target.value)}
              aria-label="Filter by lead source"
              className="appearance-none bg-surface-primary border border-th-border rounded-xl px-4 py-2.5 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Sources</option>
              {leadSources.map((source) => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
              showFilters
                ? 'border-th-accent-500 text-th-accent-700 bg-th-accent-50'
                : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-th-accent-500 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-th-border grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="filter-dnc" className="block text-xs font-medium text-th-text-secondary mb-1.5">Do Not Call</label>
              <select
                id="filter-dnc"
                value={filters.do_not_call === undefined ? '' : filters.do_not_call ? 'true' : 'false'}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilters((prev) => ({ ...prev, do_not_call: val === '' ? undefined : val === 'true' }));
                  setPage(0);
                }}
                className="w-full border border-th-border rounded-xl px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-dne" className="block text-xs font-medium text-th-text-secondary mb-1.5">Do Not Email</label>
              <select
                id="filter-dne"
                value={filters.do_not_email === undefined ? '' : filters.do_not_email ? 'true' : 'false'}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilters((prev) => ({ ...prev, do_not_email: val === '' ? undefined : val === 'true' }));
                  setPage(0);
                }}
                className="w-full border border-th-border rounded-xl px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-date-from" className="block text-xs font-medium text-th-text-secondary mb-1.5">Created After</label>
              <input
                id="filter-date-from"
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, dateFrom: e.target.value || undefined }));
                  setPage(0);
                }}
                className="w-full border border-th-border rounded-xl px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
              />
            </div>
            <div>
              <label htmlFor="filter-date-to" className="block text-xs font-medium text-th-text-secondary mb-1.5">Created Before</label>
              <input
                id="filter-date-to"
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, dateTo: e.target.value || undefined }));
                  setPage(0);
                }}
                className="w-full border border-th-border rounded-xl px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* Contacts Table */}
      <div className="bg-surface-primary rounded-2xl border border-th-border overflow-hidden">
        {loading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-th-text-tertiary">
            <Users className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm font-medium text-th-text-secondary">No contacts found</p>
            <p className="text-xs mt-1">Try adjusting your filters or add a new contact</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-secondary/50 border-b border-th-border">
                    <th className="w-12 px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedContacts.size === contacts.length && contacts.length > 0}
                        onChange={toggleSelectAll}
                        aria-label="Select all contacts"
                        className="w-4 h-4 rounded border-th-border"
                      />
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider"><span className="inline-flex items-center gap-1">Name <HelpTooltip text="The contact's name and role. Click to view their full profile." /></span></th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider"><span className="inline-flex items-center gap-1">Contact <HelpTooltip text="Contact information on file. Use the icons to reach out directly." /></span></th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider"><span className="inline-flex items-center gap-1">Account <HelpTooltip text="The company or account this contact is associated with." /></span></th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider"><span className="inline-flex items-center gap-1">Plan <HelpTooltip text="The contact type or category (e.g., Primary, Billing, Emergency)." /></span></th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider">Advisor</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-th-text-tertiary uppercase tracking-wider"><span className="inline-flex items-center gap-1">Created <HelpTooltip text="When this contact was added to the CRM." /></span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-th-border">
                  {contacts.map((contact) => {
                    const isSelected = selectedContacts.has(contact.id);
                    const planType = (contact as unknown as Record<string, unknown>).plan_type as string | undefined;
                    const planLabel = planType ? PLAN_TYPE_LABELS[planType as keyof typeof PLAN_TYPE_LABELS] : null;

                    return (
                      <tr
                        key={contact.id}
                        className={`hover:bg-surface-secondary/50 cursor-pointer transition-colors ${isSelected ? 'bg-th-accent-50' : ''}`}
                        onClick={() => handleRowClick(contact.id)}
                      >
                        <td className="w-12 px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectContact(contact.id)}
                            aria-label={`Select ${contact.first_name} ${contact.last_name}`}
                            className="w-4 h-4 rounded border-th-border"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-th-accent-100 rounded-xl flex items-center justify-center shrink-0">
                              <span className="text-th-accent-700 font-semibold text-sm">
                                {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-th-text-primary truncate">
                                {contact.salutation ? `${contact.salutation} ` : ''}
                                {contact.first_name} {contact.last_name}
                              </p>
                              {contact.title && (
                                <p className="text-xs text-th-text-tertiary truncate">{contact.title}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {contact.email && (
                              <a
                                href={`mailto:${contact.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center text-xs text-th-text-secondary hover:text-th-accent-600 truncate max-w-[200px]"
                              >
                                <Mail className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                                {contact.email}
                              </a>
                            )}
                            {contact.phone && (
                              <a
                                href={`tel:${contact.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center text-xs text-th-text-secondary hover:text-th-accent-600"
                              >
                                <Phone className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                                {contact.phone}
                              </a>
                            )}
                            {!contact.email && !contact.phone && (
                              <span className="text-xs text-th-text-tertiary">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {contact.account ? (
                            <Link
                              to={`/accounts/${contact.account.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center text-sm text-th-accent-600 hover:underline truncate max-w-[150px]"
                            >
                              <Building2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                              {contact.account.name}
                            </Link>
                          ) : (
                            <span className="text-sm text-th-text-tertiary">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {planLabel ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                              <Shield className="w-3 h-3" />
                              {String(planLabel)}
                            </span>
                          ) : (
                            <span className="text-xs text-th-text-tertiary">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-th-text-secondary truncate max-w-[120px] block">
                            {contact.owner?.full_name || contact.owner?.email || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-th-text-tertiary whitespace-nowrap">
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
              <div className="flex items-center justify-between px-5 py-4 border-t border-th-border bg-surface-secondary/30">
                <p className="text-sm text-th-text-tertiary">
                  Showing <span className="font-medium text-th-text-secondary">{page * pageSize + 1}</span> to{' '}
                  <span className="font-medium text-th-text-secondary">{Math.min((page + 1) * pageSize, total)}</span>{' '}
                  of <span className="font-medium text-th-text-secondary">{total.toLocaleString()}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-th-border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-secondary transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>
                  <span className="text-sm text-th-text-secondary font-medium px-2">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-th-border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-secondary transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
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

      {/* ---- Contact Power Modals ---- */}
      <ContactAnalyticsModal open={showContactAnalytics} onClose={() => setShowContactAnalytics(false)} totalContacts={total} />
      <ContactEnrichmentModal open={showEnrichment} onClose={() => setShowEnrichment(false)} totalContacts={total || 1} />
      <ContactSegmentModal open={showSegments} onClose={() => setShowSegments(false)} />
      <ContactScoreModal open={showScores} onClose={() => setShowScores(false)}
        onNavigateToContact={(id) => { setShowScores(false); navigate(`/members/${id}`); }} />
      <BulkEmailModal open={showBulkEmail} onClose={() => setShowBulkEmail(false)} selectedCount={selectedContacts.size || total} />
      <ContactActivityModal open={showActivity} onClose={() => setShowActivity(false)} />
      <ContactDuplicateModal open={showDuplicates} onClose={() => setShowDuplicates(false)} />
      <ContactRelationshipModal open={showRelationships} onClose={() => setShowRelationships(false)}
        onNavigateToContact={(id) => { setShowRelationships(false); navigate(`/members/${id}`); }} />
      <BulkContactUpdateModal open={showBulkUpdate} onClose={() => setShowBulkUpdate(false)} selectedCount={selectedContacts.size || total} />
      <ContactLifecycleModal open={showLifecycle} onClose={() => setShowLifecycle(false)} />
      <ContactComplianceModal open={showCompliance} onClose={() => setShowCompliance(false)} />
      <ContactExportBuilderModal open={showExportBuilder} onClose={() => setShowExportBuilder(false)} totalContacts={total} selectedCount={selectedContacts.size} />
    </div>
  );
}
