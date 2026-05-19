import { supabase } from '@mpbhealth/database';

export interface ThemeSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text_primary: string;
    text_secondary: string;
  };
  typography: {
    heading_font: string;
    body_font: string;
    base_size: number;
  };
  buttons: {
    border_radius: number;
    shadow: boolean;
  };
  spacing_multiplier: number;
  logo_url: string;
  favicon_url: string;
  custom_css: string;
}

const DEFAULT_THEME: ThemeSettings = {
  colors: {
    primary: '#1e40af',
    secondary: '#0f766e',
    accent: '#7c3aed',
    background: '#ffffff',
    text_primary: '#1e293b',
    text_secondary: '#64748b',
  },
  typography: {
    heading_font: 'Inter',
    body_font: 'Inter',
    base_size: 16,
  },
  buttons: {
    border_radius: 8,
    shadow: true,
  },
  spacing_multiplier: 1,
  logo_url: '',
  favicon_url: '',
  custom_css: '',
};

export class ThemeService {
  async getTheme(): Promise<ThemeSettings> {
    const { data, error } = await supabase
      .from('cms_theme')
      .select('settings')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return DEFAULT_THEME;

    return { ...DEFAULT_THEME, ...(data.settings as Partial<ThemeSettings>) };
  }

  async updateTheme(settings: ThemeSettings, userId: string): Promise<ThemeSettings> {
    // Upsert the single row — update first, insert if missing
    const { data: existing } = await supabase
      .from('cms_theme')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('cms_theme')
        .update({ settings, updated_by: userId })
        .eq('id', existing.id)
        .select('settings')
        .single();

      if (error) throw error;
      return data.settings as ThemeSettings;
    }

    const { data, error } = await supabase
      .from('cms_theme')
      .insert({ settings, updated_by: userId })
      .select('settings')
      .single();

    if (error) throw error;
    return data.settings as ThemeSettings;
  }
}

export const themeService = new ThemeService();
