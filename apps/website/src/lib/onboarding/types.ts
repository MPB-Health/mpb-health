export type Audience = 'individual' | 'family' | 'employer';
export type Priority = 'cost' | 'balanced' | 'hsa' | 'coverage';
export type Usage = 'virtual' | 'mixed' | 'inperson';
export type IUAComfort = 'higher' | 'lower';
export type Extra = 'maternity' | 'worldwide' | 'networkFreedom';

export interface OnboardingAnswers {
  audience?: Audience;
  zipCode?: string;
  ages?: number[];
  priority?: Priority;
  usage?: Usage;
  iuaComfort?: IUAComfort;
  extras?: Extra[];
  preExistingAwareness?: boolean;
  contactOptIn?: boolean;
  contactEmail?: string;
  contactPhone?: string;
}

export interface PlanRecommendation {
  planId: string;
  planName: string;
  score: number;
  rationale: string[];
  estimatedPrice?: string;
  enrollUrl?: string;
  detailsAnchor?: string;
}
