import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Play,
  ExternalLink,
  ChevronRight,
  CalendarDays,
  History,
  Bell,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/Badge';
import { JitsiMeetRoom } from '../../components/advisor/JitsiMeetRoom';
import {
  advisorMeetingService,
  AdvisorMeeting,
  getActiveMeeting,
  getUpcomingMeetings,
  getPastMeetings,
  joinMeeting,
} from '../../lib/advisorMeetingService';
import { advisorAuthService } from '../../lib/advisorAuthService';
import { cn } from '../../lib/utils';

export default function AdvisorMeetings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const joinMeetingId = searchParams.get('join');

  const [activeMeeting, setActiveMeeting] = useState<AdvisorMeeting | null>(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState<AdvisorMeeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<AdvisorMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [inMeeting, setInMeeting] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<AdvisorMeeting | null>(null);
  const [advisorProfile, setAdvisorProfile] = useState<any>(null);
  const [attendeeId, setAttendeeId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    // Auto-join if meeting ID in URL
    if (joinMeetingId && activeMeeting && activeMeeting.id === joinMeetingId) {
      handleJoinMeeting(activeMeeting);
    }
  }, [joinMeetingId, activeMeeting]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [active, upcoming, past, profile] = await Promise.all([
        getActiveMeeting(),
        getUpcomingMeetings(5),
        getPastMeetings(10),
        advisorAuthService.getAdvisorProfile(user.id),
      ]);

      setActiveMeeting(active);
      setUpcomingMeetings(upcoming);
      setPastMeetings(past);
      setAdvisorProfile(profile);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = async (meeting: AdvisorMeeting) => {
    try {
      // Record attendance
      const attendee = await joinMeeting(meeting.id, {
        advisorId: advisorProfile?.id,
        email: user?.email || undefined,
        name: advisorProfile ? `${advisorProfile.first_name} ${advisorProfile.last_name}` : user?.email,
      });
      setAttendeeId(attendee.id);
      setCurrentMeeting(meeting);
      setInMeeting(true);
    } catch (error) {
      console.error('Error joining meeting:', error);
      // Still allow joining even if attendance tracking fails
      setCurrentMeeting(meeting);
      setInMeeting(true);
    }
  };

  const handleLeaveMeeting = async () => {
    if (attendeeId) {
      try {
        await advisorMeetingService.leaveMeeting(attendeeId);
      } catch (error) {
        console.error('Error recording leave:', error);
      }
    }
    setInMeeting(false);
    setCurrentMeeting(null);
    setAttendeeId(null);
    loadData(); // Refresh data
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
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

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meetings...</p>
        </div>
      </div>
    );
  }

  // In-meeting view
  if (inMeeting && currentMeeting) {
    return (
      <>
        <Helmet>
          <title>{currentMeeting.title} | MPB Health Advisor Portal</title>
        </Helmet>
        <div className="h-screen bg-gray-900 p-4">
          <JitsiMeetRoom
            meeting={currentMeeting}
            userDisplayName={
              advisorProfile
                ? `${advisorProfile.first_name} ${advisorProfile.last_name}`
                : user?.email || 'Advisor'
            }
            userEmail={user?.email || ''}
            onLeave={handleLeaveMeeting}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Advisor Meetings | MPB Health Advisor Portal</title>
        <meta
          name="description"
          content="Join video conferences with the MPB Health team and fellow advisors."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                <Video className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Advisor Meetings</h1>
                <p className="text-gray-600">
                  Join video conferences with the MPB Health business development team
                </p>
              </div>
            </div>
          </div>

          {/* Live Meeting Banner */}
          {activeMeeting && (
            <Card className="mb-8 p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="p-4 bg-white/20 rounded-xl">
                      <Video className="w-8 h-8" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                    </span>
                  </div>
                  <div>
                    <Badge className="bg-white/20 text-white border-0 mb-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                      LIVE NOW
                    </Badge>
                    <h2 className="text-2xl font-bold">{activeMeeting.title}</h2>
                    <p className="text-green-100 mt-1">
                      Started {new Date(activeMeeting.started_at!).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {activeMeeting.attendee_count > 0 && (
                        <span className="ml-3">
                          <Users className="w-4 h-4 inline mr-1" />
                          {activeMeeting.attendee_count} attendees
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="bg-white text-green-600 hover:bg-green-50"
                  onClick={() => handleJoinMeeting(activeMeeting)}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Join Meeting
                </Button>
              </div>
            </Card>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Meetings */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-blue-600" />
                    Upcoming Meetings
                  </h2>
                </div>

                {upcomingMeetings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingMeetings.map((meeting) => {
                      const { date, time } = formatDateTime(meeting.scheduled_at);
                      const timeUntil = getTimeUntil(meeting.scheduled_at);

                      return (
                        <div
                          key={meeting.id}
                          className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-blue-100 rounded-xl">
                                <Calendar className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{meeting.description}</p>
                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {date}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {time}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {meeting.duration_minutes} min
                                  </span>
                                </div>
                                {meeting.is_recurring && (
                                  <Badge variant="outline" className="mt-2">
                                    {meeting.recurrence_pattern === 'biweekly'
                                      ? 'Bi-weekly'
                                      : meeting.recurrence_pattern}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-600 border-blue-200"
                              >
                                In {timeUntil}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No upcoming meetings scheduled</p>
                  </div>
                )}
              </Card>

              {/* Past Meetings */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-600" />
                    Past Meetings
                  </h2>
                </div>

                {pastMeetings.length > 0 ? (
                  <div className="space-y-3">
                    {pastMeetings.map((meeting) => {
                      const { date, time } = formatDateTime(meeting.scheduled_at);

                      return (
                        <div
                          key={meeting.id}
                          className="p-4 rounded-lg bg-gray-50 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                              <p className="text-sm text-gray-500">
                                {date} at {time}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-gray-600">
                              <Users className="w-3 h-3 mr-1" />
                              {meeting.attendee_count} attended
                            </Badge>
                            {meeting.recording_url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={meeting.recording_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Recording
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No past meetings yet</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Meeting Tips */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-600" />
                  Meeting Tips
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Join a few minutes early to test your audio and video</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Use headphones to reduce echo and background noise</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Find a quiet, well-lit location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Have the Playbook and Bulletins open for reference</span>
                  </li>
                </ul>
              </Card>

              {/* Notifications */}
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  Get Notified
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Receive email reminders before scheduled meetings so you never miss an update.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Manage Notifications
                </Button>
              </Card>

              {/* Quick Links */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-4">During Meetings</h3>
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                    <a href="/advisor/playbook" target="_blank">
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Advisor Playbook
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                    <a href="/advisor/content" target="_blank">
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Latest Bulletins
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                    <a href="/advisor/training-university" target="_blank">
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Training University
                    </a>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
