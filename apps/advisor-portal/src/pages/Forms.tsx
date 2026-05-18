import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  UserCheck,
  Building2,
  Users,
  CalendarDays,
  Link2,
  Copy,
  CheckCheck,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@mpbhealth/ui';
import { Tooltip } from '../components/Tooltip';
import {
  formsService,
  type AdvisorForm,
  type FormSubmission,
} from '@mpbhealth/advisor-core';
import { supabase } from '@mpbhealth/database';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorQueryReady } from '../hooks/useAdvisorQueryReady';
import { useAdvisorPageDebugLog } from '../hooks/useAdvisorPageDebugLog';
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
  // Prefer direct Cognito form URL when available (works for external customers)
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

interface FormsProps {
  section?: 'advisor' | 'employer' | 'member';
}

// Section configuration for filtering and display
const sectionConfig = {
  advisor: {
    title: 'Advisor Forms',
    description: 'Forms for advisor onboarding and compliance',
    icon: UserCheck,
    filter: (form: AdvisorForm) => 
      form.menu_section === 'advisor' || 
      form.category?.toLowerCase().includes('advisor'),
  },
  employer: {
    title: 'Employer Forms',
    description: 'Forms for employer enrollment and administration',
    icon: Building2,
    filter: (form: AdvisorForm) => 
      form.menu_section === 'employer' || 
      form.category?.toLowerCase().includes('employer'),
  },
  member: {
    title: 'Member Forms',
    description: 'Forms for member enrollment and benefits',
    icon: Users,
    filter: (form: AdvisorForm) => 
      form.menu_section === 'member' || 
      form.category?.toLowerCase().includes('member'),
  },
};

