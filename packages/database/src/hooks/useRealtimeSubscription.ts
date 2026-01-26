import { useEffect, useRef, useCallback, useState } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../client';

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeSubscriptionOptions<T> {
  /** Table name to subscribe to */
  table: string;
  /** Schema (default: 'public') */
  schema?: string;
  /** Event type to listen for */
  event?: PostgresChangeEvent;
  /** Filter for specific column:value */
  filter?: string;
  /** Callback for INSERT events */
  onInsert?: (payload: T) => void;
  /** Callback for UPDATE events */
  onUpdate?: (payload: { old: T; new: T }) => void;
  /** Callback for DELETE events */
  onDelete?: (payload: T) => void;
  /** Callback for any change */
  onChange?: (payload: RealtimePostgresChangesPayload<T>) => void;
  /** Whether to enable the subscription (default: true) */
  enabled?: boolean;
}

interface UseRealtimeSubscriptionReturn {
  /** Current subscription status */
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  /** Unsubscribe manually */
  unsubscribe: () => void;
  /** Resubscribe manually */
  resubscribe: () => void;
}

export function useRealtimeSubscription<T = any>(
  options: UseRealtimeSubscriptionOptions<T>
): UseRealtimeSubscriptionReturn {
  const {
    table,
    schema = 'public',
    event = '*',
    filter,
    onInsert,
    onUpdate,
    onDelete,
    onChange,
    enabled = true,
  } = options;

  const channelRef = useRef<RealtimeChannel | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const subscribe = useCallback(() => {
    if (!enabled) return;

    setStatus('connecting');

    const channelName = `${table}-changes-${Math.random().toString(36).substring(7)}`;

    const channelConfig: any = {
      event,
      schema,
      table,
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        channelConfig,
        (payload: RealtimePostgresChangesPayload<T>) => {
          onChange?.(payload);

          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload.new as T);
              break;
            case 'UPDATE':
              onUpdate?.({ old: payload.old as T, new: payload.new as T });
              break;
            case 'DELETE':
              onDelete?.(payload.old as T);
              break;
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setStatus('error');
        } else if (status === 'CLOSED') {
          setStatus('disconnected');
        }
      });

    channelRef.current = channel;
  }, [table, schema, event, filter, onInsert, onUpdate, onDelete, onChange, enabled]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setStatus('disconnected');
    }
  }, []);

  const resubscribe = useCallback(() => {
    unsubscribe();
    subscribe();
  }, [unsubscribe, subscribe]);

  useEffect(() => {
    subscribe();

    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    status,
    unsubscribe,
    resubscribe,
  };
}

// Hook for subscribing to multiple tables at once
interface MultiTableSubscription<T> {
  table: string;
  schema?: string;
  event?: PostgresChangeEvent;
  filter?: string;
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: { old: T; new: T }) => void;
  onDelete?: (payload: T) => void;
}

export function useMultiTableSubscription<T = any>(
  subscriptions: MultiTableSubscription<T>[],
  enabled: boolean = true
): { status: 'connecting' | 'connected' | 'disconnected' | 'error' } {
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  useEffect(() => {
    if (!enabled) return;

    setStatus('connecting');
    let connectedCount = 0;

    subscriptions.forEach((sub, index) => {
      const channelName = `multi-${sub.table}-${index}-${Math.random().toString(36).substring(7)}`;

      const channelConfig: any = {
        event: sub.event || '*',
        schema: sub.schema || 'public',
        table: sub.table,
      };

      if (sub.filter) {
        channelConfig.filter = sub.filter;
      }

      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', channelConfig, (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              sub.onInsert?.(payload.new as T);
              break;
            case 'UPDATE':
              sub.onUpdate?.({ old: payload.old as T, new: payload.new as T });
              break;
            case 'DELETE':
              sub.onDelete?.(payload.old as T);
              break;
          }
        })
        .subscribe((subStatus) => {
          if (subStatus === 'SUBSCRIBED') {
            connectedCount++;
            if (connectedCount === subscriptions.length) {
              setStatus('connected');
            }
          } else if (subStatus === 'CHANNEL_ERROR') {
            setStatus('error');
          }
        });

      channelsRef.current.push(channel);
    });

    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
      setStatus('disconnected');
    };
  }, [subscriptions, enabled]);

  return { status };
}

// Presence hook for user online status
interface UsePresenceOptions {
  channelName: string;
  userId: string;
  metadata?: Record<string, any>;
  onSync?: (state: Record<string, any[]>) => void;
  onJoin?: (key: string, currentPresences: any[], newPresences: any[]) => void;
  onLeave?: (key: string, currentPresences: any[], leftPresences: any[]) => void;
}

export function usePresence(options: UsePresenceOptions) {
  const { channelName, userId, metadata = {}, onSync, onJoin, onLeave } = options;

  const channelRef = useRef<RealtimeChannel | null>(null);
  const [presenceState, setPresenceState] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setPresenceState(state);
        onSync?.(state);
      })
      .on('presence', { event: 'join' }, ({ key, currentPresences, newPresences }) => {
        onJoin?.(key, currentPresences, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, currentPresences, leftPresences }) => {
        onLeave?.(key, currentPresences, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            ...metadata,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [channelName, userId, metadata, onSync, onJoin, onLeave]);

  return {
    presenceState,
    onlineUsers: Object.keys(presenceState).length,
  };
}
