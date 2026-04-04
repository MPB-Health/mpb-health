import type { SupabaseClient } from '@supabase/supabase-js';
import type { LeadData, NotificationPriority, PriorityClassification, PriorityColors } from './types';
import { URGENCY_KEYWORDS } from './types';

export class PriorityService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Check if a lead is a repeat submission based on email or phone
   */
  async checkRepeatLead(
    email: string,
    phone: string | null
  ): Promise<{ isRepeat: boolean; repeatCount: number }> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { count: emailCount, error: emailError } = await this.supabase
        .from('lead_submissions')
        .select('*', { count: 'exact', head: true })
        .ilike('email', email)
        .lt('created_at', fiveMinutesAgo);

      if (emailError) {
        console.error('Error checking repeat lead by email:', emailError);
      }

      let phoneCount = 0;
      if (phone && phone.trim() !== '') {
        const { count, error: phoneError } = await this.supabase
          .from('lead_submissions')
          .select('*', { count: 'exact', head: true })
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
   * Classify lead priority based on various factors
   */
  async classifyLeadPriority(lead: LeadData): Promise<PriorityClassification> {
    const reasons: string[] = [];
    let priority: NotificationPriority = 'normal';

    // Check for repeat lead
    const { isRepeat, repeatCount } = await this.checkRepeatLead(lead.email, lead.phone);

    if (isRepeat) {
      reasons.push(`Repeat lead (${repeatCount} previous submission${repeatCount > 1 ? 's' : ''})`);
      priority = 'high';
    }

    // Check household size
    if (lead.household_size && lead.household_size >= 3) {
      reasons.push(`Family size: ${lead.household_size} members`);
      if ((priority as NotificationPriority) !== 'critical') {
        priority = 'high';
      }
    }

    // Check for urgency in contact preference
    if (this.containsUrgencyKeywords(lead.contact_preference)) {
      reasons.push('Contact preference indicates urgency');
      priority = 'critical';
    }

    // Check for urgency in primary concern
    if (this.containsUrgencyKeywords(lead.primary_concern)) {
      reasons.push('Primary concern indicates urgency');
      priority = 'critical';
    }

    // Check for urgency in source CTA
    if (this.containsUrgencyKeywords(lead.source_cta)) {
      reasons.push('Source CTA indicates urgency');
      if ((priority as NotificationPriority) !== 'critical') {
        priority = 'high';
      }
    }

    // Large families (5+) are critical
    if (lead.household_size && lead.household_size >= 5) {
      reasons.push(`Large family (${lead.household_size} members)`);
      priority = 'critical';
    }

    // Repeat leads with 3+ submissions are critical
    if (repeatCount >= 3) {
      reasons.push('Multiple repeat submissions (high engagement)');
      priority = 'critical';
    }

    // Default reason
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
  getQuickPriority(lead: Partial<LeadData>): NotificationPriority {
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
      this.containsUrgencyKeywords(lead.contact_preference) ||
      this.containsUrgencyKeywords(lead.primary_concern)
    ) {
      return 'critical';
    }

    return 'normal';
  }

  /**
   * Check if text contains urgency keywords
   */
  private containsUrgencyKeywords(text: string | null | undefined): boolean {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return URGENCY_KEYWORDS.some((keyword) => lowerText.includes(keyword));
  }
}

// Static utility functions

/**
 * Get priority color scheme for UI display
 */
export function getPriorityColor(priority: NotificationPriority): PriorityColors {
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
export function getPriorityLabel(priority: NotificationPriority): string {
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
export function shouldPlaySound(priority: NotificationPriority): boolean {
  return priority === 'high' || priority === 'critical';
}

/**
 * Get auto-dismiss time for toast (in ms)
 */
export function getToastDismissTime(priority: NotificationPriority): number {
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

// Factory function
export function createPriorityService(supabase: SupabaseClient): PriorityService {
  return new PriorityService(supabase);
}
