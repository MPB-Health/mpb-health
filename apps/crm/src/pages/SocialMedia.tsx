import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BarChart3, FileText, LayoutGrid, Link2, Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCRM } from '../contexts/CRMContext';
import { PermissionGate } from '../components/PermissionGate';
import {
  SocialQuoteFormModal,
  SocialQuoteFormCard,
  SocialPostsPanel,
  SocialConnectionsPanel,
  SOCIAL_PLATFORMS,
  isSocialQuoteWebForm,
} from '../components/social-media';
import type { WebForm } from '@mpbhealth/crm-core';
import toast from 'react-hot-toast';
import { HelpBanner } from '../components/help';

type Tab = 'forms' | 'posts' | 'connections' | 'analytics';

export default function SocialMedia() {
  const { formService } = useCRM();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('forms');
  const [forms, setForms] = useState<WebForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WebForm | null>(null);

  const loadForms = useCallback(async () => {
    setLoading(true);
    const { forms: list } = await formService.getForms({}, 100, 0);
    setForms(list);
    setLoading(false);
  }, [formService]);

  useEffect(() => {
    void loadForms();
  }, [loadForms]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'forms' || t === 'posts' || t === 'connections' || t === 'analytics') {
      setTab(t);
    }
  }, [searchParams]);

  useEffect(() => {
    const li = searchParams.get('linkedin');
    if (!li) return;
    if (li === 'connected') {
      toast.success('LinkedIn connected for this organization.', { id: 'social-linkedin-oauth' });
    } else if (li === 'error') {
      const msg = searchParams.get('linkedin_error') || 'LinkedIn connection failed';
      toast.error(msg, { id: 'social-linkedin-oauth' });
    }
    const next = new URLSearchParams(searchParams);
    next.delete('linkedin');
    next.delete('linkedin_error');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const socialFormsResolved = useMemo(() => forms.filter(isSocialQuoteWebForm), [forms]);

  const handleDuplicate = async (id: string) => {
    const res = await formService.duplicateForm(id);
    if (res.success) {
      toast.success('Duplicated');
      void loadForms();
    } else toast.error(res.error || 'Duplicate failed');
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Archive this form? It will no longer accept public submissions.')) return;
    const res = await formService.updateForm(id, { status: 'archived' });
    if (res.success) {
      toast.success('Form archived');
      void loadForms();
    } else toast.error(res.error || 'Archive failed');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this social quote form?')) return;
    const res = await formService.deleteForm(id);
    if (res.success) {
      toast.success('Deleted');
      void loadForms();
    } else toast.error(res.error || 'Delete failed');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-500" />
            <h1 className="text-2xl font-bold text-th-text-primary">Social Media Hub</h1>
          </motion.div>
          <p className="text-sm text-th-text-tertiary mt-1 max-w-xl">
            Quote forms with UTM-ready links, a lightweight post calendar, and analytics snapshots — aligned with your
            CRM org.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/social-media/legacy/ads"
            className="inline-flex items-center gap-2 rounded-lg border border-th-border px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-tertiary"
          >
            <LayoutGrid className="w-4 h-4" />
            Ad campaigns
          </Link>
          <PermissionGate permission="campaigns.write">
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-th-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" />
              New social quote form
            </button>
          </PermissionGate>
        </div>
      </div>

      <HelpBanner pageKey="social-media" title="Welcome to Social Media" tip="Schedule posts, track engagement, and manage your social media presence across platforms. Monitor which content drives the most leads." />

      <div className="flex flex-wrap gap-2 border-b border-th-border pb-1">
        {(
          [
            { id: 'forms' as const, label: 'Quote forms', icon: FileText },
            { id: 'posts' as const, label: 'Posts', icon: LayoutGrid },
            { id: 'connections' as const, label: 'Connections', icon: Link2 },
            { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
          ]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-surface-primary text-th-accent-600 border border-b-0 border-th-border -mb-px'
                : 'text-th-text-tertiary hover:text-th-text-secondary'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'forms' && (
        <div className="space-y-6">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-th-text-tertiary text-sm">Loading forms…</div>
          ) : socialFormsResolved.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-th-border bg-surface-primary/50 p-12 text-center">
              <p className="text-th-text-secondary font-medium">No social quote forms yet</p>
              <p className="text-sm text-th-text-tertiary mt-2 max-w-md mx-auto">
                Create a form to get a public URL with UTM parameters for each network. Submissions flow into web form
                submissions and can convert to leads.
              </p>
              <PermissionGate permission="campaigns.write">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setModalOpen(true);
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-th-accent-600 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  <Plus className="w-4 h-4" />
                  Create social quote form
                </button>
              </PermissionGate>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {socialFormsResolved.map((f) => (
                <SocialQuoteFormCard
                  key={f.id}
                  form={f}
                  onEdit={(form) => {
                    setEditing(form);
                    setModalOpen(true);
                  }}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onArchive={handleArchive}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'posts' && <SocialPostsPanel />}

      {tab === 'connections' && <SocialConnectionsPanel />}

      {tab === 'analytics' && <SocialAnalyticsTab forms={socialFormsResolved} />}

      <SocialQuoteFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        webForm={editing}
        onSuccess={() => void loadForms()}
      />
    </div>
  );
}

function SocialAnalyticsTab({ forms }: { forms: WebForm[] }) {
  const byPlatform = useMemo(() => {
    const m: Record<string, { forms: number; subs: number }> = {};
    SOCIAL_PLATFORMS.forEach((p) => {
      m[p.id] = { forms: 0, subs: 0 };
    });
    forms.forEach((f) => {
      const sq = (f.settings as { socialQuote?: { platform?: string } })?.socialQuote;
      const pl = sq?.platform || 'facebook';
      if (!m[pl]) m[pl] = { forms: 0, subs: 0 };
      m[pl].forms += 1;
      m[pl].subs += f.submit_count;
    });
    return m;
  }, [forms]);

  const totalSubs = forms.reduce((s, f) => s + f.submit_count, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-th-border bg-gradient-to-br from-violet-500/10 to-transparent p-5">
          <p className="text-xs font-semibold uppercase text-th-text-tertiary">Social quote forms</p>
          <p className="text-3xl font-bold text-th-text-primary mt-1 tabular-nums">{forms.length}</p>
        </div>
        <div className="rounded-xl border border-th-border bg-gradient-to-br from-cyan-500/10 to-transparent p-5">
          <p className="text-xs font-semibold uppercase text-th-text-tertiary">Submissions</p>
          <p className="text-3xl font-bold text-th-text-primary mt-1 tabular-nums">{totalSubs}</p>
        </div>
        <div className="rounded-xl border border-th-border bg-gradient-to-br from-amber-500/10 to-transparent p-5">
          <p className="text-xs font-semibold uppercase text-th-text-tertiary">Top channel</p>
          <p className="text-lg font-bold text-th-text-primary mt-3">
            {SOCIAL_PLATFORMS.map((p) => ({ ...p, subs: byPlatform[p.id]?.subs ?? 0 })).sort((a, b) => b.subs - a.subs)[0]?.label ?? '—'}
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-th-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-tertiary text-left text-xs uppercase text-th-text-tertiary">
            <tr>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Forms</th>
              <th className="px-4 py-3">Submissions</th>
            </tr>
          </thead>
          <tbody>
            {SOCIAL_PLATFORMS.map((p) => (
              <tr key={p.id} className="border-t border-th-border">
                <td className="px-4 py-3 font-medium text-th-text-primary">{p.label}</td>
                <td className="px-4 py-3 tabular-nums text-th-text-secondary">{byPlatform[p.id]?.forms ?? 0}</td>
                <td className="px-4 py-3 tabular-nums text-th-text-secondary">{byPlatform[p.id]?.subs ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-th-text-primary">Top-performing forms</h3>
        <div className="rounded-xl border border-th-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-tertiary text-left text-xs uppercase text-th-text-tertiary">
              <tr>
                <th className="px-4 py-3">Form</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Submissions</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {forms.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-th-text-tertiary text-sm">
                    No forms to rank yet.
                  </td>
                </tr>
              ) : (
                [...forms]
                  .sort((a, b) => b.submit_count - a.submit_count)
                  .slice(0, 8)
                  .map((f) => {
                    const pl =
                      (f.settings as { socialQuote?: { platform?: string } })?.socialQuote?.platform || 'facebook';
                    const label = SOCIAL_PLATFORMS.find((x) => x.id === pl)?.label ?? pl;
                    return (
                      <tr key={f.id} className="border-t border-th-border">
                        <td className="px-4 py-3 font-medium text-th-text-primary truncate max-w-[200px]">{f.name}</td>
                        <td className="px-4 py-3 text-th-text-secondary">{label}</td>
                        <td className="px-4 py-3 tabular-nums text-th-text-secondary">{f.submit_count}</td>
                        <td className="px-4 py-3 text-th-text-tertiary capitalize">{f.status}</td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-th-text-tertiary">
        Totals are from live web form data in your org. Connect ad platforms in a future release for spend and
        impressions.
      </p>
    </div>
  );
}
