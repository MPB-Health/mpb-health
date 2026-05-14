import type { PageHelp, HelpArticle, HelpModule } from './types';

import { dashboardPageHelp } from './articles/dashboard';
import { leadsPageHelp, pipelinePageHelp, reactivationPageHelp } from './articles/leads-pipeline';
import { accountsPageHelp, contactsPageHelp } from './articles/accounts-contacts';
import { dealsPageHelp, dealPipelinePageHelp } from './articles/deals';
import { forecastingPageHelp } from './articles/forecasting';
import { productsPageHelp, quotesPageHelp, invoicesPageHelp } from './articles/products-quotes-invoices';
import { campaignsPageHelp, socialMediaPageHelp } from './articles/campaigns-marketing';
import { inboxPageHelp, emailSequencesPageHelp } from './articles/email';
import { tasksPageHelp, calendarPageHelp } from './articles/tasks-calendar';
import { reportsPageHelp } from './articles/reports-analytics';
import { referralPartnersPageHelp, outsideAdvisorsPageHelp, communityEventsPageHelp } from './articles/referral-network';
import { casesPageHelp } from './articles/cases-support';
import { documentsPageHelp, callsPageHelp } from './articles/documents-calls';
import { templatesPageHelp, automationPageHelp } from './articles/templates-automation';
import { studioPageHelp } from './articles/crm-studio';
import { settingsPageHelp } from './articles/settings';
import { webFormsPageHelp } from './articles/web-forms';
import { recruitingPageHelp, recruitingArticles } from './articles/recruiting';

import { dashboardArticles } from './articles/dashboard';
import { leadsPipelineArticles } from './articles/leads-pipeline';
import { accountsContactsArticles } from './articles/accounts-contacts';
import { dealsArticles } from './articles/deals';
import { forecastingArticles } from './articles/forecasting';
import { productsQuotesInvoicesArticles } from './articles/products-quotes-invoices';
import { campaignsMarketingArticles } from './articles/campaigns-marketing';
import { emailArticles } from './articles/email';
import { tasksCalendarArticles } from './articles/tasks-calendar';
import { reportsAnalyticsArticles } from './articles/reports-analytics';
import { referralNetworkArticles } from './articles/referral-network';
import { casesSupportArticles } from './articles/cases-support';
import { documentsCallsArticles } from './articles/documents-calls';
import { templatesAutomationArticles } from './articles/templates-automation';
import { crmStudioArticles } from './articles/crm-studio';
import { settingsArticles } from './articles/settings';
import { webFormsArticles } from './articles/web-forms';
import { gettingStartedArticles } from './articles/getting-started';

const pageHelpMap: Record<string, PageHelp> = {};

function register(routePattern: string, help: PageHelp) {
  pageHelpMap[routePattern] = help;
}

// Main
register('/dashboard', dashboardPageHelp);
register('/today', dashboardPageHelp);

// Lead management
register('/leads', leadsPageHelp);
register('/leads/:id', leadsPageHelp);
register('/leads/workspace/:id', leadsPageHelp);
// Section 9: Quick Rate Leads removed; legacy variant kept for admin audit.
register('/leads/quick-rate-estimate/legacy', leadsPageHelp);
register('/pipeline', pipelinePageHelp);
// Section 9: Reactivation legacy variant.
register('/reactivation/legacy', reactivationPageHelp);

// CRM core
register('/accounts', accountsPageHelp);
register('/accounts/:id', accountsPageHelp);
// Section 9 rename: Contacts → Members. Legacy /contacts/legacy paths
// kept so admins auditing the old IA still get help content.
register('/members', contactsPageHelp);
register('/members/:id', contactsPageHelp);
register('/contacts/legacy', contactsPageHelp);
register('/contacts/legacy/:id', contactsPageHelp);
register('/deals', dealsPageHelp);
register('/deals/:id', dealsPageHelp);
register('/deal-pipeline', dealPipelinePageHelp);

// Forecasting
register('/forecasting', forecastingPageHelp);
register('/forecasting/velocity', forecastingPageHelp);

// Products / billing
register('/products', productsPageHelp);
register('/products/:id', productsPageHelp);
// Section 9: Quotes / Invoices removed from sidebar; help only registered
// on the legacy admin-audit variants.
register('/quotes/legacy', quotesPageHelp);
register('/quotes/legacy/:id', quotesPageHelp);
register('/invoices/legacy', invoicesPageHelp);
register('/invoices/legacy/:id', invoicesPageHelp);

// Marketing
register('/campaigns', campaignsPageHelp);
register('/campaigns/:id', campaignsPageHelp);
// Section 9: Social Media + Ad Campaigns removed; legacy variants only.
register('/social-media/legacy', socialMediaPageHelp);
register('/social-media/legacy/ads', socialMediaPageHelp);

// Email
register('/email/inbox', inboxPageHelp);
register('/email/sent', inboxPageHelp);
register('/email/schedules', inboxPageHelp);
register('/email/sequences', emailSequencesPageHelp);
register('/email/signatures', inboxPageHelp);
register('/email/deliverability', inboxPageHelp);
register('/email/connected', inboxPageHelp);
register('/email/accounts', inboxPageHelp);
register('/email/rules', inboxPageHelp);
register('/email/domains', inboxPageHelp);

