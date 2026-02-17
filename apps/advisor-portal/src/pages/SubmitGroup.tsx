import { useState, useEffect } from 'react';
import {
  UsersRound,
  Search,
} from 'lucide-react';
import {
  formsService,
  type AdvisorForm,
} from '@mpbhealth/advisor-core';

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

  useEffect(() => {
    const loadForms = async () => {
      try {
        const cmsForms = await formsService.getForms('employer');
        setForms(cmsForms.length > 0 ? cmsForms : fallbackGroups);
      } catch (err) {
        console.error('Failed to load employer forms:', err);
        setForms(fallbackGroups);
      } finally {
        setLoading(false);
      }
    };

    loadForms();
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

            return (
              <button
                key={form.id}
                onClick={() => setSelectedForm(form)}
                className="document-card group bg-surface-primary rounded-xl border border-th-border hover:border-th-accent-300 hover:shadow-md transition-all cursor-pointer h-full flex flex-col text-left"
              >
                {hasThumbnail ? (
                  <div
                    className="document-card__thumbnail bg-surface-tertiary"
                    style={{
                      backgroundImage: `url(${thumbnailUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center top',
                      backgroundRepeat: 'no-repeat',
                    }}
                    role="img"
                    aria-label={form.label}
                  />
                ) : (
                  <div className="document-card__content p-5 pb-0">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-surface-tertiary">
                        <UsersRound className="w-6 h-6 text-th-text-tertiary" />
                      </div>
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
                    <span className="text-sm text-th-accent-600 font-medium">Fill out →</span>
                  </div>
                </div>
              </button>
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
                <h2 className="text-lg font-semibold text-th-text-primary">
                  {selectedForm.label}
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
                <iframe
                  src={formsService.getEmbedUrl(selectedForm)}
                  className="w-full h-full border-0"
                  title={selectedForm.label}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
