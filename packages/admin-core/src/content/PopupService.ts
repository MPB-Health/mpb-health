import { supabase } from '@mpbhealth/database';

export interface PopupTrigger {
  type: 'exit_intent' | 'time_delay' | 'scroll_percent' | 'page_load' | 'button_click';
  delay_ms?: number;
  scroll_percent?: number;
}

export interface PopupTargeting {
  pages: 'all' | string[];
  visitor_type?: 'new' | 'returning' | 'all';
}

export interface CmsPopup {
  id: string;
  name: string;
  blocks: unknown[];
  trigger_config: PopupTrigger;
  targeting: PopupTargeting;
  frequency: 'once' | 'once_per_session' | 'always';
  is_active: boolean;
  impressions: number;
  closes: number;
  conversions: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PopupCreateInput = Pick<CmsPopup, 'name'> &
  Partial<Pick<CmsPopup, 'blocks' | 'trigger_config' | 'targeting' | 'frequency' | 'is_active'>>;

export type PopupUpdateInput = Partial<
  Pick<CmsPopup, 'name' | 'blocks' | 'trigger_config' | 'targeting' | 'frequency' | 'is_active'>
>;

const COLUMNS =
  'id, name, blocks, trigger_config, targeting, frequency, is_active, impressions, closes, conversions, created_by, created_at, updated_at';

export class PopupService {
  async getPopups(): Promise<CmsPopup[]> {
    const { data, error } = await supabase
      .from('cms_popups')
      .select(COLUMNS)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  }

  async getPopup(id: string): Promise<CmsPopup | null> {
    const { data, error } = await supabase
      .from('cms_popups')
      .select(COLUMNS)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  async createPopup(input: PopupCreateInput): Promise<CmsPopup> {
    const { data, error } = await supabase
      .from('cms_popups')
      .insert(input)
      .select(COLUMNS)
      .single();

    if (error) throw error;
    return data as any;
  }

  async updatePopup(id: string, input: PopupUpdateInput): Promise<CmsPopup> {
    const { data, error } = await supabase
      .from('cms_popups')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(COLUMNS)
      .single();

    if (error) throw error;
    return data as any;
  }

  async deletePopup(id: string): Promise<void> {
    const { error } = await supabase
      .from('cms_popups')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleActive(id: string, active: boolean): Promise<CmsPopup> {
    return this.updatePopup(id, { is_active: active });
  }

  async incrementStat(
    id: string,
    stat: 'impressions' | 'closes' | 'conversions',
  ): Promise<void> {
    const { data: current, error: fetchError } = await supabase
      .from('cms_popups')
      .select(stat)
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    const next = ((current as any)?.[stat] ?? 0) + 1;

    const { error } = await supabase
      .from('cms_popups')
      .update({ [stat]: next })
      .eq('id', id);

    if (error) throw error;
  }
}

export const popupService = new PopupService();
