import { useEffect, useRef } from 'react';
import { JITSI_CONFIG, type AdvisorMeeting } from '@mpbhealth/advisor-core';

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: unknown) => JitsiAPI;
  }
}

interface JitsiAPI {
  dispose: () => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
}

interface JitsiMeetRoomProps {
  meeting: AdvisorMeeting;
  displayName: string;
  onJoin?: () => void;
  onLeave?: () => void;
}

export default function JitsiMeetRoom({
  meeting,
  displayName,
  onJoin,
  onLeave,
}: JitsiMeetRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiAPI | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Jitsi Meet
    const api = new window.JitsiMeetExternalAPI(JITSI_CONFIG.domain, {
      roomName: meeting.room_name,
      parentNode: containerRef.current,
      userInfo: {
        displayName,
      },
      configOverwrite: {
        ...JITSI_CONFIG.options.configOverwrite,
        subject: meeting.title,
      },
      interfaceConfigOverwrite: JITSI_CONFIG.options.interfaceConfigOverwrite,
    });

    apiRef.current = api;

    // Event handlers
    api.on('videoConferenceJoined', () => {
      onJoin?.();
    });

    api.on('videoConferenceLeft', () => {
      onLeave?.();
    });

    // Apply password if set
    if (meeting.room_password) {
      api.on('participantRoleChanged', (event: { role: string }) => {
        if (event.role === 'moderator') {
          api.executeCommand('password', meeting.room_password);
        }
      });

      api.on('passwordRequired', () => {
        api.executeCommand('password', meeting.room_password);
      });
    }

    // Cleanup
    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [meeting.room_name, meeting.room_password, meeting.title, displayName, onJoin, onLeave]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[500px] bg-neutral-900 rounded-lg overflow-hidden"
    />
  );
}
