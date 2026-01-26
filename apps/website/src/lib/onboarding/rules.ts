import { OnboardingAnswers, PlanRecommendation } from './types';
import plansData from '../../../content/plans.json';

interface ScoredPlan {
  planId: string;
  planName: string;
  score: number;
  rationale: string[];
}

export function recommendPlans(answers: OnboardingAnswers): PlanRecommendation[] {
  const scored: ScoredPlan[] = [];

  scored.push(scoreEssentials(answers));
  scored.push(scoreMECEssentials(answers));
  scored.push(scoreCarePlus(answers));
  scored.push(scoreDirect(answers));
  scored.push(scoreSecureHSA(answers));

  scored.sort((a, b) => b.score - a.score);

  const top2 = scored.slice(0, 2);

  return top2.map(plan => {
    const planData = plansData.plans.find(p => p.id === plan.planId);
    return {
      ...plan,
      detailsAnchor: planData?.anchor,
      enrollUrl: getEnrollUrl(plan.planId),
    };
  });
}

function scoreEssentials(answers: OnboardingAnswers): ScoredPlan {
  let score = 0;
  const rationale: string[] = [];

  if (answers.priority === 'cost') {
    score += 50;
    rationale.push('Budget-friendly option perfect for cost-conscious members');
  }

  if (answers.usage === 'virtual') {
    score += 30;
    rationale.push('Includes comprehensive virtual care access');
  }

  if (answers.audience === 'individual' && answers.priority === 'cost') {
    score += 20;
    rationale.push('Ideal for individuals seeking basic protection');
  }

  if (rationale.length === 0) {
    rationale.push('Essential coverage with virtual care and discounts');
  }

  return {
    planId: 'essentials',
    planName: 'Essentials',
    score,
    rationale: rationale.slice(0, 3),
  };
}

function scoreMECEssentials(answers: OnboardingAnswers): ScoredPlan {
  let score = 0;
  const rationale: string[] = [];

  if (answers.priority === 'hsa') {
    score += 40;
    rationale.push('HSA-compatible for tax advantages');
  }

  if (answers.priority === 'cost') {
    score += 30;
    rationale.push('Affordable option with preventive care benefits');
  }

  if (answers.audience === 'employer') {
    score += 25;
    rationale.push('Meets minimum essential coverage requirements');
  }

  if (rationale.length === 0) {
    rationale.push('Combines essential coverage with preventive care benefits');
  }

  return {
    planId: 'mec-essentials',
    planName: 'MEC+ Essentials',
    score,
    rationale: rationale.slice(0, 3),
  };
}

function scoreCarePlus(answers: OnboardingAnswers): ScoredPlan {
  let score = 0;
  const rationale: string[] = [];

  if (answers.priority === 'balanced') {
    score += 50;
    rationale.push('Perfect balance of coverage and affordability');
  }

  if (answers.extras?.includes('maternity')) {
    score += 40;
    rationale.push('Includes comprehensive maternity benefits');
  }

  if (answers.audience === 'family') {
    score += 30;
    rationale.push('Great option for growing families');
  }

  if (answers.iuaComfort === 'lower') {
    score += 20;
    rationale.push('Lower IUA options available for peace of mind');
  }

  if (rationale.length === 0) {
    rationale.push('Enhanced medical cost sharing with lower thresholds');
  }

  return {
    planId: 'care-plus',
    planName: 'Care+',
    score,
    rationale: rationale.slice(0, 3),
  };
}

function scoreDirect(answers: OnboardingAnswers): ScoredPlan {
  let score = 0;
  const rationale: string[] = [];

  if (answers.extras?.includes('worldwide')) {
    score += 50;
    rationale.push('Worldwide protection for international travelers');
  }

  if (answers.extras?.includes('networkFreedom')) {
    score += 40;
    rationale.push('Complete provider freedom nationwide');
  }

  if (answers.priority === 'coverage') {
    score += 35;
    rationale.push('Comprehensive preventive sharing included');
  }

  if (answers.usage === 'mixed') {
    score += 25;
    rationale.push('Ideal for mix of virtual and in-person care');
  }

  if (rationale.length === 0) {
    rationale.push('Maximum flexibility with preventive care sharing');
  }

  return {
    planId: 'direct',
    planName: 'Direct',
    score,
    rationale: rationale.slice(0, 3),
  };
}

function scoreSecureHSA(answers: OnboardingAnswers): ScoredPlan {
  let score = 0;
  const rationale: string[] = [];

  if (answers.priority === 'hsa') {
    score += 60;
    rationale.push('Maximizes tax advantages with HSA compatibility');
  }

  if (answers.audience === 'employer') {
    score += 30;
    rationale.push('Perfect for self-employed and small businesses');
  }

  if (answers.iuaComfort === 'higher') {
    score += 25;
    rationale.push('High-deductible approach reduces monthly costs');
  }

  if (rationale.length === 0) {
    rationale.push('HSA-compatible protection with tax benefits');
  }

  return {
    planId: 'secure-hsa',
    planName: 'Secure HSA',
    score,
    rationale: rationale.slice(0, 3),
  };
}

function getEnrollUrl(planId: string): string {
  const enrollUrls: Record<string, string> = {
    'essentials': 'https://essentials.enrollmpb.com/',
    'mec-essentials': 'https://mec.enrollmpb.com/',
    'care-plus': 'https://careplus.enrollmpb.com/',
    'careplus': 'https://careplus.enrollmpb.com/',
    'direct': 'https://direct.enrollmpb.com/',
    'secure-hsa': 'https://securehsa.enrollmpb.com/',
  };

  return enrollUrls[planId] || '/quote';
}
