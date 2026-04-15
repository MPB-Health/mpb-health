// ============================================================================
// WhiteLabelProvider — Applies org-specific branding via CSS custom properties
// ============================================================================

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { licensingService } from '../LicensingService';
import type { WhiteLabelConfig } from '../types';

interface WhiteLabelContextValue {
  config: WhiteLabelConfig | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const WhiteLabelContext = createContext<WhiteLabelContextValue>({
  config: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

export function useWhiteLabel(): WhiteLabelContextValue {
  return useContext(WhiteLabelContext);
}

interface WhiteLabelProviderProps {
  orgId: string | null;
  children: ReactNode;
}

export function WhiteLabelProvider({ orgId, children }: WhiteLabelProviderProps) {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = async () => {
    if (!orgId) {
      setConfig(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await licensingService.getWhiteLabelConfig(orgId);
      setConfig(data);

      if (data) {
        applyBranding(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load white-label config'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [orgId]);

  return (
    <WhiteLabelContext.Provider value={{ config, loading, error, refresh }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

function applyBranding(config: WhiteLabelConfig) {
  const root = document.documentElement;

  root.style.setProperty('--wl-primary', config.primary_color);
  root.style.setProperty('--wl-secondary', config.secondary_color);
  root.style.setProperty('--wl-accent', config.accent_color);

  if (config.background_color) {
    root.style.setProperty('--wl-background', config.background_color);
  }
  if (config.text_color) {
    root.style.setProperty('--wl-text', config.text_color);
  }
  if (config.header_color) {
    root.style.setProperty('--wl-header', config.header_color);
  }
  if (config.sidebar_color) {
    root.style.setProperty('--wl-sidebar', config.sidebar_color);
  }
  if (config.font_family) {
    root.style.setProperty('--wl-font-family', config.font_family);
  }
  if (config.heading_font_family) {
    root.style.setProperty('--wl-heading-font', config.heading_font_family);
  }

  if (config.favicon_url) {
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon) {
      favicon.href = config.favicon_url;
    }
  }

  if (config.meta_title) {
    document.title = config.meta_title;
  }
}
