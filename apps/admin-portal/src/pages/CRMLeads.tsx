import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Filter } from 'lucide-react';
import { crmBridgeService, type CRMLead } from '@mpbhealth/admin-core';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

export default function CRMLeads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [stages, setStages] = useState<{ id: string; name: string; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const result = await crmBridgeService.getLeads({
        status: statusFilter || undefined,
        stage_id: stageFilter || undefined,
        search: searchQuery || undefined,
        limit: 50,
      });
      setLeads(result.data);
      setTotalCount(result.count);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, stageFilter, searchQuery]);

  useEffect(() => {
    crmBridgeService.getPipelineStages().then(setStages).catch(() => {});
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">CRM Leads</h1>
          <p className="text-sm text-th-text-tertiary mt-1">{totalCount} total leads</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-th-text-tertiary" />
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
        {stages.length > 0 && (
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          >
            <option value="">All Stages</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600" />
          </div>
        ) : leads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-secondary border-b border-th-border">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Company</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Source</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-surface-tertiary cursor-pointer transition-colors"
                    onClick={() => navigate(`/crm/leads/${lead.id}`)}
                  >
                    <td className="py-3 px-4">
                      <p className="font-medium text-th-text-primary">
                        {lead.first_name} {lead.last_name}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-sm text-th-text-secondary">{lead.email || '-'}</td>
                    <td className="py-3 px-4 text-sm text-th-text-secondary">{lead.company || '-'}</td>
                    <td className="py-3 px-4">
                      {lead.status && (
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_COLORS[lead.status] || 'bg-neutral-100 text-neutral-600'}`}>
                          {lead.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-th-text-secondary">{lead.source || '-'}</td>
                    <td className="py-3 px-4 text-sm text-th-text-tertiary">
                      {new Date(lead.created_at).toLocaleDateString()}
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
