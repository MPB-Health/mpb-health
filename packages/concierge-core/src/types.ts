export interface TrainingResource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: TrainingCategory;
  subcategory?: string;
  type: ResourceType;
  /** Whether the link opens in a new tab (external) */
  external: boolean;
}

export type TrainingCategory =
  | 'health-sharing'
  | 'mpb-plans'
  | 'welcome-scripts'
  | 'telehealth'
  | 'internal-sops';

export type ResourceType = 'document' | 'pdf' | 'video' | 'checklist' | 'handbook' | 'sop' | 'script';

export const CATEGORY_LABELS: Record<TrainingCategory, string> = {
  'health-sharing': 'Health Sharing Introduction & Processes',
  'mpb-plans': 'MPB Plans: Member Handbooks',
  'welcome-scripts': 'Welcome Call Scripts',
  'telehealth': 'Telehealth & MEC',
  'internal-sops': 'Internal Daily SOPs',
};

export const CATEGORY_DESCRIPTIONS: Record<TrainingCategory, string> = {
  'health-sharing': 'Learn how health sharing works, member guidelines, terminology, and de-escalation procedures',
  'mpb-plans': 'Membership comparison charts, plan handbooks, and quick reference guides for all plan types',
  'welcome-scripts': 'Welcome call scripts for each plan type to onboard new members effectively',
  'telehealth': 'ARM and Lyric SOP for telehealth and MEC services',
  'internal-sops': 'Daily checklists, task management, healthcare pricing, prescriptions, imaging, and appointment setting',
};
