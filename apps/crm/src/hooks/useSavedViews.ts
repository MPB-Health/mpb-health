import { useState, useEffect, useCallback } from 'react';
import { useCRMService } from '../contexts/CRMServiceContext';
import type { SavedView } from '@mpbhealth/crm-core';

export interface SmartView {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  filters: Record<string, unknown>;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
  isSystem: true;
}

const SMART_VIEWS: Record<string, SmartView[]> = {
  leads: [
    {
      id: 'smart-new-today',
      name: 'New Today',
      icon: 'zap',
      color: '#10b981',
      filters: { dateFrom: new Date().toISOString().split('T')[0] },
      sort_field: 'created_at',
      sort_direction: 'desc',
      isSystem: true,
    },
    {
      id: 'smart-healthshare',
      name: 'HealthShare',
      icon: 'shield',
      color: '#10b981',
      filters: { planType: 'healthshare' },
      sort_field: 'created_at',
      sort_direction: 'desc',
      isSystem: true,
    },
    {
      id: 'smart-traditional',
      name: 'Traditional',
      icon: 'shield-check',
      color: '#3b82f6',
      filters: { planType: 'traditional_insurance' },
      sort_field: 'created_at',
      sort_direction: 'desc',
      isSystem: true,
    },
    {
      id: 'smart-high-priority',
      name: 'High Priority',
      icon: 'alert-triangle',
      color: '#ef4444',
      filters: { priority: 'high' },
      sort_field: 'priority',
      sort_direction: 'desc',
      isSystem: true,
    },
  ],
  contacts: [
    {
      id: 'smart-recent-contacts',
      name: 'Recently Added',
      icon: 'clock',
      color: '#6366f1',
      filters: {},
      sort_field: 'created_at',
      sort_direction: 'desc',
      isSystem: true,
    },
    {
      id: 'smart-hs-contacts',
      name: 'HealthShare',
      icon: 'shield',
      color: '#10b981',
      filters: { planType: 'healthshare' },
      isSystem: true,
    },
  ],
};

export function useSavedViews(module: string) {
  const { savedViewService, orgId } = useCRMService();
  const [views, setViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const smartViews = SMART_VIEWS[module] || [];

  const loadViews = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await savedViewService.getViews(module);
      setViews(data);
      const defaultView = data.find((v) => v.is_default);
      if (defaultView && !activeViewId) {
        setActiveViewId(defaultView.id);
      }
    } catch {
      // silently fail — views are non-critical
    } finally {
      setLoading(false);
    }
  }, [savedViewService, module, orgId, activeViewId]);

  useEffect(() => {
    loadViews();
  }, [loadViews]);

  const saveView = useCallback(
    async (
      name: string,
      isShared: boolean,
      filters: Record<string, unknown>,
      options?: { sort_field?: string; sort_direction?: 'asc' | 'desc'; columns?: string[] },
    ) => {
      setLoading(true);
      try {
        const result = await savedViewService.createView({
          module,
          name,
          filters,
          is_shared: isShared,
          sort_field: options?.sort_field,
          sort_direction: options?.sort_direction,
          columns: options?.columns,
        });
        if (result.success && result.view) {
          setViews((prev) => [...prev, result.view!]);
          setActiveViewId(result.view.id);
        }
        return result;
      } finally {
        setLoading(false);
      }
    },
    [savedViewService, module],
  );

  const deleteView = useCallback(
    async (viewId: string) => {
      await savedViewService.deleteView(viewId);
      setViews((prev) => prev.filter((v) => v.id !== viewId));
      if (activeViewId === viewId) setActiveViewId(null);
    },
    [savedViewService, activeViewId],
  );

  const setDefault = useCallback(
    async (viewId: string) => {
      await savedViewService.setDefault(viewId, module);
      setViews((prev) =>
        prev.map((v) => ({
          ...v,
          is_default: v.id === viewId,
        })),
      );
    },
    [savedViewService, module],
  );

  const applyView = useCallback((view: SavedView | SmartView) => {
    setActiveViewId(view.id);
  }, []);

  const clearView = useCallback(() => {
    setActiveViewId(null);
  }, []);

  const activeSmartView = smartViews.find((v) => v.id === activeViewId) ?? null;
  const activeCustomView = views.find((v) => v.id === activeViewId) ?? null;
  const activeView = activeCustomView ?? null;

  return {
    views,
    smartViews,
    activeView,
    activeSmartView,
    activeViewId,
    loading,
    saveView,
    deleteView,
    setDefault,
    applyView,
    clearView,
  };
}
