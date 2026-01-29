// ============================================================================
// TourContext — Global feature tour state management
// ============================================================================

import { createContext, useContext, type ReactNode } from 'react';
import { useFeatureTour } from '../hooks/useFeatureTour';
import { FeatureTour } from '../components/tour';
import type { TourId, TourDefinition } from '../components/tour';

interface TourContextValue {
  activeTour: TourDefinition | null;
  isOpen: boolean;
  isTourCompleted: (tourId: TourId) => boolean;
  isTourSkipped: (tourId: TourId) => boolean;
  getAvailableTours: () => TourDefinition[];
  startTour: (tourId: TourId) => boolean;
  completeTour: (tourId: TourId) => void;
  skipTour: (tourId: TourId) => void;
  closeTour: () => void;
  resetTour: (tourId: TourId) => void;
  resetAllTours: () => void;
  allTours: Record<string, TourDefinition>;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const tourState = useFeatureTour();

  return (
    <TourContext.Provider value={tourState}>
      {children}

      {/* Render active tour */}
      {tourState.activeTour && (
        <FeatureTour
          tour={tourState.activeTour}
          isOpen={tourState.isOpen}
          onClose={tourState.closeTour}
          onComplete={() => tourState.completeTour(tourState.activeTour!.id as TourId)}
        />
      )}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

export default TourProvider;
