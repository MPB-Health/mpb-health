import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@mpbhealth/database';
import { contentService } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorQueryReady } from './useAdvisorQueryReady';

/**
 * The bulletin realtime channel has a fixed topic name, so concurrent consumers
 * (layout badge, dashboard, bulletins page) must share one channel instead of
 * each opening their own.
 */
const listeners = new Set<() => void>();
let sharedChannel: ReturnType<typeof contentService.subscribeToBulletins> | null = null;

function subscribeSharedBulletinChannel(listener: () => void): () => void {
  listeners.add(listener);
  if (!sharedChannel) {
    sharedChannel = contentService.subscribeToBulletins(() => {
      listeners.forEach((l) => l());
    });
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && sharedChannel) {
      void supabase.removeChannel(sharedChannel);
      sharedChannel = null;
    }
  };
}

/**
 * Server-state slice extracted from AdvisorContext (Candidate 9 split).
 *
 * Realtime events invalidate the query, so every mounted consumer updates
 * together. The subscription is skipped while must_change_password to avoid
 * the WebSocket "closed before connection established" error during the
 * /change-password redirect.
 */
export function useUnreadBulletinCount(): number {
  const { profile } = useAdvisor();
  const { advisorReady, profileId } = useAdvisorQueryReady();
  const queryClient = useQueryClient();

  const { data: count } = useQuery({
    queryKey: ['advisorUnreadBulletins', profileId] as const,
    queryFn: () => contentService.getUnreadBulletinCount(profileId!),
    enabled: Boolean(advisorReady && profileId),
  });

  const subscriptionActive = Boolean(profileId && profile && !profile.must_change_password);

  useEffect(() => {
    if (!subscriptionActive) return;
    return subscribeSharedBulletinChannel(() => {
      void queryClient.invalidateQueries({ queryKey: ['advisorUnreadBulletins', profileId] });
    });
  }, [subscriptionActive, profileId, queryClient]);

  return count ?? 0;
}
