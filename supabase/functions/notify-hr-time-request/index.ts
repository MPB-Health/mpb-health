// Supabase Edge Function: notify-hr-time-request
// PHI-safe HR time-off notifications via Resend.
// Deploy: supabase functions deploy notify-hr-time-request

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getClientIdentifier, escapeHtml } from '../_shared/security.ts';
import {
  wrapEmailLayout,
  emailCta,
  emailInfoCard,
  emailInfoRow,
} from '../_shared/emailLayout.ts';

const log = createLogger('notify-hr-time-request');

const HR_EMAILS = [
  'accounting@mympb.com',
  'catherine@mympb.com',
  'dayra@mympb.com',
];

const TYPE_LABELS: Record<string, string> = {
  pto: 'Paid time off',
  sick: 'Sick day',
  doctor_appointment: 'Doctor appointment',
  leave_early: 'Leave early',
  arrive_late: 'Arrive late',
  remote: 'Remote / WFH',
  bereavement: 'Bereavement',
  jury_duty: 'Jury duty',
  unpaid_leave: 'Unpaid leave',
  personal: 'Personal day',
  parental: 'Parental leave',
  other: 'Other',
};

const PORTAL_URL = Deno.env.get('STAFF_HUB_URL') || 'https://staff.mpb.health';
const FROM_EMAIL = Deno.env.get('HR_FROM_EMAIL') || 'MPB Health <notifications@mpb.health>';

interface NotifyBody {
  kind: 'submitted' | 'decided';
  request_id: string;
}

function formatRange(startsAt: string, endsAt: string, allDay: boolean): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  };
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  };

  if (allDay) {
    return `${start.toLocaleDateString('en-US', dateOpts)} - ${end.toLocaleDateString('en-US', dateOpts)} (all day)`;
  }
  return `${start.toLocaleDateString('en-US', dateOpts)} ${start.toLocaleTimeString('en-US', timeOpts)} - ${end.toLocaleDateString('en-US', dateOpts)} ${end.toLocaleTimeString('en-US', timeOpts)} ET`;
}

async function sendResend(params: {
  to: string[];
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend failed: ${res.status} ${text}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  const clientIp = getClientIdentifier(req);
  const rateLimitResponse = checkRateLimit(clientIp, {
    maxRequests: 40,
    windowSeconds: 60,
    keyPrefix: 'notify-hr-time-request',
  }, headers);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        status: 405,
        headers,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration is missing');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers,
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await admin.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
        status: 401,
        headers,
      });
    }

    const body: NotifyBody = await req.json();
    if (!body?.request_id || !body?.kind) {
      return new Response(JSON.stringify({ success: false, error: 'Missing kind or request_id' }), {
        status: 400,
        headers,
      });
    }

    const { data: request, error: reqError } = await admin
      .from('staff_time_requests')
      .select(
        'id, org_id, user_id, employee_name, employee_email, type, status, starts_at, ends_at, all_day, title, decision_note, decided_at',
      )
      .eq('id', body.request_id)
      .single();

    if (reqError || !request) {
      log.warn('Request not found', { request_id: body.request_id });
      return new Response(JSON.stringify({ success: false, error: 'Request not found' }), {
        status: 404,
        headers,
      });
    }

    const callerIsOwner = caller.id === request.user_id;
    const callerIsHr = HR_EMAILS.includes((caller.email ?? '').toLowerCase());

    // submitted: owner (or HR) may notify. decided: HR only.
    if (body.kind === 'submitted' && !callerIsOwner && !callerIsHr) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        status: 403,
        headers,
      });
    }
    if (body.kind === 'decided' && !callerIsHr) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        status: 403,
        headers,
      });
    }

    const typeLabel = TYPE_LABELS[request.type] ?? request.type;
    const range = formatRange(request.starts_at, request.ends_at, request.all_day);
    const detailUrl = `${PORTAL_URL}/time-off/${request.id}`;

    // PHI-safe: never include reason or document contents in email.
    if (body.kind === 'submitted') {
      const subject = `[Staff Hub] ${typeLabel} request from ${request.employee_name} - ${range}`;
      const rows = [
        emailInfoRow('Employee', escapeHtml(request.employee_name)),
        emailInfoRow('Email', escapeHtml(request.employee_email)),
        emailInfoRow('Type', escapeHtml(typeLabel)),
        emailInfoRow('When', escapeHtml(range)),
        emailInfoRow('Status', 'Pending review'),
      ].join('');

      const html = wrapEmailLayout(
        {
          appName: 'Staff Hub HR',
          accentColor: '#0A4E8E',
          heading: 'New time-off request',
          preheader: `${request.employee_name} submitted a ${typeLabel} request`,
          portalUrl: PORTAL_URL,
        },
        `${emailInfoCard(rows, '#0A4E8E')}${emailCta(detailUrl, 'Review in Staff Hub', '#0A4E8E')}<p style="margin:20px 0 0;color:#64748b;font-size:13px;">Supporting documents stay in Staff Hub. They are not attached to this email.</p>`,
      );

      await sendResend({ to: [...HR_EMAILS], subject, html });
      log.info('Submitted notify sent', { request_id: request.id });
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    // decided
    const statusLabel = request.status === 'approved' ? 'Approved' : request.status === 'denied' ? 'Denied' : request.status;
    const subject = `[Staff Hub] Your ${typeLabel} request was ${statusLabel.toLowerCase()}`;
    const rows = [
      emailInfoRow('Type', escapeHtml(typeLabel)),
      emailInfoRow('When', escapeHtml(range)),
      emailInfoRow('Decision', escapeHtml(statusLabel)),
    ];
    if (request.decision_note) {
      rows.push(emailInfoRow('Note from HR', escapeHtml(request.decision_note)));
    }

    const html = wrapEmailLayout(
      {
        appName: 'Staff Hub HR',
        accentColor: '#0A4E8E',
        heading: `Request ${statusLabel.toLowerCase()}`,
        preheader: `Your ${typeLabel} request was ${statusLabel.toLowerCase()}`,
        portalUrl: PORTAL_URL,
      },
      `${emailInfoCard(rows.join(''), request.status === 'approved' ? '#16a34a' : '#dc2626')}${emailCta(detailUrl, 'View request', '#0A4E8E')}`,
    );

    const recipients = [request.employee_email].filter(Boolean);
    if (recipients.length === 0) {
      throw new Error('Employee email missing');
    }

    await sendResend({ to: recipients, subject, html });
    log.info('Decision notify sent', { request_id: request.id, status: request.status });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    log.error('notify-hr-time-request failed', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers },
    );
  }
});
