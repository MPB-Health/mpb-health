// Advisor Profile Types
export interface AdvisorProfile {
  id: string;
  user_id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  specialization: string;
  bio: string | null;
  avatar_url: string | null;
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Training Types
export interface TrainingModule {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content_type: 'video' | 'document' | 'interactive' | 'quiz' | 'external_link';
  content_url: string | null;
  thumbnail_url: string | null;
  duration_minutes: number;
  order_index: number;
  is_required: boolean;
  prerequisites: string[];
  created_at: string;
  updated_at: string;
}

export interface TrainingProgress {
  id: string;
  advisor_id: string;
  module_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  started_at: string | null;
  completed_at: string | null;
  time_spent_minutes: number;
  quiz_score: number | null;
  quiz_attempts: number;
  last_position: number | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  module_count?: number;
}

export interface Certification {
  id: string;
  advisor_id: string;
  name: string;
  description: string | null;
  issued_at: string;
  expires_at: string | null;
  certificate_url: string | null;
  badge_url: string | null;
  issuer: string;
  credential_id: string | null;
}

// Meeting Types
export interface AdvisorMeeting {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  room_name: string;
  room_password: string | null;
  host_id: string | null;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  meeting_type: 'training' | 'team' | 'one_on_one' | 'webinar' | 'other';
  max_participants: number | null;
  recording_url: string | null;
  resources: MeetingResource[];
  created_at: string;
  updated_at: string;
}

export interface MeetingResource {
  id: string;
  name: string;
  url: string;
  type: 'document' | 'video' | 'link' | 'presentation';
}

export interface MeetingAttendee {
  id: string;
  meeting_id: string;
  advisor_id: string;
  joined_at: string | null;
  left_at: string | null;
  duration_minutes: number | null;
  advisor?: AdvisorProfile;
}

export interface MeetingInvitation {
  id: string;
  meeting_id: string;
  advisor_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative' | 'no_response';
  responded_at: string | null;
  reminder_sent: boolean;
  created_at: string;
  meeting?: AdvisorMeeting;
  advisor?: AdvisorProfile;
}

export interface MeetingTemplate {
  id: string;
  name: string;
  description: string | null;
  default_duration: number;
  default_type: string;
  agenda_template: string | null;
  resources: MeetingResource[];
}

// Content Types
export interface SOPDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content: string;
  content_type: 'markdown' | 'html' | 'pdf';
  file_url: string | null;
  version: string;
  is_published: boolean;
  tags: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface SOPCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  document_count?: number;
}

export interface Handbook {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content: string;
  file_url: string | null;
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Bulletin {
  id: string;
  title: string;
  content: string;
  category: 'announcement' | 'update' | 'alert' | 'news';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_pinned: boolean;
  published_at: string;
  expires_at: string | null;
  author_id: string | null;
  author_name: string | null;
  read_by: string[];
  created_at: string;
}

// Form Types
export interface AdvisorForm {
  id: string;
  cognito_form_id: string;
  name: string;
  description: string | null;
  category: string;
  embed_url: string;
  is_active: boolean;
  submission_count: number;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  advisor_id: string;
  cognito_entry_id: string;
  data: Record<string, unknown>;
  status: 'submitted' | 'processing' | 'completed' | 'rejected';
  submitted_at: string;
  processed_at: string | null;
}

// Onboarding Types
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  step_type: 'form' | 'document' | 'training' | 'verification' | 'custom';
  order_index: number;
  is_required: boolean;
  action_url: string | null;
  action_label: string | null;
  estimated_minutes: number;
}

export interface OnboardingProgress {
  id: string;
  advisor_id: string;
  step_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

// Jitsi Configuration
export const JITSI_CONFIG = {
  domain: 'meet.jit.si',
  options: {
    configOverwrite: {
      startWithAudioMuted: true,
      startWithVideoMuted: false,
      prejoinPageEnabled: true,
      disableDeepLinking: true,
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_BRAND_WATERMARK: false,
      SHOW_POWERED_BY: false,
      DEFAULT_BACKGROUND: '#1e293b',
      TOOLBAR_BUTTONS: [
        'microphone',
        'camera',
        'desktop',
        'fullscreen',
        'fodeviceselection',
        'hangup',
        'chat',
        'recording',
        'settings',
        'raisehand',
        'videoquality',
        'filmstrip',
        'participants-pane',
        'tileview',
      ],
    },
  },
};
