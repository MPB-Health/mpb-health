import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileText, Plus, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { memberPortalService } from '../../lib/memberPortalService';
import type { Claim } from '../../types/memberPortal';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';

const Claims: React.FC = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const loadClaims = async () => {
      if (!user?.id) return;

      setLoading(true);
      const data = await memberPortalService.getClaims(user.id, {
        status: filter !== 'all' ? filter : undefined
      });
      setClaims(data);
      setLoading(false);
    };

    loadClaims();
  }, [user?.id, filter]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <Helmet>
        <title>My Claims - MPB Health</title>
        <meta name="description" content="View and manage your healthcare claims" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">My Claims</h1>
                <p className="mt-2 text-neutral-600">Track and manage your healthcare claims</p>
              </div>
              <Link to="/member/portal/claims/new">
                <Button className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Submit New Claim
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <Filter className="h-5 w-5 text-neutral-600" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Claims</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : claims.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No claims found</h3>
              <p className="text-neutral-600 mb-6">Get started by submitting your first claim</p>
              <Link to="/member/portal/claims/new">
                <Button>Submit a Claim</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <Card key={claim.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {claim.claim_number}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                          {claim.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-neutral-600">
                        <div>
                          <span className="font-medium">Provider:</span> {claim.provider_name}
                        </div>
                        <div>
                          <span className="font-medium">Date of Service:</span>{' '}
                          {new Date(claim.service_date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {claim.claim_type}
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-neutral-900">
                        ${claim.total_amount.toFixed(2)}
                      </div>
                      {claim.approved_amount && (
                        <div className="text-sm text-green-600">
                          ${claim.approved_amount.toFixed(2)} approved
                        </div>
                      )}
                      <Link
                        to={`/member/portal/claims/${claim.id}`}
                        className="inline-block mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Claims;
