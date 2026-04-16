import { supabase } from './supabase';

export interface TrackingPlatform {
  id: string;
  platform_name: string;
  platform_type: string;
  display_name: string;
  description: string;
  icon_url?: string;
  documentation_url?: string;
  is_active: boolean;
  requires_consent: boolean;
  config_schema: Record<string, any>;
  default_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TrackingSnippet {
  id: string;
  platform_id: string;
  snippet_name: string;
  tracking_id?: string;
  snippet_code?: string;
  snippet_type: string;
  injection_point: string;
  is_enabled: boolean;
  is_test_mode: boolean;
  load_priority: number;
  configuration: Record<string, any>;
  custom_parameters: Record<string, any>;
  version: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackingTag {
  id: string;
  tag_name: string;
  tag_category: string;
  tag_type: string;
  snippet_id: string;
  is_active: boolean;
  fire_on_page_load: boolean;
  fire_priority: number;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TagFiringRule {
  id: string;
  tag_id: string;
  rule_type: string;
  rule_condition: string;
  rule_value?: string;
  match_type: string;
  is_active: boolean;
  created_at: string;
}

export interface ConversionEvent {
  id: string;
  event_name: string;
  event_display_name: string;
  event_category: string;
  event_description?: string;
  is_active: boolean;
  track_value: boolean;
  track_currency: boolean;
  platform_mappings: Record<string, any>;
  custom_properties: Record<string, any>;
  funnel_step?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UTMCampaign {
  id: string;
  campaign_name: string;
  campaign_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term?: string;
  utm_content?: string;
  short_url?: string;
  qr_code_url?: string;
  campaign_start_date?: string;
  campaign_end_date?: string;
  campaign_budget?: number;
  is_active: boolean;
  click_count: number;
  conversion_count: number;
  revenue_generated: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackingEventLog {
  id: string;
  event_name: string;
  event_type: string;
  platform_name?: string;
  event_data: Record<string, any>;
  user_id?: string;
  session_id?: string;
  page_path?: string;
  referrer?: string;
  user_agent?: string;
  ip_address?: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export interface IntegrationHealth {
  id: string;
  platform_id: string;
  status: string;
  last_success_at?: string;
  last_error_at?: string;
  last_error_message?: string;
  success_count: number;
  error_count: number;
  avg_response_time?: number;
  uptime_percentage?: number;
  alerts_enabled: boolean;
  last_checked_at: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsExperiment {
  id: string;
  experiment_name: string;
  experiment_description?: string;
  experiment_type: string;
  hypothesis?: string;
  start_date: string;
  end_date?: string;
  status: string;
  traffic_allocation: number;
  variants: Record<string, any>;
  success_metric: string;
  baseline_value?: number;
  target_value?: number;
  statistical_significance?: number;
  winner_variant?: string;
  participants_count: number;
  conversions_count: number;
  results_data: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const analyticsTrackingService = {
  // Tracking Platforms
  async getTrackingPlatforms(activeOnly = false) {
    let query = supabase
      .from('tracking_platforms')
      .select('id, platform_name, platform_type, display_name, description, icon_url, documentation_url, is_active, requires_consent, config_schema, default_settings, created_at, updated_at')
      .order('display_name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as TrackingPlatform[];
  },

  async getTrackingPlatform(id: string) {
    const { data, error } = await supabase
      .from('tracking_platforms')
      .select('id, platform_name, platform_type, display_name, description, icon_url, documentation_url, is_active, requires_consent, config_schema, default_settings, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as TrackingPlatform;
  },

  async updateTrackingPlatform(id: string, updates: Partial<TrackingPlatform>) {
    const { data, error } = await supabase
      .from('tracking_platforms')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as TrackingPlatform;
  },

  // Tracking Snippets
  async getTrackingSnippets(platformId?: string, enabledOnly = false) {
    let query = supabase
      .from('tracking_snippets')
      .select('id, platform_id, snippet_name, tracking_id, snippet_code, snippet_type, injection_point, is_enabled, is_test_mode, load_priority, configuration, custom_parameters, version, created_by, created_at, updated_at, tracking_platforms(id, platform_name, platform_type, display_name, is_active)')
      .order('load_priority', { ascending: true });

    if (platformId) {
      query = query.eq('platform_id', platformId);
    }

    if (enabledOnly) {
      query = query.eq('is_enabled', true).eq('is_test_mode', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as any;
  },

  async createTrackingSnippet(snippet: Partial<TrackingSnippet>) {
    const { data, error } = await supabase
      .from('tracking_snippets')
      .insert([snippet])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as TrackingSnippet;
  },

  async updateTrackingSnippet(id: string, updates: Partial<TrackingSnippet>) {
    const { data, error } = await supabase
      .from('tracking_snippets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as TrackingSnippet;
  },

  async deleteTrackingSnippet(id: string) {
    const { error } = await supabase
      .from('tracking_snippets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Tracking Tags
  async getTrackingTags(category?: string) {
    let query = supabase
      .from('tracking_tags')
      .select('id, tag_name, tag_category, tag_type, snippet_id, is_active, fire_on_page_load, fire_priority, description, created_by, created_at, updated_at, tracking_snippets(id, snippet_name, snippet_type, is_enabled)')
      .order('fire_priority', { ascending: true });

    if (category) {
      query = query.eq('tag_category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as any;
  },

  async createTrackingTag(tag: Partial<TrackingTag>) {
    const { data, error } = await supabase
      .from('tracking_tags')
      .insert([tag])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as TrackingTag;
  },

  async updateTrackingTag(id: string, updates: Partial<TrackingTag>) {
    const { data, error } = await supabase
      .from('tracking_tags')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as TrackingTag;
  },

  async deleteTrackingTag(id: string) {
    const { error } = await supabase
      .from('tracking_tags')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Tag Firing Rules
  async getTagFiringRules(tagId: string) {
    const { data, error } = await supabase
      .from('tag_firing_rules')
      .select('id, tag_id, rule_type, rule_condition, rule_value, match_type, is_active, created_at')
      .eq('tag_id', tagId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as unknown as TagFiringRule[];
  },

  async createTagFiringRule(rule: Partial<TagFiringRule>) {
    const { data, error } = await supabase
      .from('tag_firing_rules')
      .insert([rule])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as TagFiringRule;
  },

  async deleteTagFiringRule(id: string) {
    const { error } = await supabase
      .from('tag_firing_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Conversion Events
  async getConversionEvents(category?: string, activeOnly = false) {
    let query = supabase
      .from('conversion_events')
      .select('id, event_name, event_display_name, event_category, event_description, is_active, track_value, track_currency, platform_mappings, custom_properties, funnel_step, created_by, created_at, updated_at')
      .order('event_display_name', { ascending: true });

    if (category) {
      query = query.eq('event_category', category);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as ConversionEvent[];
  },

  async createConversionEvent(event: Partial<ConversionEvent>) {
    const { data, error } = await supabase
      .from('conversion_events')
      .insert([event])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as ConversionEvent;
  },

  async updateConversionEvent(id: string, updates: Partial<ConversionEvent>) {
    const { data, error } = await supabase
      .from('conversion_events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as ConversionEvent;
  },

  async deleteConversionEvent(id: string) {
    const { error } = await supabase
      .from('conversion_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // UTM Campaigns
  async getUTMCampaigns(activeOnly = false) {
    let query = supabase
      .from('utm_campaigns')
      .select('id, campaign_name, campaign_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content, short_url, qr_code_url, campaign_start_date, campaign_end_date, campaign_budget, is_active, click_count, conversion_count, revenue_generated, notes, created_by, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as UTMCampaign[];
  },

  async createUTMCampaign(campaign: Partial<UTMCampaign>) {
    const { data, error } = await supabase
      .from('utm_campaigns')
      .insert([campaign])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as UTMCampaign;
  },

  async updateUTMCampaign(id: string, updates: Partial<UTMCampaign>) {
    const { data, error } = await supabase
      .from('utm_campaigns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as UTMCampaign;
  },

  async deleteUTMCampaign(id: string) {
    const { error } = await supabase
      .from('utm_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async generateCampaignURL(baseUrl: string, utm: Partial<UTMCampaign>) {
    const url = new URL(baseUrl);
    if (utm.utm_source) url.searchParams.set('utm_source', utm.utm_source);
    if (utm.utm_medium) url.searchParams.set('utm_medium', utm.utm_medium);
    if (utm.utm_campaign) url.searchParams.set('utm_campaign', utm.utm_campaign);
    if (utm.utm_term) url.searchParams.set('utm_term', utm.utm_term);
    if (utm.utm_content) url.searchParams.set('utm_content', utm.utm_content);
    return url.toString();
  },

  // Tracking Event Log
  async logTrackingEvent(event: Partial<TrackingEventLog>) {
    const { data, error } = await supabase
      .from('tracking_event_log')
      .insert([event])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as TrackingEventLog;
  },

  async getTrackingEventLog(filters?: {
    eventName?: string;
    platformName?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    let query = supabase
      .from('tracking_event_log')
      .select('id, event_name, event_type, platform_name, event_data, user_id, session_id, page_path, referrer, user_agent, ip_address, success, error_message, created_at')
      .order('created_at', { ascending: false });

    if (filters?.eventName) {
      query = query.eq('event_name', filters.eventName);
    }

    if (filters?.platformName) {
      query = query.eq('platform_name', filters.platformName);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as TrackingEventLog[];
  },

  // Integration Health
  async getIntegrationHealth() {
    const { data, error } = await supabase
      .from('integration_health')
      .select('id, platform_id, status, last_success_at, last_error_at, last_error_message, success_count, error_count, avg_response_time, uptime_percentage, alerts_enabled, last_checked_at, created_at, updated_at, tracking_platforms(id, platform_name, platform_type, display_name, is_active)')
      .order('status', { ascending: true });

    if (error) throw error;
    return data as any;
  },

  async updateIntegrationHealth(platformId: string, updates: Partial<IntegrationHealth>) {
    const { data, error } = await supabase
      .from('integration_health')
      .upsert([{
        platform_id: platformId,
        ...updates,
        updated_at: new Date().toISOString(),
        last_checked_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as IntegrationHealth;
  },

  // Analytics Experiments
  async getAnalyticsExperiments(status?: string) {
    let query = supabase
      .from('analytics_experiments')
      .select('id, experiment_name, experiment_description, experiment_type, hypothesis, start_date, end_date, status, traffic_allocation, variants, success_metric, baseline_value, target_value, statistical_significance, winner_variant, participants_count, conversions_count, results_data, created_by, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as AnalyticsExperiment[];
  },

  async createAnalyticsExperiment(experiment: Partial<AnalyticsExperiment>) {
    const { data, error } = await supabase
      .from('analytics_experiments')
      .insert([experiment])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as AnalyticsExperiment;
  },

  async updateAnalyticsExperiment(id: string, updates: Partial<AnalyticsExperiment>) {
    const { data, error } = await supabase
      .from('analytics_experiments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as AnalyticsExperiment;
  },

  async deleteAnalyticsExperiment(id: string) {
    const { error } = await supabase
      .from('analytics_experiments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
