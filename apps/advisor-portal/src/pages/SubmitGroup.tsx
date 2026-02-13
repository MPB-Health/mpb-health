import { useState } from 'react';
import {
  UsersRound,
  Search,
} from 'lucide-react';

export default function SubmitGroup() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; title: string; url: string } | null>(null);

  const groups = [
    {
      id: 'employer-group-census',
      title: 'Employer Group Census',
      description: 'Submit your employer group census form',
      thumbnail_url: 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/employer-group-census.jpg',
      url: 'https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/169',
    },
    {
      id: 'employer-group-listbill',
      title: 'Employer Group List-Bill Setup',
      description: 'Set up list billing for your employer group',
      thumbnail_url: 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/employer-group-listbill.jpg',
      url: 'https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/343',
    },
  ];

  const filteredGroups = groups.filter((group) => {
    const matchesSearch =
      !searchQuery ||
      group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase());
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

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((group) => {
          const hasThumbnail = !!group.thumbnail_url;

          return (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className="document-card group bg-surface-primary rounded-xl border border-th-border hover:border-th-accent-300 hover:shadow-md transition-all cursor-pointer h-full flex flex-col text-left"
            >
              {hasThumbnail ? (
                <div
                  className="document-card__thumbnail bg-surface-tertiary"
                  style={{
                    backgroundImage: `url(${group.thumbnail_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top',
                    backgroundRepeat: 'no-repeat',
                  }}
                  role="img"
                  aria-label={group.title}
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
                  {group.title}
                </h3>
                {group.description && (
                  <p className="text-sm text-th-text-tertiary mt-1 line-clamp-2">
                    {group.description}
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

      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <UsersRound className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
          <p className="text-th-text-tertiary">No groups found</p>
        </div>
      )}

      {/* Form modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSelectedGroup(null)}
          />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-surface-primary rounded-2xl shadow-xl w-full max-w-4xl h-[95vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-th-border flex-shrink-0">
                <h2 className="text-lg font-semibold text-th-text-primary">
                  {selectedGroup.title}
                </h2>
                <button
                  onClick={() => setSelectedGroup(null)}
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
                  src={selectedGroup.url}
                  className="w-full h-full border-0"
                  title={selectedGroup.title}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
