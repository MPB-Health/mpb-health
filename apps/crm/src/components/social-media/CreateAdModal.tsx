import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import { Modal } from '../Modal';
import { useCRM } from '../../contexts/CRMContext';
import { logAuditEvent } from '@mpbhealth/auth';
import { useOrg } from '../../contexts/OrgContext';
import type { CampaignWithRelations, CampaignStatus } from '@mpbhealth/crm-core';
import { AdCopyEditor } from './AdCopyEditor';
import { AdPreviewCard } from './AdPreviewCard';
import { TargetingPanel } from './TargetingPanel';
import { BudgetSchedulePanel } from './BudgetSchedulePanel';
import type { SocialAdDraftState, SocialPlatform, AdObjective, AdCtaType } from './socialMediaTypes';
import { SOCIAL_PLATFORMS, AD_CTA_LABELS } from './socialMediaTypes';

const STEPS = [
  'Campaign setup',
  'Creative',
  'Preview',
  'Targeting',
  'Budget & schedule',
  'Review',
] as const;

const initialDraft = (): SocialAdDraftState => ({
  adName: '',
  objective: 'leads',
  linkedCampaignId: '',
  platforms: ['facebook', 'instagram'],
  headline: '',
  primaryText: '',
  description: '',
  cta: 'get_quote',
  imageNote: '',
  ageMin: 25,
  ageMax: 55,
  gender: 'all',
  states: ['FL', 'TX'],
  interests: ['Health insurance'],
  audienceName: '',
  budgetType: 'daily',
  budgetAmount: '150',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  bidStrategy: 'lowest_cost',
  createStatus: 'draft',
});

export interface CreateAdModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (campaignId: string) => void;
}

