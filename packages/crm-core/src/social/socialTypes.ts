export type SocialPlatformId = 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';

export type SocialPostStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export type SocialConnectionStatus =
  | 'not_configured'
  | 'pending_oauth'
  | 'connected'
  | 'error'
  | 'disconnected';

/** Non-secret integration hints (OAuth tokens belong in Edge Functions / Vault, not here). */
export type SocialConnectionMetadata = Record<string, unknown>;

export interface SocialPost {
  id: string;
  org_id: string;
  title: string;
  platform: SocialPlatformId;
  post_date: string;
  status: SocialPostStatus;
  utm_campaign: string | null;
  notes: string | null;
  linked_campaign_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialPostCreateInput {
  title: string;
  platform: SocialPlatformId;
  post_date?: string;
  status?: SocialPostStatus;
  utm_campaign?: string | null;
  notes?: string | null;
  linked_campaign_id?: string | null;
}

export interface SocialPostUpdateInput {
  title?: string;
  platform?: SocialPlatformId;
  post_date?: string;
  status?: SocialPostStatus;
  utm_campaign?: string | null;
  notes?: string | null;
  linked_campaign_id?: string | null;
}

export interface SocialPlatformConnection {
  id: string;
  org_id: string;
  provider: SocialPlatformId;
  connection_status: SocialConnectionStatus;
  display_name: string | null;
  metadata: SocialConnectionMetadata;
  sync_error: string | null;
  last_synced_at: string | null;
  connected_by: string | null;
  /** Present when OAuth completed via Edge Function; tokens are never returned to the browser. */
  token_expires_at?: string | null;
  oauth_scope?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialPlatformConnectionUpsertInput {
  provider: SocialPlatformId;
  connection_status?: SocialConnectionStatus;
  display_name?: string | null;
  metadata?: SocialConnectionMetadata;
  sync_error?: string | null;
  last_synced_at?: string | null;
}
