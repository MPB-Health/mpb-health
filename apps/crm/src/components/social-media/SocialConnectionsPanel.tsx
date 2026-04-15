import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ExternalLink, Linkedin, Save } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import { PermissionGate } from '../PermissionGate';
import type { SocialConnectionStatus, SocialPlatformConnection } from '@mpbhealth/crm-core';
import { SOCIAL_PLATFORMS, type SocialPlatform } from './socialMediaTypes';
import { SOCIAL_API_DOC_URLS } from './socialIntegrationDocs';

function statusLabel(s: SocialConnectionStatus): string {
  switch (s) {
    case 'not_configured':
      return 'Not configured';
    case 'pending_oauth':
      return 'OAuth pending';
    case 'connected':
      return 'Connected';
    case 'error':
      return 'Error';
    case 'disconnected':
      return 'Disconnected';
    default:
      return s;
  }
}

export function SocialConnectionsPanel() {
  const { socialService, supabase, orgId } = useCRM();
  const [rows, setRows] = useState<SocialPlatformConnection[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SocialPlatform | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { connections, error } = await socialService.getConnections();
    setRows(connections);
    setLoadError(error ?? null);
    setLoading(false);
  }, [socialService]);

  useEffect(() => {
    void load();
  }, [load]);

  const byProvider = useMemo(() => {
    const m = new Map<string, SocialPlatformConnection>();
    rows.forEach((r) => m.set(r.provider, r));
    return m;
  }, [rows]);

  const saveRow = async (provider: SocialPlatform, patch: {
    metadata: Record<string, string>;
    display_name?: string;
    connection_status: SocialConnectionStatus;
  }) => {
    setSaving(provider);
    const res = await socialService.upsertConnection({
      provider,
      metadata: patch.metadata,
      display_name: patch.display_name ?? null,
      connection_status: patch.connection_status,
    });
    setSaving(null);
    if (res.success) {
      toast.success(`${SOCIAL_PLATFORMS.find((p) => p.id === provider)?.label ?? provider} saved`);
      void load();
    } else toast.error(res.error || 'Save failed');
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-th-text-tertiary">Loading connections…</div>;
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-th-text-secondary">
        <p className="font-medium text-th-text-primary">Database tables not available</p>
        <p className="mt-2">{loadError}</p>
        <p className="mt-2 text-xs text-th-text-tertiary">
          Apply migrations{' '}
          <code className="font-mono">20260415120000_crm_social_posts_and_connections.sql</code> and{' '}
          <code className="font-mono">20260415131000_crm_social_connection_oauth_tokens.sql</code>, then run{' '}
          <code className="font-mono">pnpm db:migrate</code> (or your Supabase workflow) and refresh.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-th-text-secondary max-w-3xl">
        Save <strong>non-secret</strong> identifiers (ad account ids, LinkedIn organization URNs, etc.). OAuth tokens
        must be issued and stored only in <strong>Edge Functions</strong> using Supabase secrets—same pattern as mail
        and calendar integrations.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {SOCIAL_PLATFORMS.map(({ id, label }) => (
          <ConnectionCard
            key={id}
            provider={id}
            label={label}
            existing={byProvider.get(id)}
            saving={saving === id}
            onSave={saveRow}
            orgId={orgId}
            supabase={supabase}
          />
        ))}
      </div>
    </div>
  );
}

