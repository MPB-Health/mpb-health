import { useState } from 'react';
import { GradientHeader } from '@mpbhealth/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AlertTriangle, Calendar, Mail, Phone, MessageSquare, Linkedin, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { supabase } from '../lib/supabase';

type Provider = 'microsoft_outlook' | 'goto_connect' | 'linkedin';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

interface IntegrationCardConfig {
  id: Provider;
  title: string;
  icon: typeof Mail;
  description: string;
  features: string[];
  workaround: string;
}

const INTEGRATIONS: IntegrationCardConfig[] = [
  {
    id: 'microsoft_outlook',
    title: 'Outlook (Microsoft Graph)',
    icon: Calendar,
    description: 'Two-way calendar sync, email send/receive logged to activities and email_log.',
    features: [
      'Calendar sync (meetings → CRM)',
      'Email send via Outlook',
      'Inbound email capture',
      'Contact sync',
    ],
    workaround:
      'Manual workaround: log calls and emails via the CRM Note/Call/Email buttons on the Lead or Recruit profile. These are captured in the Daily Log automatically.',
  },
  {
    id: 'goto_connect',
    title: 'GoTo Connect',
    icon: Phone,
    description: 'Call logs, click-to-dial, voicemail capture, call duration → auto Daily Log, SMS send/receive.',
    features: [
      'Click-to-dial from profile',
      'Auto-log call duration',
      'Voicemail → activity',
      'SMS send/receive',
      'Screen pop on inbound',
    ],
    workaround:
      'Manual workaround: use the Call button on profiles to log calls manually. SMS can be sent via the Text button (logs to activity timeline and Daily Log).',
  },
  {
    id: 'linkedin',
    title: 'LinkedIn',
    icon: Linkedin,
    description: 'Messages + connection requests + profile pull where API allows; rest stays manual via LinkedIn subsection.',
    features: [
      'Message sync (where API allows)',
      'Connection request tracking',
      'Profile data pull',
      'InMail activity logging',
    ],
    workaround:
      'Manual workaround: use the LinkedIn subsection on Leads/Recruiting to track connection status, follow-up tasks, and conversation notes. Set workflow_subsection to "LinkedIn" for pipeline tracking.',
  },
];

export default function IntegrationsHub() {
  const { user } = useAuth();
  const { activeOrgId } = useOrg();
  const qc = useQueryClient();
  const [showGotoSetup, setShowGotoSetup] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ['crmIntegrationAccounts', activeOrgId, user?.id],
    queryFn: async () => {
      if (!activeOrgId || !user?.id) return [];
      const { data, error } = await supabase
        .from('crm_integration_accounts')
        .select('*')
        .eq('org_id', activeOrgId)
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeOrgId && !!user?.id,
  });

  const upsert = useMutation({
    mutationFn: async (provider: Provider) => {
      if (!activeOrgId || !user?.id) throw new Error('no org');
      const { error } = await supabase.from('crm_integration_accounts').upsert(
        {
          org_id: activeOrgId,
          user_id: user.id,
          provider,
          status: 'connected',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'org_id,user_id,provider' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Integration connected.');
      qc.invalidateQueries({ queryKey: ['crmIntegrationAccounts', activeOrgId, user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const byProv = (p: Provider) => accounts.find((a: { provider: string }) => a.provider === p);
  const isConnected = (p: Provider) =>
    (byProv(p) as { status?: string } | undefined)?.status === 'connected';

  const gotoEndpoint = SUPABASE_URL
    ? `${SUPABASE_URL}/functions/v1/goto-connect-integration`
    : 'https://<your-project>.supabase.co/functions/v1/goto-connect-integration';

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Integrations"
        subtitle="Connect external services to sync calls, calendar, and contacts."
        icon={<MessageSquare className="w-5 h-5" />}
      />

      {/* Phase 5 — IT provisioning banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-amber-900">Pending IT Provisioning</h3>
          <p className="text-xs text-amber-700 mt-1">
            OAuth apps for Outlook (Azure AD), GoTo Connect, and LinkedIn have not yet been provisioned.
            Integrations will become functional once IT completes app registration and supplies credentials.
            In the meantime, use the manual workarounds described below.
          </p>
        </div>
      </div>

      {/* Integration cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {INTEGRATIONS.map((integration) => {
          const Icon = integration.icon;
          const connected = isConnected(integration.id);
          return (
            <div
              key={integration.id}
              className="bg-surface-primary rounded-2xl border border-th-border p-6 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-th-accent-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-th-accent-600" />
                </div>
                <h2 className="text-sm font-semibold text-th-text-primary">{integration.title}</h2>
              </div>

              <p className="text-xs text-th-text-secondary mb-3">{integration.description}</p>

              <ul className="text-xs text-th-text-tertiary space-y-1 mb-4 flex-1">
                {integration.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <span className="text-th-accent-500 mt-px">•</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Connection status */}
              <div className="flex items-center gap-2 mb-3 text-xs">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={`font-medium ${connected ? 'text-green-600' : 'text-th-text-tertiary'}`}>
                  {connected ? 'Connected' : 'Not Connected'}
                </span>
              </div>

              {/* Disabled Connect button with tooltip */}
              <div className="relative group">
                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-th-border text-th-text-tertiary bg-surface-secondary cursor-not-allowed opacity-60"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Connect
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  OAuth app not yet provisioned by IT
                </div>
              </div>

              {/* Workaround docs */}
              <div className="mt-3 pt-3 border-t border-th-border-subtle">
                <p className="text-[11px] text-th-text-tertiary leading-relaxed">
                  <span className="font-medium text-th-text-secondary">Workaround: </span>
                  {integration.workaround}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* GoTo Connect setup reference (preserved for when IT provisions) */}
      <div className="bg-surface-primary rounded-2xl border border-th-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-th-text-primary">
            GoTo Connect — Custom Connection Setup Reference
          </h3>
          <button
            type="button"
            onClick={() => setShowGotoSetup(!showGotoSetup)}
            className="text-xs px-3 py-1.5 rounded-lg border border-th-border hover:bg-surface-secondary"
          >
            {showGotoSetup ? 'Hide' : 'Show details'}
          </button>
        </div>
        <p className="text-xs text-th-text-tertiary">
          Reference for IT when provisioning. In GoTo Admin, navigate to{' '}
          <strong>Integrations → Custom Connection</strong>.
        </p>

        {showGotoSetup && (
          <>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">Auth type</label>
                <div className="text-xs bg-surface-secondary rounded-lg px-3 py-2 font-mono">API Key</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">Domain</label>
                <div className="text-xs bg-surface-secondary rounded-lg px-3 py-2 font-mono break-all select-all">
                  {gotoEndpoint}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-th-text-secondary mb-1">API Key</label>
                <div className="text-xs bg-surface-secondary rounded-lg px-3 py-2 text-th-text-tertiary">
                  (Ask your admin for the GOTO_CONNECT_API_KEY value from Supabase secrets)
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-th-border">
              <h4 className="text-xs font-medium text-th-text-secondary mb-2">Available endpoints:</h4>
              <ul className="text-xs text-th-text-tertiary space-y-1 font-mono">
                <li>GET ?action=health — connectivity test</li>
                <li>GET ?action=contact_lookup&phone=+15551234567 — screen pop</li>
                <li>POST ?action=call_log — auto-log calls</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => upsert.mutate('goto_connect')}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Mark as connected (dev override)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