export function CreateAdModal({ open, onClose, onSuccess }: CreateAdModalProps) {
  const { campaignService } = useCRM();
  const { activeOrgId } = useOrg();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignWithRelations[]>([]);
  const [previewPlatform, setPreviewPlatform] = useState<SocialPlatform>('facebook');
  const [d, setD] = useState<SocialAdDraftState>(initialDraft);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setD(initialDraft());
    setPreviewPlatform('facebook');
    void (async () => {
      const { campaigns: list } = await campaignService.getCampaigns({}, 80, 0);
      setCampaigns(list);
    })();
  }, [open, campaignService]);

  useEffect(() => {
    if (d.platforms.length && !d.platforms.includes(previewPlatform)) {
      setPreviewPlatform(d.platforms[0]);
    }
  }, [d.platforms, previewPlatform]);

  const update = <K extends keyof SocialAdDraftState>(key: K, value: SocialAdDraftState[K]) => {
    setD((prev) => ({ ...prev, [key]: value }));
  };

  const togglePlatform = (p: SocialPlatform) => {
    setD((prev) => {
      const has = prev.platforms.includes(p);
      const next = has ? prev.platforms.filter((x) => x !== p) : [...prev.platforms, p];
      return { ...prev, platforms: next.length ? next : [p] };
    });
  };

  const canNext = (): boolean => {
    if (step === 0) return Boolean(d.adName.trim()) && d.platforms.length > 0;
    if (step === 1) {
      const primaryOk = d.primaryText.trim().length > 0;
      const headOk =
        d.platforms.every((pl) => {
          if (pl === 'instagram') return true;
          return d.headline.trim().length > 0;
        }) && primaryOk;
      return headOk;
    }
    if (step === 3) return d.states.length > 0;
    if (step === 4) return Boolean(d.budgetAmount) && parseFloat(d.budgetAmount) > 0;
    return true;
  };

  const handleCreate = async () => {
    if (!d.adName.trim()) {
      toast.error('Ad name is required');
      return;
    }
    setLoading(true);
    const status: CampaignStatus = d.createStatus === 'active' ? 'active' : 'draft';
    const metadata = {
      kind: 'social_ad_draft',
      objective: d.objective,
      platforms: d.platforms,
      creative: {
        headline: d.headline,
        primaryText: d.primaryText,
        description: d.description,
        cta: d.cta,
        imageNote: d.imageNote,
      },
      targeting: {
        ageMin: d.ageMin,
        ageMax: d.ageMax,
        gender: d.gender,
        states: d.states,
        interests: d.interests,
        audienceName: d.audienceName,
      },
      budget: {
        type: d.budgetType,
        amount: parseFloat(d.budgetAmount) || 0,
        startDate: d.startDate,
        endDate: d.endDate || null,
        bidStrategy: d.bidStrategy,
      },
      parentCampaignId: d.linkedCampaignId || null,
    };

    const result = await campaignService.createCampaign({
      name: d.adName.trim(),
      description: `Social ad — ${d.platforms.join(', ')} — ${d.objective}`,
      campaign_type: 'advertisement',
      status,
      budget: parseFloat(d.budgetAmount) || undefined,
      start_date: d.startDate || undefined,
      end_date: d.endDate || undefined,
      tags: ['social_ad', ...d.platforms],
      metadata,
      parent_campaign_id: d.linkedCampaignId || undefined,
    });

    setLoading(false);
    if (result.success && result.campaignId) {
      toast.success(status === 'active' ? 'Ad campaign activated' : 'Ad campaign saved as draft');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: 'campaign.created',
        entityType: 'campaign',
        entityId: result.campaignId,
        after: { name: d.adName.trim(), kind: 'social_ad_draft' },
        metadata: { source: 'create_ad_modal' },
      }).catch(console.error);
      onSuccess?.(result.campaignId);
      onClose();
    } else {
      toast.error(result.error || 'Failed to create ad campaign');
    }
  };

  const objectiveLabel = (o: AdObjective) =>
    ({ awareness: 'Awareness', traffic: 'Traffic', leads: 'Leads', conversions: 'Conversions' })[o];

  return (
    <Modal open={open} onClose={onClose} title="Create social ad" size="2xl">
      <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
        <div className="flex flex-wrap gap-1">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                i === step
                  ? 'bg-th-accent-600 text-white'
                  : i < step
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : 'bg-surface-tertiary text-th-text-tertiary'
              }`}
            >
              <span className="tabular-nums">{i + 1}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-th-text-primary">Ad / campaign name</label>
              <input
                value={d.adName}
                onChange={(e) => update('adName', e.target.value)}
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
                placeholder="Q2 — FL quote ads"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-th-text-primary">Objective</label>
              <select
                value={d.objective}
                onChange={(e) => update('objective', e.target.value as AdObjective)}
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
              >
                <option value="awareness">Brand awareness</option>
                <option value="traffic">Website traffic</option>
                <option value="leads">Lead generation</option>
                <option value="conversions">Conversions</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-th-text-primary">Link to CRM campaign (optional)</label>
              <select
                value={d.linkedCampaignId}
                onChange={(e) => update('linkedCampaignId', e.target.value)}
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-th-text-primary">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {SOCIAL_PLATFORMS.map(({ id, label }) => {
                  const on = d.platforms.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => togglePlatform(id)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        on
                          ? 'border-th-accent-600 bg-th-accent-600/10 text-th-accent-700 dark:text-th-accent-300'
                          : 'border-th-border text-th-text-secondary hover:border-th-accent-400'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <AdCopyEditor
              platforms={d.platforms}
              activePlatform={previewPlatform}
              onActivePlatformChange={setPreviewPlatform}
              headline={d.headline}
              primaryText={d.primaryText}
              description={d.description}
              onHeadlineChange={(v) => update('headline', v)}
              onPrimaryTextChange={(v) => update('primaryText', v)}
              onDescriptionChange={(v) => update('description', v)}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium text-th-text-primary">Call to action</label>
              <select
                value={d.cta}
                onChange={(e) => update('cta', e.target.value as AdCtaType)}
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
              >
                {(Object.keys(AD_CTA_LABELS) as AdCtaType[]).map((k) => (
                  <option key={k} value={k}>
                    {AD_CTA_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-th-text-primary">Creative / image notes</label>
              <textarea
                value={d.imageNote}
                onChange={(e) => update('imageNote', e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
                placeholder="Team photo, lifestyle family, before/after premium savings graphic…"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-th-text-secondary">Preview how your ad may appear on each network.</p>
            <div className="flex flex-wrap gap-2">
              {d.platforms.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreviewPlatform(p)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    previewPlatform === p ? 'bg-th-accent-600 text-white' : 'bg-surface-tertiary text-th-text-secondary'
                  }`}
                >
                  {SOCIAL_PLATFORMS.find((x) => x.id === p)?.label ?? p}
                </button>
              ))}
            </div>
            <AdPreviewCard
              platform={previewPlatform}
              headline={d.headline}
              primaryText={d.primaryText}
              description={d.description}
              cta={d.cta}
            />
          </div>
        )}

        {step === 3 && (
          <TargetingPanel
            ageMin={d.ageMin}
            ageMax={d.ageMax}
            gender={d.gender}
            states={d.states}
            interests={d.interests}
            audienceName={d.audienceName}
            onAgeMinChange={(n) => update('ageMin', n)}
            onAgeMaxChange={(n) => update('ageMax', n)}
            onGenderChange={(g) => update('gender', g)}
            onStatesChange={(s) => update('states', s)}
            onInterestsChange={(t) => update('interests', t)}
            onAudienceNameChange={(v) => update('audienceName', v)}
          />
        )}

        {step === 4 && (
          <BudgetSchedulePanel
            budgetType={d.budgetType}
            budgetAmount={d.budgetAmount}
            startDate={d.startDate}
            endDate={d.endDate}
            bidStrategy={d.bidStrategy}
            onBudgetTypeChange={(t) => update('budgetType', t)}
            onBudgetAmountChange={(v) => update('budgetAmount', v)}
            onStartDateChange={(v) => update('startDate', v)}
            onEndDateChange={(v) => update('endDate', v)}
            onBidStrategyChange={(s) => update('bidStrategy', s)}
          />
        )}

        {step === 5 && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-th-border p-4 space-y-2 bg-surface-tertiary">
              <div className="flex items-center gap-2 font-semibold text-th-text-primary">
                <Megaphone className="w-4 h-4" />
                {d.adName || 'Untitled ad'}
              </div>
              <p className="text-th-text-secondary">
                Objective: <strong>{objectiveLabel(d.objective)}</strong> · Platforms:{' '}
                <strong>{d.platforms.map((p) => SOCIAL_PLATFORMS.find((x) => x.id === p)?.label ?? p).join(', ')}</strong>
              </p>
              {d.linkedCampaignId ? (
                <p className="text-th-text-tertiary text-xs">
                  Linked campaign: {campaigns.find((c) => c.id === d.linkedCampaignId)?.name ?? d.linkedCampaignId}
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-th-border p-4 space-y-1">
              <p className="text-xs font-semibold uppercase text-th-text-tertiary">Creative</p>
              <p className="text-th-text-primary font-medium">{d.headline || '(No headline)'}</p>
              <p className="text-th-text-secondary whitespace-pre-wrap line-clamp-4">{d.primaryText}</p>
              <p className="text-th-text-tertiary text-xs">CTA: {AD_CTA_LABELS[d.cta]}</p>
            </div>
            <div className="rounded-xl border border-th-border p-4 space-y-1">
              <p className="text-xs font-semibold uppercase text-th-text-tertiary">Targeting</p>
              <p className="text-th-text-secondary">
                Ages {d.ageMin}–{d.ageMax}, {d.gender} · {d.states.join(', ')}
              </p>
              <p className="text-th-text-secondary">{d.interests.join(' · ')}</p>
              {d.audienceName ? <p className="text-th-text-tertiary">Audience: {d.audienceName}</p> : null}
            </div>
            <div className="rounded-xl border border-th-border p-4 space-y-1">
              <p className="text-xs font-semibold uppercase text-th-text-tertiary">Budget</p>
              <p className="text-th-text-secondary">
                ${d.budgetAmount} {d.budgetType} · {d.bidStrategy.replace('_', ' ')}
              </p>
              <p className="text-th-text-tertiary text-xs">
                {d.startDate}
                {d.endDate ? ` → ${d.endDate}` : ' (no end date)'}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 text-th-text-secondary">
                <input
                  type="radio"
                  name="createStatus"
                  checked={d.createStatus === 'draft'}
                  onChange={() => update('createStatus', 'draft')}
                />
                Save as draft
              </label>
              <label className="flex items-center gap-2 text-th-text-secondary">
                <input
                  type="radio"
                  name="createStatus"
                  checked={d.createStatus === 'active'}
                  onChange={() => update('createStatus', 'active')}
                />
                Activate now
              </label>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-th-border pt-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-th-border px-4 py-2 text-sm font-medium text-th-text-secondary disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="inline-flex items-center gap-1 rounded-lg bg-th-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-th-accent-700 disabled:opacity-40"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleCreate()}
              className="rounded-lg bg-th-accent-600 px-5 py-2 text-sm font-semibold text-white hover:bg-th-accent-700 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Create ad campaign'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
