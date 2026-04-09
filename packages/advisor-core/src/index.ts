// Types
export * from './types';

// Training gate (grandfather cutoff + exemption helper)
export {
  DEFAULT_ADVISOR_TRAINING_GATE_CUTOFF_ISO,
  resolveAdvisorTrainingGateCutoffMs,
  isAdvisorExemptFromTrainingGate,
} from './training/trainingGatePolicy';

// Services
export { TrainingService, trainingService } from './training/TrainingService';
export { MeetingService, meetingService } from './meetings/MeetingService';
export { ContentService, contentService } from './content/ContentService';
export { FormsService, formsService } from './forms/FormsService';
export { ProfileService, profileService } from './profile/ProfileService';
export { AdvisorLeadService, advisorLeadService } from './leads/advisorLeadService';
export { NavigationService, navigationService, type NavMenuItem, type QuickLink } from './navigation/NavigationService';
export { VideoService, videoService, type AdvisorVideo } from './videos/VideoService';
export { EnrollmentService, enrollmentService, type EnrollmentLink } from './enrollment/EnrollmentService';
export { PortalSettingsService, portalSettingsService, type PortalSetting } from './settings/PortalSettingsService';
export { AnnouncementService, announcementService, type Announcement } from './announcements/AnnouncementService';
export type { AssignedLeadView, LeadDetail, LeadActivity } from './leads/types';
export {
  TicketService,
  ticketService,
  appendTicketAttachmentsHtml,
  type Ticket,
  type TicketDetail,
  type TicketStats,
  type TicketComment,
  type TicketContentFormat,
  type TicketStatus,
  type TicketPriority,
  type TicketListResult,
  type ListTicketsOptions,
  type AdminTicket,
  type AdminTicketDetail,
  type AdminTicketListResult,
  type AdminListTicketsOptions,
  type CreateTicketOptions,
  type CreateTicketResult,
  type UpdateTicketOptions,
  type TicketRequester,
  type TicketAttachmentUploadResult,
} from './support/TicketService';
export { ChatService, chatService } from './chat/ChatService';
export type { ChatConversation, ChatConversationType, ChatMember, ChatMemberRole, ChatMessage, ChatSearchResult, ChatUserSearchResult, ListMessagesResult, CreateChannelOptions } from './chat/types';
export { PushService, pushService, type PushSubscriptionData, type PushSettings } from './push/PushService';
export { EventsService, eventsService, type EventFilters } from './events/EventsService';
