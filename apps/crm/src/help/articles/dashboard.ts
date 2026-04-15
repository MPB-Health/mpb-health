import type { PageHelp, HelpArticle } from '../types';

export const dashboardPageHelp: PageHelp = {
  pageKey: 'dashboard',
  title: 'Dashboard & Today',
  description:
    'Your at-a-glance command center. The Dashboard surfaces real-time metrics, task reminders, pipeline snapshots, and enrollment-period countdowns so you can prioritize your day without digging through multiple pages.',
  quickTips: [
    {
      id: 'dash-tip-1',
      text: 'Click any metric card to drill down into the underlying records—for example, clicking "New Leads Today" opens a filtered Leads list.',
    },
    {
      id: 'dash-tip-2',
      text: 'Drag widgets to rearrange your dashboard layout. Your arrangement is saved per-user and persists across sessions.',
    },
    {
      id: 'dash-tip-3',
      text: `Use the date-range picker in the top-right corner to compare this week's numbers against last week or last month.`,
    },
    {
      id: 'dash-tip-4',
      text: 'Pin your most important Saved Filter to the dashboard as a "Smart Widget" for instant access to a curated record list.',
    },
    {
      id: 'dash-tip-5',
      text: 'Switch to the "Today" view for a focused daily agenda that combines your calendar events, overdue tasks, and follow-up reminders in one timeline.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'new_leads_count',
      label: 'New Leads',
      hint: 'Total leads created or received today. Includes web-form submissions, imported records, and manually added leads.',
    },
    {
      fieldKey: 'open_deals_value',
      label: 'Open Pipeline Value',
      hint: 'Sum of expected revenue for all deals currently in an open stage. Weighted by probability if "weighted pipeline" is enabled in Settings.',
    },
    {
      fieldKey: 'tasks_due_today',
      label: 'Tasks Due Today',
      hint: 'Number of tasks with a due date of today that are not yet marked complete. Overdue tasks from previous days are shown separately in red.',
    },
    {
      fieldKey: 'conversion_rate',
      label: 'Lead-to-Deal Conversion',
      hint: 'Percentage of leads that have been converted into at least one deal within the selected date range.',
    },
  ],
  faqs: [
    {
      question: 'Can I customize which widgets appear on my dashboard?',
      answer:
        'Yes. Click the "Customize" button in the top-right corner of the Dashboard to add, remove, or reorder widgets. Changes are saved per-user, so each team member can tailor their own view.',
    },
    {
      question: `Why do my numbers look different from my team lead's dashboard?`,
      answer:
        'Dashboard metrics respect your role and territory permissions. Agents see only their own data, while Team Leads and Managers see aggregated numbers for their teams. Ask your admin to adjust your role if you need broader visibility.',
    },
    {
      question: 'How often do dashboard metrics refresh?',
      answer:
        'Metrics refresh automatically every 60 seconds. You can also click the refresh icon next to the date-range picker to force an immediate update.',
    },
  ],
  relatedArticles: [
    'dash-understanding',
    'dash-widgets',
    'dash-today-view',
  ],
};

