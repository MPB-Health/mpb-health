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
import PageChrome, {
  BezelPanel,
  adminSearchInputClass,
  adminSelectClass,
} from '../components/PageChrome';

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
        return <Clock className="w-5 h-5 text-th-text-tertiary" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'in_review':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-surface-tertiary text-th-text-secondary';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'advisor':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'member':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'partner':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-surface-tertiary text-th-text-secondary';
    }
  };

  return (
    <div className="space-y-5">
      <PageChrome
        title="Enrollments"
        description="Review and manage enrollment applications"
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Pending', count: enrollments.filter((e) => e.status === 'pending').length, color: 'neutral' },
          { label: 'In Review', count: enrollments.filter((e) => e.status === 'in_review').length, color: 'blue' },
          { label: 'Approved', count: enrollments.filter((e) => e.status === 'approved').length, color: 'green' },
          { label: 'Rejected', count: enrollments.filter((e) => e.status === 'rejected').length, color: 'red' },
          { label: 'On Hold', count: enrollments.filter((e) => e.status === 'on_hold').length, color: 'yellow' },
        ].map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => setStatusFilter(stat.label.toLowerCase().replace(' ', '_'))}
            className={`card-premium p-4 text-left transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.99] ${
              statusFilter === stat.label.toLowerCase().replace(' ', '_')
                ? 'border-th-accent-300 bg-th-accent-50 dark:bg-th-accent-900/20 dark:border-th-accent-700'
                : 'hover:border-th-accent-200 dark:hover:border-th-accent-800'
            }`}
          >
            <p className="text-2xl font-semibold tracking-tight text-th-text-primary">{stat.count}</p>
            <p className="text-sm text-th-text-tertiary">{stat.label}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={adminSearchInputClass}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-th-text-tertiary shrink-0" />
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={adminSelectClass}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="on_hold">On Hold</option>
          </select>
          <select
            aria-label="Filter by type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={adminSelectClass}
          >
            <option value="">All Types</option>
            <option value="advisor">Advisor</option>
            <option value="member">Member</option>
            <option value="partner">Partner</option>
          </select>
        </div>
      </div>

      <BezelPanel>
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600"></div>
          </div>
        ) : enrollments.length > 0 ? (
          <table className="w-full">
            <thead className="bg-surface-secondary border-b border-th-border">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Applicant
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Submitted
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                  Documents
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border-subtle">
              {enrollments.map((enrollment) => (
                <tr
                  key={enrollment.id}
                  className="hover:bg-surface-tertiary cursor-pointer"
                  onClick={() => navigate(`/enrollments/${enrollment.id}`)}
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-th-text-primary">
                        {enrollment.applicant_name}
                      </p>
                      <p className="text-sm text-th-text-tertiary">
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
                  <td className="py-3 px-4 text-sm text-th-text-tertiary">
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
                              : 'bg-th-text-tertiary'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-th-text-tertiary ml-2">
                        {enrollment.documents?.length || 0} docs
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-14 px-4">
            <UserPlus className="w-11 h-11 mx-auto mb-3 text-th-text-tertiary" />
            <p className="text-th-text-primary font-medium">No enrollments found</p>
            <p className="text-sm text-th-text-tertiary mt-1">Try adjusting filters or search.</p>
          </div>
        )}
      </BezelPanel>
    </div>
  );
}
