import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';

export interface FocusItem {
  id: string;
  org_id: string;
  user_id: string;
  entity_type: 'lead' | 'contact' | 'deal' | 'task' | 'case';
  entity_id: string;
  priority: number;
  notes: string | null;
  pinned_at: string;
  completed_at: string | null;
  created_at: string;
}

export function useFocusItems() {
  const { activeOrgId } = useOrg();
  const [items, setItems] = useState<FocusItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadItems = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('crm_focus_items')
        .select('id, org_id, user_id, entity_type, entity_id, priority, notes, pinned_at, completed_at, created_at')
        .eq('org_id', activeOrgId)
        .is('completed_at', null)
        .order('priority', { ascending: false })
        .order('pinned_at', { ascending: false })
        .limit(20);
      setItems((data as unknown as FocusItem[]) || []);
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const pinItem = useCallback(
    async (entityType: FocusItem['entity_type'], entityId: string, notes?: string) => {
      if (!activeOrgId) return;
      const existing = items.find(
        (i) => i.entity_type === entityType && i.entity_id === entityId,
      );
      if (existing) return;

      const { data, error } = await supabase
        .from('crm_focus_items')
        .insert({ org_id: activeOrgId, entity_type: entityType, entity_id: entityId, notes })
        .select('id, org_id, user_id, entity_type, entity_id, priority, notes, pinned_at, completed_at, created_at')
        .single();

      if (!error && data) {
        setItems((prev) => [data as unknown as FocusItem, ...prev]);
      }
      return !error;
    },
    [activeOrgId, items],
  );

  const unpinItem = useCallback(async (itemId: string) => {
    await supabase.from('crm_focus_items').delete().eq('id', itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const completeItem = useCallback(async (itemId: string) => {
    await supabase
      .from('crm_focus_items')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const isPinned = useCallback(
    (entityType: FocusItem['entity_type'], entityId: string) => {
      return items.some((i) => i.entity_type === entityType && i.entity_id === entityId);
    },
    [items],
  );

  return { items, loading, pinItem, unpinItem, completeItem, isPinned, refresh: loadItems };
}
