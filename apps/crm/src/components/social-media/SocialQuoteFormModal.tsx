import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, QrCode } from 'lucide-react';
import { Modal } from '../Modal';
import { useCRM } from '../../contexts/CRMContext';
import type { FormField, WebForm } from '@mpbhealth/crm-core';
import { SOCIAL_PLATFORMS, type SocialPlatform } from './socialMediaTypes';
import type { FormSettingsWithSocial, FormStylingWithSocial } from './socialMediaTypes';
import { buildSocialQuoteFormUrl, buildUtmQuery, getPublicWebFormOrigin, slugify } from './socialMediaUtils';

export interface SocialQuoteFormModalProps {
  open: boolean;
  onClose: () => void;
  /** When set, modal edits this form */
  webForm?: WebForm | null;
  onSuccess?: () => void;
}

type FieldKey = 'firstName' | 'lastName' | 'email' | 'phone' | 'zip' | 'state' | 'household' | 'coverage';

const FIELD_DEFS: Record<
  FieldKey,
  Omit<FormField, 'id'> & { idFactory: () => string }
> = {
  firstName: {
    idFactory: () => 'sf_first',
    type: 'text',
    label: 'First name',
    placeholder: 'Jane',
    required: true,
    width: 'half',
  },
  lastName: {
    idFactory: () => 'sf_last',
    type: 'text',
    label: 'Last name',
    placeholder: 'Doe',
    required: true,
    width: 'half',
  },
  email: {
    idFactory: () => 'sf_email',
    type: 'email',
    label: 'Email',
    placeholder: 'you@example.com',
    required: true,
    width: 'full',
  },
  phone: {
    idFactory: () => 'sf_phone',
    type: 'phone',
    label: 'Phone',
    placeholder: '(555) 555-0100',
    required: true,
    width: 'full',
  },
  zip: {
    idFactory: () => 'sf_zip',
    type: 'text',
    label: 'ZIP code',
    placeholder: '12345',
    required: true,
    width: 'half',
    validation: { pattern: '^\\d{5}$', maxLength: 5 },
  },
  state: {
    idFactory: () => 'sf_state',
    type: 'select',
    label: 'State',
    required: true,
    width: 'half',
    options: ['FL', 'TX', 'CA', 'Other'],
  },
  household: {
    idFactory: () => 'sf_household',
    type: 'select',
    label: 'Household',
    required: true,
    width: 'full',
    options: ['Individual', 'Couple', 'Family'],
  },
  coverage: {
    idFactory: () => 'sf_coverage',
    type: 'select',
    label: 'Coverage interest',
    required: false,
    width: 'full',
    options: ['Major medical', 'Short-term', 'Medicare', 'Not sure'],
  },
};

function buildFields(params: {
  headline: string;
  intro: string;
  enabled: Record<FieldKey, boolean>;
}): FormField[] {
  const fields: FormField[] = [];
  fields.push({
    id: 'sf_heading',
    type: 'heading',
    label: 'Heading',
    content: params.headline || 'Get your personalized quote',
  });
  if (params.intro.trim()) {
    fields.push({
      id: 'sf_intro',
      type: 'paragraph',
      label: 'Intro',
      content: params.intro,
    });
  }
  (Object.keys(FIELD_DEFS) as FieldKey[]).forEach((key) => {
    if (!params.enabled[key]) return;
    const def = FIELD_DEFS[key];
    const { idFactory, ...rest } = def;
    fields.push({ ...rest, id: idFactory() });
  });
  return fields;
}

