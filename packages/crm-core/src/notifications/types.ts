import type { LeadPriority } from '../priority/types';

// Lead submission for notifications
export interface LeadSubmission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  household_size: number | null;
  zip_code?: string | null;
  contact_preference?: string | null;
  primary_concern?: string | null;
  source_page: string | null;
  source_cta: string | null;
  zoho_sync_status: string;
  created_at: string;
}

// Enhanced lead submission with priority info
export interface EnhancedLeadSubmission extends LeadSubmission {
  priority: LeadPriority;
  isRepeatLead: boolean;
  repeatCount: number;
  priorityReasons: string[];
}

// Callback types
export type NewLeadCallback = (lead: LeadSubmission) => void;
export type EnhancedLeadCallback = (lead: EnhancedLeadSubmission) => void;

// Notification statistics
export interface NotificationStats {
  total_leads: number;
  leads_today: number;
  leads_this_week: number;
  avg_response_time_minutes: number;
  unacknowledged: number;
}

// Lead counts by priority
export interface LeadCountsByPriority {
  normal: number;
  high: number;
  critical: number;
  total: number;
}
