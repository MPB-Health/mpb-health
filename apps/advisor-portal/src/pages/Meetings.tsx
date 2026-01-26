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
        <h1 className="text-2xl font-bold text-neutral-900">Meetings</h1>
        <p className="text-neutral-500 text-sm mt-1">
          View and join your scheduled meetings
        </p>
      </div>

      {/* Live meetings */}
      {liveMeetings.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-red-700 mb-4">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="font-semibold">Live Now</span>
          </div>
          <div className="space-y-3">
            {liveMeetings.map((meeting) => (
              <button
                key={meeting.id}
                onClick={() => navigate(`/meetings/${meeting.id}`)}
                className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-red-200 hover:border-red-300 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Video className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-neutral-900">{meeting.title}</p>
                    <p className="text-sm text-neutral-500">
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-yellow-700 mb-4">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold">Pending Invitations</span>
          </div>
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-white rounded-lg border border-yellow-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {invitation.meeting?.title}
                    </p>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-neutral-500">
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
                      className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      title="Accept"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => respondToInvitation(invitation.id, 'tentative')}
                      className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                      title="Tentative"
                    >
                      <HelpCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => respondToInvitation(invitation.id, 'declined')}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
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
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-5 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">Upcoming Meetings</h2>
        </div>
        <div className="divide-y divide-neutral-100">
          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map((meeting) => (
              <button
                key={meeting.id}
                onClick={() => navigate(`/meetings/${meeting.id}`)}
                className="w-full flex items-center justify-between p-5 hover:bg-neutral-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Video className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">{meeting.title}</p>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-neutral-500">
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
                      ? 'bg-blue-100 text-blue-700'
                      : meeting.meeting_type === 'team'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {meeting.meeting_type}
                </span>
              </button>
            ))
          ) : (
            <div className="p-12 text-center">
              <Video className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
              <p className="text-neutral-500">No upcoming meetings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
