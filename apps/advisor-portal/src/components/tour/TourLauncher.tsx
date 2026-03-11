// ============================================================================
// TourLauncher — List and launch available feature tours
// ============================================================================

import { useState } from 'react';
import {
  GraduationCap,
  Play,
  CheckCircle,
  ChevronRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { cn } from '@mpbhealth/ui';
import { useFeatureTour } from '../../hooks/useFeatureTour';
import { type TourId, TOURS } from './types';

interface TourLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOUR_ICONS: Record<string, string> = {
  'power-list-tour': 'Zap',
  'inbox-tour': 'Inbox',
  'automations-tour': 'Bot',
  'analytics-tour': 'BarChart3',
};

export function TourLauncher({ isOpen, onClose }: TourLauncherProps) {
  const {
    startTour,
    isTourCompleted,
    isTourSkipped,
    resetTour,
    resetAllTours,
  } = useFeatureTour();
  const [showReset, setShowReset] = useState(false);

  if (!isOpen) return null;

  const tours = Object.values(TOURS);
  const completedCount = tours.filter((t) => isTourCompleted(t.id as TourId)).length;
  const hasCompletedAny = completedCount > 0;

  const handleStartTour = (tourId: TourId) => {
    onClose();
    // Small delay to allow modal to close
    setTimeout(() => {
      startTour(tourId);
    }, 150);
  };

  const handleResetTour = (e: React.MouseEvent, tourId: TourId) => {
    e.stopPropagation();
    resetTour(tourId);
  };

  const handleResetAll = () => {
    resetAllTours();
    setShowReset(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-50">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="font-semibold text-neutral-900 dark:text-white">
                  Feature Tours
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {completedCount} of {tours.length} completed
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="px-4 pt-4">
            <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-500"
                style={{ width: `${(completedCount / tours.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Tour List */}
          <div className="p-4 space-y-2">
            {tours.map((tour) => {
              const isCompleted = isTourCompleted(tour.id as TourId);
              const isSkipped = isTourSkipped(tour.id as TourId);

              return (
                <button
                  type="button"
                  key={tour.id}
                  onClick={() => handleStartTour(tour.id as TourId)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                    isCompleted
                      ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                      : 'bg-neutral-50 dark:bg-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  )}
                >
                  {/* Status icon */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      isCompleted
                        ? 'bg-green-100 dark:bg-green-900/50'
                        : 'bg-neutral-200 dark:bg-neutral-600'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Play className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    )}
                  </div>

                  {/* Tour info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'font-medium',
                        isCompleted
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-neutral-900 dark:text-white'
                      )}
                    >
                      {tour.name}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                      {tour.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <button
                        type="button"
                        onClick={(e) => handleResetTour(e, tour.id as TourId)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-white dark:hover:bg-neutral-600 rounded transition-colors"
                        title="Take tour again"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    <ChevronRight
                      className={cn(
                        'w-4 h-4',
                        isCompleted
                          ? 'text-green-500'
                          : 'text-neutral-400'
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          {hasCompletedAny && (
            <div className="px-4 pb-4 border-t border-neutral-100 dark:border-neutral-700 pt-3">
              {showReset ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">
                    Reset all tour progress?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReset(false)}
                      className="px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleResetAll}
                      className="px-3 py-1.5 text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded transition-colors"
                    >
                      Reset All
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  Reset all progress
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default TourLauncher;
