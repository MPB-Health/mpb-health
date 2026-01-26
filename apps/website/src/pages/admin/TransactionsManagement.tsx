import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Search,
  Filter,
  Download,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  RefreshCw,
  Eye,
  MoreVertical
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';

interface Transaction {
  id: string;
  member_id: string;
  member_name?: string;
  transaction_type: 'membership_fee' | 'claim_payment' | 'refund' | 'adjustment';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  reference_number?: string;
  description?: string;
  created_at: string;
  processed_at?: string;
}

const TransactionsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');

  useEffect(() => {
    loadTransactions();
  }, [statusFilter, typeFilter, dateRange]);

  const loadTransactions = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('transaction_type', typeFilter);
      }

      if (dateRange !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
        query = query.gte('created_at', daysAgo.toISOString());
      }

      const { data, error } = await query.limit(100);

      // Handle missing table gracefully
      if (error?.message?.includes('schema cache') || 
          error?.code === 'PGRST204' ||
          error?.code === 'PGRST205') {
        setTransactions([]);
      } else if (error) {
        console.error('Error loading transactions:', error);
      } else {
        setTransactions(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }

    setLoading(false);
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      transaction.reference_number?.toLowerCase().includes(search) ||
      transaction.member_name?.toLowerCase().includes(search) ||
      transaction.description?.toLowerCase().includes(search)
    );
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'refunded':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'membership_fee':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'claim_payment':
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />;
      case 'refund':
        return <RefreshCw className="h-4 w-4 text-purple-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const stats = {
    total: filteredTransactions.reduce((sum, t) => sum + (t.status === 'completed' ? t.amount : 0), 0),
    pending: filteredTransactions.filter(t => t.status === 'pending').length,
    completed: filteredTransactions.filter(t => t.status === 'completed').length,
    failed: filteredTransactions.filter(t => t.status === 'failed').length
  };

  const handleExport = () => {
    const csvContent = [
      ['Reference', 'Type', 'Amount', 'Status', 'Date', 'Description'].join(','),
      ...filteredTransactions.map(t => [
        t.reference_number || '',
        t.transaction_type,
        t.amount.toFixed(2),
        t.status,
        new Date(t.created_at).toLocaleDateString(),
        `"${t.description || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <AdminLayout activeView="transactions" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Transactions Management - Admin - MPB Health</title>
        <meta name="description" content="Manage payments and billing transactions" />
      </Helmet>

      <div>
        <AdminBreadcrumb currentPage="Transactions" />

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Transactions</h1>
                <p className="mt-2 text-neutral-600">Manage payments and billing</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex items-center gap-2" onClick={handleExport}>
                  <Download className="h-5 w-5" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-green-50 border-l-4 border-green-600">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Total Revenue</div>
                  <div className="text-2xl font-bold text-neutral-900">{formatCurrency(stats.total)}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-yellow-50 border-l-4 border-yellow-600">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Pending</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.pending}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-blue-50 border-l-4 border-blue-600">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Completed</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.completed}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-red-50 border-l-4 border-red-600">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Failed</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.failed}</div>
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
                  placeholder="Search by reference number, member, or description..."
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
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="membership_fee">Membership Fee</option>
                  <option value="claim_payment">Claim Payment</option>
                  <option value="refund">Refund</option>
                  <option value="adjustment">Adjustment</option>
                </select>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Transactions Table */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No transactions found</h3>
                <p className="text-neutral-600">No transactions match your criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              {getTypeIcon(transaction.transaction_type)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-neutral-900">
                                {transaction.reference_number || 'N/A'}
                              </div>
                              <div className="text-sm text-neutral-500">
                                {transaction.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-900 capitalize">
                            {transaction.transaction_type.replace('_', ' ')}
                          </div>
                          {transaction.payment_method && (
                            <div className="text-sm text-neutral-500">{transaction.payment_method}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-semibold ${
                            transaction.transaction_type === 'refund' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {transaction.transaction_type === 'refund' ? '-' : '+'}{formatCurrency(transaction.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {getStatusIcon(transaction.status)}
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
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

export default TransactionsManagement;

