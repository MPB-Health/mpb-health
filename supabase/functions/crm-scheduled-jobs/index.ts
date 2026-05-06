// CRM scheduled jobs — invoke with service role (Supabase Cron or manual).
// Body JSON: { "job": "promote_stale_nurture" } or { "job": "oe_reactivation", "year": 2026 }
// Optional: { "org_id": "<uuid>" } to scope to one org (otherwise all orgs).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_env' }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: { job?: string; org_id?: string; year?: number } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const job = body.job || 'promote_stale_nurture';

  const { data: orgs, error: orgErr } = await supabase.from('orgs').select('id');
  if (orgErr) {
    return new Response(JSON.stringify({ ok: false, error: orgErr.message }), { status: 500 });
  }

  const targetOrgs = body.org_id ? [{ id: body.org_id }] : (orgs ?? []);

  if (job === 'promote_stale_nurture') {
    let total = 0;
    for (const o of targetOrgs as { id: string }[]) {
      const { data, error } = await supabase.rpc('crm_promote_stale_quotes_to_nurture', {
        p_org_id: o.id,
        p_stale_after: '30 days',
      });
      if (!error && typeof data === 'number') total += data;
    }
    return new Response(JSON.stringify({ ok: true, job, promoted: total }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (job === 'oe_reactivation') {
    const year = body.year ?? new Date().getFullYear();
    const totals: Record<string, number> = {};

    for (const o of targetOrgs as { id: string }[]) {
      const startedAt = new Date().toISOString();

      await supabase.from('crm_oe_reactivation_runs').upsert(
        {
          org_id: o.id,
          run_year: year,
          scheduled_for: `${year}-09-15`,
          started_at: startedAt,
          leads_targeted: 0,
        },
        { onConflict: 'org_id,run_year' },
      );

      const { data: cadence } = await supabase
        .from('crm_follow_up_cadences')
        .select('id, steps')
        .eq('org_id', o.id)
        .eq('name', 'OE Reactivation — Nurture bulk')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!cadence) {
        totals[o.id] = 0;
        await supabase
          .from('crm_oe_reactivation_runs')
          .update({ completed_at: new Date().toISOString() })
          .eq('org_id', o.id)
          .eq('run_year', year);
        continue;
      }

      const firstStep = Array.isArray(cadence.steps) ? cadence.steps[0] : null;
      const delayHours = Number(firstStep?.delay_hours ?? 0);

      const { data: leads, error: leadsErr } = await supabase
        .from('lead_submissions')
        .select('id')
        .eq('org_id', o.id)
        .eq('pipeline_stage', 'nurture')
        .neq('do_not_contact', true);

      if (leadsErr) {
        await supabase
          .from('crm_oe_reactivation_runs')
          .update({ completed_at: new Date().toISOString() })
          .eq('org_id', o.id)
          .eq('run_year', year);
        totals[o.id] = 0;
        continue;
      }

      let enrolled = 0;
      const nextActionAt = new Date(Date.now() + delayHours * 3600 * 1000).toISOString();

      for (const lead of leads ?? []) {
        const { error: stateErr } = await supabase.from('crm_lead_cadence_state').upsert(
          {
            lead_id: lead.id,
            cadence_id: cadence.id,
            org_id: o.id,
            current_step: 0,
            next_action_at: nextActionAt,
            paused: false,
            paused_reason: null,
            completed_at: null,
          },
          { onConflict: 'lead_id,cadence_id' },
        );
        if (!stateErr) enrolled += 1;
      }

      totals[o.id] = enrolled;

      await supabase
        .from('crm_oe_reactivation_runs')
        .update({
          completed_at: new Date().toISOString(),
          leads_targeted: enrolled,
        })
        .eq('org_id', o.id)
        .eq('run_year', year);
    }

    const totalEnrolled = Object.values(totals).reduce((a, b) => a + b, 0);
    return new Response(
      JSON.stringify({ ok: true, job, year, enrolled: totalEnrolled, by_org: totals }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(JSON.stringify({ ok: false, error: 'unknown_job' }), { status: 400 });
});
