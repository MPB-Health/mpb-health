// ============================================================================
// Domain Service - Custom sender domain management + verification
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export type DomainVerificationStatus = 'pending' | 'verified' | 'failed' | 'expired';

export interface MailDomain {
  id: string;
  org_id: string;
  domain: string;
  spf_status: DomainVerificationStatus;
  spf_record: string | null;
  spf_verified_at: string | null;
  dkim_status: DomainVerificationStatus;
  dkim_selector: string | null;
  dkim_record: string | null;
  dkim_verified_at: string | null;
  dmarc_status: DomainVerificationStatus;
  dmarc_record: string | null;
  dmarc_verified_at: string | null;
  mx_status: DomainVerificationStatus;
  mx_verified_at: string | null;
  is_verified: boolean;
  verification_token: string;
  last_check_at: string | null;
  compliance_footer: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SenderIdentity {
  id: string;
  org_id: string;
  domain_id: string;
  email_address: string;
  display_name: string | null;
  is_default: boolean;
  signature_id: string | null;
  created_at: string;
}

export interface DomainHealthResult {
  domain: string;
  health_score: number;
  issues: string[];
  records: {
    spf: { found: boolean; valid: boolean; record: string | null };
    dkim: { found: boolean; valid: boolean; record: string | null };
    dmarc: { found: boolean; valid: boolean; record: string | null; policy: string | null };
    mx: { found: boolean; records: string[] };
  };
  last_check: string;
}

export interface RequiredDnsRecords {
  spf: { type: string; host: string; value: string; description: string };
  dkim: { type: string; host: string; value: string; description: string };
  dmarc: { type: string; host: string; value: string; description: string };
  verification: { type: string; host: string; value: string; description: string };
}

// ============================================================================
// Service
// ============================================================================

export class DomainService {
  constructor(
    private supabase: SupabaseClient,
    private supabaseUrl: string
  ) {}

  async getDomains(orgId: string): Promise<MailDomain[]> {
    const { data, error } = await this.supabase
      .from('mail_domains')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getDomain(id: string): Promise<MailDomain | null> {
    const { data, error } = await this.supabase
      .from('mail_domains')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async addDomain(
    orgId: string,
    domain: string
  ): Promise<{ domain: MailDomain; required_records: RequiredDnsRecords }> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${this.supabaseUrl}/functions/v1/domain-verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'add_domain',
        org_id: orgId,
        domain,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add domain');
    }

    return res.json();
  }

  async verifyDomain(domainId: string): Promise<Record<string, unknown>> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${this.supabaseUrl}/functions/v1/domain-verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'verify',
        domain_id: domainId,
      }),
    });

    if (!res.ok) throw new Error('Verification failed');
    return res.json();
  }

  async getDomainHealth(domainId: string): Promise<DomainHealthResult> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${this.supabaseUrl}/functions/v1/domain-verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'health',
        domain_id: domainId,
      }),
    });

    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  }

  async deleteDomain(domainId: string): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    await fetch(`${this.supabaseUrl}/functions/v1/domain-verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: 'delete',
        domain_id: domainId,
      }),
    });
  }

  async updateComplianceFooter(domainId: string, footer: string): Promise<void> {
    await this.supabase
      .from('mail_domains')
      .update({ compliance_footer: footer })
      .eq('id', domainId);
  }

  // ========================================================================
  // Sender Identities
  // ========================================================================

  async getSenderIdentities(orgId: string): Promise<SenderIdentity[]> {
    const { data, error } = await this.supabase
      .from('mail_sender_identities')
      .select('*')
      .eq('org_id', orgId)
      .order('is_default', { ascending: false })
      .order('email_address');

    if (error) throw error;
    return data || [];
  }

  async createSenderIdentity(input: {
    org_id: string;
    domain_id: string;
    email_address: string;
    display_name?: string;
    is_default?: boolean;
    signature_id?: string;
  }): Promise<SenderIdentity> {
    const { data: { user } } = await this.supabase.auth.getUser();

    const { data, error } = await this.supabase
      .from('mail_sender_identities')
      .insert({
        ...input,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSenderIdentity(id: string): Promise<void> {
    await this.supabase
      .from('mail_sender_identities')
      .delete()
      .eq('id', id);
  }
}

export function createDomainService(
  supabase: SupabaseClient,
  supabaseUrl: string
): DomainService {
  return new DomainService(supabase, supabaseUrl);
}
