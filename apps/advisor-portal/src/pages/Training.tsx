import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';
import { useAdvisor } from '../contexts/AdvisorContext';

interface TrainingProps {
  section?: 'mpb' | 'sedera' | 'zion';
}

const sectionConfig = {
  mpb: {
    title: 'MPB Training',
    description: 'MPB Health training modules',
  },
  sedera: {
    title: 'Sedera Training',
    description: 'Sedera training modules',
  },
  zion: {
    title: 'Zion Training',
    description: 'Zion training modules',
  },
};

export default function Training({ section }: TrainingProps) {
  const navigate = useNavigate();
  const { trainingModules, trainingProgress } = useAdvisor();
  const [searchQuery, setSearchQuery] = useState('');

  const currentSection = section ? sectionConfig[section] : null;
  const pageTitle = currentSection?.title || 'Training';
  const pageDescription = currentSection?.description || 'Your advisor training modules';

  const getModuleStatus = (moduleId: string) => {
    const progress = trainingProgress.find((p) => p.module_id === moduleId);
    return progress?.status || 'not_started';
  };

  const filteredModules = trainingModules.filter((module) => {
    const matchesCategory = !section || module.category?.toLowerCase().includes(section);
    const matchesSearch =
      !searchQuery ||
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-surface-tertiary">
          <GraduationCap className="w-6 h-6 text-th-text-tertiary" />
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
          placeholder="Search modules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
        />
      </div>

      {/* Modules grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.slice(0, 1).map((module) => {
          const status = getModuleStatus(module.id);
          const progress = trainingProgress.find((p) => p.module_id === module.id);

          const hasThumbnail = !!module.thumbnail_url;

          return (
            <div
              key={module.id}
              onClick={() => navigate(`/training/${module.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/training/${module.id}`)}
              role="button"
              tabIndex={0}
              className="document-card group bg-surface-primary rounded-xl border border-th-border hover:border-th-accent-300 hover:shadow-md transition-all cursor-pointer h-full flex flex-col"
            >{hasThumbnail ? (
                <div
                  className="document-card__thumbnail bg-surface-tertiary"
                  style={{
                    backgroundImage: `url(${module.thumbnail_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top',
                    backgroundRepeat: 'no-repeat',
                  }}
                  role="img"
                  aria-label={module.title}
                />
              ) : (
                <div className="document-card__content p-5 pb-0">
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : status === 'in_progress'
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'bg-surface-tertiary'
                      }`}
                    >
                      {status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : status === 'in_progress' ? (
                        <Play className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <GraduationCap className="w-6 h-6 text-th-text-tertiary" />
                      )}
                    </div>
                    {module.is_required && (
                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                </div>
              )}<div className={`document-card__content flex-1 flex flex-col ${hasThumbnail ? 'p-5' : 'p-5 pt-4'}`}>
                <h3 className="font-semibold text-th-text-primary leading-snug">
                  {module.title}
                </h3>
                {module.description && (
                  <p className="text-sm text-th-text-tertiary mt-1 line-clamp-2">
                    {module.description}
                  </p>
                )}
                <div className="mt-auto" aria-hidden="true"></div>
                <div className="document-card__footer flex items-center justify-between pt-3.5 mt-[14px] border-t border-th-border-subtle">
                  <div className="flex items-center space-x-1 text-sm text-th-text-tertiary">
                    <Clock className="w-4 h-4" />
                    <span>{module.duration_minutes} min</span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      status === 'completed'
                        ? 'text-green-600 dark:text-green-400'
                        : status === 'in_progress'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-th-text-tertiary'
                    }`}
                  >
                    {status === 'completed'
                      ? 'Completed'
                      : status === 'in_progress'
                      ? `${progress?.time_spent_minutes || 0} min spent`
                      : 'Not started'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
          <p className="text-th-text-tertiary">No training modules found</p>
        </div>
      )}
    </div>
  );
}
