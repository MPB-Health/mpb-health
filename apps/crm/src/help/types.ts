export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface QuickTip {
  id: string;
  text: string;
}

export interface FieldHint {
  fieldKey: string;
  label: string;
  hint: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface PageHelp {
  pageKey: string;
  title: string;
  description: string;
  quickTips: QuickTip[];
  fieldHints: FieldHint[];
  faqs: FAQ[];
  relatedArticles: string[];
  videoUrl?: string;
}

export interface HelpArticle {
  id: string;
  module: HelpModule;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  difficulty: Difficulty;
}

export type HelpModule =
  | 'getting-started'
  | 'leads-pipeline'
  | 'accounts-contacts'
  | 'deals'
  | 'forecasting'
  | 'products-quotes-invoices'
  | 'campaigns-marketing'
  | 'social-media'
  | 'email'
  | 'tasks-calendar'
  | 'reports-analytics'
  | 'referral-network'
  | 'cases-support'
  | 'documents-calls'
  | 'templates-automation'
  | 'crm-studio'
  | 'settings'
  | 'web-forms'
  // Section 9 / Round 5 — Recruiting clone parity. New top-level
  // workspace dedicated to agent recruiting, structurally a clone of
  // Leads but with its own pipeline + cadences + email log attribution.
  | 'recruiting';

export interface ModuleMeta {
  key: HelpModule;
  label: string;
  description: string;
  icon: string;
}

export const MODULE_META: ModuleMeta[] = [
  { key: 'getting-started', label: 'Getting Started', description: 'Learn the basics of your CRM and get up to speed quickly.', icon: 'Rocket' },
  { key: 'leads-pipeline', label: 'Leads & Pipeline', description: 'Capture, qualify, and move leads through your sales pipeline.', icon: 'Users' },
  { key: 'accounts-contacts', label: 'Accounts & Contacts', description: 'Manage companies and individual contacts in your network.', icon: 'Building2' },
  { key: 'deals', label: 'Deals & Deal Pipeline', description: 'Track opportunities from proposal to close.', icon: 'DollarSign' },
  { key: 'forecasting', label: 'Forecasting', description: 'Project revenue and track deal velocity metrics.', icon: 'TrendingUp' },
  { key: 'products-quotes-invoices', label: 'Products, Quotes & Invoices', description: 'Build your product catalog and manage quotes and billing.', icon: 'Package' },
  { key: 'campaigns-marketing', label: 'Campaigns & Marketing', description: 'Plan and execute marketing campaigns to generate leads.', icon: 'Megaphone' },
  { key: 'social-media', label: 'Social Media & Ads', description: 'Manage social media presence and advertising campaigns.', icon: 'Share2' },
  { key: 'email', label: 'Email', description: 'Send, schedule, and automate email communications.', icon: 'Mail' },
  { key: 'tasks-calendar', label: 'Tasks, Calendar & Meetings', description: 'Stay organized with tasks, appointments, and meeting scheduling.', icon: 'CalendarDays' },
  { key: 'reports-analytics', label: 'Reports & Analytics', description: 'Analyze performance with dashboards and detailed reports.', icon: 'BarChart3' },
  { key: 'referral-network', label: 'Referral Partners & Network', description: 'Grow through referral partners, advisors, and community events.', icon: 'Handshake' },
  { key: 'cases-support', label: 'Cases & Support', description: 'Track and resolve customer support cases.', icon: 'LifeBuoy' },
  { key: 'documents-calls', label: 'Documents & Calls', description: 'Store documents and log call activity.', icon: 'FileText' },
  { key: 'templates-automation', label: 'Templates & Automation', description: 'Create templates and automate repetitive workflows.', icon: 'Zap' },
  { key: 'crm-studio', label: 'CRM Studio & Custom Modules', description: 'Customize your CRM with custom fields and modules.', icon: 'Settings2' },
  { key: 'settings', label: 'Settings & Administration', description: 'Configure organization settings, users, and permissions.', icon: 'Settings' },
  { key: 'web-forms', label: 'Web Forms', description: 'Build and embed lead capture forms on your website.', icon: 'FileInput' },
];