export const dashboardArticles: HelpArticle[] = [
  {
    id: 'dash-understanding',
    module: 'getting-started',
    title: 'Understanding Your Dashboard',
    summary:
      'A walkthrough of every default widget on the Dashboard and how to read the data it presents.',
    content: `The Dashboard is the first screen you see after logging in, and it is designed to answer one question immediately: "What should I focus on right now?" The top row displays high-level KPI cards—New Leads, Open Pipeline Value, Tasks Due Today, and Lead-to-Deal Conversion Rate. Each card is color-coded: green means the metric is trending up compared to the prior period, red means it is declining, and gray means there is not enough historical data to compare.

Below the KPI cards you will find the Pipeline Snapshot widget, which renders a horizontal bar chart of your active deals grouped by stage. This gives you a visual sense of where your deals are clustering—if the "Proposal Sent" stage is overloaded while "Negotiation" is empty, it may be time to follow up on outstanding proposals. Hovering over any bar shows the deal count and total value for that stage.

The Activity Feed widget on the right side streams recent actions across your assigned records: new lead assignments, emails sent, calls logged, and deal-stage changes. Think of it as a living audit trail. You can filter the feed by activity type or by record to zero in on a specific client's history.

At the bottom of the default layout is the Upcoming Renewals widget, which is particularly important during AEP and OEP. It lists policies expiring within the next 30, 60, or 90 days (configurable) so you can proactively reach out to beneficiaries before their current coverage lapses. Clicking any renewal row opens the associated contact or account record with the policy details pre-loaded.`,
    tags: ['dashboard', 'KPI', 'widgets', 'pipeline-snapshot', 'activity-feed', 'renewals'],
    difficulty: 'beginner',
  },
  {
    id: 'dash-widgets',
    module: 'getting-started',
    title: 'Customizing Dashboard Widgets',
    summary:
      'Add, remove, resize, and configure widgets so your dashboard shows exactly the data you care about.',
    content: `Every user's workflow is different, so MPB CRM lets you fully customize your Dashboard layout. Click the "Customize" button in the top-right corner to enter edit mode. In edit mode, each widget displays grab handles, a resize grip, and a gear icon for configuration. Drag a widget by its handle to reposition it; drag the resize grip to make it wider or taller.

To add a new widget, click the "+ Add Widget" button that appears in edit mode. The widget gallery offers categories like Metrics, Charts, Lists, and Integrations. For Medicare-focused teams, the "Enrollment Countdown" widget is especially popular—it displays a live countdown to the next AEP or OEP start date along with a summary of how many renewals and new applications are in progress.

Each widget has its own settings panel (accessible via the gear icon). For chart widgets, you can choose the data source (leads, deals, tasks), the metric (count, value, conversion rate), and the grouping (by stage, by source, by agent). For list widgets, you can choose a Saved Filter to control which records appear. This means you can create a widget that shows "Leads from Facebook Ads – Last 7 Days" right on your dashboard.

When you are satisfied with the layout, click "Save Layout." Your arrangement is stored on the server, so it follows you across devices. If you ever want to start fresh, click "Reset to Default" to restore the out-of-the-box layout. Team Leads and Managers can also create a "Team Dashboard" that all members of their team see as a secondary tab, perfect for shared KPIs during enrollment season.`,
    tags: ['dashboard', 'widgets', 'customization', 'layout', 'enrollment-countdown'],
    difficulty: 'intermediate',
  },
  {
    id: 'dash-today-view',
    module: 'getting-started',
    title: 'Using the Today View',
    summary:
      'The Today view condenses your calendar, tasks, and follow-ups into a single prioritized timeline for the day.',
    content: `The Today view is a companion to the Dashboard that takes a time-centric approach. Instead of showing aggregate metrics, it lays out your day as a vertical timeline—starting with the first scheduled event in the morning and ending with your last task or meeting. To switch to the Today view, click the "Today" tab at the top of the Dashboard or navigate directly to /today.

Each item on the timeline is tagged with its type: calendar events appear with a blue clock icon, tasks with a green checkbox, follow-up reminders with an orange bell, and overdue items with a red warning badge. You can complete a task directly from the timeline by clicking the checkbox—no need to navigate to the Tasks page. Similarly, you can log a call or send a quick email from the follow-up reminder by expanding the action menu.

The Today view also incorporates smart suggestions powered by your lead and deal data. For example, if a lead has not been contacted in five business days, the system will insert a "Suggested Follow-up" block into your timeline with a recommended action (call or email) and a one-click button to execute it. During high-volume periods like AEP, these suggestions help ensure no lead falls through the cracks.

At the end of the day, the "End of Day Summary" section appears at the bottom of the Today view. It recaps what you accomplished—calls made, emails sent, tasks completed, deals moved—and highlights anything that rolled over to tomorrow. This summary can also be emailed to you or your team lead automatically if the feature is enabled in Settings > Notifications.`,
    tags: ['today', 'timeline', 'tasks', 'follow-up', 'daily-agenda', 'end-of-day'],
    difficulty: 'beginner',
  },
];
