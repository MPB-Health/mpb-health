import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  MessageSquare,
  Maximize2,
  Minimize2,
  BookOpen,
  FileText,
  GraduationCap,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { AdvisorMeeting, MeetingResource } from '../../lib/advisorMeetingService';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface JitsiMeetRoomProps {
  meeting: AdvisorMeeting;
  userDisplayName: string;
  userEmail: string;
  onLeave?: () => void;
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
}

export function JitsiMeetRoom({
  meeting,
  userDisplayName,
  userEmail,
  onLeave,
  onParticipantJoined,
  onParticipantLeft,
}: JitsiMeetRoomProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Load Jitsi script
  useEffect(() => {
    const loadJitsiScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Jitsi script'));
        document.body.appendChild(script);
      });
    };

    loadJitsiScript()
      .then(() => {
        initJitsi();
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, [meeting.room_name]);

  const initJitsi = useCallback(() => {
    if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) return;

    try {
      const domain = 'meet.jit.si';
      const options = {
        roomName: meeting.room_name,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          enableClosePage: false,
          disableInviteFunctions: false,
          subject: meeting.title,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          TOOLBAR_ALWAYS_VISIBLE: true,
          MOBILE_APP_PROMO: false,
          HIDE_INVITE_MORE_HEADER: true,
          DEFAULT_BACKGROUND: '#1e3a5f',
          TOOLBAR_BUTTONS: [
            'camera',
            'chat',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'hangup',
            'microphone',
            'participants-pane',
            'raisehand',
            'select-background',
            'settings',
            'tileview',
            'videoquality',
          ],
        },
        userInfo: {
          displayName: userDisplayName,
          email: userEmail,
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;

      // Event listeners
      api.addListener('videoConferenceJoined', () => {
        setIsLoading(false);
      });

      api.addListener('participantJoined', (participant: any) => {
        setParticipantCount((prev) => prev + 1);
        onParticipantJoined?.(participant);
      });

      api.addListener('participantLeft', (participant: any) => {
        setParticipantCount((prev) => Math.max(0, prev - 1));
        onParticipantLeft?.(participant);
      });

      api.addListener('audioMuteStatusChanged', (muted: { muted: boolean }) => {
        setIsAudioMuted(muted.muted);
      });

      api.addListener('videoMuteStatusChanged', (muted: { muted: boolean }) => {
        setIsVideoMuted(muted.muted);
      });

      api.addListener('readyToClose', () => {
        onLeave?.();
      });

      // Get initial participant count
      api.getNumberOfParticipants().then((count: number) => {
        setParticipantCount(count);
      });
    } catch (err) {
      setError('Failed to initialize video conference');
      setIsLoading(false);
    }
  }, [meeting.room_name, meeting.title, userDisplayName, userEmail, onLeave, onParticipantJoined, onParticipantLeft]);

  const toggleAudio = () => {
    jitsiApiRef.current?.executeCommand('toggleAudio');
  };

  const toggleVideo = () => {
    jitsiApiRef.current?.executeCommand('toggleVideo');
  };

  const hangUp = () => {
    jitsiApiRef.current?.executeCommand('hangup');
    onLeave?.();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      jitsiContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'playbook':
        return BookOpen;
      case 'bulletin':
        return FileText;
      case 'training':
        return GraduationCap;
      default:
        return ExternalLink;
    }
  };

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-600 mb-4">
          <VideoOff className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Unable to Join Meeting</h3>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </Card>
    );
  }

  return (
    <div className="flex h-full bg-gray-900 rounded-xl overflow-hidden">
      {/* Main Video Area */}
      <div className={cn('flex-1 flex flex-col relative', showSidebar ? 'mr-0' : '')}>
        {/* Video Container */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Joining meeting...</p>
              </div>
            </div>
          )}
          <div ref={jitsiContainerRef} className="absolute inset-0" />
        </div>

        {/* Bottom Controls */}
        <div className="bg-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-gray-700 text-white border-gray-600">
              <Users className="w-3 h-3 mr-1" />
              {participantCount} participants
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAudio}
              className={cn(
                'rounded-full p-3',
                isAudioMuted ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
              )}
            >
              {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVideo}
              className={cn(
                'rounded-full p-3',
                isVideoMuted ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
              )}
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={hangUp}
              className="rounded-full p-3 bg-red-600 hover:bg-red-700 text-white"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="rounded-full p-2 bg-gray-700 hover:bg-gray-600 text-white"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              className="rounded-full p-2 bg-gray-700 hover:bg-gray-600 text-white"
            >
              {showSidebar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar - Resources */}
      {showSidebar && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
            <p className="text-sm text-gray-500 mt-1">Resources & Tools</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Quick Access
              </h4>
              <div className="space-y-2">
                {meeting.resources && meeting.resources.length > 0 ? (
                  meeting.resources.map((resource: MeetingResource, index: number) => {
                    const Icon = getResourceIcon(resource.type);
                    return (
                      <Link
                        key={index}
                        to={resource.url}
                        target="_blank"
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{resource.title}</span>
                      </Link>
                    );
                  })
                ) : (
                  <>
                    <Link
                      to="/advisor/playbook"
                      target="_blank"
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Advisor Playbook</span>
                    </Link>
                    <Link
                      to="/advisor/content"
                      target="_blank"
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FileText className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Latest Bulletins</span>
                    </Link>
                    <Link
                      to="/advisor/training-university"
                      target="_blank"
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <GraduationCap className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Training University</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Meeting Agenda */}
            {meeting.agenda && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Agenda
                </h4>
                <Card className="p-3 bg-gray-50">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {meeting.agenda}
                  </pre>
                </Card>
              </div>
            )}

            {/* Chat */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Meeting Chat
              </h4>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => jitsiApiRef.current?.executeCommand('toggleChat')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Open Chat Panel
              </Button>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Need help? Contact support@mpbhealth.com
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
