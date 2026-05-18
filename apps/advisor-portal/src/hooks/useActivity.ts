// ============================================================================
// Activity & Notification Hooks — React hooks for activity feed and notifications
// ============================================================================

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  activityService,
  notificationService,
  ActivityType,
  Notification,
  LogActivityInput,
  ACTIVITY_CONFIG,
} from '@mpbhealth/champion-core';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorQueryReady } from './useAdvisorQueryReady';

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
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = profile?.org_id;
  const limit = options.limit || 50;
  const typesKey = options.types?.length ? [...options.types].sort().join('|') : '';

  const infinite = useInfiniteQuery({
    queryKey: [
      'activityFeed',
      orgId,
      options.leadId,
      options.userId,
      typesKey,
      limit,
    ] as const,
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      return activityService.getActivityFeed(orgId!, {
        lead_id: options.leadId,
        user_id: options.userId,
        activity_types: options.types,
        limit,
        offset,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === limit ? allPages.flat().length : undefined,
    enabled: Boolean(advisorReady && orgId),
  });

  const activities = useMemo(() => infinite.data?.pages.flat() ?? [], [infinite.data?.pages]);

  const loadMore = useCallback(() => {
    if (infinite.isFetchingNextPage || !infinite.hasNextPage) return;
    void infinite.fetchNextPage();
  }, [infinite.fetchNextPage, infinite.hasNextPage, infinite.isFetchingNextPage]);

  const refresh = useCallback(() => {
    void infinite.refetch();
  }, [infinite.refetch]);

  const groupedActivities = useMemo(
    () => activityService.groupActivitiesByDate(activities),
    [activities],
  );

  const loading =
    !advisorReady ? true : !orgId ? false : infinite.isPending;

  return {
    activities,
    groupedActivities,
    loading,
    error: infinite.isError ? 'Failed to load activity feed' : null,
    hasMore: Boolean(infinite.hasNextPage),
    loadMore,
    refresh,
  };
}

// ============================================================================
// Log Activity Hook
// ============================================================================

export function useLogActivity() {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = profile?.org_id;
  const userId = profile?.user_id;
  const [error, setError] = useState<string | null>(null);

  const logActivity = useCallback(
    async (input: LogActivityInput) => {
      if (!orgId || !userId) {
        // User not authenticated - silently skip logging
        return null;
      }
      try {
        setError(null);
        return await activityService.logActivity(orgId, userId, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to log activity';
        setError(message);
        console.error('[useLogActivity] Failed:', err);
        return null;
      }
    },
    [orgId, userId]
  );

  const isReady = Boolean(advisorReady && orgId && userId);

  return { logActivity, error, isReady };
}

// ============================================================================
// Notifications Hook
// ============================================================================

export function useNotifications(options: {
  unreadOnly?: boolean;
  limit?: number;
} = {}) {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const userId = profile?.user_id;
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => ['notifications', userId, options.unreadOnly, options.limit ?? 50] as const,
    [userId, options.unreadOnly, options.limit],
  );

  const query = useQuery({
    queryKey,
    queryFn: () =>
      notificationService.getNotifications(userId!, {
        unreadOnly: options.unreadOnly,
        limit: options.limit || 50,
      }),
    enabled: Boolean(advisorReady && userId),
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (!advisorReady || !userId) return;
    notificationService.subscribeToNotifications(userId, (notification) => {
      queryClient.setQueryData<Notification[]>(queryKey, (prev) => [notification, ...(prev ?? [])]);
    });

    return () => {
      notificationService.unsubscribeFromNotifications(userId);
    };
  }, [advisorReady, userId, queryClient, queryKey]);

  const markAsRead = useCallback(
    async (notificationIds?: string[]) => {
      if (!userId) return;
      await notificationService.markAsRead(userId, notificationIds);
      queryClient.setQueryData<Notification[]>(queryKey, (prev) =>
        (prev ?? []).map((n) =>
          !notificationIds || notificationIds.includes(n.id)
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n,
        ),
      );
    },
    [userId, queryClient, queryKey],
  );

  const dismiss = useCallback(
    async (notificationId: string) => {
      await notificationService.dismissNotification(notificationId);
      queryClient.setQueryData<Notification[]>(queryKey, (prev) =>
        (prev ?? []).filter((n) => n.id !== notificationId),
      );
    },
    [queryClient, queryKey],
  );

  const dismissAll = useCallback(async () => {
    if (!userId) return;
    await notificationService.dismissAll(userId);
    queryClient.setQueryData<Notification[]>(queryKey, []);
  }, [userId, queryClient, queryKey]);

  const refresh = useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({
      predicate: ({ queryKey: k }) => Array.isArray(k) && k[0] === 'notifications' && k[1] === userId,
    });
  }, [queryClient, userId]);

  return {
    notifications: query.data ?? [],
    loading: !advisorReady ? true : !userId ? false : query.isPending,
    error: query.isError ? 'Failed to load notifications' : null,
    markAsRead,
    dismiss,
    dismissAll,
    refresh,
  };
}

// ============================================================================
// Unread Count Hook
// ============================================================================

export function useUnreadNotificationCount() {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const userId = profile?.user_id;
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ['unreadNotificationCount', userId] as const, [userId]);

  const query = useQuery({
    queryKey,
    queryFn: () => notificationService.getUnreadCount(userId!),
    enabled: Boolean(advisorReady && userId),
    retry: false,
  });

  useEffect(() => {
    if (!advisorReady || !userId) return;
    notificationService.subscribeToNotifications(userId, () => {
      queryClient.setQueryData<number>(queryKey, (n) => (n ?? 0) + 1);
    });
    return () => {
      notificationService.unsubscribeFromNotifications(userId);
    };
  }, [advisorReady, userId, queryClient, queryKey]);

  const decrement = useCallback(
    (amount: number = 1) => {
      queryClient.setQueryData<number>(queryKey, (prev) =>
        prev == null ? 0 : Math.max(0, prev - amount),
      );
    },
    [queryClient, queryKey],
  );

  const reset = useCallback(() => {
    queryClient.setQueryData<number>(queryKey, 0);
  }, [queryClient, queryKey]);

  const refresh = useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey, userId]);

  return {
    count: query.data ?? 0,
    decrement,
    reset,
    refresh,
  };
}

// ============================================================================
// Notification Summary Hook
// ============================================================================

export function useNotificationSummary() {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const userId = profile?.user_id;
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ['notificationSummary', userId] as const, [userId]);

  const query = useQuery({
    queryKey,
    queryFn: () => notificationService.getNotificationSummary(userId!),
    enabled: Boolean(advisorReady && userId),
  });

  const refresh = useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey, userId]);

  return {
    summary: query.data ?? null,
    loading: !advisorReady ? true : !userId ? false : query.isPending,
    error: query.isError ? 'Failed to load notification summary' : null,
    refresh,
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
