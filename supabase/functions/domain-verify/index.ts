// ============================================================================
// Domain Verify - DNS-over-HTTPS SPF/DKIM/DMARC verification
// Checks domain DNS records for email deliverability configuration
// Deploy: supabase functions deploy domain-verify
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { requireAuth, checkRateLimit, getClientIdentifier } from '../_shared/security.ts';

// DNS record types
const DNS_TYPE_TXT = 16;
const DNS_TYPE_MX = 15;

interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DnsResponse {
  Status: number;
  Answer?: DnsAnswer[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const clientIp = getClientIdentifier(req);
    const rateLimitResponse = checkRateLimit(clientIp, {
      maxRequests: 20,
      windowSeconds: 60,
      keyPrefix: 'domain-verify',
    });
    if (rateLimitResponse) return rateLimitResponse;

    const { user: authUser, errorResponse } = await requireAuth(req, supabase);
    if (errorResponse) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      // ====================================================================
      // Add a domain and get required DNS records
      // ====================================================================
      case 'add_domain': {
        const { org_id, domain } = body;

        // Validate domain format
        if (!domain || !/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/.test(domain)) {
          return new Response(JSON.stringify({ error: 'Invalid domain format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Generate DKIM selector
        const dkimSelector = 'mpbcrm';
        const verificationToken = crypto.randomUUID().replace(/-/g, '');

        // Expected records
        const expectedSpf = `v=spf1 include:_spf.google.com include:amazonses.com ~all`;
        const expectedDkim = `v=DKIM1; k=rsa; p=<DKIM_PUBLIC_KEY>`;
        const expectedDmarc = `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}; pct=100`;

        const { data: domainRecord, error } = await supabase
          .from('mail_domains')
          .insert({
            org_id,
            domain,
            dkim_selector: dkimSelector,
            spf_record: expectedSpf,
            dkim_record: expectedDkim,
            dmarc_record: expectedDmarc,
            verification_token: verificationToken,
            created_by: authUser.userId,
            next_check_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Check in 5 min
          })
          .select('id, org_id, domain, dkim_selector, spf_record, dkim_record, dmarc_record, verification_token, spf_status, dkim_status, dmarc_status, mx_status, spf_verified_at, dkim_verified_at, dmarc_verified_at, mx_verified_at, last_check_at, next_check_at, created_by, created_at, updated_at')
          .single();

        if (error) {
          if (error.code === '23505') {
            return new Response(JSON.stringify({ error: 'Domain already added' }), {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          throw error;
        }

        // Audit log
        await supabase.from('mail_audit_log').insert({
          org_id,
          user_id: authUser.userId,
          action: 'domain_added',
          details: { domain },
          ip_address: clientIp,
        });

        return new Response(JSON.stringify({
          success: true,
          domain: domainRecord,
          required_records: {
            spf: {
              type: 'TXT',
              host: domain,
              value: expectedSpf,
              description: 'Add or merge this into your existing SPF record',
            },
            dkim: {
              type: 'TXT',
              host: `${dkimSelector}._domainkey.${domain}`,
              value: expectedDkim,
              description: 'Create this TXT record for DKIM signing',
            },
            dmarc: {
              type: 'TXT',
              host: `_dmarc.${domain}`,
              value: expectedDmarc,
              description: 'Create this DMARC policy record',
            },
            verification: {
              type: 'TXT',
              host: domain,
              value: `mpb-verify=${verificationToken}`,
              description: 'Domain ownership verification',
            },
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ====================================================================
      // Verify domain DNS records
      // ====================================================================
      case 'verify': {
        const { domain_id } = body;

        const { data: domainRecord } = await supabase
          .from('mail_domains')
          .select('id, org_id, domain, dkim_selector, spf_record, dkim_record, dmarc_record, verification_token, spf_status, dkim_status, dmarc_status, mx_status, spf_verified_at, dkim_verified_at, dmarc_verified_at, mx_verified_at, last_check_at, next_check_at, created_by, created_at, updated_at')
          .eq('id', domain_id)
          .single();

        if (!domainRecord) {
          return new Response(JSON.stringify({ error: 'Domain not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const domain = domainRecord.domain;
        const results: Record<string, unknown> = {};

        // Check ownership verification TXT
        const ownershipVerified = await checkTxtRecord(
          domain,
          `mpb-verify=${domainRecord.verification_token}`
        );
        results.ownership = ownershipVerified;

        // Check SPF
        const spfResult = await checkSpf(domain);
        results.spf = spfResult;

        // Check DKIM
        const dkimResult = await checkDkim(domain, domainRecord.dkim_selector);
        results.dkim = dkimResult;

        // Check DMARC
        const dmarcResult = await checkDmarc(domain);
        results.dmarc = dmarcResult;

        // Check MX
        const mxResult = await checkMx(domain);
        results.mx = mxResult;

        // Update domain record
        const updates: Record<string, unknown> = {
          last_check_at: new Date().toISOString(),
          next_check_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Re-check in 24h
        };

        if (spfResult.found) {
          updates.spf_status = spfResult.valid ? 'verified' : 'failed';
          if (spfResult.valid) updates.spf_verified_at = new Date().toISOString();
        }

        if (dkimResult.found) {
          updates.dkim_status = dkimResult.valid ? 'verified' : 'failed';
          if (dkimResult.valid) updates.dkim_verified_at = new Date().toISOString();
        }

        if (dmarcResult.found) {
          updates.dmarc_status = dmarcResult.valid ? 'verified' : 'failed';
          if (dmarcResult.valid) updates.dmarc_verified_at = new Date().toISOString();
        }

        if (mxResult.found) {
          updates.mx_status = 'verified';
          updates.mx_verified_at = new Date().toISOString();
        }

        await supabase.from('mail_domains').update(updates).eq('id', domain_id);

        // Audit log
        await supabase.from('mail_audit_log').insert({
          org_id: domainRecord.org_id,
          user_id: authUser.userId,
          action: 'domain_verified',
          details: { domain, results },
          ip_address: clientIp,
        });

        return new Response(JSON.stringify({ success: true, results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ====================================================================
      // Get domain health status
      // ====================================================================
      case 'health': {
        const { domain_id } = body;

        const { data: domainRecord } = await supabase
          .from('mail_domains')
          .select('id, org_id, domain, dkim_selector, spf_record, dkim_record, dmarc_record, verification_token, spf_status, dkim_status, dmarc_status, mx_status, spf_verified_at, dkim_verified_at, dmarc_verified_at, mx_verified_at, last_check_at, next_check_at, created_by, created_at, updated_at')
          .eq('id', domain_id)
          .single();

        if (!domainRecord) {
          return new Response(JSON.stringify({ error: 'Domain not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const domain = domainRecord.domain;

        // Re-check all records
        const spf = await checkSpf(domain);
        const dkim = await checkDkim(domain, domainRecord.dkim_selector);
        const dmarc = await checkDmarc(domain);
        const mx = await checkMx(domain);

        // Calculate health score
        let score = 0;
        if (spf.valid) score += 25;
        if (dkim.valid) score += 30;
        if (dmarc.valid) score += 25;
        if (mx.found) score += 20;

        const issues: string[] = [];
        if (!spf.found) issues.push('No SPF record found');
        else if (!spf.valid) issues.push('SPF record exists but may not include your sending domain');
        if (!dkim.found) issues.push(`No DKIM record found at ${domainRecord.dkim_selector}._domainkey.${domain}`);
        if (!dmarc.found) issues.push('No DMARC record found');
        else if (!dmarc.valid) issues.push('DMARC policy is "none" - consider upgrading to "quarantine" or "reject"');
        if (!mx.found) issues.push('No MX records found');

        return new Response(JSON.stringify({
          domain: domainRecord.domain,
          health_score: score,
          issues,
          records: { spf, dkim, dmarc, mx },
          last_check: new Date().toISOString(),
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ====================================================================
      // Delete domain
      // ====================================================================
      case 'delete': {
        const { domain_id } = body;

        const { data: domainRecord } = await supabase
          .from('mail_domains')
          .select('domain, org_id')
          .eq('id', domain_id)
          .single();

        await supabase.from('mail_domains').delete().eq('id', domain_id);

        if (domainRecord) {
          await supabase.from('mail_audit_log').insert({
            org_id: domainRecord.org_id,
            user_id: authUser.userId,
            action: 'domain_deleted',
            details: { domain: domainRecord.domain },
            ip_address: clientIp,
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Domain verify error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// DNS Query Helpers (using DNS-over-HTTPS via Cloudflare/Google)
// ============================================================================

async function queryDns(name: string, type: number): Promise<DnsAnswer[]> {
  const res = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
    {
      headers: { Accept: 'application/dns-json' },
    }
  );

  if (!res.ok) return [];

  const data: DnsResponse = await res.json();
  return data.Answer || [];
}

async function checkTxtRecord(domain: string, expectedValue: string): Promise<boolean> {
  const answers = await queryDns(domain, DNS_TYPE_TXT);
  return answers.some(a => {
    const txt = a.data.replace(/"/g, '');
    return txt.includes(expectedValue);
  });
}

async function checkSpf(domain: string): Promise<{ found: boolean; valid: boolean; record: string | null }> {
  const answers = await queryDns(domain, DNS_TYPE_TXT);
  const spfRecord = answers.find(a => a.data.replace(/"/g, '').startsWith('v=spf1'));

  if (!spfRecord) return { found: false, valid: false, record: null };

  const record = spfRecord.data.replace(/"/g, '');
  // Valid if it exists and isn't just "v=spf1 -all"
  const valid = record.includes('include:') || record.includes('ip4:') || record.includes('ip6:');

  return { found: true, valid, record };
}

async function checkDkim(domain: string, selector: string): Promise<{ found: boolean; valid: boolean; record: string | null }> {
  const dkimDomain = `${selector}._domainkey.${domain}`;
  const answers = await queryDns(dkimDomain, DNS_TYPE_TXT);

  const dkimRecord = answers.find(a => a.data.replace(/"/g, '').includes('v=DKIM1'));

  if (!dkimRecord) return { found: false, valid: false, record: null };

  const record = dkimRecord.data.replace(/"/g, '');
  const valid = record.includes('p=') && !record.includes('p=;'); // Has a public key

  return { found: true, valid, record };
}

async function checkDmarc(domain: string): Promise<{ found: boolean; valid: boolean; record: string | null; policy: string | null }> {
  const answers = await queryDns(`_dmarc.${domain}`, DNS_TYPE_TXT);
  const dmarcRecord = answers.find(a => a.data.replace(/"/g, '').startsWith('v=DMARC1'));

  if (!dmarcRecord) return { found: false, valid: false, record: null, policy: null };

  const record = dmarcRecord.data.replace(/"/g, '');
  const policyMatch = record.match(/p=(\w+)/);
  const policy = policyMatch?.[1] || null;
  const valid = policy === 'quarantine' || policy === 'reject';

  return { found: true, valid, record, policy };
}

async function checkMx(domain: string): Promise<{ found: boolean; records: string[] }> {
  const answers = await queryDns(domain, DNS_TYPE_MX);

  if (answers.length === 0) return { found: false, records: [] };

  return {
    found: true,
    records: answers.map(a => a.data),
  };
}
