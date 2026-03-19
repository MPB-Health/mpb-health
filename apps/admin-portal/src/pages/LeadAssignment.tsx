import { useState, useEffect, useCallback } from 'react';
import { Users, Search, Filter, Loader2, UserPlus, X, Check, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  leadAssignmentService,
  type AssignableLead,
  type AdvisorOption,
  type LeadAssignmentStats,
} from '@mpbhealth/admin-core';

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

export default function LeadAssignment() {
  const [leads, setLeads] = useState<AssignableLead[]>([]);
  const [advisors, setAdvisors] = useState<AdvisorOption[]>([]);
  const [stats, setStats] = useState<LeadAssignmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [search, setSearch] = useState('');
  const [assignedFilter, setAssignedFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);

  // 8s loading timeout
  useEffect(() => {
    if (!loading) { setTimedOut(false); return; }
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [loading]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsData, advisorsData, statsData] = await Promise.all([
        leadAssignmentService.getAll({
          assigned: assignedFilter,
          search: search || undefined,
          priority: priorityFilter || undefined,
        }),
        leadAssignmentService.getAdvisors(),
        leadAssignmentService.getStats(),
      ]);
      setLeads(leadsData);
      setAdvisors(advisorsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load leads:', err);
      toast.error('Failed to load lead assignments');
    } finally {
      setLoading(false);
    }
  }, [search, assignedFilter, priorityFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [leadsData, advisorsData, statsData] = await Promise.all([
          leadAssignmentService.getAll({
            assigned: assignedFilter,
            search: search || undefined,
            priority: priorityFilter || undefined,
          }),
          leadAssignmentService.getAdvisors(),
          leadAssignmentService.getStats(),
        ]);
        if (!cancelled) {
          setLeads(leadsData);
          setAdvisors(advisorsData);
          setStats(statsData);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load leads:', err);
          toast.error('Failed to load lead assignments');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [search, assignedFilter, priorityFilter]);

  async function handleAssign(leadId: string, advisorId: string) {
    setAssigningId(null);
    try {
      await leadAssignmentService.assignLead(leadId, advisorId);
      toast.success('Lead assigned');
      load();
    } catch {
      toast.error('Failed to assign lead');
    }
  }

  async function handleUnassign(leadId: string) {
    try {
      await leadAssignmentService.unassignLead(leadId);
      toast.success('Lead unassigned');
      load();
    } catch {
      toast.error('Failed to unassign lead');
    }
  }

  async function handleBulkAssign(advisorId: string) {
    if (selectedIds.size === 0) return;
    setBulkAssigning(true);
    setShowBulkDropdown(false);
    try {
      const count = await leadAssignmentService.bulkAssign([...selectedIds], advisorId);
      toast.success(`${count} lead${count !== 1 ? 's' : ''} assigned`);
      setSelectedIds(new Set());
      load();
    } catch {
      toast.error('Failed to bulk assign leads');
    } finally {
      setBulkAssigning(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    }
  }

  function getAdvisorName(advisorId: string | null): string {
    if (!advisorId) return 'Unassigned';
    const advisor = advisors.find((a) => a.id === advisorId);
    return advisor ? `${advisor.first_name} ${advisor.last_name}` : 'Unknown';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Lead Assignment</h1>
          <p className="text-sm text-th-text-tertiary mt-1">Assign inbound leads to advisors</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary border border-th-border rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Leads', value: stats.total, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
            { label: 'Unassigned', value: stats.unassigned, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
            { label: 'Assigned', value: stats.assigned, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-primary rounded-xl border border-th-border p-4 flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${s.color}`}><Users className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold text-th-text-primary">{s.value}</p>
                <p className="text-sm text-th-text-tertiary">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
          />
        </div>
        <select
          value={assignedFilter}
          onChange={(e) => setAssignedFilter(e.target.value as 'all' | 'assigned' | 'unassigned')}
          className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
        >
          <option value="all">All Leads</option>
          <option value="unassigned">Unassigned</option>
          <option value="assigned">Assigned</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-sm"
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedIds.size} lead{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBulkDropdown(!showBulkDropdown)}
              disabled={bulkAssigning}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
            >
              {bulkAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Bulk Assign
            </button>
            {showBulkDropdown && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-surface-primary border border-th-border rounded-lg shadow-xl z-30 max-h-60 overflow-y-auto">
                {advisors.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleBulkAssign(a.id)}
                    className="w-full text-left px-4 py-2 text-sm text-th-text-primary hover:bg-surface-tertiary transition-colors"
                  >
                    {a.first_name} {a.last_name}
                    <span className="text-th-text-tertiary ml-1">({a.email})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => { setSelectedIds(new Set()); setShowBulkDropdown(false); }}
            className="p-1.5 text-th-text-tertiary hover:text-th-text-primary transition-colors"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-th-accent-600 animate-spin" />
            {timedOut && (
              <div className="mt-4 text-center">
                <p className="text-sm text-th-text-tertiary">Loading is taking longer than expected.</p>
                <button type="button" onClick={load} className="mt-2 text-sm text-th-accent-600 hover:underline">
                  Retry
                </button>
              </div>
            )}
          </div>
        ) : leads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-secondary border-b border-th-border">
                <tr>
                  <th className="py-3 px-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === leads.length && leads.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Pipeline Stage</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Priority</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Lead Score</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Assigned To</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface-tertiary transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-th-text-primary text-sm">
                        {[lead.first_name, lead.last_name].filter(Boolean).join(' ') || '-'}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-sm text-th-text-secondary">{lead.email || '-'}</td>
                    <td className="py-3 px-4 text-sm text-th-text-secondary">{lead.pipeline_stage || '-'}</td>
                    <td className="py-3 px-4">
                      {lead.priority ? (
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${PRIORITY_COLORS[lead.priority] || 'bg-neutral-100 text-neutral-600'}`}>
                          {lead.priority}
                        </span>
                      ) : (
                        <span className="text-sm text-th-text-tertiary">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-th-text-secondary">{lead.lead_score ?? '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-sm ${lead.assigned_to ? 'text-th-text-primary font-medium' : 'text-th-text-tertiary'}`}>
                        {getAdvisorName(lead.assigned_to)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="relative">
                        {lead.assigned_to ? (
                          <button
                            type="button"
                            onClick={() => handleUnassign(lead.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Unassign
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setAssigningId(assigningId === lead.id ? null : lead.id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-th-accent-600 hover:bg-th-accent-50 dark:hover:bg-th-accent-900/20 rounded transition-colors"
                            >
                              <UserPlus className="w-3 h-3" />
                              Assign
                            </button>
                            {assigningId === lead.id && (
                              <div className="absolute right-0 top-full mt-1 w-64 bg-surface-primary border border-th-border rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto">
                                {advisors.map((a) => (
                                  <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => handleAssign(lead.id, a.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-th-text-primary hover:bg-surface-tertiary transition-colors flex items-center gap-2"
                                  >
                                    <Check className="w-3 h-3 text-th-text-tertiary" />
                                    {a.first_name} {a.last_name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No leads found</p>
          </div>
        )}
      </div>
    </div>
  );
}
