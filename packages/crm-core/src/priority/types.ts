// Notification priority levels (distinct from CRM pipeline LeadPriority in leads/leadTypes.ts)
export type NotificationPriority = 'normal' | 'high' | 'critical';

// Lead data for priority classification
export interface LeadData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  household_size: number | null;
  zip_code?: string | null;
  contact_preference?: string | null;
  primary_concern?: string | null;
  source_cta?: string | null;
  created_at: string;
}

// Priority classification result
export interface PriorityClassification {
  priority: NotificationPriority;
  isRepeatLead: boolean;
  repeatCount: number;
  reasons: string[];
}

// Priority color scheme
export interface PriorityColors {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

// Keywords that indicate urgency
export const URGENCY_KEYWORDS = [
  'asap',
  'urgent',
  'immediately',
  'emergency',
  'right away',
  'today',
  'now',
  'critical',
];