export function SocialQuoteFormModal({ open, onClose, webForm, onSuccess }: SocialQuoteFormModalProps) {
  const { formService } = useCRM();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [platform, setPlatform] = useState<SocialPlatform>('facebook');
  const [headline, setHeadline] = useState('Better coverage. Smarter spend.');
  const [ctaLabel, setCtaLabel] = useState('Get my quote');
  const [utmCampaignSlug, setUtmCampaignSlug] = useState('');
  const [intro, setIntro] = useState('Tell us a bit about you — a specialist will follow up within one business day.');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [successMessage, setSuccessMessage] = useState("Thanks! You're on the list — we'll be in touch shortly.");
  const [status, setStatus] = useState<'draft' | 'active'>('draft');
  const [enabled, setEnabled] = useState<Record<FieldKey, boolean>>({
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    zip: true,
    state: true,
    household: true,
    coverage: true,
  });

  useEffect(() => {
    if (!open) return;
    if (webForm) {
      setName(webForm.name);
      setDescription(webForm.description || '');
      setSlug(webForm.slug);
      const sq = (webForm.settings as FormSettingsWithSocial)?.socialQuote;
      setPlatform(sq?.platform ?? 'facebook');
      setHeadline(sq?.headline || webForm.styling?.headerText || '');
      setCtaLabel(sq?.ctaLabel || webForm.styling?.buttonText || 'Get my quote');
      setUtmCampaignSlug(sq?.utmCampaignSlug || slugify(webForm.name));
      setIntro(
        webForm.fields.find((f) => f.type === 'paragraph')?.content ||
          'Tell us a bit about you — a specialist will follow up within one business day.'
      );
      setPrimaryColor(webForm.styling?.primaryColor || '#4f46e5');
      setSuccessMessage(webForm.styling?.successMessage || "Thanks! You're on the list.");
      setStatus(webForm.status === 'archived' ? 'draft' : webForm.status);
      const keys = Object.keys(FIELD_DEFS) as FieldKey[];
      const next = {} as Record<FieldKey, boolean>;
      keys.forEach((k) => {
        next[k] = webForm.fields.some((f) => f.id === FIELD_DEFS[k].idFactory());
      });
      setEnabled(next);
    } else {
      setName('');
      setDescription('');
      setSlug('');
      setPlatform('facebook');
      setHeadline('Better coverage. Smarter spend.');
      setCtaLabel('Get my quote');
      setUtmCampaignSlug('');
      setIntro('Tell us a bit about you — a specialist will follow up within one business day.');
      setPrimaryColor('#4f46e5');
      setSuccessMessage("Thanks! You're on the list — we'll be in touch shortly.");
      setStatus('draft');
      setEnabled({
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        zip: true,
        state: true,
        household: true,
        coverage: true,
      });
    }
  }, [open, webForm]);

  const utmSlug = utmCampaignSlug.trim() || slugify(name || 'social-quote');

  const shareQuery = useMemo(
    () =>
      buildUtmQuery({
        platform,
        campaignSlug: utmSlug,
        content: slugify(name || 'form'),
      }),
    [platform, utmSlug, name]
  );

  const previewUrl = useMemo(() => {
    const s = slug || slugify(name || 'quote');
    const origin = getPublicWebFormOrigin() || (typeof window !== 'undefined' ? window.location.origin : '');
    return buildSocialQuoteFormUrl(origin, s, shareQuery);
  }, [slug, name, shareQuery]);

  const qrSrc = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(previewUrl)}`,
    [previewUrl]
  );

  const toggleField = (k: FieldKey) => {
    setEnabled((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Form name is required');
      return;
    }
    const finalSlug = slug.trim() || slugify(`sq-${platform}-${name}`);
    const fields = buildFields({ headline, intro, enabled });
    if (!fields.some((f) => f.type !== 'heading' && f.type !== 'paragraph')) {
      toast.error('Enable at least one input field');
      return;
    }

    const settings: FormSettingsWithSocial = {
      duplicateHandling: 'create_new',
      socialQuote: {
        platform,
        utmCampaignSlug: utmSlug,
        headline,
        ctaLabel,
      },
    };

    const styling: FormStylingWithSocial = {
      primaryColor,
      buttonText: ctaLabel,
      successMessage,
      headerText: '',
      descriptionText: '',
    };

    setLoading(true);
    if (webForm) {
      const res = await formService.updateForm(webForm.id, {
        name: name.trim(),
        description: description || undefined,
        slug: finalSlug,
        status,
        fields,
        settings,
        styling,
      });
      setLoading(false);
      if (res.success) {
        toast.success('Social quote form updated');
        onSuccess?.();
        onClose();
      } else toast.error(res.error || 'Update failed');
    } else {
      const res = await formService.createForm({
        name: name.trim(),
        description: description || undefined,
        slug: finalSlug,
        entity_type: 'lead',
        status,
        fields,
        settings,
        styling,
      });
      setLoading(false);
      if (res.success) {
        toast.success('Social quote form created');
        onSuccess?.();
        onClose();
      } else toast.error(res.error || 'Create failed');
    }
  };

  const copyLink = () => {
    void navigator.clipboard.writeText(previewUrl);
    toast.success('Link copied');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={webForm ? 'Edit social quote form' : 'New social quote form'}
      variant="slideOver"
      size="2xl"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-th-text-primary">Form name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
              placeholder="Instagram — Q2 quote sweepstakes"
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-th-text-primary">Description (internal)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-th-text-primary">URL slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm font-mono text-xs"
              placeholder="auto-generated from name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-th-text-primary">Target platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
              className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
            >
              {SOCIAL_PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-th-border bg-surface-tertiary p-4 space-y-2">
          <p className="text-xs font-semibold uppercase text-th-text-tertiary">Auto UTM (share this URL)</p>
          <code className="block break-all text-xs text-th-text-secondary">{previewUrl}</code>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1 rounded-lg bg-th-accent-600 px-3 py-1.5 text-xs font-medium text-white"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy link
            </button>
          </div>
          <div className="flex items-start gap-3 pt-2 border-t border-th-border">
            <QrCode className="w-4 h-4 text-th-text-tertiary shrink-0 mt-1" />
            <div>
              <p className="text-xs font-medium text-th-text-primary">QR preview</p>
              <img src={qrSrc} alt="QR code for share URL" className="mt-2 rounded-lg border border-th-border bg-white p-1" width={140} height={140} />
              <p className="text-[10px] text-th-text-tertiary mt-1">Opens the public form with UTM parameters.</p>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-th-text-secondary">utm_campaign slug</label>
            <input
              value={utmCampaignSlug}
              onChange={(e) => setUtmCampaignSlug(slugify(e.target.value))}
              className="w-full rounded border border-th-border bg-surface-primary px-2 py-1 text-xs font-mono"
              placeholder={slugify(name || 'campaign')}
            />
          </div>
          {typeof import.meta !== 'undefined' && !import.meta.env?.VITE_PUBLIC_WEB_FORM_BASE_URL ? (
            <p className="text-[10px] text-th-text-tertiary pt-1">
              Tip: set <span className="font-mono">VITE_PUBLIC_WEB_FORM_BASE_URL</span> if share links should point at
              another host.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-th-text-primary">Hero headline</label>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-th-text-primary">Intro paragraph</label>
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-th-text-primary">CTA button</label>
            <input
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-th-text-primary">Brand accent</label>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-full rounded-lg border border-th-border bg-surface-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-th-text-primary">Success message</label>
          <textarea
            value={successMessage}
            onChange={(e) => setSuccessMessage(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-th-text-primary">Form fields</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FIELD_DEFS) as FieldKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => toggleField(k)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  enabled[k] ? 'bg-th-accent-600 text-white' : 'bg-surface-tertiary text-th-text-tertiary'
                }`}
              >
                {FIELD_DEFS[k].label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-th-text-primary">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'active')}
            className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="active">Active (public)</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 border-t border-th-border pt-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-th-border px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-th-accent-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Saving…' : webForm ? 'Save changes' : 'Create form'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
