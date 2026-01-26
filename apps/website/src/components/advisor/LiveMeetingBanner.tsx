import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, Users, Play, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AdvisorMeeting, getActiveMeeting } from '../../lib/advisorMeetingService';
import { cn } from '../../lib/utils';

interface LiveMeetingBannerProps {
  className?: string;
  compact?: boolean;
  onDismiss?: () => void;
}

export function LiveMeetingBanner({ className, compact = false, onDismiss }: LiveMeetingBannerProps) {
  const [meeting, setMeeting] = useState<AdvisorMeeting | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForLiveMeeting();
    // Poll every 30 seconds
    const interval = setInterval(checkForLiveMeeting, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkForLiveMeeting = async () => {
    try {
      const activeMeeting = await getActiveMeeting();
      setMeeting(activeMeeting);
    } catch (error) {
      console.error('Error checking for live meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (loading || !meeting || dismissed) {
    return null;
  }

  if (compact) {
    return (
      <Link
        to={`/advisor/meetings?join=${meeting.id}`}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-all',
          className
        )}
      >
        <div className="relative">
          <Video className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-0 text-xs">LIVE</Badge>
            <span className="font-medium truncate">{meeting.title}</span>
          </div>
        </div>
        <Play className="w-4 h-4" />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        'relative rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white overflow-hidden',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

      <div className="relative p-6">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-between">
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
              <h3 className="text-xl font-bold">{meeting.title}</h3>
              {meeting.description && (
                <p className="text-green-100 text-sm mt-1 line-clamp-1">{meeting.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-green-100">
                {meeting.started_at && (
                  <span>
                    Started{' '}
                    {new Date(meeting.started_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                )}
                {meeting.attendee_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {meeting.attendee_count} in meeting
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            size="lg"
            className="bg-white text-green-600 hover:bg-green-50 shadow-lg"
            asChild
          >
            <Link to={`/advisor/meetings?join=${meeting.id}`}>
              <Play className="w-5 h-5 mr-2" />
              Join Now
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
