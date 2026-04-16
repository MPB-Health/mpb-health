import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Filter, Download, Eye, Edit, MoreVertical, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { MemberProfile } from '../../types/memberPortal';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';

const MemberManagement: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadMembers();
  }, [statusFilter]);

  const loadMembers = async () => {
    setLoading(true);

    let query = supabase
      .from('member_profiles')
      .select('id, first_name, last_name, date_of_birth, gender, phone, address_line1, address_line2, city, state, zip_code, country, profile_photo_url, membership_number, membership_status, membership_start_date, membership_end_date, plan_id, assigned_advisor_id, preferred_language, communication_preferences, medical_conditions, allergies, medications, emergency_contact_consent, hipaa_consent, consent_date, metadata, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('membership_status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading members:', error);
    } else {
      setMembers(data || []);
    }

    setLoading(false);
  };

  const filteredMembers = members.filter(member => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      member.first_name?.toLowerCase().includes(search) ||
      member.last_name?.toLowerCase().includes(search) ||
      member.membership_number?.toLowerCase().includes(search) ||
      member.phone?.toLowerCase().includes(search)
    );
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'suspended':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AdminLayout activeView="members" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Member Management - Admin - MPB Health</title>
        <meta name="description" content="Manage member profiles and accounts" />
      </Helmet>

      <div>
        <AdminBreadcrumb currentPage="Member Management" />

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Member Management</h1>
                <p className="mt-2 text-neutral-600">View and manage member profiles</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by name, member number, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-neutral-600" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                {filteredMembers.length} Member{filteredMembers.length !== 1 ? 's' : ''}
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-600">No members found matching your criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Member #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Member Since
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">
                                  {member.first_name?.[0]}{member.last_name?.[0]}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-neutral-900">
                                {member.first_name} {member.last_name}
                              </div>
                              <div className="text-sm text-neutral-500">
                                {member.city}, {member.state}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900">
                            {member.membership_number || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-900">{member.phone || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.membership_status)}`}>
                            {getStatusIcon(member.membership_status)}
                            {member.membership_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {member.membership_start_date ? new Date(member.membership_start_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/admin/members/${member.id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                            <Link
                              to={`/admin/members/${member.id}/edit`}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                            </Link>
                            <button
                              className="text-gray-600 hover:text-gray-900"
                              title="More Actions"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
    </AdminLayout>
  );
};

export default MemberManagement;
