import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Video,
  Calendar,
  Clock,
  Users,
  FileText,
  ExternalLink,
  Radio,
} from 'lucide-react';
import { meetingService, type AdvisorMeeting } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';
import JitsiMeetRoom from '../components/JitsiMeetRoom';

export default function MeetingRoom() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { profile, refreshMeetings } = useAdvisor();
  const [meeting, setMeeting] = useState<AdvisorMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [inMeeting, setInMeeting] = useState(false);

  useEffect(() => {
    const loadMeeting = async () => {
      if (!meetingId) return;

      try {
        const m = await meetingService.getMeeting(meetingId);
        setMeeting(m);
      } catch (err) {
        toast.error('Failed to load meeting');
        navigate('/meetings');
      } finally {
        setLoading(false);
      }
    };

    loadMeeting();
  }, [meetingId, navigate]);

  // Subscribe to meeting updates
  useEffect(() => {
    if (!meetingId) return;

    const channel = meetingService.subscribeMeetingUpdates(meetingId, (updated) => {
      setMeeting(updated);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [meetingId]);

  const handleJoin = async () => {
    if (!profile || !meetingId) return;

    try {
      await meetingService.recordAttendance(meetingId, profile.id);
      setInMeeting(true);
    } catch (err) {
      toast.error('Failed to join meeting');
    }
  };

  const handleLeave = async () => {
    if (!profile || !meetingId) return;

    try {
      await meetingService.recordLeave(meetingId, profile.id);
      setInMeeting(false);
      await refreshMeetings();
    } catch (err) {
      console.error('Failed to record leave:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600"></div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <p className="text-th-text-tertiary">Meeting not found</p>
        <button
          onClick={() => navigate('/meetings')}
          className="mt-4 text-th-accent-600 hover:text-th-accent-700 font-medium"
        >
          Back to Meetings
        </button>
      </div>
    );
  }

  const isLive = meeting.status === 'live';
  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : 'Anonymous';

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/meetings')}
        className="flex items-center space-x-2 text-th-text-secondary hover:text-th-text-primary"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Meetings</span>
      </button>

      {/* Meeting info */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                isLive ? 'bg-red-100 dark:bg-red-900/30' : 'bg-purple-100 dark:bg-purple-900/30'
              }`}
            >
              {isLive ? (
                <Radio className="w-7 h-7 text-red-600 dark:text-red-400 animate-pulse" />
              ) : (
                <Video className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-th-text-primary">
                  {meeting.title}
                </h1>
                {isLive && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 mt-2 text-sm text-th-text-tertiary">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(meeting.scheduled_at), 'EEEE, MMMM d, yyyy')}
                  </span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{format(new Date(meeting.scheduled_at), 'h:mm a')}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{meeting.duration_minutes} minutes</span>
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
        </div>

        {meeting.description && (
          <p className="text-th-text-secondary mt-4">{meeting.description}</p>
        )}
      </div>

      {/* Meeting room */}
      {(isLive || meeting.status === 'scheduled') && (
        <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
          {inMeeting ? (
            <JitsiMeetRoom
              meeting={meeting}
              displayName={displayName}
              onJoin={handleJoin}
              onLeave={handleLeave}
            />
          ) : (
            <div className="p-12 text-center">
              <Video className="w-16 h-16 mx-auto mb-4 text-th-text-tertiary" />
              <h3 className="text-lg font-semibold text-th-text-primary mb-2">
                {isLive ? 'Meeting is Live!' : 'Meeting Room'}
              </h3>
              <p className="text-th-text-tertiary mb-6">
                {isLive
                  ? 'Click below to join the meeting in progress'
                  : 'Click below to join when the meeting starts'}
              </p>
              <button
                onClick={handleJoin}
                className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                  isLive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-th-accent-600 text-white hover:bg-th-accent-700'
                }`}
              >
                {isLive ? 'Join Live Meeting' : 'Join Meeting'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Meeting resources */}
      {meeting.resources && meeting.resources.length > 0 && (
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="font-semibold text-th-text-primary mb-4">Meeting Resources</h2>
          <div className="space-y-3">
            {meeting.resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border border-th-border hover:border-th-accent-300 hover:bg-th-accent-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-th-text-tertiary" />
                  <span className="font-medium text-th-text-secondary">
                    {resource.name}
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-th-text-tertiary" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Meeting recording */}
      {meeting.status === 'completed' && meeting.recording_url && (
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="font-semibold text-th-text-primary mb-4">Meeting Recording</h2>
          <div className="aspect-video bg-neutral-900 dark:bg-black rounded-lg">
            <video
              src={meeting.recording_url}
              controls
              className="w-full h-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
