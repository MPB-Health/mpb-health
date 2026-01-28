// ============================================================================
// Activity & Notification Hooks — React hooks for activity feed and notifications
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  activityService,
  notificationService,
  ActivityFeedItem,
  ActivityType,
  Notification,
  NotificationSummary,
  LogActivityInput,
  ACTIVITY_CONFIG,
} from '@mpbhealth/champion-core';
import { useAdvisor } from '../contexts/AdvisorContext';

// ============================================================================
// Activity Feed Hook
// ============================================================================

export function useActivityFeed(options: {
  leadId?: string;
  userId?: string;
  types?: ActivityType[];
  limit?: number;
} = {}) {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;

  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = useCallback(async (offset: number = 0) => {
    if (!orgId) return;

    try {
      if (offset === 0) setLoading(true);
      const data = await activityService.getActivityFeed(orgId, {
        lead_id: options.leadId,
        user_id: options.userId,
        activity_types: options.types,
        limit: options.limit || 50,
        offset,
      });

      if (offset === 0) {
        setActivities(data);
      } else {
        setActivities((prev) => [...prev, ...data]);
      }

      setHasMore(data.length === (options.limit || 50));
      setError(null);
    } catch (err) {
      console.error('[useActivityFeed] Failed to fetch:', err);
      setError('Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  }, [orgId, options.leadId, options.userId, options.types, options.limit]);

  useEffect(() => {
    fetchActivities(0);
  }, [fetchActivities]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchActivities(activities.length);
    }
  }, [loading, hasMore, activities.length, fetchActivities]);

  const refresh = useCallback(() => {
    fetchActivities(0);
  }, [fetchActivities]);

  // Group activities by date
  const groupedActivities = activityService.groupActivitiesByDate(activities);

  return {
    activities,
    groupedActivities,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

// ============================================================================
// Log Activity Hook
// ============================================================================

export function useLogActivity() {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;
  const userId = profile?.user_id;

  const logActivity = useCallback(
    async (input: LogActivityInput) => {
      if (!orgId || !userId) return null;
      return activityService.logActivity(orgId, userId, input);
    },
    [orgId, userId]
  );

  return { logActivity };
}

// ============================================================================
// Notifications Hook
// ============================================================================

export function useNotifications(options: {
  unreadOnly?: boolean;
  limit?: number;
} = {}) {
  const { profile } = useAdvisor();
  const userId = profile?.user_id;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await notificationService.getNotifications(userId, {
        unreadOnly: options.unreadOnly,
        limit: options.limit || 50,
      });
      setNotifications(data);
      setError(null);
    } catch (err) {
      console.error('[useNotifications] Failed to fetch:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [userId, options.unreadOnly, options.limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = notificationService.subscribeToNotifications(userId, (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      notificationService.unsubscribeFromNotifications(userId);
    };
  }, [userId]);

  const markAsRead = useCallback(
    async (notificationIds?: string[]) => {
      if (!userId) return;
      await notificationService.markAsRead(userId, notificationIds);
      setNotifications((prev) =>
        prev.map((n) =>
          !notificationIds || notificationIds.includes(n.id)
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    },
    [userId]
  );

  const dismiss = useCallback(async (notificationId: string) => {
    await notificationService.dismissNotification(notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  const dismissAll = useCallback(async () => {
    if (!userId) return;
    await notificationService.dismissAll(userId);
    setNotifications([]);
  }, [userId]);

  return {
    notifications,
    loading,
    error,
    markAsRead,
    dismiss,
    dismissAll,
    refresh: fetchNotifications,
  };
}

// ============================================================================
// Unread Count Hook
// ============================================================================

export function useUnreadNotificationCount() {
  const { profile } = useAdvisor();
  const userId = profile?.user_id;

  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!userId) return;
    const unreadCount = await notificationService.getUnreadCount(userId);
    setCount(unreadCount);
  }, [userId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Real-time updates
  useEffect(() => {
    if (!userId) return;

    const channel = notificationService.subscribeToNotifications(userId, () => {
      setCount((prev) => prev + 1);
    });

    return () => {
      notificationService.unsubscribeFromNotifications(userId);
    };
  }, [userId]);

  const decrement = useCallback((amount: number = 1) => {
    setCount((prev) => Math.max(0, prev - amount));
  }, []);

  const reset = useCallback(() => {
    setCount(0);
  }, []);

  return {
    count,
    decrement,
    reset,
    refresh: fetchCount,
  };
}

// ============================================================================
// Notification Summary Hook
// ============================================================================

export function useNotificationSummary() {
  const { profile } = useAdvisor();
  const userId = profile?.user_id;

  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await notificationService.getNotificationSummary(userId);
      setSummary(data);
    } catch (err) {
      console.error('[useNotificationSummary] Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    refresh: fetchSummary,
  };
}

// ============================================================================
// Activity Config Helper
// ============================================================================

export function useActivityConfig() {
  const getConfig = useCallback((type: ActivityType) => {
    return ACTIVITY_CONFIG[type];
  }, []);

  const getActivityTypes = useCallback(() => {
    return activityService.getActivityTypes();
  }, []);

  return {
    getConfig,
    getActivityTypes,
    allConfigs: ACTIVITY_CONFIG,
  };
}
