import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  AlertTriangle,
  File,
  Image,
  FileSpreadsheet,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';

interface Document {
  id: string;
  member_id: string;
  member_name?: string;
  document_type: 'id_verification' | 'proof_of_address' | 'medical_record' | 'claim_receipt' | 'other';
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  rejection_reason?: string;
  uploaded_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

const DocumentReview: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [statusFilter, typeFilter]);

  const loadDocuments = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('member_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('document_type', typeFilter);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('Error loading documents:', error);
      } else {
        setDocuments(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }

    setLoading(false);
  };

  const filteredDocuments = documents.filter(doc => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      doc.file_name?.toLowerCase().includes(search) ||
      doc.member_name?.toLowerCase().includes(search) ||
      doc.document_type?.toLowerCase().includes(search)
    );
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      needs_revision: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'needs_revision':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
    if (mimeType?.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      id_verification: 'ID Verification',
      proof_of_address: 'Proof of Address',
      medical_record: 'Medical Record',
      claim_receipt: 'Claim Receipt',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const handleApprove = async (docId: string) => {
    const { error } = await supabase
      .from('member_documents')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', docId);

    if (!error) {
      loadDocuments();
      setSelectedDoc(null);
    }
  };

  const handleReject = async () => {
    if (!selectedDoc) return;

    const { error } = await supabase
      .from('member_documents')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', selectedDoc.id);

    if (!error) {
      loadDocuments();
      setSelectedDoc(null);
      setShowRejectModal(false);
      setRejectionReason('');
    }
  };

  const _handleRequestRevision = async (docId: string) => {
    const { error } = await supabase
      .from('member_documents')
      .update({
        status: 'needs_revision',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', docId);

    if (!error) {
      loadDocuments();
    }
  };

  const stats = {
    pending: documents.filter(d => d.status === 'pending').length,
    approved: documents.filter(d => d.status === 'approved').length,
    rejected: documents.filter(d => d.status === 'rejected').length,
    needsRevision: documents.filter(d => d.status === 'needs_revision').length
  };

  return (
    <AdminLayout activeView="documents" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Document Review - Admin - MPB Health</title>
        <meta name="description" content="Review and approve uploaded member documents" />
      </Helmet>

      <div>
        <AdminBreadcrumb currentPage="Document Review" />

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Document Review</h1>
                <p className="mt-2 text-neutral-600">Review and approve uploaded documents</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className={`p-4 border-l-4 ${stats.pending > 0 ? 'bg-yellow-50 border-yellow-600' : 'bg-gray-50 border-gray-400'}`}>
              <div className="flex items-center gap-3">
                <Clock className={`h-8 w-8 ${stats.pending > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Pending Review</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.pending}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-green-50 border-l-4 border-green-600">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Approved</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.approved}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-red-50 border-l-4 border-red-600">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Rejected</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.rejected}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-orange-50 border-l-4 border-orange-600">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Needs Revision</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.needsRevision}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by file name, member name, or document type..."
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
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="needs_revision">Needs Revision</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="id_verification">ID Verification</option>
                  <option value="proof_of_address">Proof of Address</option>
                  <option value="medical_record">Medical Record</option>
                  <option value="claim_receipt">Claim Receipt</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Documents List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No documents found</h3>
              <p className="text-neutral-600">No documents match your criteria</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-neutral-100 rounded-lg">
                        {getFileIcon(doc.mime_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 line-clamp-1" title={doc.file_name}>
                          {doc.file_name}
                        </h3>
                        <p className="text-sm text-neutral-500">{formatFileSize(doc.file_size)}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {getStatusIcon(doc.status)}
                      {doc.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Type</span>
                      <span className="font-medium">{getDocumentTypeLabel(doc.document_type)}</span>
                    </div>
                    {doc.member_name && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">Member</span>
                        <span className="font-medium">{doc.member_name}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Uploaded</span>
                      <span className="font-medium">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {doc.rejection_reason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-sm">
                      <span className="font-medium text-red-900">Rejection Reason:</span>
                      <p className="text-red-700 mt-1">{doc.rejection_reason}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 flex items-center justify-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    {doc.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(doc.id)}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center justify-center gap-1 text-red-600 hover:text-red-700"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setShowRejectModal(true);
                          }}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

      {/* Rejection Modal */}
      {showRejectModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Reject Document</h3>
            <p className="text-neutral-600 mb-4">
              Please provide a reason for rejecting "{selectedDoc.file_name}"
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedDoc(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
              >
                Reject Document
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

export default DocumentReview;

