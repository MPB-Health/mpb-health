import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Search, 
  Filter, 
  Plus,
  Send,
  Bell,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  Users,
  Calendar,
  Edit,
  Trash2,
  AlertTriangle,
  Info,
  AlertCircle,
  Megaphone
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success' | 'announcement';
  channel: 'in_app' | 'email' | 'sms' | 'push';
  audience: 'all_members' | 'active_members' | 'advisors' | 'staff' | 'specific';
  specific_recipients?: string[];
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduled_at?: string;
  sent_at?: string;
  sent_count?: number;
  read_count?: number;
  created_by?: string;
  created_at: string;
}

const NotificationsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    channel: 'in_app' as const,
    audience: 'all_members' as const
  });

  useEffect(() => {
    loadNotifications();
  }, [statusFilter, typeFilter]);

  const loadNotifications = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('system_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('Error loading notifications:', error);
      } else {
        setNotifications(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }

    setLoading(false);
  };

  const filteredNotifications = notifications.filter(notification => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      notification.title?.toLowerCase().includes(search) ||
      notification.message?.toLowerCase().includes(search)
    );
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'announcement':
        return <Megaphone className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-100 text-blue-700',
      warning: 'bg-yellow-100 text-yellow-700',
      alert: 'bg-red-100 text-red-700',
      success: 'bg-green-100 text-green-700',
      announcement: 'bg-purple-100 text-purple-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-yellow-100 text-yellow-700',
      sent: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'push':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAudienceLabel = (audience: string) => {
    const labels: Record<string, string> = {
      all_members: 'All Members',
      active_members: 'Active Members',
      advisors: 'Advisors',
      staff: 'Staff',
      specific: 'Specific Recipients'
    };
    return labels[audience] || audience;
  };

  const handleSendNow = async (notificationId: string) => {
    const { error } = await supabase
      .from('system_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (!error) {
      loadNotifications();
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    const { error } = await supabase
      .from('system_notifications')
      .delete()
      .eq('id', notificationId);

    if (!error) {
      loadNotifications();
    }
  };

  const handleCreateNotification = async () => {
    const { error } = await supabase
      .from('system_notifications')
      .insert({
        ...newNotification,
        status: 'draft',
        created_at: new Date().toISOString()
      });

    if (!error) {
      setShowCreateModal(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        channel: 'in_app',
        audience: 'all_members'
      });
      loadNotifications();
    }
  };

  const stats = {
    total: notifications.length,
    draft: notifications.filter(n => n.status === 'draft').length,
    scheduled: notifications.filter(n => n.status === 'scheduled').length,
    sent: notifications.filter(n => n.status === 'sent').length
  };

  return (
    <AdminLayout activeView="notifications" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Notifications - Admin - MPB Health</title>
        <meta name="description" content="Send and manage system notifications" />
      </Helmet>

      <div>
        <AdminBreadcrumb currentPage="Notifications" />

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Notifications</h1>
                <p className="mt-2 text-neutral-600">Send and manage system notifications</p>
              </div>
              <Button className="flex items-center gap-2" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-5 w-5" />
                Create Notification
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-blue-50 border-l-4 border-blue-600">
              <div className="flex items-center gap-3">
                <Bell className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Total</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gray-50 border-l-4 border-gray-400">
              <div className="flex items-center gap-3">
                <Edit className="h-8 w-8 text-gray-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Drafts</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.draft}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-yellow-50 border-l-4 border-yellow-600">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Scheduled</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.scheduled}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-green-50 border-l-4 border-green-600">
              <div className="flex items-center gap-3">
                <Send className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Sent</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.sent}</div>
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
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-neutral-600" />
                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                </select>
                <select
                  aria-label="Filter by type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="alert">Alert</option>
                  <option value="success">Success</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Notifications List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No notifications found</h3>
              <p className="text-neutral-600 mb-4">Create your first notification to get started</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Notification
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card key={notification.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${getTypeColor(notification.type)}`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-neutral-900">
                            {notification.title}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                            {notification.status}
                          </span>
                        </div>
                        <p className="text-neutral-600 mb-4 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-neutral-500">
                          <span className="inline-flex items-center gap-1">
                            {getChannelIcon(notification.channel)}
                            {notification.channel.replace('_', ' ')}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {getAudienceLabel(notification.audience)}
                          </span>
                          {notification.sent_at && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Sent: {new Date(notification.sent_at).toLocaleDateString()}
                            </span>
                          )}
                          {notification.scheduled_at && notification.status === 'scheduled' && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Scheduled: {new Date(notification.scheduled_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {notification.sent_count !== undefined && (
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <span className="text-green-600">
                              Sent to {notification.sent_count} recipients
                            </span>
                            {notification.read_count !== undefined && (
                              <span className="text-blue-600">
                                {notification.read_count} read ({notification.sent_count > 0 ? ((notification.read_count / notification.sent_count) * 100).toFixed(0) : 0}%)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {notification.status === 'draft' && (
                        <Button
                          size="sm"
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleSendNow(notification.id)}
                        >
                          <Send className="h-4 w-4" />
                          Send Now
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-neutral-900 mb-6">Create Notification</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                  placeholder="Notification title..."
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Message</label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                  placeholder="Notification message..."
                  rows={4}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="notif-type" className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                  <select
                    id="notif-type"
                    value={newNotification.type}
                    onChange={(e) => setNewNotification({...newNotification, type: e.target.value as any})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="alert">Alert</option>
                    <option value="success">Success</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="notif-channel" className="block text-sm font-medium text-neutral-700 mb-1">Channel</label>
                  <select
                    id="notif-channel"
                    value={newNotification.channel}
                    onChange={(e) => setNewNotification({...newNotification, channel: e.target.value as any})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="in_app">In-App</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push Notification</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="notif-audience" className="block text-sm font-medium text-neutral-700 mb-1">Audience</label>
                  <select
                    id="notif-audience"
                    value={newNotification.audience}
                    onChange={(e) => setNewNotification({...newNotification, audience: e.target.value as any})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all_members">All Members</option>
                    <option value="active_members">Active Members</option>
                    <option value="advisors">Advisors</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewNotification({
                    title: '',
                    message: '',
                    type: 'info',
                    channel: 'in_app',
                    audience: 'all_members'
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateNotification}
                disabled={!newNotification.title.trim() || !newNotification.message.trim()}
              >
                Create Draft
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

export default NotificationsAdmin;

