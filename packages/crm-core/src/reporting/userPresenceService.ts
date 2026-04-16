import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserPresence, UserPresenceStatus, UserPresenceUpdateInput } from './types';

export class UserPresenceService {
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all online users for an organization
   */
  async getOnlineUsers(orgId: string): Promise<UserPresence[]> {
    try {
      // Consider users online if active in last 5 minutes
      const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('user_presence')
        .select(`
        id, user_id, org_id, status, current_page, last_activity_at, session_started_at, ip_address, user_agent,
          profiles:user_id (email, full_name)
        `)
        .eq('org_id', orgId)
        .in('status', ['online', 'away', 'busy'])
        .gte('last_activity_at', cutoff)
        .order('last_activity_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((p) => ({
        ...p,
        user_email: (p.profiles as any)?.email,
        user_name: (p.profiles as any)?.full_name,
      }));
    } catch (err) {
      console.error('UserPresenceService.getOnlineUsers error:', err);
      return [];
    }
  }

  /**
   * Get presence for a specific user
   */
  async getUserPresence(userId: string): Promise<UserPresence | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_presence')
        .select(`
        id, user_id, org_id, status, current_page, last_activity_at, session_started_at, ip_address, user_agent,
          profiles:user_id (email, full_name)
        `)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) return null;

      return {
        ...data,
        user_email: (data.profiles as any)?.email,
        user_name: (data.profiles as any)?.full_name,
      };
    } catch (err) {
      console.error('UserPresenceService.getUserPresence error:', err);
      return null;
    }
  }

  /**
   * Update or create presence for current user
   */
  async updatePresence(
    orgId: string,
    input: UserPresenceUpdateInput
  ): Promise<UserPresence | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await this.supabase
        .from('user_presence')
        .upsert(
          {
            user_id: user.id,
            org_id: orgId,
            status: input.status || 'online',
            current_page: input.current_page,
            last_activity_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select('id, user_id, org_id, status, current_page, last_activity_at, session_started_at, ip_address, user_agent')
        .single();

      if (error) throw error;
      return data as any;
    } catch (err) {
      console.error('UserPresenceService.updatePresence error:', err);
      return null;
    }
  }

  /**
   * Set user as unknown as online
   */
  async setOnline(orgId: string, currentPage?: string): Promise<UserPresence | null> {
    return this.updatePresence(orgId, { status: 'online', current_page: currentPage });
  }

  /**
   * Set user as unknown as away
   */
  async setAway(orgId: string): Promise<UserPresence | null> {
    return this.updatePresence(orgId, { status: 'away' });
  }

  /**
   * Set user as unknown as busy
   */
  async setBusy(orgId: string): Promise<UserPresence | null> {
    return this.updatePresence(orgId, { status: 'busy' });
  }

  /**
   * Set user as unknown as offline
   */
  async setOffline(): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return false;

      const { error } = await this.supabase
        .from('user_presence')
        .update({
          status: 'offline',
          last_activity_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('UserPresenceService.setOffline error:', err);
      return false;
    }
  }

  /**
   * Start heartbeat to keep presence alive
   */
  startHeartbeat(orgId: string, intervalMs: number = 60000): void {
    this.stopHeartbeat();

    // Initial ping
    this.updatePresence(orgId, { status: 'online' });

    this.heartbeatInterval = setInterval(() => {
      this.updatePresence(orgId, { status: 'online' });
    }, intervalMs);
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Track page navigation
   */
  async trackPageView(orgId: string, pagePath: string): Promise<void> {
    await this.updatePresence(orgId, { status: 'online', current_page: pagePath });
  }

  /**
   * Get presence stats for org
   */
  async getPresenceStats(orgId: string): Promise<{
    total_online: number;
    total_away: number;
    total_busy: number;
    by_page: Record<string, number>;
  }> {
    try {
      const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('user_presence')
        .select('status, current_page')
        .eq('org_id', orgId)
        .gte('last_activity_at', cutoff);

      if (error) throw error;

      const stats = {
        total_online: 0,
        total_away: 0,
        total_busy: 0,
        by_page: {} as Record<string, number>,
      };

      for (const p of data || []) {
        if (p.status === 'online') stats.total_online++;
        else if (p.status === 'away') stats.total_away++;
        else if (p.status === 'busy') stats.total_busy++;

        if (p.current_page) {
          stats.by_page[p.current_page] = (stats.by_page[p.current_page] || 0) + 1;
        }
      }

      return stats;
    } catch (err) {
      console.error('UserPresenceService.getPresenceStats error:', err);
      return { total_online: 0, total_away: 0, total_busy: 0, by_page: {} };
    }
  }

  /**
   * Subscribe to presence changes (realtime)
   */
  subscribeToPresence(
    orgId: string,
    callback: (presence: UserPresence[]) => void
  ): { unsubscribe: () => void } {
    const channel = this.supabase
      .channel(`presence:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `org_id=eq.${orgId}`,
        },
        async () => {
          // Fetch updated list
          const users = await this.getOnlineUsers(orgId);
          callback(users);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        this.supabase.removeChannel(channel);
      },
    };
  }
}

export function createUserPresenceService(supabase: SupabaseClient): UserPresenceService {
  return new UserPresenceService(supabase);
}
