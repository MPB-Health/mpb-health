import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Building,
  UserCheck,
  UserX,
  Download,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { AdminBreadcrumb } from '../../../components/admin/AdminBreadcrumb';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import {
  type Advisor,
  type AdminAdvisorFilters,
  type AdvisorStats,
  getAllAdvisors,
  createAdvisor,
  updateAdvisor,
  toggleAdvisorActive,
  deleteAdvisor,
  getAdvisorStats,
  getAllStates,
  getAllAgentTypes,
  getAdvisorDisplayName,
  formatPhoneNumber,
} from '../../../lib/advisorDirectoryService';

// ============================================================================
// Types
// ============================================================================

interface AdvisorFormState {
  agent_id: string;
  agent_label: string;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  email_2: string;
  phone_1: string;
  phone_2: string;
  website_link: string;
  domain_name: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  zipcode: string;
  county: string;
  agent_type: string;
  agent_type_2: string;
  agent_type_3: string;
  status: string;
  license_states: string;
  active_date: string;
  parent_id: string;
  parent_label: string;
  is_active: boolean;
}

const emptyForm: AdvisorFormState = {
  agent_id: '',
  agent_label: '',
  first_name: '',
  last_name: '',
  company: '',
  email: '',
  email_2: '',
  phone_1: '',
  phone_2: '',
  website_link: '',
  domain_name: '',
  address_1: '',
  address_2: '',
  city: '',
  state: '',
  zipcode: '',
  county: '',
  agent_type: '',
  agent_type_2: '',
  agent_type_3: '',
  status: 'Active',
  license_states: '',
  active_date: '',
  parent_id: '',
  parent_label: '',
  is_active: true,
};

// ============================================================================
// Main Component
// ============================================================================

