import { useState, useEffect } from 'react';
import {
  Video,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Users,
  Play,
  Square,
  Calendar,
  Zap,
  ChevronRight,
  Mail,
  Check,
  X,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Copy,
  ExternalLink,
  History,
  UserPlus,
  Globe,
  Lock,
  UserCheck,
  Bell,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { MeetingScheduler, MeetingFormData, MeetingTemplate, AdvisorForSelection } from './MeetingScheduler';
import {
  advisorMeetingService,
  AdvisorMeeting,
  MeetingInvitation,
  MeetingWithInvitations,
} from '../../lib/advisorMeetingService';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

// ============================================================================
// Types
// ============================================================================

type ViewMode = 'list' | 'calendar';
type FilterStatus = 'all' | 'live' | 'scheduled' | 'completed' | 'cancelled';

interface MeetingManagementProps {
  onMeetingStart?: (meeting: AdvisorMeeting) => void;
  onMeetingEnd?: (meeting: AdvisorMeeting) => void;
}

// ============================================================================
// Component
// ============================================================================

export function MeetingManagement({ onMeetingStart, onMeetingEnd }: MeetingManagementProps) {
  // State
  const [meetings, setMeetings] = useState<AdvisorMeeting[]>([]);
  const [templates, setTemplates] = useState<MeetingTemplate[]>([]);
  const [advisors, setAdvisors] = useState<AdvisorForSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI State
  const [showScheduler, setShowScheduler] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<AdvisorMeeting | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingWithInvitations | null>(null);
  const [showInvitations, setShowInvitations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [meetingsData, templatesData, advisorsData] = await Promise.all([
        advisorMeetingService.getMeetings(),
        loadTemplates(),
        loadAdvisors(),
      ]);

      setMeetings(meetingsData);
      setTemplates(templatesData);
      setAdvisors(advisorsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const meetingsData = await advisorMeetingService.getMeetings();
      setMeetings(meetingsData);
    } finally {
      setRefreshing(false);
    }
  };

  const loadTemplates = async (): Promise<MeetingTemplate[]> => {
    try {
      const data = await advisorMeetingService.getMeetingTemplates();
      return data;
    } catch {
      // Templates might not exist yet
      return [];
    }
  };

  const loadAdvisors = async (): Promise<AdvisorForSelection[]> => {
    const { data, error } = await supabase
      .from('advisor_profiles')
      .select('id, first_name, last_name, email, status, avatar_url')
      .eq('status', 'active')
      .order('first_name');

    if (error) {
      console.error('Error loading advisors:', error);
      return [];
    }

    return data || [];
  };

  // Meeting Actions
  const handleScheduleMeeting = async (formData: MeetingFormData, startNow: boolean) => {
    try {
      const scheduledAt = startNow
        ? new Date().toISOString()
        : new Date(`${formData.scheduled_at}T${formData.scheduled_time}`).toISOString();

      if (startNow) {
        // Create instant meeting
        const meeting = await advisorMeetingService.createInstantMeeting(formData.title, {
          visibility: formData.visibility,
          selectedAdvisors: formData.selected_advisors,
          meetingType: formData.meeting_type,
        });

        toast.success('Meeting started! Advisors have been notified.');
        onMeetingStart?.(meeting);
      } else {
        // Schedule meeting
        await advisorMeetingService.createMeetingWithInvitations({
          title: formData.title,
          description: formData.description,
          scheduled_at: scheduledAt,
          duration_minutes: formData.duration_minutes,
          is_recurring: formData.is_recurring,
          recurrence_pattern: formData.recurrence_pattern || undefined,
          agenda: formData.agenda,
          visibility: formData.visibility,
          meeting_type: formData.meeting_type,
          selected_advisors: formData.selected_advisors,
          auto_record: formData.auto_record,
          reminder_minutes: formData.reminder_minutes,
          passcode: formData.passcode,
        });

        toast.success('Meeting scheduled successfully!');
      }

      setShowScheduler(false);
      loadData();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast.error('Failed to schedule meeting');
      throw error;
    }
  };

  const handleStartMeeting = async (meeting: AdvisorMeeting) => {
    try {
      const updated = await advisorMeetingService.startMeeting(meeting.id);
      toast.success('Meeting started! Advisors can now join.');
      onMeetingStart?.(updated);
      loadData();
    } catch (error) {
      console.error('Error starting meeting:', error);
      toast.error('Failed to start meeting');
    }
  };

  const handleEndMeeting = async (meeting: AdvisorMeeting) => {
    try {
      const updated = await advisorMeetingService.endMeeting(meeting.id);
      toast.success('Meeting ended');
      onMeetingEnd?.(updated);
      loadData();
    } catch (error) {
      console.error('Error ending meeting:', error);
      toast.error('Failed to end meeting');
    }
  };

  const handleDeleteMeeting = async (meeting: AdvisorMeeting) => {
    if (!confirm(`Delete "${meeting.title}"? This cannot be undone.`)) return;

    try {
      await advisorMeetingService.deleteMeeting(meeting.id);
      toast.success('Meeting deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error('Failed to delete meeting');
    }
  };

  const handleCancelMeeting = async (meeting: AdvisorMeeting) => {
    if (!confirm(`Cancel "${meeting.title}"? Invitees will be notified.`)) return;

    try {
      await advisorMeetingService.cancelMeeting(meeting.id);
      toast.success('Meeting cancelled');
      loadData();
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      toast.error('Failed to cancel meeting');
    }
  };

  const handleViewInvitations = async (meeting: AdvisorMeeting) => {
    try {
      const meetingWithInvitations = await advisorMeetingService.getMeetingWithInvitations(meeting.id);
      setSelectedMeeting(meetingWithInvitations);
      setShowInvitations(true);
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast.error('Failed to load invitations');
    }
  };

  const handleSendReminders = async (meetingId: string) => {
    try {
      await advisorMeetingService.sendMeetingReminder(meetingId);
      toast.success('Reminders sent to all invitees');
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast.error('Failed to send reminders');
    }
  };

  const copyMeetingLink = (meeting: AdvisorMeeting) => {
    const link = advisorMeetingService.getJitsiMeetingUrl(meeting.room_name);
    navigator.clipboard.writeText(link);
    toast.success('Meeting link copied to clipboard');
  };

  // Filter meetings
  const filteredMeetings = meetings
    .filter(m => {
      if (filterStatus !== 'all' && m.status !== filterStatus) return false;
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(search) ||
          m.description?.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .sort((a, b) => {
      // Live meetings first, then by scheduled date
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
    });

  // Stats
  const stats = {
    live: meetings.filter(m => m.status === 'live').length,
    scheduled: meetings.filter(m => m.status === 'scheduled' && new Date(m.scheduled_at) > new Date()).length,
    completed: meetings.filter(m => m.status === 'completed').length,
    totalAttendees: meetings.reduce((sum, m) => sum + (m.attendee_count || 0), 0),
  };

  // Format helpers
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const getTimeUntil = (dateStr: string) => {
    const now = new Date();
    const target = new Date(dateStr);
    const diff = target.getTime() - now.getTime();

    if (diff < 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    return `in ${minutes}m`;
  };

  const getVisibilityIcon = (visibility?: string) => {
    switch (visibility) {
      case 'all': return <Globe className="w-4 h-4" />;
      case 'selected': return <UserCheck className="w-4 h-4" />;
      case 'private': return <Lock className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Manage Advisor Meetings</h3>
          <p className="text-sm text-gray-600">Schedule and manage video conferences with advisors</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingMeeting(null);
              setShowScheduler(true);
            }}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </Button>
          <Button
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            onClick={() => {
              setEditingMeeting(null);
              setShowScheduler(true);
            }}
          >
            <Zap className="w-4 h-4 mr-2" />
            Start Instant Meeting
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center justify-between mb-1">
            <Video className="w-5 h-5 text-green-600" />
            {stats.live > 0 && (
              <Badge className="bg-red-100 text-red-700 text-xs animate-pulse">LIVE</Badge>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.live}</div>
          <div className="text-sm text-gray-600">Active Now</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <Clock className="w-5 h-5 text-blue-600 mb-1" />
          <div className="text-2xl font-bold text-gray-900">{stats.scheduled}</div>
          <div className="text-sm text-gray-600">Upcoming</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
          <History className="w-5 h-5 text-purple-600 mb-1" />
          <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
          <Users className="w-5 h-5 text-orange-600 mb-1" />
          <div className="text-2xl font-bold text-gray-900">{stats.totalAttendees}</div>
          <div className="text-sm text-gray-600">Total Attendees</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          {(['all', 'live', 'scheduled', 'completed', 'cancelled'] as FilterStatus[]).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                filterStatus === status
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <div className="p-12 text-center bg-gray-50 rounded-lg border border-gray-200">
          <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || filterStatus !== 'all'
              ? 'No meetings match your filters'
              : 'No meetings scheduled'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Schedule your first advisor meeting'}
          </p>
          <Button onClick={() => setShowScheduler(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => {
            const { date, time } = formatDateTime(meeting.scheduled_at);
            const isUpcoming = meeting.status === 'scheduled' && new Date(meeting.scheduled_at) > new Date();

            return (
              <div
                key={meeting.id}
                className={cn(
                  'p-4 border rounded-lg transition-all',
                  meeting.status === 'live'
                    ? 'bg-green-50 border-green-300 shadow-md'
                    : meeting.status === 'completed'
                    ? 'bg-gray-50 border-gray-200'
                    : meeting.status === 'cancelled'
                    ? 'bg-red-50 border-red-200 opacity-60'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'p-3 rounded-xl',
                      meeting.status === 'live' ? 'bg-green-100' : 'bg-blue-100'
                    )}>
                      <Video className={cn(
                        'w-6 h-6',
                        meeting.status === 'live' ? 'text-green-600' : 'text-blue-600'
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900">{meeting.title}</h4>
                        {meeting.status === 'live' && (
                          <Badge className="bg-red-600 text-white text-xs animate-pulse">
                            <span className="w-2 h-2 bg-white rounded-full mr-1 inline-block"></span>
                            LIVE
                          </Badge>
                        )}
                        {meeting.status === 'completed' && (
                          <Badge variant="outline" className="text-gray-600">Completed</Badge>
                        )}
                        {meeting.status === 'cancelled' && (
                          <Badge variant="outline" className="text-red-600 border-red-300">Cancelled</Badge>
                        )}
                        {meeting.is_recurring && (
                          <Badge variant="outline" className="text-blue-600">
                            {meeting.recurrence_pattern === 'biweekly' ? 'Bi-weekly' : meeting.recurrence_pattern}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-gray-500">
                          {getVisibilityIcon((meeting as any).visibility)}
                          <span className="ml-1">{(meeting as any).visibility || 'all'}</span>
                        </Badge>
                      </div>
                      {meeting.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{meeting.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {time}
                        </span>
                        <span>{meeting.duration_minutes} min</span>
                        {meeting.attendee_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {meeting.attendee_count} attended
                          </span>
                        )}
                        {isUpcoming && (
                          <Badge variant="outline" className="text-blue-600 bg-blue-50">
                            {getTimeUntil(meeting.scheduled_at)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {meeting.status === 'scheduled' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleStartMeeting(meeting)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewInvitations(meeting)}
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Invites
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendReminders(meeting.id)}
                        >
                          <Bell className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {meeting.status === 'live' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyMeetingLink(meeting)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Link
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => handleEndMeeting(meeting)}
                        >
                          <Square className="w-4 h-4 mr-1" />
                          End
                        </Button>
                      </>
                    )}
                    {(meeting.status === 'scheduled' || meeting.status === 'live') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingMeeting(meeting);
                          setShowScheduler(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                    {meeting.status !== 'live' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteMeeting(meeting)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Meeting Scheduler Modal */}
      {showScheduler && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <MeetingScheduler
            templates={templates}
            advisors={advisors}
            onSchedule={handleScheduleMeeting}
            onCancel={() => {
              setShowScheduler(false);
              setEditingMeeting(null);
            }}
            initialData={editingMeeting ? {
              title: editingMeeting.title,
              description: editingMeeting.description || '',
              scheduled_at: editingMeeting.scheduled_at.split('T')[0],
              scheduled_time: editingMeeting.scheduled_at.split('T')[1]?.slice(0, 5) || '09:00',
              duration_minutes: editingMeeting.duration_minutes,
              is_recurring: editingMeeting.is_recurring,
              recurrence_pattern: editingMeeting.recurrence_pattern,
              agenda: editingMeeting.agenda || '',
              visibility: (editingMeeting as any).visibility || 'all',
              meeting_type: (editingMeeting as any).meeting_type || 'group',
            } : undefined}
            isEditing={!!editingMeeting}
          />
        </div>
      )}

      {/* Invitations Modal */}
      {showInvitations && selectedMeeting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedMeeting.title}</h3>
                <p className="text-sm text-gray-600">Meeting Invitations</p>
              </div>
              <button
                onClick={() => {
                  setShowInvitations(false);
                  setSelectedMeeting(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Stats */}
              {selectedMeeting.invitation_stats && (
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {selectedMeeting.invitation_stats.total}
                    </div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-600">
                      {selectedMeeting.invitation_stats.accepted}
                    </div>
                    <div className="text-xs text-gray-500">Accepted</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-yellow-600">
                      {selectedMeeting.invitation_stats.pending}
                    </div>
                    <div className="text-xs text-gray-500">Pending</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-red-600">
                      {selectedMeeting.invitation_stats.declined}
                    </div>
                    <div className="text-xs text-gray-500">Declined</div>
                  </div>
                </div>
              )}

              {/* Invitations List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedMeeting.invitations?.map(invitation => (
                  <div
                    key={invitation.id}
                    className="p-3 border rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium',
                        invitation.status === 'accepted' ? 'bg-green-600' :
                        invitation.status === 'declined' ? 'bg-red-600' :
                        invitation.status === 'tentative' ? 'bg-yellow-600' : 'bg-gray-400'
                      )}>
                        {invitation.advisor?.first_name?.[0]}{invitation.advisor?.last_name?.[0]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {invitation.advisor?.first_name} {invitation.advisor?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{invitation.advisor?.email}</div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        invitation.status === 'accepted' && 'bg-green-50 text-green-700 border-green-200',
                        invitation.status === 'declined' && 'bg-red-50 text-red-700 border-red-200',
                        invitation.status === 'tentative' && 'bg-yellow-50 text-yellow-700 border-yellow-200',
                        invitation.status === 'pending' && 'bg-gray-50 text-gray-700 border-gray-200',
                      )}
                    >
                      {invitation.status === 'accepted' && <Check className="w-3 h-3 mr-1" />}
                      {invitation.status === 'declined' && <X className="w-3 h-3 mr-1" />}
                      {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                    </Badge>
                  </div>
                ))}

                {(!selectedMeeting.invitations || selectedMeeting.invitations.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>No invitations sent yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-between">
              <Button
                variant="outline"
                onClick={() => handleSendReminders(selectedMeeting.id)}
              >
                <Bell className="w-4 h-4 mr-2" />
                Send Reminders
              </Button>
              <Button onClick={() => setShowInvitations(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeetingManagement;
