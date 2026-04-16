import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Filter, CheckCircle, XCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Claim } from '../../types/memberPortal';
import { Card } from '../../components/ui/Card';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';

const ClaimsProcessing: React.FC = () => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending_review');

  useEffect(() => {
    loadClaims();
  }, [statusFilter]);

  const loadClaims = async () => {
    setLoading(true);

    let query = supabase
      .from('claims')
      .select('id, member_id, claim_number, claim_type, status, provider_name, provider_id, patient_name, patient_type, dependent_id, service_date, diagnosis_codes, total_amount, eligible_amount, approved_amount, paid_amount, denial_reason, processing_notes, submitted_date, reviewed_date, approved_date, paid_date, reviewed_by, metadata, created_at')
      .order('submitted_date', { ascending: false });

    if (statusFilter === 'pending_review') {
      query = query.in('status', ['submitted', 'under_review', 'pending_info']);
    } else if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading claims:', error);
    } else {
      setClaims(data || []);
    }

    setLoading(false);
  };

  const _handleApprove = async (claimId: string, amount: number) => {
    const { error } = await supabase
      .from('claims')
      .update({
        status: 'approved',
        approved_amount: amount,
        approved_date: new Date().toISOString()
      })
      .eq('id', claimId);

    if (!error) {
      loadClaims();
    }
  };

  const _handleDeny = async (claimId: string, reason: string) => {
    const { error } = await supabase
      .from('claims')
      .update({
        status: 'denied',
        denial_reason: reason,
        reviewed_date: new Date().toISOString()
      })
      .eq('id', claimId);

    if (!error) {
      loadClaims();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      pending_info: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'denied':
        return <XCircle className="h-4 w-4" />;
      case 'submitted':
      case 'under_review':
        return <Clock className="h-4 w-4" />;
      case 'pending_info':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityLevel = (claim: Claim): 'high' | 'medium' | 'low' => {
    if (claim.status === 'pending_info') return 'high';
    const daysSinceSubmission = claim.submitted_date
      ? Math.floor((Date.now() - new Date(claim.submitted_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    if (daysSinceSubmission > 7) return 'high';
    if (daysSinceSubmission > 3) return 'medium';
    return 'low';
  };

  return (
    <AdminLayout activeView="claims" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Needs Processing - Admin - MPB Health</title>
        <meta name="description" content="Review and process sharing requests" />
      </Helmet>

      <div>
        <AdminBreadcrumb currentPage="Needs Processing" />

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900">Needs Processing</h1>
            <p className="mt-2 text-neutral-600">Review and approve member sharing requests</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-blue-50 border-l-4 border-blue-600">
              <div className="text-sm font-medium text-neutral-600">Submitted</div>
              <div className="text-2xl font-bold text-neutral-900">
                {claims.filter(c => c.status === 'submitted').length}
              </div>
            </Card>
            <Card className="p-4 bg-yellow-50 border-l-4 border-yellow-600">
              <div className="text-sm font-medium text-neutral-600">Under Review</div>
              <div className="text-2xl font-bold text-neutral-900">
                {claims.filter(c => c.status === 'under_review').length}
              </div>
            </Card>
            <Card className="p-4 bg-orange-50 border-l-4 border-orange-600">
              <div className="text-sm font-medium text-neutral-600">Pending Info</div>
              <div className="text-2xl font-bold text-neutral-900">
                {claims.filter(c => c.status === 'pending_info').length}
              </div>
            </Card>
            <Card className="p-4 bg-green-50 border-l-4 border-green-600">
              <div className="text-sm font-medium text-neutral-600">Approved Today</div>
              <div className="text-2xl font-bold text-neutral-900">
                {claims.filter(c => c.status === 'approved' && c.approved_date && new Date(c.approved_date).toDateString() === new Date().toDateString()).length}
              </div>
            </Card>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-neutral-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending_review">Pending Review</option>
                <option value="all">All Claims</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="pending_info">Pending Info</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </Card>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : claims.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No claims found</h3>
              <p className="text-neutral-600">No claims match the selected filter</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => {
                const priority = getPriorityLevel(claim);
                return (
                  <Card
                    key={claim.id}
                    className={`p-6 ${priority === 'high' ? 'border-l-4 border-red-500' : priority === 'medium' ? 'border-l-4 border-yellow-500' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-neutral-900">
                            {claim.claim_number}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                            {getStatusIcon(claim.status)}
                            {claim.status.replace('_', ' ').toUpperCase()}
                          </span>
                          {priority === 'high' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              URGENT
                            </span>
                          )}
                        </div>

                        <div className="grid md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="font-medium text-neutral-600">Patient:</span>
                            <div className="text-neutral-900">{claim.patient_name}</div>
                          </div>
                          <div>
                            <span className="font-medium text-neutral-600">Provider:</span>
                            <div className="text-neutral-900">{claim.provider_name}</div>
                          </div>
                          <div>
                            <span className="font-medium text-neutral-600">Service Date:</span>
                            <div className="text-neutral-900">
                              {new Date(claim.service_date).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-neutral-600">Type:</span>
                            <div className="text-neutral-900">{claim.claim_type}</div>
                          </div>
                        </div>

                        {claim.diagnosis_codes && claim.diagnosis_codes.length > 0 && (
                          <div className="text-sm mb-3">
                            <span className="font-medium text-neutral-600">Diagnosis Codes:</span>{' '}
                            <span className="text-neutral-900">{claim.diagnosis_codes.join(', ')}</span>
                          </div>
                        )}

                        {claim.processing_notes && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                            <span className="font-medium text-yellow-900">Notes:</span>{' '}
                            <span className="text-yellow-800">{claim.processing_notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="ml-6 text-right">
                        <div className="text-2xl font-bold text-neutral-900 mb-1">
                          ${claim.total_amount.toFixed(2)}
                        </div>
                        {claim.approved_amount && (
                          <div className="text-sm text-green-600 mb-4">
                            ${claim.approved_amount.toFixed(2)} approved
                          </div>
                        )}

                        {['submitted', 'under_review', 'pending_info'].includes(claim.status) && (
                          <div className="flex flex-col gap-2 mt-4">
                            <Link
                              to={`/admin/claims/${claim.id}`}
                              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              Review Claim
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    {claim.submitted_date && (
                      <div className="mt-4 pt-4 border-t border-neutral-200 text-xs text-neutral-500">
                        Submitted: {new Date(claim.submitted_date).toLocaleString()}
                        {claim.reviewed_date && ` • Reviewed: ${new Date(claim.reviewed_date).toLocaleString()}`}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
    </AdminLayout>
  );
};

export default ClaimsProcessing;
