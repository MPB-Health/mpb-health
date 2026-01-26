import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  formsService,
  type AdvisorForm,
  type FormSubmission,
} from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';

export default function Forms() {
  const { profile } = useAdvisor();
  const [forms, setForms] = useState<AdvisorForm[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<AdvisorForm | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!profile) return;

      try {
        const [formsList, cats, subs] = await Promise.all([
          formsService.getForms(),
          formsService.getFormCategories(),
          formsService.getSubmissions(profile.id),
        ]);
        setForms(formsList);
        setCategories(cats);
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

  const filteredForms = forms.filter((form) => {
    const matchesCategory = !selectedCategory || form.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Forms</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Complete and submit required forms
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-neutral-400" />
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
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
              className="bg-white rounded-xl border border-neutral-200 p-5 text-left hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isSubmitted ? 'bg-green-100' : 'bg-neutral-100'
                  }`}
                >
                  {isSubmitted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <FileText className="w-6 h-6 text-neutral-500" />
                  )}
                </div>
                {form.category === 'onboarding' && !isSubmitted && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                    Required
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-neutral-900 mt-4">{form.name}</h3>
              {form.description && (
                <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                  {form.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                <span className="text-sm text-neutral-500">{form.category}</span>
                {isSubmitted ? (
                  <span
                    className={`text-sm font-medium ${
                      submission.status === 'completed'
                        ? 'text-green-600'
                        : submission.status === 'rejected'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {submission.status === 'completed'
                      ? 'Completed'
                      : submission.status === 'rejected'
                      ? 'Rejected'
                      : 'Pending'}
                  </span>
                ) : (
                  <span className="text-sm text-primary-600 font-medium">
                    Fill out →
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {filteredForms.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
          <p className="text-neutral-500">No forms found</p>
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
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    {selectedForm.name}
                  </h2>
                  {selectedForm.description && (
                    <p className="text-sm text-neutral-500">
                      {selectedForm.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedForm(null)}
                  className="p-2 text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                <iframe
                  src={selectedForm.embed_url}
                  className="w-full min-h-[600px] border-0"
                  title={selectedForm.name}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent submissions */}
      {submissions.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="p-5 border-b border-neutral-100">
            <h2 className="font-semibold text-neutral-900">Recent Submissions</h2>
          </div>
          <div className="divide-y divide-neutral-100">
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
                      <p className="font-medium text-neutral-900">
                        {form?.name || 'Unknown Form'}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${
                      submission.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : submission.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
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
