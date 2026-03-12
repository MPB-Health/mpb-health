import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@mpbhealth/database';

interface WidgetConfig {
  widget_key: string;
  is_visible: boolean;
  order_index: number;
  grid_column: string;
}

let cachedWidgets: WidgetConfig[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useWidgetVisibility() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(cachedWidgets || []);
  const [loading, setLoading] = useState(!cachedWidgets);

  useEffect(() => {
    if (cachedWidgets && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setWidgets(cachedWidgets);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('advisor_dashboard_widgets')
          .select('widget_key, is_visible, order_index, grid_column')
          .order('order_index', { ascending: true });
        if (!cancelled && data) {
          cachedWidgets = data as WidgetConfig[];
          cacheTimestamp = Date.now();
          setWidgets(cachedWidgets);
        }
      } catch {
        // On error, show all widgets (fail open)
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const isVisible = useCallback(
    (key: string): boolean => {
      if (widgets.length === 0) return true; // No config = show all
      const w = widgets.find((w) => w.widget_key === key);
      return w ? w.is_visible : true; // Unknown key = show
    },
    [widgets]
  );

  return { isVisible, widgets, loading };
}
