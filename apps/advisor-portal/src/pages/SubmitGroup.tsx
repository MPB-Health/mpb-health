import { useState, useEffect, useCallback } from 'react';
import {
  UsersRound,
  Search,
  Link2,
  CheckCheck,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { Button } from '@mpbhealth/ui';
import {
  formsService,
  type AdvisorForm,
} from '@mpbhealth/advisor-core';
import { sanitizeHtml } from '@mpbhealth/utils';

const WEBSITE_BASE_URL = 'https://mpb.health';

/** Extract the direct Cognito form URL from cognito_embed HTML (iframe src) */
function getCognitoFormUrl(form: AdvisorForm): string | null {
  if (!form.cognito_embed || !form.cognito_embed.includes('cognitoforms.com')) return null;
  const match = form.cognito_embed.match(/src="(https:\/\/[^"]*cognitoforms\.com[^"]+)"/);
  return match ? match[1] : null;
}

/** Returns the best URL to copy/share. Prefers direct Cognito form URL for external use. */
function getShareableUrl(form: AdvisorForm): string | null {
  const cognitoUrl = getCognitoFormUrl(form);
  if (cognitoUrl) return cognitoUrl;

  if (form.slug) {
    if (form.slug.startsWith('http')) return form.slug;
    return `${WEBSITE_BASE_URL}${form.slug.startsWith('/') ? form.slug : '/' + form.slug}`;
  }
  if (form.embed_url && form.embed_url.startsWith('http')) return form.embed_url;
  if (form.cognito_embed && form.cognito_embed.startsWith('http') && !form.cognito_embed.includes('<')) {
    return form.cognito_embed;
  }
  return null;
}

const fallbackGroups: AdvisorForm[] = [
  {
    id: 'employer-group-census',
    slug: 'employer-group-census',
    label: 'Employer Group Census',
    category: 'employer',
    description: 'Submit your employer group census form',
    icon: 'users-round',
    estimated_minutes: 15,
    cognito_embed: 'https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/169',
    is_active: true,
    requires_auth: false,
    sort_order: 1,
    show_in_menu: true,
    menu_section: 'employer',
    menu_order: 1,
    created_at: '',
    updated_at: '',
    name: 'Employer Group Census',
    embed_url: 'https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/169',
  } as AdvisorForm,
  {
    id: 'employer-group-listbill',
    slug: 'employer-group-listbill',
    label: 'Employer Group List-Bill Setup',
    category: 'employer',
    description: 'Set up list billing for your employer group',
    icon: 'users-round',
    estimated_minutes: 10,
    cognito_embed: 'https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/343',
    is_active: true,
    requires_auth: false,
    sort_order: 2,
    show_in_menu: true,
    menu_section: 'employer',
    menu_order: 2,
    created_at: '',
    updated_at: '',
    name: 'Employer Group List-Bill Setup',
    embed_url: 'https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/343',
  } as AdvisorForm,
];

export default function SubmitGroup() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForm, setSelectedForm] = useState<AdvisorForm | null>(null);
  const [forms, setForms] = useState<AdvisorForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = useCallback((e: React.MouseEvent, form: AdvisorForm) => {
    e.stopPropagation();
    const url = getShareableUrl(form);
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedId(form.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled) { setForms(fallbackGroups); setLoading(false); }
    }, 10_000);

    const loadForms = async () => {
      try {
        const cmsForms = await formsService.getForms('employer');
        if (cancelled) return;
        setForms(cmsForms.length > 0 ? cmsForms : fallbackGroups);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load employer forms:', err);
        setForms(fallbackGroups);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadForms();
    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      !searchQuery ||
      form.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-surface-tertiary">
          <UsersRound className="w-6 h-6 text-th-text-tertiary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Submit Group</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Submit and manage your groups
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-th-text-tertiary" />
        <input
          type="text"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
        />
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-primary rounded-xl border border-th-border h-full flex flex-col animate-pulse"
            >
              <div className="document-card__thumbnail bg-surface-tertiary" />
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="h-5 bg-surface-tertiary rounded w-3/4" />
                <div className="h-4 bg-surface-tertiary rounded w-full" />
                <div className="mt-auto pt-3.5 border-t border-th-border-subtle flex justify-between">
                  <div className="h-4 bg-surface-tertiary rounded w-12" />
                  <div className="h-4 bg-surface-tertiary rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cards grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredForms.map((form) => {
            const thumbnailUrl = (form as AdvisorForm & { thumbnail_url?: string }).thumbnail_url;
            const hasThumbnail = !!thumbnailUrl;
            const shareUrl = getShareableUrl(form);
            const isCopied = copiedId === form.id;

            return (
              <div
                key={form.id}
                className="document-card group bg-surface-primary rounded-xl border border-th-border hover:border-th-accent-300 hover:shadow-md transition-all h-full flex flex-col text-left"
              >
                {hasThumbnail ? (
                  <div
                    className="document-card__thumbnail bg-surface-tertiary cursor-pointer"
                    style={{
                      backgroundImage: `url(${thumbnailUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center top',
                      backgroundRepeat: 'no-repeat',
                    }}
                    role="img"
                    aria-label={form.label}
                    onClick={() => setSelectedForm(form)}
                  />
                ) : (
                  <div className="document-card__content p-5 pb-0">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-surface-tertiary">
                        <UsersRound className="w-6 h-6 text-th-text-tertiary" />
                      </div>
                      {shareUrl && (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleCopyLink(e, form)}
                            title="Copy shareable link"
                            aria-label="Copy shareable link"
                            className="min-h-[44px] min-w-[44px] text-th-text-tertiary hover:text-th-accent-600"
                          >
                            {isCopied ? (
                              <CheckCheck className="w-4 h-4 text-green-600" />
                            ) : (
                              <Link2 className="w-4 h-4" />
                            )}
                          </Button>
                          <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-th-text-tertiary hover:text-th-accent-600 hover:bg-th-accent-50 dark:hover:bg-th-accent-900/20 transition-colors"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className={`document-card__content flex-1 flex flex-col ${hasThumbnail ? 'p-5' : 'p-5 pt-4'}`}>
                  <h3 className="font-semibold text-th-text-primary leading-snug">
                    {form.label}
                  </h3>
                  {form.description && (
                    <p className="text-sm text-th-text-tertiary mt-1 line-clamp-2">
                      {form.description}
                    </p>
                  )}
                  <div className="mt-auto" aria-hidden="true"></div>
                  <div className="document-card__footer flex items-center justify-between pt-3.5 mt-[14px] border-t border-th-border-subtle">
                    <span className="text-sm text-th-text-tertiary">Form</span>
                    <div className="flex items-center gap-2">
                      {shareUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleCopyLink(e, form)}
                          className="flex items-center gap-1 text-xs text-th-text-tertiary hover:text-th-accent-600"
                        >
                          {isCopied ? <CheckCheck className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                          {isCopied ? 'Copied!' : 'Share'}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedForm(form)}
                        className="text-sm text-th-accent-600 font-medium hover:text-th-accent-700"
                      >
                        Fill out →
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredForms.length === 0 && (
        <div className="text-center py-12">
          <UsersRound className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
          <p className="text-th-text-tertiary">No groups found</p>
        </div>
      )}

      {/* Form modal */}
      {selectedForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSelectedForm(null)}
          />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-surface-primary rounded-2xl shadow-xl w-full max-w-4xl h-[95vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-th-border flex-shrink-0">
                <h2 className="text-lg font-semibold text-th-text-primary truncate mr-4">
                  {selectedForm.label}
                </h2>
                <div className="flex items-center gap-1 shrink-0">
                  {(() => {
                    const url = getShareableUrl(selectedForm);
                    if (!url) return null;
                    const copied = copiedId === selectedForm.id;
                    return (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleCopyLink(e, selectedForm)}
                          title="Copy shareable link"
                        >
                          {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? 'Copied!' : 'Copy Link'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          title="Open Cognito form in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open
                        </Button>
                      </>
                    );
                  })()}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedForm(null)}
                    aria-label="Close"
                    className="min-h-[44px] min-w-[44px]"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                {selectedForm.cognito_embed && selectedForm.cognito_embed.includes('<') ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedForm.cognito_embed, { ADD_TAGS: ['iframe', 'script'], ADD_ATTR: ['src', 'frameborder', 'allowfullscreen', 'allow', 'loading', 'scrolling', 'data-key', 'data-form'] }) }}
                    className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                  />
                ) : (
                  <iframe
                    src={formsService.getEmbedUrl(selectedForm)}
                    className="w-full h-full border-0"
                    title={selectedForm.label}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
