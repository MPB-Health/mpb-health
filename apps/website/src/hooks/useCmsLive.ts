import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { safeRemoveChannel } from '@mpbhealth/database';

// Supabase's PostgrestFilterBuilder is a thenable that resolves to a richer
// response than we care about. We only need `data` + `error`, and because
// PostgrestSingleResponse uses contravariant `then` generics, narrowing the
// data type up front fights TS. So we accept `unknown` for the resolved
// shape and assert inside the hook — the runtime shape is always identical
// regardless of which column projection the caller picked.
export interface CmsLiveQueryResult<T> {
  data: T[] | null;
  error: { message: string; code?: string } | null;
}

export interface UseCmsLiveOptions<T> {
  table: string;
  // Accept any thenable that resolves to `{ data, error }`. Supabase's
  // builder objects (PostgrestFilterBuilder, etc.) match this when awaited.
  buildQuery: () => PromiseLike<{
    data: unknown;
    error: { message: string; code?: string } | null;
  }>;
  realtimeFilter?: string;
  refetchKey?: string;
  enabled?: boolean;
  // Optional generic anchor so callers can write `useCmsLive<Event>(...)`
  // even though buildQuery itself is loosely typed.
  _ghost?: T;
}

export interface UseCmsLiveResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCmsLive<T>({
  table,
  buildQuery,
  realtimeFilter,
  refetchKey,
  enabled = true,
}: UseCmsLiveOptions<T>): UseCmsLiveResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const buildQueryRef = useRef(buildQuery);

  buildQueryRef.current = buildQuery;

  const refetch = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      const { data: rows, error: err } = await buildQueryRef.current();
      if (!mountedRef.current) return;
      if (err) {
        setError(err.message);
        return;
      }
      setError(null);
      // The hook is generic over T but Supabase's response is typed to the
      // exact column projection. Trust the caller's generic.
      setData((rows as T[] | null) || []);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      setLoading(false);
      return;
    }

    refetch();

    if (!isSupabaseConfigured) return;

    let channel: RealtimeChannel | null = null;
    try {
      const channelName = `cms-live:${table}:${refetchKey || 'default'}`;
      channel = supabase.channel(channelName);
      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            ...(realtimeFilter ? { filter: realtimeFilter } : {}),
          },
          () => {
            refetch();
          }
        )
        .subscribe();
    } catch {
      // Realtime is best-effort; the focus listener still keeps things fresh.
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', refetch);

    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', refetch);
      safeRemoveChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, realtimeFilter, refetchKey, enabled]);

  return { data, loading, error, refetch };
}

