import { supabase } from './supabase';

export interface SiteAnalytics {
  id: string;
  date: string;
  page_views: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_session_duration: number;
  conversion_rate: number;
  created_at: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  channel: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ContentAnalytics {
  id: string;
  content_id: string;
  content_type: string;
  views: number;
  unique_views: number;
  avg_time_on_page: number;
  shares: number;
  leads_generated: number;
  date: string;
  created_at: string;
}

export interface AdminActionLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  changes: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface SiteSetting {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface SEOMetadata {
  id: string;
  page_path: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  canonical_url: string;
  robots: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export const adminAnalyticsService = {
  async getSiteAnalytics(startDate?: string, endDate?: string) {
    let query = supabase
      .from('site_analytics')
      .select('*')
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as SiteAnalytics[];
  },

  async getMarketingCampaigns(status?: string) {
    let query = supabase
      .from('marketing_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as MarketingCampaign[];
  },

  async createMarketingCampaign(campaign: Partial<MarketingCampaign>) {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .insert([campaign])
      .select()
      .single();

    if (error) throw error;
    return data as MarketingCampaign;
  },

  async updateMarketingCampaign(id: string, updates: Partial<MarketingCampaign>) {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as MarketingCampaign;
  },

  async getContentAnalytics(contentId?: string, contentType?: string) {
    let query = supabase
      .from('content_analytics')
      .select('*')
      .order('date', { ascending: false });

    if (contentId) {
      query = query.eq('content_id', contentId);
    }
    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as ContentAnalytics[];
  },

  async getTopPerformingContent(limit = 10) {
    const { data, error } = await supabase
      .from('content_analytics')
      .select('*')
      .order('views', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as ContentAnalytics[];
  },

  async logAdminAction(action: Partial<AdminActionLog>) {
    const { data, error } = await supabase
      .from('admin_actions_log')
      .insert([action])
      .select()
      .single();

    if (error) throw error;
    return data as AdminActionLog;
  },

  async getAdminActionLogs(filters?: { adminUserId?: string; targetType?: string; limit?: number }) {
    let query = supabase
      .from('admin_actions_log')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.adminUserId) {
      query = query.eq('admin_user_id', filters.adminUserId);
    }
    if (filters?.targetType) {
      query = query.eq('target_type', filters.targetType);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as AdminActionLog[];
  },

  async getSiteSettings(category?: string) {
    let query = supabase
      .from('site_settings')
      .select('*')
      .order('category', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as SiteSetting[];
  },

  async updateSiteSetting(key: string, value: any, updatedBy: string) {
    const { data, error } = await supabase
      .from('site_settings')
      .update({
        value,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      })
      .eq('key', key)
      .select()
      .single();

    if (error) throw error;
    return data as SiteSetting;
  },

  async getSEOMetadata(pagePath?: string) {
    let query = supabase
      .from('seo_metadata')
      .select('*')
      .order('page_path', { ascending: true });

    if (pagePath) {
      query = query.eq('page_path', pagePath);
    }

    const { data, error } = await query;
    if (error) throw error;
    return pagePath ? (data?.[0] as SEOMetadata) : (data as SEOMetadata[]);
  },

  async upsertSEOMetadata(metadata: Partial<SEOMetadata>) {
    const { data, error } = await supabase
      .from('seo_metadata')
      .upsert([{ ...metadata, updated_at: new Date().toISOString() }], {
        onConflict: 'page_path'
      })
      .select()
      .single();

    if (error) throw error;
    return data as SEOMetadata;
  },

  async getMarketingROI() {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select('channel, budget, spent, revenue, conversions')
      .eq('status', 'active');

    if (error) throw error;

    const roi = data?.reduce((acc: any, campaign: any) => {
      const channel = campaign.channel;
      if (!acc[channel]) {
        acc[channel] = {
          channel,
          totalBudget: 0,
          totalSpent: 0,
          totalRevenue: 0,
          totalConversions: 0,
          roi: 0,
          cpa: 0
        };
      }

      acc[channel].totalBudget += campaign.budget || 0;
      acc[channel].totalSpent += campaign.spent || 0;
      acc[channel].totalRevenue += campaign.revenue || 0;
      acc[channel].totalConversions += campaign.conversions || 0;

      if (acc[channel].totalSpent > 0) {
        acc[channel].roi = ((acc[channel].totalRevenue - acc[channel].totalSpent) / acc[channel].totalSpent) * 100;
        acc[channel].cpa = acc[channel].totalSpent / (acc[channel].totalConversions || 1);
      }

      return acc;
    }, {});

    return Object.values(roi || {});
  }
};
