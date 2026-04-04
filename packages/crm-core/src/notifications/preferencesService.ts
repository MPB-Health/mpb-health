import type { SupabaseClient } from '@supabase/supabase-js';

export interface NotificationPreferences {
  id?: string;
  user_id?: string;
  email_notifications: boolean;
  desktop_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email_notifications: true,
  desktop_notifications: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export class PreferencesService {
  constructor(private supabase: SupabaseClient) {}

  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const { data: userData } = await this.supabase.auth.getUser();
      if (!userData?.user) return { ...DEFAULT_PREFERENCES };

      const { data, error } = await this.supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (error || !data) {
        return { ...DEFAULT_PREFERENCES };
      }

      return {
        id: data.id,
        user_id: data.user_id,
        email_notifications: data.email_notifications ?? DEFAULT_PREFERENCES.email_notifications,
        desktop_notifications: data.desktop_notifications ?? DEFAULT_PREFERENCES.desktop_notifications,
        quiet_hours_enabled: data.quiet_hours_enabled ?? DEFAULT_PREFERENCES.quiet_hours_enabled,
        quiet_hours_start: data.quiet_hours_start ?? DEFAULT_PREFERENCES.quiet_hours_start,
        quiet_hours_end: data.quiet_hours_end ?? DEFAULT_PREFERENCES.quiet_hours_end,
        timezone: data.timezone ?? DEFAULT_PREFERENCES.timezone,
      };
    } catch (error) {
      console.error('Error fetching preferences:', error);
      return { ...DEFAULT_PREFERENCES };
    }
  }

  async upsertPreferences(
    prefs: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: userData } = await this.supabase.auth.getUser();
      if (!userData?.user) return { success: false, error: 'Not authenticated' };

      const { error } = await this.supabase
        .from('notification_preferences')
        .upsert(
          {
            user_id: userData.user.id,
            ...prefs,
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error saving preferences:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Error saving preferences:', error);
      return { success: false, error: 'Unexpected error' };
    }
  }
}

export function createPreferencesService(supabase: SupabaseClient): PreferencesService {
  return new PreferencesService(supabase);
}
