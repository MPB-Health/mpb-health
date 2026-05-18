import { useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationEventsService } from '@mpbhealth/champion-core';
import type { NotificationEvent, NotificationEventType } from '@mpbhealth/champion-core';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorQueryReady } from './useAdvisorQueryReady';

// ============================================================================
// useNotificationEvents — notification events list with realtime
// ============================================================================

export function useNotificationEvents(options: {
  unreadOnly?: boolean;
  eventType?: NotificationEventType;
  limit?: number;
  onNewEvent?: (event: NotificationEvent) => void;
} = {}) {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const userId = profile?.id;
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () =>
      ['notificationEvents', profile?.id, options.unreadOnly, options.eventType, options.limit] as const,
    [profile?.id, options.unreadOnly, options.eventType, options.limit],
  );

  const query = useQuery({
    queryKey,
    queryFn: () => notificationEventsService.getEvents(userId!, options),
    enabled: Boolean(advisorReady && userId),
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (!advisorReady || !userId) return;

    const handler = (event: NotificationEvent) => {
      queryClient.setQueryData<NotificationEvent[]>(queryKey, (prev) => [event, ...(prev ?? [])]);
      options.onNewEvent?.(event);
    };

    notificationEventsService.subscribeToEvents(userId, handler);

    return () => {
      notificationEventsService.unsubscribeFromEvents(userId, handler);
    };
  }, [advisorReady, userId, queryClient, queryKey, options.onNewEvent]);

  const refresh = useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({
      predicate: ({ queryKey: k }) =>
        Array.isArray(k) && k[0] === 'notificationEvents' && k[1] === userId,
    });
  }, [queryClient, userId]);

  const markAsRead = useCallback(
    async (eventIds?: string[]) => {
      if (!userId) return;
      await notificationEventsService.markAsRead(userId, eventIds);
      queryClient.setQueryData<NotificationEvent[]>(queryKey, (prev) =>
        (prev ?? []).map((e) =>
          !eventIds || eventIds.includes(e.id)
            ? { ...e, is_read: true, read_at: new Date().toISOString() }
            : e,
        ),
      );
    },
    [userId, queryClient, queryKey],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await notificationEventsService.markAllRead(userId);
    queryClient.setQueryData<NotificationEvent[]>(queryKey, (prev) =>
      (prev ?? []).map((e) => ({ ...e, is_read: true, read_at: new Date().toISOString() })),
    );
  }, [userId, queryClient, queryKey]);

  return {
    events: query.data ?? [],
    loading: query.isPending,
    error: query.isError
      ? query.error instanceof Error
        ? query.error.message
        : 'Failed to load notification events'
      : null,
    markAsRead,
    markAllRead,
    refresh,
  };
}

// ============================================================================
// useUnreadEventCount — badge count with realtime
// ============================================================================

export function useUnreadEventCount() {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const userId = profile?.id;
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => ['unreadNotificationEventCount', userId] as const,
    [userId],
  );

  const query = useQuery({
    queryKey,
    queryFn: () => notificationEventsService.getUnreadCount(userId!),
    enabled: Boolean(advisorReady && userId),
    retry: false,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!advisorReady || !userId) return;

    const handler = () => {
      queryClient.setQueryData<number>(queryKey, (n) => (n ?? 0) + 1);
    };

    notificationEventsService.subscribeToEvents(userId, handler);

    return () => {
      notificationEventsService.unsubscribeFromEvents(userId, handler);
    };
  }, [advisorReady, userId, queryClient, queryKey]);

  const decrement = useCallback(
    (n = 1) => {
      queryClient.setQueryData<number>(queryKey, (prev) =>
        prev == null ? 0 : Math.max(0, prev - n),
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