function ConnectionCard({
  provider,
  label,
  existing,
  saving,
  onSave,
  orgId,
  supabase,
}: {
  provider: SocialPlatform;
  label: string;
  existing: SocialPlatformConnection | undefined;
  saving: boolean;
  onSave: (
    provider: SocialPlatform,
    patch: { metadata: Record<string, string>; display_name?: string; connection_status: SocialConnectionStatus }
  ) => void;
  orgId: string | null;
  supabase: SupabaseClient;
}) {
  const docs = SOCIAL_API_DOC_URLS[provider];
  const meta = (existing?.metadata ?? {}) as Record<string, string>;
  const [displayName, setDisplayName] = useState(existing?.display_name ?? '');
  const [status, setStatus] = useState<SocialConnectionStatus>(existing?.connection_status ?? 'not_configured');
  const [linkedinOrgUrn, setLinkedinOrgUrn] = useState(meta.linkedin_organization_urn ?? '');
  const [linkedinAdAccount, setLinkedinAdAccount] = useState(meta.linkedin_sponsored_account_id ?? '');
  const [metaAdAccount, setMetaAdAccount] = useState(meta.meta_ad_account_id ?? '');
  const [igBusinessId, setIgBusinessId] = useState(meta.instagram_business_account_id ?? '');
  const [xAdvertiser, setXAdvertiser] = useState(meta.x_ads_account_id ?? '');
  const [ttAdvertiser, setTtAdvertiser] = useState(meta.tiktok_advertiser_id ?? '');
  const [oauthStarting, setOauthStarting] = useState(false);

  useEffect(() => {
    setDisplayName(existing?.display_name ?? '');
    setStatus(existing?.connection_status ?? 'not_configured');
    const m = (existing?.metadata ?? {}) as Record<string, string>;
    setLinkedinOrgUrn(m.linkedin_organization_urn ?? '');
    setLinkedinAdAccount(m.linkedin_sponsored_account_id ?? '');
    setMetaAdAccount(m.meta_ad_account_id ?? '');
    setIgBusinessId(m.instagram_business_account_id ?? '');
    setXAdvertiser(m.x_ads_account_id ?? '');
    setTtAdvertiser(m.tiktok_advertiser_id ?? '');
  }, [existing]);

  const buildMetadata = (): Record<string, string> => {
    if (provider === 'linkedin') {
      return {
        linkedin_organization_urn: linkedinOrgUrn.trim(),
        linkedin_sponsored_account_id: linkedinAdAccount.trim(),
      };
    }
    if (provider === 'facebook') {
      return { meta_ad_account_id: metaAdAccount.trim() };
    }
    if (provider === 'instagram') {
      return {
        meta_ad_account_id: metaAdAccount.trim(),
        instagram_business_account_id: igBusinessId.trim(),
      };
    }
    if (provider === 'twitter') {
      return { x_ads_account_id: xAdvertiser.trim() };
    }
    return { tiktok_advertiser_id: ttAdvertiser.trim() };
  };

  return (
    <div className="rounded-xl border border-th-border bg-surface-primary p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-th-text-primary">{label}</h3>
          <p className="text-xs text-th-text-tertiary mt-0.5">{statusLabel(status)}</p>
        </div>
        <a
          href={docs.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-th-accent-600 hover:underline shrink-0"
        >
          API docs
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <p className="text-[11px] text-th-text-tertiary leading-relaxed">{docs.oauthNotes}</p>

      <label className="block text-xs font-medium text-th-text-secondary">Display name (optional)</label>
      <input
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className="w-full rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm"
        placeholder={`${label} workspace`}
      />

      <label className="block text-xs font-medium text-th-text-secondary">Connection status</label>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as SocialConnectionStatus)}
        className="w-full rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm"
      >
        <option value="not_configured">Not configured</option>
        <option value="pending_oauth">OAuth pending (Edge Function)</option>
        <option value="connected">Connected</option>
        <option value="error">Error</option>
        <option value="disconnected">Disconnected</option>
      </select>

      {provider === 'linkedin' && (
        <div className="space-y-2 pt-1">
          <PermissionGate permission="campaigns.write">
            <button
              type="button"
              disabled={!orgId || oauthStarting}
              onClick={async () => {
                if (!orgId) return;
                setOauthStarting(true);
                try {
                  const { data, error } = await supabase.functions.invoke('social-linkedin-auth-url', {
                    body: { org_id: orgId },
                  });
                  if (error) {
                    toast.error(error.message || 'Could not start LinkedIn OAuth');
                    return;
                  }
                  const url = (data as { url?: string })?.url;
                  if (!url) {
                    toast.error((data as { error?: string })?.error || 'No authorize URL returned');
                    return;
                  }
                  window.location.assign(url);
                } finally {
                  setOauthStarting(false);
                }
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#0A66C2]/40 bg-[#0A66C2]/10 py-2 text-sm font-medium text-[#0A66C2] hover:bg-[#0A66C2]/15 disabled:opacity-50"
            >
              <Linkedin className="w-4 h-4" />
              {oauthStarting ? 'Redirecting…' : 'Connect with LinkedIn (OAuth)'}
            </button>
          </PermissionGate>
          {existing?.token_expires_at && (
            <p className="text-[11px] text-th-text-tertiary">
              Access token refresh by:{' '}
              <span className="font-mono">{new Date(existing.token_expires_at).toLocaleString()}</span>
            </p>
          )}
          <label className="text-xs font-medium text-th-text-secondary">LinkedIn organization URN</label>
          <input
            value={linkedinOrgUrn}
            onChange={(e) => setLinkedinOrgUrn(e.target.value)}
            className="w-full rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm font-mono text-xs"
            placeholder="urn:li:organization:12345678"
          />
          <label className="text-xs font-medium text-th-text-secondary">Sponsored / ad account id (optional)</label>
          <input
            value={linkedinAdAccount}
            onChange={(e) => setLinkedinAdAccount(e.target.value)}
            className="w-full rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm font-mono text-xs"
            placeholder="Numeric or URN from Campaign Manager"
          />
        </div>
      )}

      {(provider === 'facebook' || provider === 'instagram') && (
        <div className="space-y-2 pt-1">
          <label className="text-xs font-medium text-th-text-secondary">Meta ad account id</label>
          <input
            value={metaAdAccount}
            onChange={(e) => setMetaAdAccount(e.target.value)}
            className="w-full rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm font-mono text-xs"
            placeholder="act_1234567890"
          />
          {provider === 'instagram' && (
            <>
              <label className="text-xs font-medium text-th-text-secondary">Instagram business account id</label>
              <input
                value={igBusinessId}
                onChange={(e) => setIgBusinessId(e.target.value)}
                className="w-full rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm font-mono text-xs"
              />
            </>
          )}
        </div>
      )}

      {provider === 'twitter' && (
        <div className="space-y-2 pt-1">
          <label className="text-xs font-medium text-th-text-secondary">X Ads account / advertiser id</label>
          <input
            value={xAdvertiser}
            onChange={(e) => setXAdvertiser(e.target.value)}
            className="w-full rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm font-mono text-xs"
          />
        </div>
      )}

      {provider === 'tiktok' && (
        <div className="space-y-2 pt-1">
          <label className="text-xs font-medium text-th-text-secondary">TikTok advertiser id</label>
          <input
            value={ttAdvertiser}
            onChange={(e) => setTtAdvertiser(e.target.value)}
            className="w-full rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm font-mono text-xs"
          />
        </div>
      )}

      <PermissionGate permission="campaigns.write">
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            onSave(provider, {
              metadata: buildMetadata(),
              display_name: displayName.trim() || undefined,
              connection_status: status,
            })
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-th-accent-600 py-2 text-sm font-medium text-white hover:bg-th-accent-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save to database'}
        </button>
      </PermissionGate>
    </div>
  );
}
