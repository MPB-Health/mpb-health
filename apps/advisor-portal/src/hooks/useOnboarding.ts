// ============================================================================
// Onboarding Hook — Track and manage user onboarding state
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAdvisor } from '../contexts/AdvisorContext';

// Onboarding steps
export type OnboardingStep =
  | 'welcome'
  | 'profile'
  | 'power-list'
  | 'inbox'
  | 'automations'
  | 'complete';

export interface OnboardingState {
  hasCompletedOnboarding: boolean;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  skippedAt: string | null;
  completedAt: string | null;
  seenFeatures: string[];
  dismissedTips: string[];
}

const STORAGE_KEY = 'advisor-onboarding';

const DEFAULT_STATE: OnboardingState = {
  hasCompletedOnboarding: false,
  currentStep: 'welcome',
  completedSteps: [],
  skippedAt: null,
  completedAt: null,
  seenFeatures: [],
  dismissedTips: [],
};

const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'profile',
  'power-list',
  'inbox',
  'automations',
  'complete',
];

export interface OnboardingStepConfig {
  id: OnboardingStep;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    id: 'welcome',
    title: 'Welcome to Advisor Portal',
    description: 'Let\'s get you set up for success. This quick tour will show you the key features.',
    icon: 'sparkles',
    features: [],
  },
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Add your photo and contact info so leads can recognize you.',
    icon: 'user',
    features: ['profile-photo', 'contact-info', 'specialization'],
  },
  {
    id: 'power-list',
    title: 'Your Power List',
    description: 'This is your daily action center. Hot leads and priority tasks appear here.',
    icon: 'zap',
    features: ['priority-lanes', 'lead-scoring', 'quick-actions'],
  },
  {
    id: 'inbox',
    title: 'Unified Inbox',
    description: 'All your conversations in one place. Email and SMS together.',
    icon: 'inbox',
    features: ['conversations', 'templates', 'sequences'],
  },
  {
    id: 'automations',
    title: 'Automation Rules',
    description: 'Set up rules to automate follow-ups and never miss a lead.',
    icon: 'bot',
    features: ['triggers', 'actions', 'templates'],
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You\'re ready to start closing deals. Need help? Press ? anytime.',
    icon: 'check-circle',
    features: [],
  },
];

export function useOnboarding() {
  const { profile } = useAdvisor();
  const [state, setState] = useState<OnboardingState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_STATE, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('[Onboarding] Failed to load state:', error);
    }
    return DEFAULT_STATE;
  });

  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Persist state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[Onboarding] Failed to save state:', error);
    }
  }, [state]);

  // Auto-show wizard for new users
  useEffect(() => {
    if (profile && !state.hasCompletedOnboarding && !state.skippedAt) {
      // Check if this is a genuinely new user (created recently)
      const createdAt = new Date(profile.created_at || Date.now());
      const isNewUser = Date.now() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days

      if (isNewUser) {
        setIsWizardOpen(true);
      }
    }
  }, [profile, state.hasCompletedOnboarding, state.skippedAt]);

  // Get current step config
  const currentStepConfig = useMemo(() => {
    return ONBOARDING_STEPS.find((s) => s.id === state.currentStep) || ONBOARDING_STEPS[0];
  }, [state.currentStep]);

  // Get current step index
  const currentStepIndex = useMemo(() => {
    return STEP_ORDER.indexOf(state.currentStep);
  }, [state.currentStep]);

  // Progress percentage
  const progress = useMemo(() => {
    return Math.round((currentStepIndex / (STEP_ORDER.length - 1)) * 100);
  }, [currentStepIndex]);

  // Go to next step
  const nextStep = useCallback(() => {
    setState((prev) => {
      const currentIndex = STEP_ORDER.indexOf(prev.currentStep);
      const nextIndex = Math.min(currentIndex + 1, STEP_ORDER.length - 1);
      const nextStepId = STEP_ORDER[nextIndex];

      const completedSteps = prev.completedSteps.includes(prev.currentStep)
        ? prev.completedSteps
        : [...prev.completedSteps, prev.currentStep];

      const isComplete = nextStepId === 'complete';

      return {
        ...prev,
        currentStep: nextStepId,
        completedSteps,
        hasCompletedOnboarding: isComplete,
        completedAt: isComplete ? new Date().toISOString() : prev.completedAt,
      };
    });
  }, []);

  // Go to previous step
  const prevStep = useCallback(() => {
    setState((prev) => {
      const currentIndex = STEP_ORDER.indexOf(prev.currentStep);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return {
        ...prev,
        currentStep: STEP_ORDER[prevIndex],
      };
    });
  }, []);

  // Go to specific step
  const goToStep = useCallback((step: OnboardingStep) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  // Skip onboarding
  const skipOnboarding = useCallback(() => {
    setState((prev) => ({
      ...prev,
      hasCompletedOnboarding: true,
      skippedAt: new Date().toISOString(),
    }));
    setIsWizardOpen(false);
  }, []);

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    setState((prev) => ({
      ...prev,
      hasCompletedOnboarding: true,
      completedAt: new Date().toISOString(),
      currentStep: 'complete',
      completedSteps: STEP_ORDER.filter((s) => s !== 'complete'),
    }));
    setIsWizardOpen(false);
  }, []);

  // Reset onboarding (for testing)
  const resetOnboarding = useCallback(() => {
    setState(DEFAULT_STATE);
    setIsWizardOpen(true);
  }, []);

  // Mark a feature as seen
  const markFeatureSeen = useCallback((featureId: string) => {
    setState((prev) => {
      if (prev.seenFeatures.includes(featureId)) {
        return prev;
      }
      return {
        ...prev,
        seenFeatures: [...prev.seenFeatures, featureId],
      };
    });
  }, []);

  // Check if a feature has been seen
  const hasSeenFeature = useCallback(
    (featureId: string) => {
      return state.seenFeatures.includes(featureId);
    },
    [state.seenFeatures]
  );

  // Dismiss a tip
  const dismissTip = useCallback((tipId: string) => {
    setState((prev) => {
      if (prev.dismissedTips.includes(tipId)) {
        return prev;
      }
      return {
        ...prev,
        dismissedTips: [...prev.dismissedTips, tipId],
      };
    });
  }, []);

  // Check if a tip is dismissed
  const isTipDismissed = useCallback(
    (tipId: string) => {
      return state.dismissedTips.includes(tipId);
    },
    [state.dismissedTips]
  );

  // Open/close wizard
  const openWizard = useCallback(() => {
    if (state.hasCompletedOnboarding) {
      setState((prev) => ({ ...prev, currentStep: 'welcome' }));
    }
    setIsWizardOpen(true);
  }, [state.hasCompletedOnboarding]);

  const closeWizard = useCallback(() => {
    setIsWizardOpen(false);
  }, []);

  return {
    // State
    state,
    isWizardOpen,
    currentStepConfig,
    currentStepIndex,
    progress,
    steps: ONBOARDING_STEPS,
    totalSteps: STEP_ORDER.length,

    // Navigation
    nextStep,
    prevStep,
    goToStep,

    // Actions
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
    openWizard,
    closeWizard,

    // Feature tracking
    markFeatureSeen,
    hasSeenFeature,
    dismissTip,
    isTipDismissed,
  };
}

export default useOnboarding;
