import type { SupabaseClient } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  mobile_phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  job_title: string | null;
  department: string | null;
  timezone: string | null;
  locale: string | null;
  social_linkedin: string | null;
  social_twitter: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_github: string | null;
  social_website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateInput {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone?: string;
  mobile_phone?: string;
  avatar_url?: string;
  bio?: string;
  job_title?: string;
  department?: string;
  timezone?: string;
  locale?: string;
  social_linkedin?: string;
  social_twitter?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_github?: string;
  social_website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export class ProfileService {
  constructor(private supabase: SupabaseClient) {}

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, phone, role, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to get profile:', error);
        return null;
      }
      return data as unknown as UserProfile;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  async updateProfile(userId: string, updates: ProfileUpdateInput): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }

  async uploadAvatar(userId: string, file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) return { success: false, error: uploadError.message };

      const { data } = this.supabase.storage.from('avatars').getPublicUrl(path);

      const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;
      await this.updateProfile(userId, { avatar_url: avatarUrl });

      return { success: true, url: avatarUrl };
    } catch (error) {
      console.error('Upload avatar error:', error);
      return { success: false, error: 'Failed to upload avatar' };
    }
  }

  async getOrgProfiles(orgId: string): Promise<(UserProfile & { membership_role: string; membership_status: string })[]> {
    try {
      const { data, error } = await this.supabase
        .from('org_memberships')
        .select('role, status, profile:profiles(id, role, first_name, last_name, display_name, email, phone, mobile_phone, avatar_url, bio, job_title, department, timezone, locale, social_linkedin, social_twitter, social_facebook, social_instagram, social_github, social_website, address_line1, address_line2, city, state, postal_code, country, created_at, updated_at)')
        .eq('org_id', orgId)
        .in('status', ['active', 'suspended']);

      if (error) {
        console.error('Failed to get org profiles:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        ...row.profile,
        membership_role: row.role,
        membership_status: row.status,
      }));
    } catch (error) {
      console.error('Get org profiles error:', error);
      return [];
    }
  }
}

export function createProfileService(supabase: SupabaseClient): ProfileService {
  return new ProfileService(supabase);
}
