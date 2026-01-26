// Jitsi Meet Integration Service
export interface JitsiMeetingConfig {
  roomName: string;
  domain?: string;
  userInfo?: {
    displayName?: string;
    email?: string;
    avatarUrl?: string;
  };
  configOverwrite?: Record<string, unknown>;
  interfaceConfigOverwrite?: Record<string, unknown>;
}

export const jitsiService = {
  // Meeting management
  generateRoomName: (): string => `mpb-meeting-${Date.now()}`,

  getMeetingUrl: (roomName: string, domain = 'meet.jit.si'): string =>
    `https://${domain}/${roomName}`,

  createMeetingConfig: (options: Partial<JitsiMeetingConfig>): JitsiMeetingConfig => ({
    roomName: options.roomName || `mpb-meeting-${Date.now()}`,
    domain: options.domain || 'meet.jit.si',
    userInfo: options.userInfo,
    configOverwrite: {
      startWithAudioMuted: true,
      startWithVideoMuted: false,
      ...options.configOverwrite,
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_BRAND_WATERMARK: false,
      ...options.interfaceConfigOverwrite,
    },
  }),

  // JWT authentication (for self-hosted Jitsi)
  generateJWT: async (_roomName: string, _userInfo: Record<string, unknown>): Promise<string | null> => null,
};
