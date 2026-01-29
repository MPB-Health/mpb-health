import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MessageSquare,
  User,
  Tag,
  Eye,
  Reply,
  Archive,
  AlertTriangle,
  Inbox
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';

interface SupportTicket {
  id: string;
  ticket_number: string;
  member_id: string;
  member_name?: string;
  member_email?: string;
  subject: string;
  description: string;
  category: 'billing' | 'claims' | 'coverage' | 'technical' | 'general' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

const SupportTickets: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const loadTickets = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query.limit(100);

      // Handle missing table gracefully
      if (error?.message?.includes('schema cache') || 
          error?.code === 'PGRST204' ||
          error?.code === 'PGRST205') {
        setTickets([]);
      } else if (error) {
        console.error('Error loading tickets:', error);
      } else {
        setTickets(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }

    setLoading(false);
  };

  const filteredTickets = tickets.filter(ticket => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      ticket.ticket_number?.toLowerCase().includes(search) ||
      ticket.subject?.toLowerCase().includes(search) ||
      ticket.member_name?.toLowerCase().includes(search) ||
      ticket.member_email?.toLowerCase().includes(search)
    );
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      waiting_response: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-slate-100 text-slate-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Inbox className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'waiting_response':
        return <MessageSquare className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <Archive className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'billing':
        return '💳';
      case 'claims':
        return '📋';
      case 'coverage':
        return '🛡️';
      case 'technical':
        return '🔧';
      case 'urgent':
        return '🚨';
      default:
        return '💬';
    }
  };

  const getTimeSinceCreated = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    waiting: tickets.filter(t => t.status === 'waiting_response').length,
    critical: tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved' && t.status !== 'closed').length
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(newStatus === 'resolved' ? { resolved_at: new Date().toISOString() } : {})
      })
      .eq('id', ticketId);

    if (!error) {
      loadTickets();
    }
  };

  return (
    <AdminLayout activeView="support" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Support Tickets - Admin - MPB Health</title>
        <meta name="description" content="Manage member support tickets and requests" />
      </Helmet>

      <div>
        <AdminBreadcrumb currentPage="Support Tickets" />

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Support Tickets</h1>
                <p className="mt-2 text-neutral-600">Handle member support requests</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className={`p-4 border-l-4 ${stats.critical > 0 ? 'bg-red-50 border-red-600' : 'bg-blue-50 border-blue-600'}`}>
              <div className="flex items-center gap-3">
                <Inbox className={`h-8 w-8 ${stats.critical > 0 ? 'text-red-600' : 'text-blue-600'}`} />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Open Tickets</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.open}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-yellow-50 border-l-4 border-yellow-600">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">In Progress</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.inProgress}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-orange-50 border-l-4 border-orange-600">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-orange-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Awaiting Response</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.waiting}</div>
                </div>
              </div>
            </Card>
            <Card className={`p-4 border-l-4 ${stats.critical > 0 ? 'bg-red-50 border-red-600 animate-pulse' : 'bg-gray-50 border-gray-400'}`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-8 w-8 ${stats.critical > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Critical Priority</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.critical}</div>
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
                  placeholder="Search by ticket #, subject, member name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-5 w-5 text-neutral-600" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_response">Waiting Response</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priority</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="billing">Billing</option>
                  <option value="claims">Claims</option>
                  <option value="coverage">Coverage</option>
                  <option value="technical">Technical</option>
                  <option value="general">General</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Tickets List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageSquare className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No tickets found</h3>
              <p className="text-neutral-600">No tickets match your criteria</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className={`p-6 hover:shadow-md transition-shadow ${
                    ticket.priority === 'critical' ? 'border-l-4 border-red-500' :
                    ticket.priority === 'high' ? 'border-l-4 border-orange-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getCategoryIcon(ticket.category)}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-neutral-900">
                              {ticket.subject}
                            </h3>
                            {getPriorityIcon(ticket.priority)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <span className="font-mono">{ticket.ticket_number}</span>
                            <span>•</span>
                            <span>{getTimeSinceCreated(ticket.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-neutral-600 mb-4 line-clamp-2">
                        {ticket.description}
                      </p>

                      <div className="flex items-center gap-4 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm text-neutral-600">
                          <Tag className="h-4 w-4" />
                          {ticket.category}
                        </span>
                        {ticket.member_name && (
                          <span className="inline-flex items-center gap-1 text-sm text-neutral-600">
                            <User className="h-4 w-4" />
                            {ticket.member_name}
                          </span>
                        )}
                        {ticket.assigned_to && (
                          <span className="inline-flex items-center gap-1 text-sm text-blue-600">
                            <User className="h-4 w-4" />
                            Assigned: {ticket.assigned_to}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ml-6 flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Reply className="h-4 w-4" />
                        Reply
                      </Button>
                      {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 text-green-600 hover:text-green-700"
                          onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
    </AdminLayout>
  );
};

export default SupportTickets;

