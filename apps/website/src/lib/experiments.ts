// Simple A/B testing utilities
import { createClientLogger } from '@mpbhealth/utils';

const log = createClientLogger('Experiments');

export type ExperimentVariant = 'A' | 'B';

export interface Experiment {
  id: string;
  variants: ExperimentVariant[];
  defaultVariant: ExperimentVariant;
}

export const experiments = {
  hero: {
    id: 'hero_test',
    variants: ['A', 'B'] as ExperimentVariant[],
    defaultVariant: 'B' as ExperimentVariant,
  },
  pricing: {
    id: 'pricing_test',
    variants: ['A', 'B'] as ExperimentVariant[],
    defaultVariant: 'A' as ExperimentVariant,
  },
} as const;

export const getExperimentVariant = (experimentId: keyof typeof experiments): ExperimentVariant => {
  // Check URL parameter first for testing
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const variant = urlParams.get('v') as ExperimentVariant;

    if (variant && ['A', 'B'].includes(variant)) {
      return variant;
    }
  }

  // Return default variant (no more A/B testing)
  const experiment = experiments[experimentId];
  return experiment.defaultVariant;
};

export const trackExperiment = (experimentId: string, variant: ExperimentVariant, event: string) => {
  // Track experiment exposure and conversion
  log.info('Experiment:', experimentId, 'Variant:', variant, 'Event:', event);
  
  // In a real implementation, send to your analytics platform
  // analytics.track('experiment_event', { experimentId, variant, event });
};