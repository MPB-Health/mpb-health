import plansData from '../../content/plans.json';

export function getAdvisorContent() {
  return {
    plans: plansData.plans,
  };
}

export function getPlansContent() {
  return plansData.plans;
}
