import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  classifyLeadPriority,
  LeadPriority,
  PriorityClassification,
  LeadData,
} from '../lib/leadPriorityService';

export interface EnhancedLead extends LeadData {
  priority?: LeadPriority;
  isRepeatLead?: boolean;
  repeatCount?: number;
  priorityReasons?: string[];
}

interface UseLeadNotificationsOptions {
  autoClassify?: boolean;
  limit?: number;
}

interface UseLeadNotificationsReturn {
  leads: EnhancedLead[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  refreshLeads: () => Promise<void>;
  getLeadPriority: (lead: LeadData) => Promise<PriorityClassification>;
  markAsRead: () => void;
}

const LAST_VIEWED_KEY = 'mpb_leads_last_viewed';

/**
 * Hook for accessing lead notifications and priority data
 */
export function useLeadNotifications(
  options: UseLeadNotificationsOptions = {}
): UseLeadNotificationsReturn {
  const { autoClassify = true, limit = 10 } = options;

  const [leads, setLeads] = useState<EnhancedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get last viewed timestamp
  const getLastViewed = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_VIEWED_KEY);
  }, []);

  // Calculate unread count
  const calculateUnreadCount = useCallback(
    async (fetchedLeads: LeadData[]) => {
      const lastViewed = getLastViewed();
      if (!lastViewed) {
        setUnreadCount(fetchedLeads.length);
        return;
      }

      const lastViewedDate = new Date(lastViewed);
      const unread = fetchedLeads.filter(
        (lead) => new Date(lead.created_at) > lastViewedDate
      ).length;
      setUnreadCount(unread);
    },
    [getLastViewed]
  );

  // Fetch and optionally classify leads
  const refreshLeads = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('zoho_lead_submissions')
        .select(
          'id, first_name, last_name, email, phone, household_size, zip_code, contact_preference, primary_concern, source_cta, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        throw fetchError;
      }

      const fetchedLeads: LeadData[] = data || [];

      // Calculate unread count
      await calculateUnreadCount(fetchedLeads);

      if (autoClassify) {
        // Classify each lead's priority
        const enhancedLeads: EnhancedLead[] = await Promise.all(
          fetchedLeads.map(async (lead) => {
            const priority = await classifyLeadPriority(lead);
            return {
              ...lead,
              priority: priority.priority,
              isRepeatLead: priority.isRepeatLead,
              repeatCount: priority.repeatCount,
              priorityReasons: priority.reasons,
            };
          })
        );
        setLeads(enhancedLeads);
      } else {
        setLeads(fetchedLeads);
      }
    } catch (err) {
      console.error('[useLeadNotifications] Error fetching leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [limit, autoClassify, calculateUnreadCount]);

  // Get priority for a single lead
  const getLeadPriority = useCallback(
    async (lead: LeadData): Promise<PriorityClassification> => {
      return classifyLeadPriority(lead);
    },
    []
  );

  // Mark all as read
  const markAsRead = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAST_VIEWED_KEY, new Date().toISOString());
    setUnreadCount(0);
  }, []);

  // Initial fetch
  useEffect(() => {
    refreshLeads();
  }, [refreshLeads]);

  return {
    leads,
    loading,
    error,
    unreadCount,
    refreshLeads,
    getLeadPriority,
    markAsRead,
  };
}

/**
 * Hook for requesting desktop notification permission
 */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null
  );
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    if (Notification.permission === 'granted') {
      setPermission('granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      setPermission('denied');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  return {
    permission,
    isSupported,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    requestPermission,
  };
}

export default useLeadNotifications;

