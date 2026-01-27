import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Users, Search } from 'lucide-react';
import { advisorLeadService, type AssignedLeadView } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';

export default function MyLeads() {
  const { profile } = useAdvisor();
  const [leads, setLeads] = useState<AssignedLeadView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!profile?.id) return;
    const load = async () => {
      setLoading(true);
      const data = await advisorLeadService.getAssignedLeads(profile.id);
      setLeads(data);
      setLoading(false);
    };
    load();
  }, [profile?.id]);

  const filtered = search
    ? leads.filter(
        (l) =>
          `${l.first_name} ${l.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
          l.email.toLowerCase().includes(search.toLowerCase())
      )
    : leads;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">My Leads</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Leads assigned to you for follow-up.
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center bg-white border border-neutral-200 rounded-lg px-3 py-2 w-full max-w-sm">
        <Search className="w-4 h-4 text-neutral-400 mr-2" />
        <input
          type="text"
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-sm w-full text-neutral-700 placeholder-neutral-400"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">
            {search ? 'No leads match your search.' : 'No leads assigned to you yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Stage</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr key={lead.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {lead.first_name} {lead.last_name}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{lead.email}</td>
                    <td className="px-4 py-3 text-neutral-600">{lead.phone || '—'}</td>
                    <td className="px-4 py-3">
                      {lead.pipeline_stage ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: lead.pipeline_stage_color || '#6B7280' }}
                        >
                          {lead.pipeline_stage}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead.priority ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            lead.priority === 'critical'
                              ? 'bg-red-100 text-red-700'
                              : lead.priority === 'high'
                                ? 'bg-orange-100 text-orange-700'
                                : lead.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {lead.priority}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {format(new Date(lead.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
