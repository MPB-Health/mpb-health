// ============================================================================
// Advisor Types - Advisor portal related types
// ============================================================================

export interface Advisor {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  license_number?: string;
  license_state?: string;
  license_expiry?: string;
  certifications?: string[];
  specialties?: string[];
  biography?: string;
  avatar_url?: string;
  is_active: boolean;
  onboarding_status: OnboardingStatus;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export type OnboardingStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'suspended';

// Training/LMS Types
export interface TrainingModule {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  difficulty_level: DifficultyLevel;
  estimated_duration_minutes: number;
  passing_score: number;
  is_required: boolean;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface TrainingProgress {
  id: string;
  advisor_id: string;
  module_id: string;
  status: TrainingStatus;
  progress_percentage: number;
  score?: number;
  attempts: number;
  started_at: string;
  completed_at?: string;
  last_accessed_at: string;
}

export type TrainingStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'failed';

export interface Certification {
  id: string;
  advisor_id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  certificate_url?: string;
  is_verified: boolean;
  created_at: string;
}

// Meeting Types
export interface AdvisorMeeting {
  id: string;
  title: string;
  description?: string;
  meeting_type: MeetingType;
  host_id: string;
  room_name: string;
  jitsi_room_id?: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  status: MeetingStatus;
  recording_url?: string;
  attendees: MeetingAttendee[];
  created_at: string;
  updated_at: string;
}

export type MeetingType =
  | 'one_on_one'
  | 'team'
  | 'training'
  | 'webinar'
  | 'client';

export type MeetingStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface MeetingAttendee {
  id: string;
  meeting_id: string;
  user_id: string;
  role: AttendeeRole;
  attendance_status: AttendanceStatus;
  joined_at?: string;
  left_at?: string;
}

export type AttendeeRole = 'host' | 'co_host' | 'presenter' | 'attendee';
export type AttendanceStatus = 'pending' | 'accepted' | 'declined' | 'attended' | 'no_show';

// Playbook/SOP Types
export interface Playbook {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  tags?: string[];
  version: string;
  is_published: boolean;
  published_at?: string;
  author_id: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface PlaybookCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

// Forms Types
export interface FormSubmission {
  id: string;
  form_id: string;
  advisor_id: string;
  form_name: string;
  submission_data: Record<string, unknown>;
  status: FormSubmissionStatus;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
  created_at: string;
}

export type FormSubmissionStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'needs_revision';

// Bulletin Types
export interface Bulletin {
  id: string;
  title: string;
  content: string;
  bulletin_type: BulletinType;
  priority: BulletinPriority;
  target_audience: string[];
  is_pinned: boolean;
  published_at?: string;
  expires_at?: string;
  author_id: string;
  read_count: number;
  created_at: string;
  updated_at: string;
}

export type BulletinType =
  | 'announcement'
  | 'update'
  | 'alert'
  | 'reminder'
  | 'policy';

export type BulletinPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface BulletinRead {
  id: string;
  bulletin_id: string;
  advisor_id: string;
  read_at: string;
}

// Advisor Stats
export interface AdvisorStats {
  total_leads: number;
  leads_converted: number;
  conversion_rate: number;
  total_clients: number;
  active_clients: number;
  training_completion: number;
  meetings_attended: number;
  forms_submitted: number;
}
