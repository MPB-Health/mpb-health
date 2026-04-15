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
register('/leads/quick-rate-estimate', leadsPageHelp);
register('/pipeline', pipelinePageHelp);
register('/reactivation', reactivationPageHelp);

// CRM core
register('/accounts', accountsPageHelp);
register('/accounts/:id', accountsPageHelp);
register('/contacts', contactsPageHelp);
register('/contacts/:id', contactsPageHelp);
register('/deals', dealsPageHelp);
register('/deals/:id', dealsPageHelp);
register('/deal-pipeline', dealPipelinePageHelp);

// Forecasting
register('/forecasting', forecastingPageHelp);
register('/forecasting/velocity', forecastingPageHelp);

// Products / billing
register('/products', productsPageHelp);
register('/products/:id', productsPageHelp);
register('/quotes', quotesPageHelp);
register('/quotes/:id', quotesPageHelp);
register('/invoices', invoicesPageHelp);
register('/invoices/:id', invoicesPageHelp);

// Marketing
register('/campaigns', campaignsPageHelp);
register('/campaigns/:id', campaignsPageHelp);
register('/social-media', socialMediaPageHelp);
register('/social-media/ads', socialMediaPageHelp);

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
register('/end-of-day', tasksPageHelp);
register('/meetings', calendarPageHelp);

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
register('/sales-activity', reportsPageHelp);
register('/milestones', reportsPageHelp);

// Network
register('/referral-partners', referralPartnersPageHelp);
register('/referral-partners/:id', referralPartnersPageHelp);
register('/outside-advisors', outsideAdvisorsPageHelp);
register('/outside-advisors/:id', outsideAdvisorsPageHelp);
register('/community-events', communityEventsPageHelp);
register('/community-events/:id', communityEventsPageHelp);

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
register('/studio', studioPageHelp);
register('/studio/modules/new', studioPageHelp);
register('/studio/modules/:id', studioPageHelp);
register('/settings', settingsPageHelp);
register('/settings/approval-processes', settingsPageHelp);
register('/approvals', settingsPageHelp);

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
