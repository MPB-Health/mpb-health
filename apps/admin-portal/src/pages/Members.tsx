import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Users as UsersIcon, UserCheck, UserX, Clock, TrendingUp, Bell, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { memberService, type MemberProfile, type MemberStats } from '@mpbhealth/admin-core';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  cancelled: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

export default function Members() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: membersData, isLoading: loading } = useQuery({
    queryKey: ['adminMembers', statusFilter, searchQuery],
    queryFn: async () => {
      const [result, memberStats] = await Promise.all([
        memberService.getMembers({
          status: statusFilter || undefined,
          search: searchQuery || undefined,
          limit: 50,
        }),
        memberService.getStats(),
      ]);
      return { members: result.data, totalCount: result.count, stats: memberStats };
    },
    staleTime: 60 * 1000,
  });

  const members = membersData?.members ?? [];
  const totalCount = membersData?.totalCount ?? 0;
  const stats = membersData?.stats ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Members</h1>
          <p className="text-sm text-th-text-tertiary mt-1">
            {totalCount} total member{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/members/notifications')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors text-th-text-primary"
        >
          <Bell className="w-4 h-4" />
          Notification Center
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={UsersIcon} label="Total" value={stats.total} color="text-th-text-primary" />
          <StatCard icon={UserCheck} label="Active" value={stats.active} color="text-green-600" />
          <StatCard icon={Clock} label="Pending" value={stats.pending} color="text-yellow-600" />
          <StatCard icon={UserX} label="Suspended" value={stats.suspended} color="text-red-600" />
          <StatCard icon={UserX} label="Cancelled" value={stats.cancelled} color="text-neutral-500" />
          <StatCard icon={TrendingUp} label="New This Month" value={stats.new_this_month} color="text-blue-600" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-th-text-tertiary" />
          <input
            type="text"
            placeholder="Search by name or membership number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder:text-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by membership status"
          className="px-4 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600" />
          </div>
        ) : members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-secondary border-b border-th-border">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Member</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Membership #</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-secondary">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-surface-tertiary cursor-pointer transition-colors"
                    onClick={() => navigate(`/members/${member.id}`)}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-th-text-primary">
                          {member.first_name} {member.last_name}
                        </p>
                        {member.email && (
                          <p className="text-sm text-th-text-tertiary">{member.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-th-text-secondary font-mono">
                      {member.membership_number || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_COLORS[member.membership_status] || STATUS_COLORS.cancelled}`}>
                        {member.membership_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-th-text-secondary">
                      {member.phone || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-th-text-secondary">
                      {member.city && member.state ? `${member.city}, ${member.state}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-th-text-tertiary">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <UsersIcon className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No members found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-surface-primary rounded-xl border border-th-border p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-th-text-tertiary">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}
