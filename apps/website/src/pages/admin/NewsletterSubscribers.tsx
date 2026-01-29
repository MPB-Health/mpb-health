import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Download, Search, TrendingUp, Users, UserX, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { getAllSubscribers, NewsletterSubscription } from '../../lib/newsletterService';
import { bulkSyncToMailchimp } from '../../lib/mailchimpService';
import { SEOHead } from '../../components/SEOHead';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';

const NewsletterSubscribers = () => {
  const navigate = useNavigate();
  const [subscribers, setSubscribers] = useState<NewsletterSubscription[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<NewsletterSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  useEffect(() => {
    filterSubscribers();
  }, [subscribers, searchTerm, statusFilter, sourceFilter]);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const data = await getAllSubscribers();
      setSubscribers(data);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubscribers = () => {
    let filtered = [...subscribers];

    if (searchTerm) {
      filtered = filtered.filter(sub =>
        sub.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(sub => sub.source === sourceFilter);
    }

    setFilteredSubscribers(filtered);
  };

  const handleBulkSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const activeSubscribers = subscribers
        .filter(s => s.status === 'active')
        .map(s => ({
          email: s.email,
          status: 'subscribed' as const,
          tags: [s.source || 'website']
        }));

      const result = await bulkSyncToMailchimp(activeSubscribers);

      setSyncMessage({
        type: result.failed > 0 ? 'error' : 'success',
        text: `Synced ${result.success} subscribers. ${result.failed > 0 ? `Failed: ${result.failed}` : ''}`
      });
    } catch (_error) {
      setSyncMessage({
        type: 'error',
        text: 'Failed to sync subscribers to Mailchimp'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Status', 'Source', 'Subscribed Date', 'Unsubscribed Date'];
    const rows = filteredSubscribers.map(sub => [
      sub.email,
      sub.status,
      sub.source || '',
      sub.created_at || '',
      sub.unsubscribed_at || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.status === 'active').length,
    unsubscribed: subscribers.filter(s => s.status === 'unsubscribed').length,
    bounced: subscribers.filter(s => s.status === 'bounced').length,
  };

  const sources = [...new Set(subscribers.map(s => s.source).filter(Boolean))];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AdminLayout activeView="newsletter-subs" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <SEOHead
        title="Newsletter Subscribers - Admin Dashboard"
        description="Manage newsletter subscribers"
      />

      <div>
        <AdminBreadcrumb currentPage="Newsletter Subscribers" />

          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                  <Mail className="w-8 h-8 text-blue-600" />
                  Newsletter Subscribers
                </h1>
                <p className="text-neutral-600 mt-1">
                  Manage and sync your newsletter subscribers
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleBulkSync}
                  disabled={isSyncing}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync to Mailchimp'}
                </Button>
                <Button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            {syncMessage && (
              <div className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
                syncMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{syncMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-blue-600" />
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">{stats.total}</div>
                <div className="text-sm text-neutral-600">Total Subscribers</div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <div className="flex items-center justify-between mb-2">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">{stats.active}</div>
                <div className="text-sm text-neutral-600">Active</div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <div className="flex items-center justify-between mb-2">
                  <UserX className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">{stats.unsubscribed}</div>
                <div className="text-sm text-neutral-600">Unsubscribed</div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">{stats.bounced}</div>
                <div className="text-sm text-neutral-600">Bounced</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="unsubscribed">Unsubscribed</option>
                  <option value="bounced">Bounced</option>
                  <option value="pending">Pending</option>
                </select>

                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Sources</option>
                  {sources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-pulse text-neutral-600">Loading subscribers...</div>
                </div>
              ) : filteredSubscribers.length === 0 ? (
                <div className="p-12 text-center">
                  <Mail className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-600">No subscribers found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Subscribed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Unsubscribed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {filteredSubscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900">{subscriber.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            subscriber.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : subscriber.status === 'unsubscribed'
                              ? 'bg-yellow-100 text-yellow-800'
                              : subscriber.status === 'bounced'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-neutral-100 text-neutral-800'
                          }`}>
                            {subscriber.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {subscriber.source || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {formatDate(subscriber.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {formatDate(subscriber.unsubscribed_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {filteredSubscribers.length > 0 && (
              <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
                <p className="text-sm text-neutral-600">
                  Showing {filteredSubscribers.length} of {subscribers.length} subscribers
                </p>
              </div>
            )}
          </div>
        </div>
    </AdminLayout>
  );
};

export default NewsletterSubscribers;
