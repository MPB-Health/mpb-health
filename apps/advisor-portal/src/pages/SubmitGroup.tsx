import { useState } from 'react';
import {
  UsersRound,
  Search,
  Clock,
} from 'lucide-react';

export default function SubmitGroup() {
  const [searchQuery, setSearchQuery] = useState('');

  // Placeholder data – replace with real data source later
  const groups: {
    id: string;
    title: string;
    description?: string;
    thumbnail_url?: string | null;
    duration_minutes?: number;
    status?: string;
  }[] = [];

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
            <div
              key={group.id}
              role="button"
              tabIndex={0}
              className="document-card group bg-surface-primary rounded-xl border border-th-border hover:border-th-accent-300 hover:shadow-md transition-all cursor-pointer h-full flex flex-col"
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
                  <div className="flex items-center space-x-1 text-sm text-th-text-tertiary">
                    <Clock className="w-4 h-4" />
                    <span>{group.duration_minutes || 0} min</span>
                  </div>
                  <span className="text-sm font-medium text-th-text-tertiary">
                    {group.status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <UsersRound className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
          <p className="text-th-text-tertiary">No groups found</p>
        </div>
      )}
    </div>
  );
}
