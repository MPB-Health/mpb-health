import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Tooltip } from '../components/Tooltip';
import {
  formsService,
  type AdvisorForm,
  type FormSubmission,
} from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';

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
  const { profile } = useAdvisor();
  const [forms, setForms] = useState<AdvisorForm[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<AdvisorForm | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!profile) return;

      try {
        const [formsList, subs] = await Promise.all([
          formsService.getForms(),
          formsService.getSubmissions(profile.id),
        ]);
        setForms(formsList);
        setSubmissions(subs);
      } catch (err) {
        console.error('Failed to load forms:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile?.id]);

  const getFormSubmission = (formId: string) => {
    return submissions.find((s) => s.form_id === formId);
  };

  // Get section config if section is specified
  const currentSection = section ? sectionConfig[section] : null;

  const filteredForms = forms.filter((form) => {
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600"></div>
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

          return (
            <button
              key={form.id}
              onClick={() => setSelectedForm(form)}
              className="bg-surface-primary rounded-xl border border-th-border p-5 text-left hover:border-th-accent-300 hover:shadow-md transition-all"
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
                ) : (
                  <span className="text-sm text-th-accent-600 font-medium">
                    {form.slug === '/webinar-questionnaire/' ? 'Schedule →' : 'Fill out →'}
                  </span>
                )}
              </div>
            </button>
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
                <h2 className="text-lg font-semibold text-th-text-primary">
                  {selectedForm.name || selectedForm.label}
                </h2>
                <button
                  onClick={() => setSelectedForm(null)}
                  className="p-2 text-th-text-tertiary hover:text-th-text-primary rounded-lg hover:bg-surface-tertiary"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Display form embed - cognito_embed contains full iframe/script */}
                {selectedForm.cognito_embed ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: selectedForm.cognito_embed }}
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
