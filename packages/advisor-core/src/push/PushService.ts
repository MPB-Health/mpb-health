import { supabase } from '@mpbhealth/database';

// ============================================================================
// Auth helper — same pattern as ChatService/TicketService
// ============================================================================

const TOKEN_EXPIRY_BUFFER_SECONDS = 30;
let _pendingRefresh: Promise<ReturnType<typeof supabase.auth.refreshSession>> | null = null;

function refreshOnce() {
  if (!_pendingRefresh) {
    _pendingRefresh = supabase.auth.refreshSession().finally(() => {
      _pendingRefresh = null;
    });
  }
  return _pendingRefresh;
}

async function getResolvedAuthHeader(): Promise<{ Authorization: string } | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const needsRefresh = !session.expires_at || session.expires_at < nowSec + TOKEN_EXPIRY_BUFFER_SECONDS;

  if (needsRefresh) {
    const { data: refreshed, error } = await refreshOnce();
    if (error || !refreshed?.session) return null;
    return { Authorization: `Bearer ${refreshed.session.access_token}` };
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

// ============================================================================
// Types
// ============================================================================

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth_key: string;
  user_agent?: string;
}

export interface PushSettings {
  push_enabled: boolean;
  push_chat_messages: boolean;
  push_chat_mentions: boolean;
  push_ticket_updates: boolean;
  push_bulletins: boolean;
  mute_all_until: string | null;
}

// ============================================================================
// PushService
// ============================================================================

export class PushService {
  private async call<T extends { success: boolean }>(
    action: string,
    body: Record<string, unknown> = {},
    requireAuth = true,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'x-request-id': `push-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };

    if (requireAuth) {
      const authHeader = await getResolvedAuthHeader();
      if (!authHeader) throw new Error('Not authenticated');
      Object.assign(headers, authHeader);
    }

    const { data, error } = await supabase.functions.invoke<T>('push-service', {
      body: { action, ...body },
      headers,
    });

    if (error) throw new Error(String(error));
    if (!data) throw new Error('Empty response');
    if (!data.success) {
      throw new Error((data as Record<string, unknown>).error as string || 'Request failed');
    }

    return data;
  }

  // =========================================================================
  // VAPID
  // =========================================================================

  async getVapidPublicKey(): Promise<string> {
    const result = await this.call<{ success: boolean; vapid_public_key: string }>(
      'get_vapid_public_key',
      {},
      false,
    );
    return result.vapid_public_key;
  }

  // =========================================================================
  // DEVICE REGISTRATION
  // =========================================================================

  async registerDevice(subscription: PushSubscriptionData): Promise<void> {
    await this.call('register_device', subscription);
  }

  async unregisterDevice(endpoint: string): Promise<void> {
    await this.call('unregister_device', { endpoint });
  }

  // =========================================================================
  // SETTINGS
  // =========================================================================

  async getSettings(): Promise<PushSettings> {
    const result = await this.call<{ success: boolean; settings: PushSettings }>('get_settings');
    return result.settings;
  }

  async updateSettings(settings: Partial<PushSettings>): Promise<void> {
    await this.call('update_settings', settings);
  }
}

export const pushService = new PushService();
