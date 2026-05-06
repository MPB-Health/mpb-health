import { GradientHeader } from '@mpbhealth/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { supabase } from '../lib/supabase';

type Provider = 'microsoft_outlook' | 'goto_connect' | 'linkedin';

export default function IntegrationsHub() {
  const { user } = useAuth();
  const { activeOrgId } = useOrg();
  const qc = useQueryClient();

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
      toast.success('Integration placeholder saved — connect OAuth in a follow-up PR.');
      qc.invalidateQueries({ queryKey: ['crmIntegrationAccounts', activeOrgId, user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const byProv = (p: Provider) => accounts.find((a: { provider: string }) => a.provider === p);

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Integrations"
        subtitle="Outlook, GoTo Connect, and LinkedIn connection placeholders. OAuth and sync workers ship as dedicated PRs."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {(
          [
            ['microsoft_outlook', 'Microsoft Outlook', 'Calendar + inbox logging'],
            ['goto_connect', 'GoTo Connect', 'Calls, SMS, voicemail, dialer'],
            ['linkedin', 'LinkedIn', 'Manual workflow + API where available'],
          ] as const
        ).map(([id, title, blurb]) => (
          <div key={id} className="bg-surface-primary rounded-2xl border border-th-border p-5 space-y-3">
            <h2 className="text-sm font-semibold text-th-text-primary">{title}</h2>
            <p className="text-xs text-th-text-tertiary">{blurb}</p>
            <p className="text-xs">
              Status:{' '}
              <span className="font-medium">
                {(byProv(id) as { status?: string } | undefined)?.status || 'disconnected'}
              </span>
            </p>
            <button
              type="button"
              onClick={() => upsert.mutate(id)}
              className="text-xs px-3 py-1.5 rounded-lg border border-th-border hover:bg-surface-secondary"
            >
              Mark connected (demo)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
