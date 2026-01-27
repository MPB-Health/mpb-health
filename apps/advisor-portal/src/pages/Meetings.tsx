import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Radio,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  meetingService,
  type MeetingInvitation,
} from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';

export default function Meetings() {
  const navigate = useNavigate();
  const { profile, upcomingMeetings, liveMeetings, refreshMeetings } = useAdvisor();
  const [invitations, setInvitations] = useState<MeetingInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvitations = async () => {
      if (!profile) return;

      try {
        const invites = await meetingService.getInvitations(profile.id);
        setInvitations(invites);
      } catch (err) {
        console.error('Failed to load invitations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInvitations();
  }, [profile?.id]);

  const respondToInvitation = async (
    invitationId: string,
    status: 'accepted' | 'declined' | 'tentative'
  ) => {
    try {
      await meetingService.respondToInvitation(invitationId, status);
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === invitationId ? { ...inv, status } : inv))
      );
      await refreshMeetings();
      toast.success(
        status === 'accepted'
          ? 'Invitation accepted!'
          : status === 'declined'
          ? 'Invitation declined'
          : 'Marked as tentative'
      );
    } catch (err) {
      toast.error('Failed to respond to invitation');
    }
  };

  const formatMeetingDate = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEE, MMM d');
  };

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === 'pending' && !isPast(new Date(inv.meeting?.scheduled_at || ''))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-th-text-primary">Meetings</h1>
        <p className="text-th-text-tertiary text-sm mt-1">
          View and join your scheduled meetings
        </p>
      </div>

      {/* Live meetings */}
      {liveMeetings.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-400 mb-4">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="font-semibold">Live Now</span>
          </div>
          <div className="space-y-3">
            {liveMeetings.map((meeting) => (
              <button
                key={meeting.id}
                onClick={() => navigate(`/meetings/${meeting.id}`)}
                className="w-full flex items-center justify-between p-4 bg-surface-primary rounded-lg border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <Video className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-th-text-primary">{meeting.title}</p>
                    <p className="text-sm text-th-text-tertiary">
                      {meeting.duration_minutes} minutes
                    </p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium">
                  Join Now
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-400 mb-4">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold">Pending Invitations</span>
          </div>
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-surface-primary rounded-lg border border-yellow-200 dark:border-yellow-800 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-th-text-primary">
                      {invitation.meeting?.title}
                    </p>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-th-text-tertiary">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {invitation.meeting?.scheduled_at &&
                            format(
                              new Date(invitation.meeting.scheduled_at),
                              'MMM d, h:mm a'
                            )}
                        </span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{invitation.meeting?.duration_minutes} min</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => respondToInvitation(invitation.id, 'accepted')}
                      className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                      title="Accept"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => respondToInvitation(invitation.id, 'tentative')}
                      className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                      title="Tentative"
                    >
                      <HelpCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => respondToInvitation(invitation.id, 'declined')}
                      className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      title="Decline"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming meetings */}
      <div className="bg-surface-primary rounded-xl border border-th-border">
        <div className="p-5 border-b border-th-border-subtle">
          <h2 className="font-semibold text-th-text-primary">Upcoming Meetings</h2>
        </div>
        <div className="divide-y divide-th-border-subtle">
          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map((meeting) => (
              <button
                key={meeting.id}
                onClick={() => navigate(`/meetings/${meeting.id}`)}
                className="w-full flex items-center justify-between p-5 hover:bg-surface-tertiary transition-colors text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Video className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-th-text-primary">{meeting.title}</p>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-th-text-tertiary">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatMeetingDate(meeting.scheduled_at)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(meeting.scheduled_at), 'h:mm a')}
                        </span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{meeting.duration_minutes} min</span>
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    meeting.meeting_type === 'training'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : meeting.meeting_type === 'team'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      : 'bg-surface-tertiary text-th-text-secondary'
                  }`}
                >
                  {meeting.meeting_type}
                </span>
              </button>
            ))
          ) : (
            <div className="p-12 text-center">
              <Video className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
              <p className="text-th-text-tertiary">No upcoming meetings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