export default function Forms({ section }: FormsProps) {
  useAdvisorPageDebugLog('Forms');
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForm, setSelectedForm] = useState<AdvisorForm | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = useCallback((e: React.MouseEvent, form: AdvisorForm) => {
    e.stopPropagation();
    const url = getShareableUrl(form);
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedId(form.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const { data: formsData, isLoading: loading } = useQuery({
    queryKey: ['forms', profile?.id],
    queryFn: async () => {
      const [formsList, subs] = await Promise.all([
        formsService.getForms(),
        formsService.getSubmissions(profile!.id),
      ]);
      return { forms: formsList, submissions: subs };
    },
    enabled: advisorReady,
  });

  const forms = formsData?.forms ?? [];
  const submissions = formsData?.submissions ?? [];

  // Realtime: refresh forms when admin adds/edits/removes form in CMS
  useEffect(() => {
    const channel = formsService.subscribeToFormChanges(() => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    });
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const getFormSubmission = (formId: string) => {
    return submissions.find((s) => s.form_id === formId);
  };

  // Get section config if section is specified
  const currentSection = section ? sectionConfig[section] : null;

  const filteredForms = [...forms].sort((a, b) => (a.name || a.label).localeCompare(b.name || b.label)).filter((form) => {
    // Apply section filter first if specified
    if (currentSection && !currentSection.filter(form)) {
      return false;
    }
    const formName = form.name || form.label || '';
    const matchesSearch =
      !searchQuery ||
      formName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-surface-tertiary rounded-xl" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-surface-tertiary rounded" />
            <div className="h-4 w-56 bg-surface-tertiary rounded" />
          </div>
        </div>
        <div className="h-11 bg-surface-tertiary rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-surface-primary rounded-xl border border-th-border p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-surface-tertiary rounded-lg" />
                <div className="w-8 h-8 bg-surface-tertiary rounded" />
              </div>
              <div className="h-5 w-2/3 bg-surface-tertiary rounded" />
              <div className="h-4 w-full bg-surface-tertiary rounded" />
              <div className="h-px bg-surface-tertiary" />
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-surface-tertiary rounded" />
                <div className="h-4 w-16 bg-surface-tertiary rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Dynamic title and description based on section
  const pageTitle = currentSection?.title || 'Forms';
  const pageDescription = currentSection?.description || 'Complete and submit required forms';
  const PageIcon = currentSection?.icon || FileText;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          section ? 'bg-th-accent-100 dark:bg-th-accent-900/30' : 'bg-surface-tertiary'
        }`}>
          <PageIcon className={`w-6 h-6 ${
            section ? 'text-th-accent-600 dark:text-th-accent-400' : 'text-th-text-tertiary'
          }`} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">{pageTitle}</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            {pageDescription}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-th-text-tertiary" />
        <input
          type="text"
          placeholder="Search forms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
        />
      </div>

      {/* Forms grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredForms.map((form) => {
          const submission = getFormSubmission(form.id);
          const isSubmitted = !!submission;
          const shareUrl = getShareableUrl(form);
          const isCopied = copiedId === form.id;

          return (
            <div
              key={form.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedForm(form)}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedForm(form)}
              className="bg-surface-primary rounded-xl border border-th-border p-5 text-left hover:border-th-accent-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isSubmitted ? 'bg-green-100 dark:bg-green-900/30' : 'bg-surface-tertiary'
                  }`}
                >
                  {isSubmitted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : form.slug === '/webinar-questionnaire/' ? (
                    <CalendarDays className="w-6 h-6 text-th-text-tertiary" />
                  ) : (
                    <FileText className="w-6 h-6 text-th-text-tertiary" />
                  )}
                </div>
                {shareUrl && (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleCopyLink(e, form)}
                      title="Copy shareable link"
                      className="min-h-[44px] min-w-[44px] text-th-text-tertiary hover:text-th-accent-600 hover:bg-th-accent-50 dark:hover:bg-th-accent-900/20"
                    >
                      {isCopied ? (
                        <CheckCheck className="w-4 h-4 text-green-600" />
                      ) : (
                        <Link2 className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (navigator.share) {
                          navigator.share({ title: form.name || form.label, url: shareUrl }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(shareUrl);
                          setCopiedId(form.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }
                      }}
                      title="Share form"
                      className="min-h-[44px] min-w-[44px] text-th-text-tertiary hover:text-th-accent-600 hover:bg-th-accent-50 dark:hover:bg-th-accent-900/20"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg text-th-text-tertiary hover:text-th-accent-600 hover:bg-th-accent-50 dark:hover:bg-th-accent-900/20 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-th-text-primary mt-4">{form.name || form.label}</h3>
              {form.description && (
                <Tooltip content={form.description} placement="bottom">
                  <p className="text-sm text-th-text-tertiary mt-1 line-clamp-2 cursor-default">
                    {form.description}
                  </p>
                </Tooltip>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-th-border-subtle">
                <span className="text-sm text-th-text-tertiary">{form.category}</span>
                <div className="flex items-center gap-2">
                  {isSubmitted ? (
                    <span
                      className={`text-sm font-medium ${
                        submission.status === 'completed'
                          ? 'text-green-600 dark:text-green-400'
                          : submission.status === 'rejected'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}
                    >
                      {submission.status === 'completed'
                        ? 'Completed'
                        : submission.status === 'rejected'
                        ? 'Rejected'
                        : 'Pending'}
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedForm(form)}
                    className="text-th-accent-600 hover:text-th-accent-700"
                  >
                    {form.slug === '/webinar-questionnaire/' ? 'Schedule →' : 'Fill out →'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredForms.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
          <p className="text-th-text-tertiary">No forms found</p>
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
                  {selectedForm.name || selectedForm.label}
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
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({ title: selectedForm.name || selectedForm.label, url }).catch(() => {});
                            } else {
                              navigator.clipboard.writeText(url);
                              setCopiedId(selectedForm.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }
                          }}
                          title="Share form"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Share
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
                    className="min-h-[44px] min-w-[44px]"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Display form embed - cognito_embed contains full iframe/script */}
                {selectedForm.cognito_embed ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedForm.cognito_embed, { ADD_TAGS: ['iframe', 'script'], ADD_ATTR: ['src', 'frameborder', 'allowfullscreen', 'allow', 'loading', 'scrolling'] }) }}
                    className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                  />
                ) : selectedForm.embed_url ? (
                  <iframe
                    src={selectedForm.embed_url}
                    className="w-full h-full border-0"
                    title={selectedForm.name || selectedForm.label}
                  />
                ) : (
                  <div className="text-center py-12 text-th-text-tertiary">
                    <FileText className="w-12 h-12 mx-auto mb-4" />
                    <p>No form embed available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent submissions */}
      {submissions.length > 0 && (
        <div className="bg-surface-primary rounded-xl border border-th-border">
          <div className="p-5 border-b border-th-border-subtle">
            <h2 className="font-semibold text-th-text-primary">Recent Submissions</h2>
          </div>
          <div className="divide-y divide-th-border-subtle">
            {submissions.slice(0, 5).map((submission) => {
              const form = forms.find((f) => f.id === submission.form_id);
              return (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center space-x-3">
                    {submission.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : submission.status === 'rejected' ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium text-th-text-primary">
                        {form?.name || form?.label || 'Unknown Form'}
                      </p>
                      <p className="text-sm text-th-text-tertiary">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${
                      submission.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : submission.status === 'rejected'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    }`}
                  >
                    {submission.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