export default function DirectoryManager() {
  const navigate = useNavigate();
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [stats, setStats] = useState<AdvisorStats>({ total: 0, active: 0, inactive: 0, statesCount: 0 });
  const [states, setStates] = useState<string[]>([]);
  const [agentTypes, setAgentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
  const [form, setForm] = useState<AdvisorFormState>(emptyForm);
  const [formSection, setFormSection] = useState<'identity' | 'contact' | 'location' | 'classification'>('identity');

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterAgentType, setFilterAgentType] = useState('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<'last_name' | 'company' | 'state' | 'agent_type' | 'status'>('last_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ============================================================================
  // Data Loading
  // ============================================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [advisorsData, statsData, statesData, typesData] = await Promise.all([
        getAllAdvisors(),
        getAdvisorStats(),
        getAllStates(),
        getAllAgentTypes(),
      ]);
      setAdvisors(advisorsData);
      setStats(statsData);
      setStates(statesData);
      setAgentTypes(typesData);
    } catch (error) {
      console.error('Error loading advisor data:', error);
      toast.error('Failed to load advisor data');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Filtering & Sorting
  // ============================================================================

  const filteredAdvisors = useMemo(() => {
    let result = [...advisors];

    // Active status filter
    if (filterActive === 'active') {
      result = result.filter(a => a.is_active);
    } else if (filterActive === 'inactive') {
      result = result.filter(a => !a.is_active);
    }

    // State filter
    if (filterState !== 'all') {
      result = result.filter(a => a.state === filterState);
    }

    // Agent type filter
    if (filterAgentType !== 'all') {
      result = result.filter(a => a.agent_type === filterAgentType);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        (a.first_name?.toLowerCase().includes(q)) ||
        (a.last_name?.toLowerCase().includes(q)) ||
        (a.company?.toLowerCase().includes(q)) ||
        (a.city?.toLowerCase().includes(q)) ||
        (a.email?.toLowerCase().includes(q)) ||
        (a.agent_id?.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      const aVal = (a[sortField] || '').toLowerCase();
      const bVal = (b[sortField] || '').toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [advisors, filterActive, filterState, filterAgentType, searchQuery, sortField, sortDir]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  // ============================================================================
  // CRUD Handlers
  // ============================================================================

  const openCreateModal = () => {
    setEditingAdvisor(null);
    setForm(emptyForm);
    setFormSection('identity');
    setShowModal(true);
  };

  const openEditModal = (advisor: Advisor) => {
    setEditingAdvisor(advisor);
    setForm({
      agent_id: advisor.agent_id || '',
      agent_label: advisor.agent_label || '',
      first_name: advisor.first_name || '',
      last_name: advisor.last_name || '',
      company: advisor.company || '',
      email: advisor.email || '',
      email_2: advisor.email_2 || '',
      phone_1: advisor.phone_1 || '',
      phone_2: advisor.phone_2 || '',
      website_link: advisor.website_link || '',
      domain_name: advisor.domain_name || '',
      address_1: advisor.address_1 || '',
      address_2: advisor.address_2 || '',
      city: advisor.city || '',
      state: advisor.state || '',
      zipcode: advisor.zipcode || '',
      county: advisor.county || '',
      agent_type: advisor.agent_type || '',
      agent_type_2: advisor.agent_type_2 || '',
      agent_type_3: advisor.agent_type_3 || '',
      status: advisor.status || 'Active',
      license_states: advisor.license_states || '',
      active_date: advisor.active_date || '',
      parent_id: advisor.parent_id || '',
      parent_label: advisor.parent_label || '',
      is_active: advisor.is_active,
    });
    setFormSection('identity');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.agent_id.trim()) {
      toast.error('Agent ID is required');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(form)) {
        payload[key] = value === '' ? null : value;
      }
      // agent_id should never be null
      payload.agent_id = form.agent_id;
      payload.is_active = form.is_active;

      if (editingAdvisor) {
        await updateAdvisor(editingAdvisor.id, payload);
        toast.success('Advisor updated successfully');
      } else {
        await createAdvisor(payload);
        toast.success('Advisor created successfully');
      }

      setShowModal(false);
      setEditingAdvisor(null);
      setForm(emptyForm);
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to save advisor: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (advisor: Advisor) => {
    try {
      await toggleAdvisorActive(advisor.id, !advisor.is_active);
      toast.success(advisor.is_active ? 'Advisor deactivated' : 'Advisor reactivated');
      await loadData();
    } catch {
      toast.error('Failed to update advisor status');
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteAdvisor(id);
      toast.success('Advisor deleted permanently');
      setDeleteConfirm(null);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await loadData();
    } catch {
      toast.error('Failed to delete advisor');
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================================
  // Bulk Actions
  // ============================================================================

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAdvisors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAdvisors.map(a => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => toggleAdvisorActive(id, false))
      );
      toast.success(`${selectedIds.size} advisor(s) deactivated`);
      setSelectedIds(new Set());
      await loadData();
    } catch {
      toast.error('Failed to deactivate some advisors');
    }
  };

  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => toggleAdvisorActive(id, true))
      );
      toast.success(`${selectedIds.size} advisor(s) activated`);
      setSelectedIds(new Set());
      await loadData();
    } catch {
      toast.error('Failed to activate some advisors');
    }
  };

  // ============================================================================
  // CSV Export
  // ============================================================================

  const handleExport = () => {
    const headers = ['Agent ID', 'First Name', 'Last Name', 'Company', 'Email', 'Phone', 'City', 'State', 'Agent Type', 'Status', 'Active'];
    const rows = filteredAdvisors.map(a => [
      a.agent_id, a.first_name || '', a.last_name || '', a.company || '',
      a.email || '', a.phone_1 || '', a.city || '', a.state || '',
      a.agent_type || '', a.status || '', a.is_active ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `advisor-directory-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  // ============================================================================
  // Form Field Helper
  // ============================================================================

  const FormField = ({ label, field, placeholder, required, type = 'text' }: {
    label: string;
    field: keyof AdvisorFormState;
    placeholder?: string;
    required?: boolean;
    type?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Input
        type={type}
        value={String(form[field] ?? '')}
        onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
        placeholder={placeholder}
        className="w-full"
      />
    </div>
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AdminLayout activeView="advisor-portal-cms" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <AdminBreadcrumb currentPage="Advisor Directory" />
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Advisor Directory Manager
            </h1>
            <p className="text-gray-600 mt-1">
              Add, edit, and manage advisors in the public directory
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/advisor-cms')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to CMS
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button size="sm" onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Add Advisor
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Total Advisors</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Active</p>
                  <p className="text-2xl font-bold text-green-900">{stats.active}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Inactive</p>
                  <p className="text-2xl font-bold text-red-900">{stats.inactive}</p>
                </div>
                <UserX className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700">States Covered</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.statesCount}</p>
                </div>
                <MapPin className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, company, city, email, or agent ID..."
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && 'bg-gray-100')}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {(filterState !== 'all' || filterAgentType !== 'all' || filterActive !== 'all') && (
                  <span className="ml-2 w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">
                    {[filterState !== 'all', filterAgentType !== 'all', filterActive !== 'all'].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    id="filter-status"
                    title="Filter by status"
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    id="filter-state"
                    title="Filter by state"
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="all">All States</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-agent-type" className="block text-sm font-medium text-gray-700 mb-1">Agent Type</label>
                  <select
                    id="filter-agent-type"
                    title="Filter by agent type"
                    value={filterAgentType}
                    onChange={(e) => setFilterAgentType(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="all">All Types</option>
                    {agentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.size} advisor(s) selected
            </span>
            <Button size="sm" variant="outline" onClick={handleBulkActivate}>
              <CheckCircle className="w-4 h-4 mr-1" /> Activate
            </Button>
            <Button size="sm" variant="outline" onClick={handleBulkDeactivate}>
              <XCircle className="w-4 h-4 mr-1" /> Deactivate
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
              Clear Selection
            </Button>
          </div>
        )}

        {/* Advisor Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                Advisors ({filteredAdvisors.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : filteredAdvisors.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No advisors found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === filteredAdvisors.length && filteredAdvisors.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300"
                          title="Select all advisors"
                        />
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:text-gray-900"
                        onClick={() => handleSort('last_name')}
                      >
                        <span className="flex items-center gap-1">Name <SortIcon field="last_name" /></span>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:text-gray-900"
                        onClick={() => handleSort('company')}
                      >
                        <span className="flex items-center gap-1">Company <SortIcon field="company" /></span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Contact</th>
                      <th
                        className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:text-gray-900"
                        onClick={() => handleSort('state')}
                      >
                        <span className="flex items-center gap-1">Location <SortIcon field="state" /></span>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:text-gray-900"
                        onClick={() => handleSort('agent_type')}
                      >
                        <span className="flex items-center gap-1">Type <SortIcon field="agent_type" /></span>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:text-gray-900"
                        onClick={() => handleSort('status')}
                      >
                        <span className="flex items-center gap-1">Status <SortIcon field="status" /></span>
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredAdvisors.map((advisor) => (
                      <tr
                        key={advisor.id}
                        className={cn(
                          'hover:bg-gray-50 transition-colors',
                          !advisor.is_active && 'bg-gray-50 opacity-70',
                          selectedIds.has(advisor.id) && 'bg-blue-50'
                        )}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(advisor.id)}
                            onChange={() => toggleSelect(advisor.id)}
                            className="rounded border-gray-300"
                            title={`Select ${getAdvisorDisplayName(advisor)}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {getAdvisorDisplayName(advisor)}
                            </p>
                            <p className="text-xs text-gray-500">{advisor.agent_id}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 truncate max-w-[200px]">{advisor.company || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            {advisor.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700 truncate max-w-[180px]">{advisor.email}</span>
                              </div>
                            )}
                            {advisor.phone_1 && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700">{formatPhoneNumber(advisor.phone_1)}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700">
                              {[advisor.city, advisor.state].filter(Boolean).join(', ') || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {advisor.agent_type ? (
                            <Badge variant="secondary" className="text-xs">
                              {advisor.agent_type}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {advisor.is_active ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 text-xs">Inactive</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(advisor)}
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(advisor)}
                              title={advisor.is_active ? 'Deactivate' : 'Reactivate'}
                            >
                              {advisor.is_active ? (
                                <EyeOff className="w-4 h-4 text-orange-500" />
                              ) : (
                                <Eye className="w-4 h-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(advisor.id)}
                              title="Delete permanently"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Advisor?</h3>
              <p className="text-gray-600 mb-1">
                This will permanently remove this advisor from the database.
              </p>
              <p className="text-sm text-red-600 mb-4">
                Consider deactivating instead if you may need this record later.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete Permanently
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingAdvisor ? 'Edit Advisor' : 'Add New Advisor'}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Section Tabs */}
              <div className="flex border-b px-6">
                {([
                  { key: 'identity', label: 'Identity' },
                  { key: 'contact', label: 'Contact' },
                  { key: 'location', label: 'Location' },
                  { key: 'classification', label: 'Classification' },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFormSection(tab.key)}
                    className={cn(
                      'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                      formSection === tab.key
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {formSection === 'identity' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Agent ID" field="agent_id" placeholder="e.g. AGT-001" required />
                    <FormField label="Agent Label" field="agent_label" placeholder="Display label" />
                    <FormField label="First Name" field="first_name" placeholder="First name" />
                    <FormField label="Last Name" field="last_name" placeholder="Last name" />
                    <div className="md:col-span-2">
                      <FormField label="Company" field="company" placeholder="Company name" />
                    </div>
                    <FormField label="Parent ID" field="parent_id" placeholder="Parent agent ID" />
                    <FormField label="Parent Label" field="parent_label" placeholder="Parent organization" />
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.is_active}
                          onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">Active (visible in public directory)</span>
                      </label>
                    </div>
                  </div>
                )}

                {formSection === 'contact' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Email" field="email" placeholder="primary@email.com" type="email" />
                    <FormField label="Email 2" field="email_2" placeholder="secondary@email.com" type="email" />
                    <FormField label="Phone 1" field="phone_1" placeholder="(555) 123-4567" />
                    <FormField label="Phone 2" field="phone_2" placeholder="(555) 987-6543" />
                    <FormField label="Website" field="website_link" placeholder="https://example.com" />
                    <FormField label="Domain Name" field="domain_name" placeholder="example.com" />
                  </div>
                )}

                {formSection === 'location' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <FormField label="Address Line 1" field="address_1" placeholder="123 Main St" />
                    </div>
                    <div className="md:col-span-2">
                      <FormField label="Address Line 2" field="address_2" placeholder="Suite 100" />
                    </div>
                    <FormField label="City" field="city" placeholder="City" />
                    <FormField label="State" field="state" placeholder="TX" />
                    <FormField label="Zip Code" field="zipcode" placeholder="12345" />
                    <FormField label="County" field="county" placeholder="County" />
                  </div>
                )}

                {formSection === 'classification' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Agent Type" field="agent_type" placeholder="e.g. Independent Agent" />
                    <FormField label="Agent Type 2" field="agent_type_2" placeholder="Secondary type" />
                    <FormField label="Agent Type 3" field="agent_type_3" placeholder="Tertiary type" />
                    <FormField label="Status" field="status" placeholder="Active" />
                    <div className="md:col-span-2">
                      <FormField label="Licensed States" field="license_states" placeholder="TX, OK, LA" />
                    </div>
                    <FormField label="Active Date" field="active_date" type="date" />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingAdvisor ? 'Update Advisor' : 'Create Advisor'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
