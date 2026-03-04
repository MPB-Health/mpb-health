import { useState, useEffect, useCallback } from 'react';
import { notificationEventsService } from '@mpbhealth/champion-core';
import type { NotificationEvent, NotificationEventType } from '@mpbhealth/champion-core';
import { useAdvisor } from '../contexts/AdvisorContext';

// ============================================================================
// useNotificationEvents — notification events list with realtime
// ============================================================================

export function useNotificationEvents(options: {
  unreadOnly?: boolean;
  eventType?: NotificationEventType;
  limit?: number;
} = {}) {
  const { profile } = useAdvisor();
  const userId = profile?.id;

  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await notificationEventsService.getEvents(userId, options);
      setEvents(data);
      setError(null);
    } catch (err) {
      console.error('[useNotificationEvents] Failed to load events:', err);
      setError('Failed to load notification events');
    } finally {
      setLoading(false);
    }
  }, [userId, options.unreadOnly, options.eventType, options.limit]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel = notificationEventsService.subscribeToEvents(userId, (event) => {
      setEvents((prev) => [event, ...prev]);
    });

    return () => {
      notificationEventsService.unsubscribeFromEvents(userId);
    };
  }, [userId]);

  const markAsRead = useCallback(
    async (eventIds?: string[]) => {
      if (!userId) return;
      await notificationEventsService.markAsRead(userId, eventIds);
      // Optimistic update
      setEvents((prev) =>
        prev.map((e) =>
          !eventIds || eventIds.includes(e.id)
            ? { ...e, is_read: true, read_at: new Date().toISOString() }
            : e,
        ),
      );
    },
    [userId],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await notificationEventsService.markAllRead(userId);
    setEvents((prev) =>
      prev.map((e) => ({ ...e, is_read: true, read_at: new Date().toISOString() })),
    );
  }, [userId]);

  return {
    events,
    loading,
    error,
    markAsRead,
    markAllRead,
    refresh: fetchEvents,
  };
}

// ============================================================================
// useUnreadEventCount — badge count with realtime
// ============================================================================

export function useUnreadEventCount() {
  const { profile } = useAdvisor();
  const userId = profile?.id;

  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!userId) return;
    try {
      const n = await notificationEventsService.getUnreadCount(userId);
      setCount(n);
    } catch {
      // Silent fail for badge count
    }
  }, [userId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Realtime: increment on new event, refresh periodically
  useEffect(() => {
    if (!userId) return;

    const channel = notificationEventsService.subscribeToEvents(userId, () => {
      setCount((prev) => prev + 1);
    });

    return () => {
      notificationEventsService.unsubscribeFromEvents(userId);
    };
  }, [userId]);

  const decrement = useCallback((n = 1) => {
    setCount((prev) => Math.max(0, prev - n));
  }, []);

  const reset = useCallback(() => {
    setCount(0);
  }, []);

  return { count, decrement, reset, refresh: fetchCount };
}
