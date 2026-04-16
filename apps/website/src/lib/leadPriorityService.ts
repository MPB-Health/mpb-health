import { supabase } from './supabase';

export type LeadPriority = 'normal' | 'high' | 'critical';

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

export interface PriorityClassification {
  priority: LeadPriority;
  isRepeatLead: boolean;
  repeatCount: number;
  reasons: string[];
}

// Keywords that indicate urgency in text fields
const URGENCY_KEYWORDS = [
  'asap',
  'urgent',
  'immediately',
  'emergency',
  'right away',
  'today',
  'now',
  'critical',
];

/**
 * Check if a lead is a repeat submission based on email or phone
 */
export async function checkRepeatLead(
  email: string,
  phone: string | null
): Promise<{ isRepeat: boolean; repeatCount: number }> {
  try {
    // Check for previous submissions with same email (excluding recent 5 min window)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { count: emailCount, error: emailError } = await supabase
      .from('lead_submissions')
      .select('id', { count: 'exact', head: true })
      .ilike('email', email)
      .lt('created_at', fiveMinutesAgo);

    if (emailError) {
      console.error('Error checking repeat lead by email:', emailError);
    }

    let phoneCount = 0;
    if (phone && phone.trim() !== '') {
      const { count, error: phoneError } = await supabase
        .from('lead_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('phone', phone)
        .lt('created_at', fiveMinutesAgo);

      if (phoneError) {
        console.error('Error checking repeat lead by phone:', phoneError);
      } else {
        phoneCount = count || 0;
      }
    }

    const maxCount = Math.max(emailCount || 0, phoneCount);
    return {
      isRepeat: maxCount > 0,
      repeatCount: maxCount,
    };
  } catch (error) {
    console.error('Error in checkRepeatLead:', error);
    return { isRepeat: false, repeatCount: 0 };
  }
}

/**
 * Check if text contains urgency keywords
 */
function containsUrgencyKeywords(text: string | null | undefined): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return URGENCY_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Classify lead priority based on various factors
 */
export async function classifyLeadPriority(
  lead: LeadData
): Promise<PriorityClassification> {
  const reasons: string[] = [];
  let priority: LeadPriority = 'normal';

  // Check for repeat lead
  const { isRepeat, repeatCount } = await checkRepeatLead(lead.email, lead.phone);
  
  if (isRepeat) {
    reasons.push(`Repeat lead (${repeatCount} previous submission${repeatCount > 1 ? 's' : ''})`);
    priority = 'high';
  }

  // Check household size (family leads are higher priority)
  if (lead.household_size && lead.household_size >= 3) {
    reasons.push(`Family size: ${lead.household_size} members`);
    if (priority === 'normal') {
      priority = 'high';
    }
  }

  // Check for urgency in contact preference
  if (containsUrgencyKeywords(lead.contact_preference)) {
    reasons.push('Contact preference indicates urgency');
    priority = 'critical';
  }

  // Check for urgency in primary concern
  if (containsUrgencyKeywords(lead.primary_concern)) {
    reasons.push('Primary concern indicates urgency');
    priority = 'critical';
  }

  // Check for urgency in source CTA (e.g., "Get Quote Now", "Urgent Quote")
  if (containsUrgencyKeywords(lead.source_cta)) {
    reasons.push('Source CTA indicates urgency');
    if (priority !== 'critical') {
      priority = 'high';
    }
  }

  // Large families (5+) are critical
  if (lead.household_size && lead.household_size >= 5) {
    reasons.push(`Large family (${lead.household_size} members)`);
    priority = 'critical';
  }

  // Repeat leads with 3+ submissions are critical (high engagement)
  if (repeatCount >= 3) {
    reasons.push('Multiple repeat submissions (high engagement)');
    priority = 'critical';
  }

  // If no special conditions, it's a normal priority lead
  if (reasons.length === 0) {
    reasons.push('Standard lead');
  }

  return {
    priority,
    isRepeatLead: isRepeat,
    repeatCount,
    reasons,
  };
}

/**
 * Quick priority check without async operations (for UI display)
 */
export function getQuickPriority(lead: Partial<LeadData>): LeadPriority {
  // Large family
  if (lead.household_size && lead.household_size >= 5) {
    return 'critical';
  }

  // Family
  if (lead.household_size && lead.household_size >= 3) {
    return 'high';
  }

  // Check for urgency keywords
  if (
    containsUrgencyKeywords(lead.contact_preference) ||
    containsUrgencyKeywords(lead.primary_concern)
  ) {
    return 'critical';
  }

  return 'normal';
}

/**
 * Get priority color for UI display
 */
export function getPriorityColor(priority: LeadPriority): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (priority) {
    case 'critical':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
        dot: 'bg-red-500',
      };
    case 'high':
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-200',
        dot: 'bg-orange-500',
      };
    case 'normal':
    default:
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
      };
  }
}

/**
 * Get priority label for display
 */
export function getPriorityLabel(priority: LeadPriority): string {
  switch (priority) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'High Priority';
    case 'normal':
    default:
      return 'Normal';
  }
}

/**
 * Should play sound for this priority level?
 */
export function shouldPlaySound(priority: LeadPriority): boolean {
  return priority === 'high' || priority === 'critical';
}

/**
 * Should send desktop notification for this priority?
 */
export function shouldSendDesktopNotification(_priority: LeadPriority): boolean {
  // All leads get desktop notifications when tab is inactive
  return true;
}

/**
 * Get auto-dismiss time for toast (in ms)
 */
export function getToastDismissTime(priority: LeadPriority): number {
  switch (priority) {
    case 'critical':
      return 0; // Never auto-dismiss critical
    case 'high':
      return 12000; // 12 seconds for high priority
    case 'normal':
    default:
      return 8000; // 8 seconds for normal
  }
}

