import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { trainingService, type TrainingModule, type TrainingProgress } from '@mpbhealth/advisor-core';
import { useAdvisorQueryReady } from './useAdvisorQueryReady';

export interface TrainingStats {
  totalModules: number;
  completedModules: number;
  completionPercentage: number;
}

const EMPTY_STATS: TrainingStats = {
  totalModules: 0,
  completedModules: 0,
  completionPercentage: 0,
};

const EMPTY_MODULES: TrainingModule[] = [];
const EMPTY_PROGRESS: TrainingProgress[] = [];

/**
 * Server-state slice extracted from AdvisorContext (Candidate 9 split).
 * Fetches only on pages that render training data, instead of eagerly at login.
 */
export function useTraining() {
  const { advisorReady, profileId } = useAdvisorQueryReady();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['advisorTraining', profileId] as const,
    queryFn: async () => {
      const [modules, progress, stats] = await Promise.all([
        trainingService.getModules(),
        trainingService.getAdvisorProgress(profileId!),
        trainingService.getTrainingStats(profileId!),
      ]);
      return {
        trainingModules: modules,
        trainingProgress: progress,
        trainingStats: {
          totalModules: stats.totalModules,
          completedModules: stats.completedModules,
          completionPercentage: stats.completionPercentage,
        },
      };
    },
    enabled: Boolean(advisorReady && profileId),
  });

  const refreshTraining = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['advisorTraining', profileId] });
  }, [queryClient, profileId]);

  return {
    trainingModules: data?.trainingModules ?? EMPTY_MODULES,
    trainingProgress: data?.trainingProgress ?? EMPTY_PROGRESS,
    trainingStats: data?.trainingStats ?? EMPTY_STATS,
    refreshTraining,
  };
}
