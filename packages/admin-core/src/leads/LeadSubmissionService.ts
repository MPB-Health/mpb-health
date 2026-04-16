import { supabase } from '@mpbhealth/database';

export interface LeadSubmission {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  source_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  form_data: Record<string, unknown> | null;
  created_at: string;
}

export interface LeadSubmissionFilters {
  search?: string;
  source_page?: string;
  utm_source?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface LeadSubmissionStats {
  total: number;
  today: number;
  this_week: number;
  this_month: number;
}

export class LeadSubmissionService {
  async getSubmissions(filters?: LeadSubmissionFilters): Promise<LeadSubmission[]> {
    let query = supabase
      .from('lead_submissions')
      .select('id, first_name, last_name, email, phone, source_page, utm_source, utm_medium, utm_campaign, form_data, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (filters?.search) {
      query = query.or(
        `email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`,
      );
    }

    if (filters?.source_page) {
      query = query.eq('source_page', filters.source_page);
    }

    if (filters?.utm_source) {
      query = query.eq('utm_source', filters.utm_source);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as LeadSubmission[];
  }

  async getStats(): Promise<LeadSubmissionStats> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabase
      .from('lead_submissions')
      .select('created_at');
    if (error) throw error;

    const rows = data || [];
    return {
      total: rows.length,
      today: rows.filter((r) => r.created_at >= todayStart).length,
      this_week: rows.filter((r) => r.created_at >= weekStart).length,
      this_month: rows.filter((r) => r.created_at >= monthStart).length,
    };
  }

  getSourcePages(submissions: LeadSubmission[]): string[] {
    return [...new Set(submissions.map((s) => s.source_page).filter(Boolean) as string[])].sort();
  }

  exportCSV(submissions: LeadSubmission[]): string {
    const headers = [
      'First Name', 'Last Name', 'Email', 'Phone',
      'Source Page', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Submitted At',
    ];
    const rows = submissions.map((s) => [
      s.first_name || '',
      s.last_name || '',
      s.email || '',
      s.phone || '',
      s.source_page || '',
      s.utm_source || '',
      s.utm_medium || '',
      s.utm_campaign || '',
      new Date(s.created_at).toLocaleString(),
    ]);
    return [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  }
}

export const leadSubmissionService = new LeadSubmissionService();
