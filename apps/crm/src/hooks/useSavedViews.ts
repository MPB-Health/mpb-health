import { useState, useEffect, useCallback } from 'react';
import { createSavedViewService, type SavedView } from '@mpbhealth/crm-core';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface UseSavedViewsOptions<T> {
  module: string;
  currentFilters: T;
  onApplyFilters: (filters: T) => void;
}

export function useSavedViews<T extends Record<string, unknown>>({
  module,
  currentFilters,
  onApplyFilters,
}: UseSavedViewsOptions<T>) {
  const [service] = useState(() => createSavedViewService(supabase));
  const [views, setViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadViews = useCallback(async () => {
    const data = await service.getViews(module);
    setViews(data);

    // Apply default view on first load
    const defaultView = data.find((v) => v.is_default);
    if (defaultView && !activeViewId) {
      setActiveViewId(defaultView.id);
      onApplyFilters(defaultView.filters as T);
    }
  }, [service, module]);

  useEffect(() => {
    loadViews();
  }, [loadViews]);

  const applyView = useCallback(
    (view: SavedView) => {
      setActiveViewId(view.id);
      onApplyFilters(view.filters as T);
    },
    [onApplyFilters]
  );

  const saveCurrentAsView = useCallback(
    async (name: string, isShared = false) => {
      setLoading(true);
      const result = await service.createView({
        module,
        name,
        filters: currentFilters,
        is_shared: isShared,
      });
      setLoading(false);

      if (result.success) {
        toast.success(`View "${name}" saved`);
        await loadViews();
        if (result.view) setActiveViewId(result.view.id);
      } else {
        toast.error(result.error || 'Failed to save view');
      }
      return result;
    },
    [service, module, currentFilters, loadViews]
  );

  const deleteView = useCallback(
    async (id: string) => {
      const result = await service.deleteView(id);
      if (result.success) {
        toast.success('View deleted');
        if (activeViewId === id) setActiveViewId(null);
        await loadViews();
      } else {
        toast.error(result.error || 'Failed to delete view');
      }
    },
    [service, activeViewId, loadViews]
  );

  const setDefaultView = useCallback(
    async (id: string) => {
      const result = await service.setDefault(id, module);
      if (result.success) {
        toast.success('Default view set');
        await loadViews();
      }
    },
    [service, module, loadViews]
  );

  return {
    views,
    activeViewId,
    loading,
    applyView,
    saveCurrentAsView,
    deleteView,
    setDefaultView,
    clearActiveView: () => setActiveViewId(null),
  };
}
