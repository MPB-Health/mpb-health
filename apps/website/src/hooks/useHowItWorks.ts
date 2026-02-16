import { useState, useEffect, useCallback, useRef } from 'react';
import { HOW_IT_WORKS_STEPS } from '../lib/onboarding/howItWorksSteps';

const AUTO_ADVANCE_MS = 6000;

interface UseHowItWorksOptions {
  enableAutoAdvance?: boolean;
  enableDeepLinking?: boolean;
  enableAnalytics?: boolean;
}

interface AnalyticsEvent {
  event: 'step_view' | 'step_advance' | 'cta_click' | 'user_paused' | 'user_resumed' | 'deep_link_entry';
  stepId?: number;
  direction?: 'next' | 'prev' | 'direct';
  timeOnStep?: number;
  ctaType?: 'primary' | 'secondary' | 'tertiary';
}

export function useHowItWorks(options: UseHowItWorksOptions = {}) {
  const {
    enableAutoAdvance = true,
    enableDeepLinking = true,
    enableAnalytics = true,
  } = options;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(enableAutoAdvance);
  const [reduceMotion, setReduceMotion] = useState(false);

  const stepStartTimeRef = useRef<number>(Date.now());
  const hasTrackedDeepLinkRef = useRef(false);

  const currentStep = HOW_IT_WORKS_STEPS[currentIndex];
  const totalSteps = HOW_IT_WORKS_STEPS.length;
  const progress = (currentIndex + 1) / totalSteps;

  const trackAnalytics = useCallback((eventData: AnalyticsEvent) => {
    if (!enableAnalytics) return;

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventData.event, {
        step_id: eventData.stepId,
        direction: eventData.direction,
        time_on_step: eventData.timeOnStep,
        cta_type: eventData.ctaType,
      });
    }

    console.log('[HowItWorks Analytics]', eventData);
  }, [enableAnalytics]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!enableDeepLinking) return;

    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');

    if (stepParam) {
      const stepNumber = parseInt(stepParam, 10);
      if (stepNumber >= 1 && stepNumber <= totalSteps) {
        const newIndex = stepNumber - 1;
        setCurrentIndex(newIndex);
        setIsPlaying(false);

        if (!hasTrackedDeepLinkRef.current) {
          trackAnalytics({
            event: 'deep_link_entry',
            stepId: stepNumber,
          });
          hasTrackedDeepLinkRef.current = true;
        }
      }
    }
  }, [enableDeepLinking, totalSteps, trackAnalytics]);

  useEffect(() => {
    stepStartTimeRef.current = Date.now();

    trackAnalytics({
      event: 'step_view',
      stepId: currentStep.id,
    });
  }, [currentIndex, currentStep.id, trackAnalytics]);

  useEffect(() => {
    if (!isPlaying || !enableAutoAdvance) return;

    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % totalSteps;
        const timeOnStep = Date.now() - stepStartTimeRef.current;

        trackAnalytics({
          event: 'step_advance',
          stepId: HOW_IT_WORKS_STEPS[prev].id,
          direction: 'next',
          timeOnStep,
        });

        return nextIndex;
      });
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(intervalId);
  }, [isPlaying, enableAutoAdvance, totalSteps, trackAnalytics]);

  const updateURL = useCallback((stepNumber: number) => {
    if (!enableDeepLinking) return;

    const url = new URL(window.location.href);
    url.searchParams.set('step', stepNumber.toString());
    window.history.replaceState({}, '', url.toString());
  }, [enableDeepLinking]);

  const goToStep = useCallback((index: number, direction: 'next' | 'prev' | 'direct' = 'direct') => {
    if (index < 0 || index >= totalSteps) return;

    const timeOnStep = Date.now() - stepStartTimeRef.current;

    trackAnalytics({
      event: 'step_advance',
      stepId: currentStep.id,
      direction,
      timeOnStep,
    });

    setCurrentIndex(index);
    updateURL(index + 1);

    if (direction !== 'direct') {
      setIsPlaying(false);
    }
  }, [totalSteps, currentStep.id, trackAnalytics, updateURL]);

  const goNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % totalSteps;
    goToStep(nextIndex, 'next');
  }, [currentIndex, totalSteps, goToStep]);

  const goPrev = useCallback(() => {
    const prevIndex = (currentIndex - 1 + totalSteps) % totalSteps;
    goToStep(prevIndex, 'prev');
  }, [currentIndex, totalSteps, goToStep]);

  const selectStep = useCallback((index: number) => {
    goToStep(index, 'direct');
    setIsPlaying(false);
  }, [goToStep]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => {
      const newState = !prev;
      trackAnalytics({
        event: newState ? 'user_resumed' : 'user_paused',
        stepId: currentStep.id,
      });
      return newState;
    });
  }, [currentStep.id, trackAnalytics]);

  const trackCTA = useCallback((ctaType: 'primary' | 'secondary' | 'tertiary') => {
    trackAnalytics({
      event: 'cta_click',
      stepId: currentStep.id,
      ctaType,
    });
  }, [currentStep.id, trackAnalytics]);

  return {
    currentIndex,
    currentStep,
    totalSteps,
    progress,
    isPlaying,
    reduceMotion,
    goNext,
    goPrev,
    selectStep,
    togglePlayPause,
    trackCTA,
    steps: HOW_IT_WORKS_STEPS,
  };
}