// Productivity
register('/tasks', tasksPageHelp);
register('/calendar', calendarPageHelp);
// Section 9: End of Day folded into Sales Daily Logs; Meetings folded
// into Calendar. Legacy variants only for admin audit.
register('/sales-daily-logs', tasksPageHelp);
register('/sales-daily-logs/legacy', tasksPageHelp);
register('/end-of-day/legacy', tasksPageHelp);
register('/meetings/legacy', calendarPageHelp);

// Analytics
register('/reports', reportsPageHelp);
register('/reports/performance', reportsPageHelp);
register('/reports/leads-split', reportsPageHelp);
register('/reports/source-breakdown', reportsPageHelp);
register('/reports/revenue', reportsPageHelp);
register('/reports/conversion', reportsPageHelp);
register('/reports/activity-targets', reportsPageHelp);
register('/reports/advisor-production', reportsPageHelp);
register('/reports/annual', reportsPageHelp);
// Section 9: Sales Activity tab removed; Daily Log / Activity Detail are
// the surviving surfaces. Legacy variant for admin audit only.
register('/sales-activity/legacy', reportsPageHelp);
register('/milestones', reportsPageHelp);

// Network
register('/referral-partners', referralPartnersPageHelp);
register('/referral-partners/:id', referralPartnersPageHelp);
register('/outside-advisors', outsideAdvisorsPageHelp);
register('/outside-advisors/:id', outsideAdvisorsPageHelp);
// Section 9: Community Events removed from sidebar; legacy variant only.
register('/community-events/legacy', communityEventsPageHelp);
register('/community-events/legacy/:id', communityEventsPageHelp);

// Support
register('/cases', casesPageHelp);
register('/cases/:id', casesPageHelp);

// Documents & Calls
register('/documents', documentsPageHelp);
register('/calls', callsPageHelp);

// Admin
register('/templates', templatesPageHelp);
register('/automation', automationPageHelp);
register('/automation/builder', automationPageHelp);
register('/automation/builder/:ruleId', automationPageHelp);
// Section 9: Studio removed from sidebar; legacy variant only.
register('/studio/legacy', studioPageHelp);
register('/studio/legacy/modules/new', studioPageHelp);
register('/studio/legacy/modules/:id', studioPageHelp);
register('/settings', settingsPageHelp);
register('/settings/approval-processes', settingsPageHelp);
register('/approvals', settingsPageHelp);

// Section 9 / Round 5 — Recruiting clone parity (new top-level workspace).
// The pipeline mirrors Leads but data, sends, and cadences are kept fully
// separate per spec. Same help registration pattern as Leads.
register('/recruiting', recruitingPageHelp);
register('/recruiting/:id', recruitingPageHelp);

// Web forms
register('/web-forms', webFormsPageHelp);
register('/web-forms/new', webFormsPageHelp);
register('/web-forms/:id/edit', webFormsPageHelp);
register('/web-forms/:id/submissions', webFormsPageHelp);

/**
 * Resolve the PageHelp for a given pathname.
 * Tries exact match first, then tries replacing UUID segments with :id.
 */
export function getPageHelp(pathname: string): PageHelp | null {
  if (pageHelpMap[pathname]) return pageHelpMap[pathname];

  const normalized = pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '/:id',
  );
  if (pageHelpMap[normalized]) return pageHelpMap[normalized];

  const segments = pathname.split('/').filter(Boolean);
  for (let i = segments.length; i > 0; i--) {
    const partial = '/' + segments.slice(0, i).join('/');
    if (pageHelpMap[partial]) return pageHelpMap[partial];
  }

  return null;
}

const allArticles: HelpArticle[] = [
  ...gettingStartedArticles,
  ...dashboardArticles,
  ...leadsPipelineArticles,
  ...accountsContactsArticles,
  ...dealsArticles,
  ...forecastingArticles,
  ...productsQuotesInvoicesArticles,
  ...campaignsMarketingArticles,
  ...emailArticles,
  ...tasksCalendarArticles,
  ...reportsAnalyticsArticles,
  ...referralNetworkArticles,
  ...casesSupportArticles,
  ...documentsCallsArticles,
  ...templatesAutomationArticles,
  ...crmStudioArticles,
  ...settingsArticles,
  ...webFormsArticles,
  ...recruitingArticles,
];

export function getAllArticles(): HelpArticle[] {
  return allArticles;
}

export function getArticleById(id: string): HelpArticle | null {
  return allArticles.find((a) => a.id === id) ?? null;
}

export function getArticlesByModule(module: HelpModule): HelpArticle[] {
  return allArticles.filter((a) => a.module === module);
}

export function searchArticles(query: string): HelpArticle[] {
  if (!query.trim()) return allArticles;
  const terms = query.toLowerCase().split(/\s+/);
  return allArticles
    .map((article) => {
      const haystack = [
        article.title,
        article.summary,
        article.tags.join(' '),
        article.content,
      ]
        .join(' ')
        .toLowerCase();
      const score = terms.reduce(
        (acc, term) => acc + (haystack.includes(term) ? 1 : 0),
        0,
      );
      return { article, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ article }) => article);
}
