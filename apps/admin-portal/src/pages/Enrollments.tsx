import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  UserPlus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { enrollmentService, type Enrollment } from '@mpbhealth/admin-core';

export default function Enrollments() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    const loadEnrollments = async () => {
      try {
        const data = await enrollmentService.getEnrollments({
          status: statusFilter || undefined,
          type: typeFilter || undefined,
          search: searchQuery || undefined,
        });
        setEnrollments(data);
      } catch (err) {
        console.error('Failed to load enrollments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEnrollments();
  }, [searchQuery, statusFilter, typeFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'on_hold':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'in_review':
        return <Eye className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-700';
      case 'in_review':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'advisor':
        return 'bg-purple-100 text-purple-700';
      case 'member':
        return 'bg-blue-100 text-blue-700';
      case 'partner':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Enrollments</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Review and manage enrollment applications
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Pending', count: enrollments.filter((e) => e.status === 'pending').length, color: 'neutral' },
          { label: 'In Review', count: enrollments.filter((e) => e.status === 'in_review').length, color: 'blue' },
          { label: 'Approved', count: enrollments.filter((e) => e.status === 'approved').length, color: 'green' },
          { label: 'Rejected', count: enrollments.filter((e) => e.status === 'rejected').length, color: 'red' },
          { label: 'On Hold', count: enrollments.filter((e) => e.status === 'on_hold').length, color: 'yellow' },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => setStatusFilter(stat.label.toLowerCase().replace(' ', '_'))}
            className={`p-4 rounded-xl border transition-colors ${
              statusFilter === stat.label.toLowerCase().replace(' ', '_')
                ? 'border-primary-300 bg-primary-50'
                : 'border-neutral-200 bg-white hover:border-primary-200'
            }`}
          >
            <p className="text-2xl font-bold text-neutral-900">{stat.count}</p>
            <p className="text-sm text-neutral-500">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-neutral-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="on_hold">On Hold</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Types</option>
            <option value="advisor">Advisor</option>
            <option value="member">Member</option>
            <option value="partner">Partner</option>
          </select>
        </div>
      </div>

      {/* Enrollments table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : enrollments.length > 0 ? (
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">
                  Applicant
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">
                  Submitted
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">
                  Documents
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {enrollments.map((enrollment) => (
                <tr
                  key={enrollment.id}
                  className="hover:bg-neutral-50 cursor-pointer"
                  onClick={() => navigate(`/enrollments/${enrollment.id}`)}
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-neutral-900">
                        {enrollment.applicant_name}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {enrollment.applicant_email}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full capitalize ${getTypeColor(
                        enrollment.application_type
                      )}`}
                    >
                      {enrollment.application_type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(enrollment.status)}
                      <span
                        className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(
                          enrollment.status
                        )}`}
                      >
                        {enrollment.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-500">
                    {format(new Date(enrollment.submitted_at), 'MMM d, yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1">
                      {enrollment.documents?.map((doc, i) => (
                        <span
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            doc.status === 'verified'
                              ? 'bg-green-500'
                              : doc.status === 'rejected'
                              ? 'bg-red-500'
                              : 'bg-neutral-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-neutral-500 ml-2">
                        {enrollment.documents?.length || 0} docs
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <UserPlus className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
            <p className="text-neutral-500">No enrollments found</p>
          </div>
        )}
      </div>
    </div>
  );
}
