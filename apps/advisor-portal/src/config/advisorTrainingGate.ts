import { resolveAdvisorTrainingGateCutoffMs } from '@mpbhealth/advisor-core';

const override = import.meta.env.VITE_ADVISOR_TRAINING_GATE_CUTOFF_ISO as string | undefined;

/** Parsed cutoff; advisors created before this instant (profile or auth user) skip the training gate. */
export const ADVISOR_TRAINING_GATE_CUTOFF_MS = resolveAdvisorTrainingGateCutoffMs(override);
