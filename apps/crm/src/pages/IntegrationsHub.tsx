import { useState } from 'react';
import { GradientHeader } from '@mpbhealth/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { supabase } from '../lib/supabase';

type Provider = 'microsoft_outlook' | 'goto_connect' | 'linkedin';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

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

  const gotoEndpoint = SUPABASE_URL
    ? `${SUPABASE_URL}/functions/v1/goto-connect-integration`
    : 'https://<your-project>.supabase.co/functions/v1/goto-connect-integration';

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Integrations"
        subtitle="Connect external services to sync calls, calendar, and contacts."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {(
          [
            ['microsoft_outlook', 'Microsoft Outlook', 'Calendar + inbox logging'],
            ['goto_connect', 'GoTo Connect', 'Auto-log calls, screen pop, SMS'],
            ['linkedin', 'LinkedIn', 'Manual workflow + API where available'],
          ] as const
        ).map(([id, title, blurb]) => (
          <div key={id} className="bg-surface-primary rounded-2xl border border-th-border p-5 space-y-3">
            <h2 className="text-sm font-semibold text-th-text-primary">{title}</h2>
            <p className="text-xs text-th-text-tertiary">{blurb}</p>
            <p className="text-xs">
              Status:{' '}
              <span className={`font-medium ${
                (byProv(id) as { status?: string } | undefined)?.status === 'connected'
                  ? 'text-green-600' : 'text-th-text-tertiary'
              }`}>
                {(byProv(id) as { status?: string } | undefined)?.status || 'disconnected'}
              </span>
            </p>
            {id === 'goto_connect' ? (
              <button
                type="button"
                onClick={() => setShowGotoSetup(!showGotoSetup)}
                className="text-xs px-3 py-1.5 rounded-lg border border-th-border hover:bg-surface-secondary"
              >
                {showGotoSetup ? 'Hide setup' : 'Setup instructions'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => upsert.mutate(id)}
                className="text-xs px-3 py-1.5 rounded-lg border border-th-border hover:bg-surface-secondary"
              >
                {(byProv(id) as { status?: string } | undefined)?.status === 'connected'
                  ? 'Connected' : 'Connect'}
              </button>
            )}
          </div>
        ))}
      </div>

      {showGotoSetup && (
        <div className="bg-surface-primary rounded-2xl border border-th-border p-6 space-y-4">
          <h3 className="text-sm font-semibold text-th-text-primary">GoTo Connect — Custom Connection Setup</h3>
          <p className="text-xs text-th-text-secondary">
            In GoTo Admin, navigate to <strong>Integrations → Custom Connection</strong> and fill in:
          </p>
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
            Mark as connected
          </button>
        </div>
      )}
    </div>
  );
}
