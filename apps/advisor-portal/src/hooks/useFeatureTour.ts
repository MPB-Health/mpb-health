// ============================================================================
// useFeatureTour — Feature tour state management
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { type TourId, type TourDefinition, TOURS, getTourById } from '../components/tour/types';

interface TourState {
  completedTours: Record<string, { version: number; completedAt: string }>;
  skippedTours: string[];
}

const STORAGE_KEY = 'advisor-feature-tours';

const DEFAULT_STATE: TourState = {
  completedTours: {},
  skippedTours: [],
};

function loadState(): TourState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_STATE, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('[FeatureTour] Failed to load state:', error);
  }
  return DEFAULT_STATE;
}

function saveState(state: TourState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[FeatureTour] Failed to save state:', error);
  }
}

export function useFeatureTour() {
  const [state, setState] = useState<TourState>(loadState);
  const [activeTour, setActiveTour] = useState<TourDefinition | null>(null);

  // Persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Check if a tour has been completed (considering version)
  const isTourCompleted = useCallback(
    (tourId: TourId): boolean => {
      const tour = getTourById(tourId);
      if (!tour) return false;

      const completed = state.completedTours[tourId];
      if (!completed) return false;

      // If the tour version has been updated, it's not considered complete
      return completed.version >= tour.version;
    },
    [state.completedTours]
  );

  // Check if a tour was skipped
  const isTourSkipped = useCallback(
    (tourId: TourId): boolean => {
      return state.skippedTours.includes(tourId);
    },
    [state.skippedTours]
  );

  // Start a tour
  const startTour = useCallback((tourId: TourId): boolean => {
    const tour = getTourById(tourId);
    if (!tour) {
      console.error(`[FeatureTour] Tour not found: ${tourId}`);
      return false;
    }
    setActiveTour(tour);
    return true;
  }, []);

  // Complete a tour
  const completeTour = useCallback((tourId: TourId) => {
    const tour = getTourById(tourId);
    if (!tour) return;

    setState((prev) => ({
      ...prev,
      completedTours: {
        ...prev.completedTours,
        [tourId]: {
          version: tour.version,
          completedAt: new Date().toISOString(),
        },
      },
      // Remove from skipped if it was there
      skippedTours: prev.skippedTours.filter((id) => id !== tourId),
    }));
    setActiveTour(null);
  }, []);

  // Skip a tour
  const skipTour = useCallback((tourId: TourId) => {
    setState((prev) => ({
      ...prev,
      skippedTours: prev.skippedTours.includes(tourId)
        ? prev.skippedTours
        : [...prev.skippedTours, tourId],
    }));
    setActiveTour(null);
  }, []);

  // Close active tour
  const closeTour = useCallback(() => {
    if (activeTour) {
      skipTour(activeTour.id as TourId);
    }
  }, [activeTour, skipTour]);

  // Reset a specific tour (to show it again)
  const resetTour = useCallback((tourId: TourId) => {
    setState((prev) => {
      const { [tourId]: _, ...remainingCompleted } = prev.completedTours;
      return {
        ...prev,
        completedTours: remainingCompleted,
        skippedTours: prev.skippedTours.filter((id) => id !== tourId),
      };
    });
  }, []);

  // Reset all tours
  const resetAllTours = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  // Get available tours (not completed, not skipped)
  const getAvailableTours = useCallback((): TourDefinition[] => {
    return Object.values(TOURS).filter(
      (tour) =>
        !isTourCompleted(tour.id as TourId) &&
        !isTourSkipped(tour.id as TourId)
    );
  }, [isTourCompleted, isTourSkipped]);

  return {
    // State
    activeTour,
    isOpen: activeTour !== null,

    // Tour queries
    isTourCompleted,
    isTourSkipped,
    getAvailableTours,

    // Tour actions
    startTour,
    completeTour,
    skipTour,
    closeTour,
    resetTour,
    resetAllTours,

    // Available tours
    allTours: TOURS,
  };
}

export default useFeatureTour;
