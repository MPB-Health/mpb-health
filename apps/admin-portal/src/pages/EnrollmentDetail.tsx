import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Download,
} from 'lucide-react';
import { enrollmentService, type Enrollment } from '@mpbhealth/admin-core';
import { useAdmin } from '../contexts/AdminContext';

export default function EnrollmentDetail() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();
  const { user, refreshMetrics } = useAdmin();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    const loadEnrollment = async () => {
      if (!enrollmentId) return;

      try {
        const data = await enrollmentService.getEnrollment(enrollmentId);
        setEnrollment(data);
      } catch (err) {
        toast.error('Failed to load enrollment');
        navigate('/enrollments');
      } finally {
        setLoading(false);
      }
    };

    loadEnrollment();
  }, [enrollmentId, navigate]);

  const handleStartReview = async () => {
    if (!enrollmentId || !user) return;

    setProcessing(true);
    try {
      const updated = await enrollmentService.startReview(enrollmentId, user.id);
      setEnrollment(updated);
      toast.success('Review started');
    } catch (err) {
      toast.error('Failed to start review');
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!enrollmentId || !user) return;

    setProcessing(true);
    try {
      const updated = await enrollmentService.approve(enrollmentId, user.id);
      setEnrollment(updated);
      await refreshMetrics();
      toast.success('Enrollment approved!');
    } catch (err) {
      toast.error('Failed to approve enrollment');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!enrollmentId || !user || !rejectReason) return;

    setProcessing(true);
    try {
      const updated = await enrollmentService.reject(
        enrollmentId,
        user.id,
        rejectReason
      );
      setEnrollment(updated);
      await refreshMetrics();
      setShowRejectModal(false);
      toast.success('Enrollment rejected');
    } catch (err) {
      toast.error('Failed to reject enrollment');
    } finally {
      setProcessing(false);
    }
  };

  const handlePutOnHold = async () => {
    if (!enrollmentId || !user) return;

    const reason = prompt('Reason for putting on hold:');
    if (!reason) return;

    setProcessing(true);
    try {
      const updated = await enrollmentService.putOnHold(
        enrollmentId,
        user.id,
        reason
      );
      setEnrollment(updated);
      toast.success('Enrollment put on hold');
    } catch (err) {
      toast.error('Failed to put enrollment on hold');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyDocument = async (
    documentId: string,
    status: 'verified' | 'rejected'
  ) => {
    if (!enrollmentId || !user) return;

    try {
      const updated = await enrollmentService.verifyDocument(
        enrollmentId,
        documentId,
        user.id,
        status
      );
      setEnrollment(updated);
      toast.success(`Document ${status}`);
    } catch (err) {
      toast.error('Failed to verify document');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600"></div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="text-center py-12">
        <p className="text-th-text-tertiary">Enrollment not found</p>
        <button
          onClick={() => navigate('/enrollments')}
          className="mt-4 text-th-accent-600 hover:text-th-accent-700 font-medium"
        >
          Back to Enrollments
        </button>
      </div>
    );
  }

  const canTakeAction = enrollment.status === 'pending' || enrollment.status === 'in_review';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/enrollments')}
        className="flex items-center space-x-2 text-th-text-secondary hover:text-th-text-primary"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Enrollments</span>
      </button>

      {/* Header */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-th-text-primary">
                {enrollment.applicant_name}
              </h1>
              <span
                className={`px-3 py-1 text-sm rounded-full capitalize ${
                  enrollment.application_type === 'advisor'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : enrollment.application_type === 'member'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                }`}
              >
                {enrollment.application_type}
              </span>
            </div>
            <div className="flex items-center space-x-4 mt-2 text-sm text-th-text-tertiary">
              <div className="flex items-center space-x-1">
                <Mail className="w-4 h-4" />
                <span>{enrollment.applicant_email}</span>
              </div>
              {enrollment.applicant_phone && (
                <div className="flex items-center space-x-1">
                  <Phone className="w-4 h-4" />
                  <span>{enrollment.applicant_phone}</span>
                </div>
              )}
            </div>
          </div>
          <span
            className={`px-4 py-2 text-sm rounded-lg capitalize ${
              enrollment.status === 'approved'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : enrollment.status === 'rejected'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                : enrollment.status === 'on_hold'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                : enrollment.status === 'in_review'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-surface-tertiary text-th-text-secondary'
            }`}
          >
            {enrollment.status.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center space-x-6 mt-4 text-sm text-th-text-tertiary">
          <span>
            Submitted: {format(new Date(enrollment.submitted_at), 'MMMM d, yyyy h:mm a')}
          </span>
          {enrollment.reviewed_at && (
            <span>
              Reviewed: {format(new Date(enrollment.reviewed_at), 'MMMM d, yyyy')}
            </span>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <h2 className="font-semibold text-th-text-primary mb-4">Documents</h2>
        {enrollment.documents && enrollment.documents.length > 0 ? (
          <div className="space-y-3">
            {enrollment.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-th-text-tertiary" />
                  <div>
                    <p className="font-medium text-th-text-primary">{doc.name}</p>
                    <p className="text-sm text-th-text-tertiary">{doc.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {doc.status === 'verified' ? (
                    <span className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">Verified</span>
                    </span>
                  ) : doc.status === 'rejected' ? (
                    <span className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Rejected</span>
                    </span>
                  ) : canTakeAction ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVerifyDocument(doc.id, 'verified')}
                        className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleVerifyDocument(doc.id, 'rejected')}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <span className="flex items-center space-x-1 text-th-text-tertiary">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Pending</span>
                    </span>
                  )}
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-th-text-tertiary hover:text-th-text-secondary hover:bg-surface-tertiary rounded"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-th-text-tertiary">No documents uploaded</p>
        )}
      </div>

      {/* Notes */}
      {enrollment.notes && (
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="font-semibold text-th-text-primary mb-4">Notes</h2>
          <pre className="whitespace-pre-wrap text-sm text-th-text-secondary">
            {enrollment.notes}
          </pre>
        </div>
      )}

      {/* Actions */}
      {canTakeAction && (
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="font-semibold text-th-text-primary mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {enrollment.status === 'pending' && (
              <button
                onClick={handleStartReview}
                disabled={processing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Start Review
              </button>
            )}
            <button
              onClick={handleApprove}
              disabled={processing}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={processing}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>
            <button
              onClick={handlePutOnHold}
              disabled={processing}
              className="flex items-center space-x-2 px-4 py-2 border border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded-lg font-medium hover:bg-yellow-50 dark:hover:bg-yellow-900/20 disabled:opacity-50 transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Put on Hold</span>
            </button>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowRejectModal(false)}
          />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-surface-primary rounded-xl shadow-xl w-full max-w-md p-6 border border-th-border">
              <h3 className="text-lg font-semibold text-th-text-primary mb-4">
                Reject Enrollment
              </h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={4}
                className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary"
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason || processing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
