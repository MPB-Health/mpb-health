export interface ResourceLink {
  label: string;
  url: string;
}

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
  /** Multiple links displayed as separate buttons within the card */
  links?: ResourceLink[];
}

export type TrainingCategory =
  | 'health-sharing'
  | 'mpb-plans'
  | 'welcome-scripts'
  | 'telehealth'
  | 'internal-sops'
  | 'customer-service';

export type ResourceType = 'document' | 'pdf' | 'video' | 'checklist' | 'handbook' | 'sop' | 'script';

export const CATEGORY_LABELS: Record<TrainingCategory, string> = {
  'health-sharing': 'Health Sharing Introduction & Processes',
  'mpb-plans': 'MPB Plans: Member Handbooks',
  'welcome-scripts': 'Welcome Call Scripts',
  'telehealth': 'MEC and Telehealth',
  'internal-sops': 'RX, Labs, Imaging, Appts',
  'customer-service': 'Customer Service',
};

export const CATEGORY_DESCRIPTIONS: Record<TrainingCategory, string> = {
  'health-sharing': 'Learn how health sharing works, member guidelines, terminology, and processes',
  'mpb-plans': 'Membership comparison charts, plan handbooks, and quick reference guides for all plan types',
  'welcome-scripts': 'Welcome call scripts for each plan type to onboard new members effectively',
  'telehealth': 'ARM and MPB Telehealth SOPs for MEC and telehealth services',
  'internal-sops': 'Prescriptions, lab work, imaging services, and appointment setting procedures',
  'customer-service': 'De-escalation techniques, customer service fundamentals, and member communication best practices',
};
