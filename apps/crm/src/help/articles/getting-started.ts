import type { HelpArticle } from '../types';

export const gettingStartedArticles: HelpArticle[] = [
  {
    id: 'gs-welcome',
    module: 'getting-started',
    title: 'Welcome to MPB CRM',
    summary:
      'A first-look orientation covering the core modules, navigation, and how the CRM fits into your daily Medicare sales workflow.',
    content: `MPB CRM is purpose-built for health insurance and Medicare professionals. Whether you are an independent agent, a team lead, or part of a large agency, the platform gives you a single place to capture leads, manage client relationships, track deals through your pipeline, and stay on top of compliance-sensitive deadlines like Annual Enrollment Period (AEP) and Open Enrollment Period (OEP).

When you first log in you will land on the Dashboard, which surfaces the metrics that matter most: new leads awaiting contact, deals in progress, upcoming tasks, and any policy renewals that need attention. From there, the left-hand navigation organizes every feature into logical groups—Leads & Pipeline, Accounts & Contacts, Deals, Forecasting, Campaigns, and more.

Before diving into day-to-day work, take a few minutes to complete your profile under Settings. Add your National Producer Number (NPN), upload your headshot, and connect your email account so outbound messages send from your professional address. If your agency administrator has already pre-configured teams and territories, you will see your assigned leads populate automatically once your account is activated.

Finally, bookmark the Help Center (the question-mark icon in the top-right corner) so you can always search for articles, keyboard shortcuts, and video walkthroughs without leaving the page you are working on. The CRM is designed to keep you productive during AEP rushes and quieter off-season periods alike—let's get started.`,
    tags: ['onboarding', 'first-login', 'overview', 'AEP', 'OEP', 'navigation'],
    difficulty: 'beginner',
  },
  {
    id: 'gs-navigation',
    module: 'getting-started',
    title: 'Navigating the CRM',
    summary:
      'Learn how the sidebar, breadcrumbs, global search, and quick-action bar work together to get you where you need to go.',
    content: `The CRM navigation is organized into a collapsible sidebar on the left side of the screen. Each top-level section—such as Leads, Accounts, Deals, and Reports—expands to reveal sub-pages. You can collapse the sidebar by clicking the hamburger icon at the top to reclaim screen real estate when working on data-heavy views like the Pipeline Board.

At the very top of every page sits the Global Search bar. Type any name, phone number, email, or policy ID and the CRM will instantly surface matching leads, contacts, accounts, and deals. Search results are grouped by record type so you can jump directly to the right context. For faster access, press Ctrl+K (or Cmd+K on macOS) to open the command palette, which combines search with quick actions like "Create Lead" or "Schedule Meeting."

Breadcrumbs appear just below the top bar whenever you navigate into a detail view. They let you retrace your path—click any segment to jump back to that list or parent record. For example, navigating into a contact's detail page from an account will show Home > Accounts > Acme Insurance > Jane Doe, so you can hop back to the account without losing your place.

Finally, the Quick-Action floating button in the bottom-right corner gives you one-click access to the actions you perform most: add a new lead, log a call, create a task, or send an email. This button is context-aware—on the Leads page it defaults to "New Lead," while on the Deals page it defaults to "New Deal." Mastering these navigation patterns will dramatically reduce the number of clicks in your daily workflow.`,
    tags: ['navigation', 'sidebar', 'search', 'breadcrumbs', 'command-palette', 'quick-action'],
    difficulty: 'beginner',
  },
  {
    id: 'gs-permissions',
    module: 'getting-started',
    title: 'Understanding Permissions',
    summary:
      'How roles, teams, and territory assignments control what you can see and edit inside the CRM.',
    content: `MPB CRM uses a role-based access control (RBAC) system to ensure every user sees exactly the data they need—and nothing more. Your administrator assigns you one of several built-in roles (Agent, Team Lead, Manager, or Admin), each with progressively broader permissions. Agents typically see only their own leads and deals, Team Leads can view and reassign records within their team, Managers see data across multiple teams, and Admins have full access to every record and configuration setting.

Beyond roles, the CRM supports territory-based access. Territories are geographic or product-based groupings (for example, "Southeast Medicare Advantage" or "National Under-65 Health") that determine which leads are routed to you. When a new lead comes in through a web form or a marketing campaign, the system checks the lead's state, zip code, and product interest against your territory rules and assigns it automatically.

If you ever encounter a "Permission Denied" message, it usually means the record belongs to another agent's territory or your role does not include the required action (such as deleting a deal or exporting a report). In these cases, reach out to your administrator or team lead, who can either reassign the record to you or temporarily elevate your permissions.

It is also worth noting that certain sensitive fields—like Social Security numbers and bank account details—are masked by default for roles below Manager. Even if you can view a contact record, these fields will show as "••••" unless your role explicitly grants access. This is critical for CMS compliance and HIPAA-adjacent best practices when handling Medicare beneficiary data.`,
    tags: ['permissions', 'RBAC', 'roles', 'territories', 'access-control', 'compliance', 'HIPAA'],
    difficulty: 'intermediate',
  },
  {
    id: 'gs-shortcuts',
    module: 'getting-started',
    title: 'Keyboard Shortcuts & Power Features',
    summary:
      'Speed up your workflow with keyboard shortcuts, bulk actions, saved filters, and inline editing.',
    content: `Power users can navigate the CRM almost entirely from the keyboard. Press Ctrl+K (Cmd+K on Mac) to open the command palette, then type a page name or action to jump there instantly. Common shortcuts include Ctrl+N to create a new record of the current type, Ctrl+Shift+F to open advanced search, and Escape to close any open modal or side panel.

Bulk actions let you operate on many records at once. On any list view—leads, contacts, deals—check the boxes next to the records you want, and an action bar appears at the top of the list. From there you can reassign, tag, change status, send a bulk email, or export the selected records to CSV. During AEP, this is invaluable for quickly reassigning hundreds of renewal leads to available agents.

Saved Filters (sometimes called "Smart Views") allow you to store complex search criteria and recall them with one click. For example, you might create a filter called "AEP Renewals – My Territory" that shows all leads with a renewal date within the next 60 days, assigned to you, in states you are licensed in. Saved Filters appear in the left sidebar of every list view and can be shared with your team.

Inline editing saves you from constantly opening and closing detail views. On most list views, double-click any editable cell—status, assigned agent, phone number—and modify it right in the table. Changes save automatically when you click away or press Enter. Combined with keyboard navigation (Tab to move between cells, Enter to confirm), inline editing turns the CRM into a spreadsheet-fast data entry tool during high-volume periods.`,
    tags: ['shortcuts', 'keyboard', 'bulk-actions', 'saved-filters', 'inline-editing', 'productivity'],
    difficulty: 'intermediate',
  },
  {
    id: 'gs-round5-rebrand',
    module: 'getting-started',
    title: "What's new — Section 9 navigation refresh",
    summary:
      'The recent IA cleanup renamed Contacts to Members, retired several legacy sections, and added a Recruiting workspace that mirrors Leads. Use this article to find where things moved.',
    content: `MPB CRM just shipped the Section 9 / Round 5 navigation refresh. Here is the cheat-sheet so you don't lose time hunting for things.

Renames you'll see immediately:
• "Contacts" is now "Members." Every record, button, and breadcrumb that used to say "Contact" or "New Contact" now says "Member" or "New Member." Old /contacts links automatically redirect to /members, and the previous Contacts page is preserved at /contacts/legacy for admin auditing only.
• The Sales Daily Logs view you already know gained an admin filter, manual entry, and corrections audit. The standalone "Sales Activity" tile is gone — its primary URL now redirects to /sales-daily-logs (legacy variant kept at /sales-activity/legacy for admins).

Sections that are now retired from the sidebar (legacy variants kept for admin audit only):
• Quick Rate Leads — primary URL goes to /leads. Legacy admin view at /leads/quick-rate-estimate/legacy.
• Quotes & Invoices — there is no longer a top-level entry. /quotes redirects to /today and /invoices redirects to /members. Legacy admin views remain at /quotes/legacy and /invoices/legacy. Print routes (/quotes/:id/print, /invoices/:id/print) are unchanged so existing PDFs still work.
• Social Media + Ad Campaigns — both consolidated under /campaigns. Legacy views at /social-media/legacy and /social-media/legacy/ads.
• Studio — folded into /settings. Legacy admin module at /studio/legacy. Existing custom modules still resolve at /custom/:moduleApiName.
• Reactivation, Community Events, End of Day, Meetings, and the old Dashboard are merged into Today, Calendar, or Sales Daily Logs depending on the record type. See the in-app banner on each old URL for the new home.

Brand-new section:
• Recruiting — a top-level workspace dedicated to health insurance agent and agency recruiting. It is a structural clone of Leads (subsection bar, profile layout, top-row Note/Call/Email/Text/Task buttons, Pin to Today, in-profile email composer, bulk-assign, and bulk mass-email). Recruiting data lives in its own pipeline and never commingles with consumer Members or Leads — the cadence builder under /cadences now exposes a Leads vs Recruiting filter so you can author messaging for each side without crosstalk.

If a deep link sends you to a legacy view, that's expected — the redirect rule kicks in for admins explicitly visiting the legacy path. For day-to-day work you should always use the new canonical URLs above. Anything you've bookmarked under the old URLs continues to work and forwards you to the new home automatically.`,
    tags: ['release-notes', 'navigation', 'members', 'recruiting', 'cadences', 'studio', 'quotes', 'invoices'],
    difficulty: 'beginner',
  },
];
