import { invokeWithResolvedAuth } from '@mpbhealth/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChampionEnrollmentStats {
  configured: boolean;
  total_users: number;
  active_users: number;
  total_agents: number;
  active_agents: number;
  total_enrollments: number;
  pending_enrollments: number;
  approved_enrollments: number;
  total_billing_records: number;
  recent_signups_30d: number;
  recent_enrollments_30d: number;
}

export interface ChampionTrends {
  configured: boolean;
  user_signups: { date: string; count: number }[];
  enrollments: { date: string; count: number }[];
}

export interface MobileAppStats {
  configured: boolean;
  total_users: number;
  active_users: number;
  total_sessions: number;
  recent_sessions_30d: number;
  recent_signups_30d: number;
}

export interface MobileTrends {
  configured: boolean;
  user_signups: { date: string; count: number }[];
  sessions: { date: string; count: number }[];
}

export interface ExternalSupportStats {
  configured: boolean;
  total: number;
  new_tickets: number;
  open: number;
  pending: number;
  closed: number;
}

export interface GA4Overview {
  configured: boolean;
  measurement_id: string;
  stream_id: string;
  stream_name: string;
  total_sessions: number;
  total_page_views: number;
  total_users: number;
  new_users: number;
  avg_session_duration: number;
  bounce_rate: number;
  top_pages: { path: string; views: number }[];
  top_sources: { source: string; sessions: number }[];
}

export interface CombinedAnalytics {
  champion_enrollment: ChampionEnrollmentStats;
  mobile_app: MobileAppStats;
  support: ExternalSupportStats;
  ga4: GA4Overview;
  timestamp: string;
}

export interface SchemaDiscovery {
  project: string;
  tables: { name: string; row_count: number }[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const FUNCTION_NAME = 'analytics-hub-proxy';

const EMPTY_CHAMPION: ChampionEnrollmentStats = {
  configured: false,
  total_users: 0, active_users: 0,
  total_agents: 0, active_agents: 0,
  total_enrollments: 0, pending_enrollments: 0, approved_enrollments: 0,
  total_billing_records: 0,
  recent_signups_30d: 0, recent_enrollments_30d: 0,
};

const EMPTY_MOBILE: MobileAppStats = {
  configured: false,
  total_users: 0, active_users: 0,
  total_sessions: 0, recent_sessions_30d: 0, recent_signups_30d: 0,
};

const EMPTY_SUPPORT: ExternalSupportStats = {
  configured: false, total: 0, new_tickets: 0, open: 0, pending: 0, closed: 0,
};

const EMPTY_GA4: GA4Overview = {
  configured: false, measurement_id: 'G-MQMM1N1MSL', stream_id: '11406103800', stream_name: 'MPB Health',
  total_sessions: 0, total_page_views: 0, total_users: 0, new_users: 0,
  avg_session_duration: 0, bounce_rate: 0, top_pages: [], top_sources: [],
};

export class AnalyticsHubService {
  private async invoke<T>(action: string, extra?: Record<string, unknown>): Promise<T | null> {
    try {
      const { data, error } = await invokeWithResolvedAuth<{ success: boolean } & T>(
        FUNCTION_NAME,
        { body: { action, ...extra } },
      );
      if (error) {
        console.warn(`[AnalyticsHub] ${action} failed:`, error.message);
        return null;
      }
      return data as T;
    } catch (err) {
      console.warn(`[AnalyticsHub] ${action} error:`, err);
      return null;
    }
  }

  async getChampionStats(): Promise<ChampionEnrollmentStats> {
    return (await this.invoke<ChampionEnrollmentStats>('champion_stats')) ?? EMPTY_CHAMPION;
  }

  async getChampionTrends(days = 30): Promise<ChampionTrends> {
    return (
      (await this.invoke<ChampionTrends>('champion_trends', { days })) ??
      { configured: false, user_signups: [], enrollments: [] }
    );
  }

  async getMobileAppStats(): Promise<MobileAppStats> {
    return (await this.invoke<MobileAppStats>('mobile_stats')) ?? EMPTY_MOBILE;
  }

  async getMobileTrends(days = 30): Promise<MobileTrends> {
    return (
      (await this.invoke<MobileTrends>('mobile_trends', { days })) ??
      { configured: false, user_signups: [], sessions: [] }
    );
  }

  async getSupportStats(): Promise<ExternalSupportStats> {
    return (await this.invoke<ExternalSupportStats>('support_stats')) ?? EMPTY_SUPPORT;
  }

  async getGA4Overview(days = 30): Promise<GA4Overview> {
    return (await this.invoke<GA4Overview>('ga4_overview', { days })) ?? EMPTY_GA4;
  }

  async getCombinedSummary(): Promise<CombinedAnalytics> {
    const result = await this.invoke<CombinedAnalytics>('combined_summary');
    return result ?? {
      champion_enrollment: EMPTY_CHAMPION,
      mobile_app: EMPTY_MOBILE,
      support: EMPTY_SUPPORT,
      ga4: EMPTY_GA4,
      timestamp: new Date().toISOString(),
    };
  }

  async discoverSchema(project: 'champion' | 'mobile' | 'itsts'): Promise<SchemaDiscovery> {
    return (
      (await this.invoke<SchemaDiscovery>('discover_schema', { project })) ??
      { project: '', tables: [] }
    );
  }
}

export const analyticsHubService = new AnalyticsHubService();
