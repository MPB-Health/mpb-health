import { supabase } from '@mpbhealth/database';

export type NewsletterStatus = 'active' | 'unsubscribed' | 'bounced' | 'pending';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: NewsletterStatus;
  source: string | null;
  created_at: string;
  unsubscribed_at: string | null;
}

export interface NewsletterStats {
  total: number;
  active: number;
  unsubscribed: number;
  bounced: number;
  pending: number;
}

export class NewsletterAdminService {
  async getSubscribers(filters?: {
    status?: NewsletterStatus | 'all';
    search?: string;
  }): Promise<NewsletterSubscriber[]> {
    let query = supabase
      .from('newsletter_subscriptions')
      .select('id, email, status, source, created_at, unsubscribed_at')
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.ilike('email', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as NewsletterSubscriber[];
  }

  async getStats(): Promise<NewsletterStats> {
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .select('status');
    if (error) throw error;
    const rows = data || [];
    return {
      total: rows.length,
      active: rows.filter((r) => r.status === 'active').length,
      unsubscribed: rows.filter((r) => r.status === 'unsubscribed').length,
      bounced: rows.filter((r) => r.status === 'bounced').length,
      pending: rows.filter((r) => r.status === 'pending').length,
    };
  }

  async updateStatus(id: string, status: NewsletterStatus): Promise<void> {
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .update({
        status,
        ...(status === 'unsubscribed' ? { unsubscribed_at: new Date().toISOString() } : {}),
      })
      .eq('id', id);
    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  exportCSV(subscribers: NewsletterSubscriber[]): string {
    const headers = ['Email', 'Status', 'Source', 'Subscribed At', 'Unsubscribed At'];
    const rows = subscribers.map((s) => [
      s.email,
      s.status,
      s.source || '',
      new Date(s.created_at).toLocaleDateString(),
      s.unsubscribed_at ? new Date(s.unsubscribed_at).toLocaleDateString() : '',
    ]);
    return [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  }
}

export const newsletterAdminService = new NewsletterAdminService();
