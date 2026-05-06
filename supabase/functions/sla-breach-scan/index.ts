// Supabase Edge Function: sla-breach-scan
// Scheduled job (invoked by pg_cron every 15 minutes) that walks every org's
// active SLA config, flags any lead whose Initial Contact task is overdue per
// the business-hour deadline, writes a lead_notifications row for each
// escalation recipient, and optionally emails them via Resend.
//
// Idempotent: a notification is only created when one doesn't already exist
// for the (lead, notification_type='sla_breach', user_id) triplet.
//
// Deploy: supabase functions deploy sla-breach-scan
// Schedule (if pg_cron + pg_net are available, the Phase 2 migration already
// configured this automatically). Otherwise configure Supabase Cron manually.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createLogger } from '../_shared/logger.ts';

const log = createLogger('sla-breach-scan');

interface SLAConfigRow {
  id: string;
  org_id: string;
  sla_hours: number;
  business_hours_start: string;
  business_hours_end: string;
  business_days: number[];
  timezone: string | null;
  escalation_to: string[];
  escalation_email: boolean;
  is_active: boolean;
}

interface LeadRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  assigned_to: string | null;
  created_at: string;
  pipeline_stage: string | null;
  last_contacted_at: string | null;
}

serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    log.error('Missing env: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    return new Response(JSON.stringify({ success: false, error: 'missing_env' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: configs, error: configErr } = await supabase
    .from('crm_sla_config')
    .select(
      'id, org_id, sla_hours, business_hours_start, business_hours_end, business_days, timezone, escalation_to, escalation_email, is_active',
    )
    .eq('is_active', true);

  if (configErr) {
    log.error('Failed to load SLA configs', { error: configErr.message });
    return new Response(JSON.stringify({ success: false, error: configErr.message }), { status: 500 });
  }

  let scanned = 0;
  let escalated = 0;
  let emailed = 0;

  for (const cfg of (configs ?? []) as SLAConfigRow[]) {
    // Fetch still-uncontacted leads in early pipeline stages (MP 8-stage model)
    const { data: leads, error: leadErr } = await supabase
      .from('lead_submissions')
      .select('id, first_name, last_name, assigned_to, created_at, pipeline_stage, last_contacted_at')
      .eq('org_id', cfg.org_id)
      .is('last_contacted_at', null)
      .in('pipeline_stage', ['new', 'working']);

    if (leadErr) {
      log.warn('Failed to load leads for org', { org_id: cfg.org_id, error: leadErr.message });
      continue;
    }

    for (const lead of (leads ?? []) as LeadRow[]) {
      scanned += 1;

      // Use the DB's deadline calculator so breach math matches everywhere
      const { data: deadlineRow, error: deadlineErr } = await supabase.rpc(
        'crm_calc_business_hour_deadline',
        {
          p_start: lead.created_at,
          p_hours: cfg.sla_hours,
          p_bh_start: cfg.business_hours_start,
          p_bh_end: cfg.business_hours_end,
          p_business_days: cfg.business_days,
          p_timezone: cfg.timezone ?? 'UTC',
        },
      );

      if (deadlineErr || !deadlineRow) {
        continue;
      }

      const deadline = new Date(deadlineRow as string);
      if (Date.now() < deadline.getTime()) continue;

      const recipients = cfg.escalation_to.length > 0
        ? cfg.escalation_to
        : lead.assigned_to
        ? [lead.assigned_to]
        : [];

      for (const recipientId of recipients) {
        // Idempotency: skip if an open notification of this type already exists
        const { count } = await supabase
          .from('lead_notifications')
          .select('id', { count: 'exact', head: true })
          .eq('lead_id', lead.id)
          .eq('user_id', recipientId)
          .eq('notification_type', 'sla_breach')
          .is('acknowledged_at', null);

        if ((count ?? 0) > 0) continue;

        await supabase.from('lead_notifications').insert({
          lead_id: lead.id,
          org_id: cfg.org_id,
          user_id: recipientId,
          notification_type: 'sla_breach',
          priority: 'high',
          message: `SLA breach — ${[lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'lead'} has not been contacted within the required time.`,
        });
        escalated += 1;

        if (cfg.escalation_email && resendKey) {
          const { data: { user } } = await supabase.auth.admin.getUserById(recipientId);
          const email = user?.email;
          if (email) {
            fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'MPB Health <notifications@mpb.health>',
                to: email,
                subject: `SLA breach: ${[lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'lead'}`,
                html: `<p>A lead passed its SLA deadline without being contacted.</p>
                       <p>Deadline was: <strong>${deadline.toISOString()}</strong></p>
                       <p>Open the CRM to follow up or reassign.</p>`,
              }),
            }).catch((err) => log.warn('Resend send failed', { error: String(err) }));
            emailed += 1;
          }
        }
      }
    }
  }

  log.info('sla-breach-scan complete', { scanned, escalated, emailed });

  return new Response(
    JSON.stringify({ success: true, scanned, escalated, emailed }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
