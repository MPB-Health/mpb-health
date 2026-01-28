import { useState, useEffect, useCallback } from 'react';
import { priorityService, type PowerListItem, type PriorityLane, type PriorityItemWithDetails } from '@mpbhealth/champion-core';
import { useOrg } from '@mpbhealth/auth';
import { useAdvisor } from '../contexts/AdvisorContext';

export function usePowerList() {
  const { activeOrg } = useOrg();
  const { profile } = useAdvisor();
  const [items, setItems] = useState<PowerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!activeOrg?.id) return;
    try {
      setLoading(true);
      const data = await priorityService.getPowerList(activeOrg.id, profile?.user_id);
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load power list'));
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id, profile?.user_id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}

export function usePriorityLanes() {
  const { activeOrg } = useOrg();
  const [lanes, setLanes] = useState<PriorityLane[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!activeOrg?.id) return;
    try {
      setLoading(true);
      const data = await priorityService.getLanes(activeOrg.id);
      setLanes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load lanes'));
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { lanes, loading, error, refresh };
}

export function useLaneItems(laneId: string | null) {
  const [items, setItems] = useState<PriorityItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!laneId) return;
    try {
      setLoading(true);
      const data = await priorityService.getLaneItems(laneId);
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load lane items'));
    } finally {
      setLoading(false);
    }
  }, [laneId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}

export function usePriorityStats() {
  const { activeOrg } = useOrg();
  const { profile } = useAdvisor();
  const [stats, setStats] = useState<{
    totalItems: number;
    byLane: { laneId: string; laneName: string; count: number }[];
    snoozedCount: number;
    completedToday: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!activeOrg?.id) return;
    try {
      setLoading(true);
      const data = await priorityService.getStats(activeOrg.id, profile?.user_id);
      setStats(data);
    } catch (err) {
      console.error('Failed to load priority stats:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id, profile?.user_id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, refresh };
}

export function usePriorityActions() {
  const { activeOrg } = useOrg();

  const snoozeItem = useCallback(async (itemId: string, until: Date, reason?: string) => {
    await priorityService.snoozeItem({ item_id: itemId, until, reason });
  }, []);

  const unsnoozeItem = useCallback(async (itemId: string) => {
    await priorityService.unsnoozeItem(itemId);
  }, []);

  const completeItem = useCallback(async (itemId: string, reason?: string) => {
    await priorityService.completeItem(itemId, reason);
  }, []);

  const moveItem = useCallback(async (itemId: string, newLaneId: string, newRank?: number) => {
    await priorityService.moveItem({ item_id: itemId, new_lane_id: newLaneId, new_rank: newRank });
  }, []);

  const addToLane = useCallback(async (laneId: string, leadId?: string, contactId?: string, reason?: string) => {
    if (!activeOrg?.id) throw new Error('No active organization');
    return priorityService.addToLane(activeOrg.id, {
      lane_id: laneId,
      lead_id: leadId,
      contact_id: contactId,
      reason,
    });
  }, [activeOrg?.id]);

  const recordAction = useCallback(async (itemId: string, nextActionAt?: Date) => {
    await priorityService.recordAction(itemId, nextActionAt);
  }, []);

  return {
    snoozeItem,
    unsnoozeItem,
    completeItem,
    moveItem,
    addToLane,
    recordAction,
  };
}
