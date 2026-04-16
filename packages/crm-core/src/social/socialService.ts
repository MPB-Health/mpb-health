import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SocialPost,
  SocialPostCreateInput,
  SocialPostUpdateInput,
  SocialPlatformConnection,
  SocialPlatformConnectionUpsertInput,
} from './socialTypes';

export class SocialService {
  constructor(
    private supabase: SupabaseClient,
    private orgId: string
  ) {}

  private orgReady(): boolean {
    return Boolean(this.orgId);
  }

  // ── Posts (crm_social_posts) ─────────────────────────────────────────────

  async getPosts(limit = 200): Promise<{ posts: SocialPost[]; error?: string }> {
    if (!this.orgReady()) return { posts: [] };
    const { data, error } = await this.supabase
      .from('crm_social_posts')
      .select('id, org_id, platform, content, scheduled_at, published_at, status, metrics, created_by, created_at, updated_at')
      .eq('org_id', this.orgId)
      .order('post_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[SocialService] getPosts', error);
      return { posts: [], error: error.message };
    }
    return { posts: (data ?? []) as unknown as SocialPost[] };
  }

  async createPost(input: SocialPostCreateInput): Promise<{ success: boolean; post?: SocialPost; error?: string }> {
    if (!this.orgReady()) return { success: false, error: 'No organization' };
    const { data: user } = await this.supabase.auth.getUser();
    const row = {
      org_id: this.orgId,
      title: input.title.trim(),
      platform: input.platform,
      post_date: input.post_date ?? new Date().toISOString().slice(0, 10),
      status: input.status ?? 'scheduled',
      utm_campaign: input.utm_campaign ?? null,
      notes: input.notes ?? null,
      linked_campaign_id: input.linked_campaign_id ?? null,
      created_by: user.user?.id ?? null,
    };

    const { data, error } = await this.supabase.from('crm_social_posts').insert(row).select('id, org_id, platform, content, scheduled_at, published_at, status, metrics, created_by, created_at, updated_at').single();

    if (error) {
      console.error('[SocialService] createPost', error);
      return { success: false, error: error.message };
    }
    return { success: true, post: data as unknown as SocialPost };
  }

  async updatePost(
    id: string,
    input: SocialPostUpdateInput
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.orgReady()) return { success: false, error: 'No organization' };
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined) patch[k] = v;
    }
    if (Object.keys(patch).length === 0) return { success: true };
    const { error } = await this.supabase.from('crm_social_posts').update(patch).eq('id', id).eq('org_id', this.orgId);

    if (error) {
      console.error('[SocialService] updatePost', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  async deletePost(id: string): Promise<{ success: boolean; error?: string }> {
    if (!this.orgReady()) return { success: false, error: 'No organization' };
    const { error } = await this.supabase.from('crm_social_posts').delete().eq('id', id).eq('org_id', this.orgId);

    if (error) {
      console.error('[SocialService] deletePost', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  // ── Platform connections (crm_social_platform_connections) ─────────────

  async getConnections(): Promise<{ connections: SocialPlatformConnection[]; error?: string }> {
    if (!this.orgReady()) return { connections: [] };
    const { data, error } = await this.supabase
      .from('crm_social_platform_connections')
      .select(
        'id, org_id, provider, connection_status, display_name, metadata, sync_error, last_synced_at, connected_by, created_at, updated_at, token_expires_at, oauth_scope'
      )
      .eq('org_id', this.orgId)
      .order('provider');

    if (error) {
      console.error('[SocialService] getConnections', error);
      return { connections: [], error: error.message };
    }
    return { connections: (data ?? []) as unknown as SocialPlatformConnection[] };
  }

  async upsertConnection(
    input: SocialPlatformConnectionUpsertInput
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.orgReady()) return { success: false, error: 'No organization' };
    const { data: user } = await this.supabase.auth.getUser();

    const row = {
      org_id: this.orgId,
      provider: input.provider,
      connection_status: input.connection_status ?? 'not_configured',
      display_name: input.display_name ?? null,
      metadata: input.metadata ?? {},
      sync_error: input.sync_error ?? null,
      last_synced_at: input.last_synced_at ?? null,
      connected_by: user.user?.id ?? null,
    };

    const { error } = await this.supabase.from('crm_social_platform_connections').upsert(row, {
      onConflict: 'org_id,provider',
    });

    if (error) {
      console.error('[SocialService] upsertConnection', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  async deleteConnection(provider: SocialPlatformConnectionUpsertInput['provider']): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.orgReady()) return { success: false, error: 'No organization' };
    const { error } = await this.supabase
      .from('crm_social_platform_connections')
      .delete()
      .eq('org_id', this.orgId)
      .eq('provider', provider);

    if (error) {
      console.error('[SocialService] deleteConnection', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }
}

export function createSocialService(supabase: SupabaseClient, orgId: string): SocialService {
  return new SocialService(supabase, orgId);
}
