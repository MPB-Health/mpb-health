import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { createClientLogger } from '@mpbhealth/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  classifyLeadPriority,
  shouldPlaySound,
  PriorityClassification,
} from '../lib/leadPriorityService';
import { ToastContainer, LeadToastData } from '../components/notifications/LeadToast';
import type { RealtimeChannel, RealtimePostgresInsertPayload } from '@supabase/supabase-js';

const log = createClientLogger('LeadNotificationProvider');

// Lead data from Supabase realtime
interface LeadSubmission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  household_size: number | null;
  zip_code: string | null;
  contact_preference: string | null;
  primary_concern: string | null;
  source_cta: string | null;
  created_at: string;
}

interface LeadNotificationContextType {
  // State
  hasPermission: boolean;
  isSubscribed: boolean;
  toasts: LeadToastData[];
  recentLeads: LeadSubmission[];
  unreadCount: number;

  // Actions
  requestPermission: () => Promise<boolean>;
  dismissToast: (id: string) => void;
  dismissAllToasts: () => void;
  markAsViewed: (leadId: string) => void;
  markAllAsViewed: () => void;
}

const LeadNotificationContext = createContext<LeadNotificationContextType | null>(null);

const STORAGE_KEY = 'mpb_lead_notification_permission';
const LAST_VIEWED_KEY = 'mpb_leads_last_viewed';
const MAX_TOASTS = 5;
const MAX_RECENT_LEADS = 10;

const playLeadNotificationTone = () => {
  try {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const context = new AudioCtx();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
    oscillator.onended = () => {
      void context.close();
    };
  } catch {
    // Ignore audio initialization errors
  }
};

interface LeadNotificationProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export const LeadNotificationProvider: React.FC<LeadNotificationProviderProps> = ({
  children,
  enabled = true,
}) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [toasts, setToasts] = useState<LeadToastData[]>([]);
  const [recentLeads, setRecentLeads] = useState<LeadSubmission[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Check for existing notification permission
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedPermission = localStorage.getItem(STORAGE_KEY);
    if (storedPermission === 'granted' && 'Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      log.info('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setHasPermission(true);
      localStorage.setItem(STORAGE_KEY, 'granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      log.info('Notifications are blocked');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);
      if (granted) {
        localStorage.setItem(STORAGE_KEY, 'granted');
      }
      return granted;
    } catch (error) {
      console.error('[LeadNotifications] Error requesting permission:', error);
      return false;
    }
  }, []);

  // Play notification sound
  const playSound = useCallback(() => {
    playLeadNotificationTone();
  }, []);

  // Send desktop notification
  const sendDesktopNotification = useCallback(
    (lead: LeadSubmission, priority: PriorityClassification) => {
      if (!hasPermission || !document.hidden) return;

      const priorityEmoji =
        priority.priority === 'critical'
          ? '🔥'
          : priority.priority === 'high'
          ? '⚡'
          : '💰';

      const householdText = lead.household_size
        ? ` • Family of ${lead.household_size}`
        : '';
      
      const locationText = lead.zip_code ? ` • ${lead.zip_code}` : '';

      const notification = new Notification(
        `${priorityEmoji} New Lead: ${lead.first_name} ${lead.last_name}`,
        {
          body: `${priority.reasons[0]}${householdText}${locationText}`,
          icon: '/sounds/lead-icon.png',
          tag: `lead-${lead.id}`,
          requireInteraction: priority.priority === 'critical',
        }
      );

      notification.onclick = () => {
        window.focus();
        window.location.href = `/admin/quote-submissions?lead=${lead.id}`;
        notification.close();
      };

      // Auto-close non-critical notifications
      if (priority.priority !== 'critical') {
        setTimeout(() => notification.close(), 10000);
      }
    },
    [hasPermission]
  );

  // Create toast from lead
  const createToast = useCallback(
    (lead: LeadSubmission, priority: PriorityClassification): LeadToastData => {
      return {
        id: `toast-${lead.id}-${Date.now()}`,
        leadId: lead.id,
        firstName: lead.first_name,
        lastName: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        zipCode: lead.zip_code,
        householdSize: lead.household_size,
        priority: priority.priority,
        isRepeatLead: priority.isRepeatLead,
        repeatCount: priority.repeatCount,
        reasons: priority.reasons,
        createdAt: lead.created_at,
      };
    },
    []
  );

  // Handle new lead
  const handleNewLead = useCallback(
    async (lead: LeadSubmission) => {
      log.info('New lead received:', lead);

      // Classify priority
      const priority = await classifyLeadPriority({
        id: lead.id,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        household_size: lead.household_size,
        zip_code: lead.zip_code,
        contact_preference: lead.contact_preference,
        primary_concern: lead.primary_concern,
        source_cta: lead.source_cta,
        created_at: lead.created_at,
      });

      log.info('Priority classified:', priority);

      // Add to recent leads
      setRecentLeads((prev) => [lead, ...prev.slice(0, MAX_RECENT_LEADS - 1)]);

      // Increment unread count
      setUnreadCount((prev) => prev + 1);

      // Create and show toast
      const toast = createToast(lead, priority);
      setToasts((prev) => [toast, ...prev.slice(0, MAX_TOASTS - 1)]);

      // Play sound for high/critical priority
      if (shouldPlaySound(priority.priority)) {
        playSound();
      }

      // Send desktop notification if tab is inactive
      sendDesktopNotification(lead, priority);

      // Record notification in database (optional, for analytics)
      try {
        await supabase.from('lead_notifications').insert({
          lead_id: lead.id,
          priority: priority.priority,
          is_repeat_lead: priority.isRepeatLead,
          repeat_count: priority.repeatCount,
          desktop_notification_sent: hasPermission && document.hidden,
        });
      } catch (error) {
        console.error('[LeadNotifications] Failed to record notification:', error);
      }
    },
    [createToast, playSound, sendDesktopNotification, hasPermission]
  );

  // Subscribe to Supabase realtime
  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) return;

    log.info('Setting up realtime subscription...');

    channelRef.current = supabase
      .channel('lead_notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'zoho_lead_submissions',
        },
        (payload: RealtimePostgresInsertPayload<LeadSubmission>) => {
          handleNewLead(payload.new);
        }
      )
      .subscribe((status) => {
        log.info('Subscription status:', status);
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [enabled, handleNewLead]);

  // Dismiss a single toast
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Dismiss all toasts
  const dismissAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Mark a lead as viewed
  const markAsViewed = useCallback((leadId: string) => {
    // Could track individual viewed leads if needed
    log.info('Marking lead as viewed:', leadId);
  }, []);

  // Mark all as viewed and reset unread count
  const markAllAsViewed = useCallback(() => {
    setUnreadCount(0);
    localStorage.setItem(LAST_VIEWED_KEY, new Date().toISOString());
  }, []);

  const value: LeadNotificationContextType = {
    hasPermission,
    isSubscribed,
    toasts,
    recentLeads,
    unreadCount,
    requestPermission,
    dismissToast,
    dismissAllToasts,
    markAsViewed,
    markAllAsViewed,
  };

  return (
    <LeadNotificationContext.Provider value={value}>
      {children}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        onView={markAsViewed}
      />
    </LeadNotificationContext.Provider>
  );
};

export const useLeadNotificationContext = (): LeadNotificationContextType => {
  const context = useContext(LeadNotificationContext);
  if (!context) {
    throw new Error(
      'useLeadNotificationContext must be used within a LeadNotificationProvider'
    );
  }
  return context;
};

export default LeadNotificationProvider;

