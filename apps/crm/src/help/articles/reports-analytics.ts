import type { PageHelp, HelpArticle } from '../types';

export const reportsPageHelp: PageHelp = {
  pageKey: 'reports',
  title: 'Reports & Analytics',
  description:
    'Analyze sales performance, pipeline health, revenue trends, and agent activity with built-in and custom reports.',
  quickTips: [
    {
      id: 'reports-tip-1',
      text: 'Pin your most-used reports to the Dashboard for instant access to key metrics each morning.',
    },
    {
      id: 'reports-tip-2',
      text: 'Use date range presets like "This AEP" or "Last OEP" to quickly compare enrollment period performance.',
    },
    {
      id: 'reports-tip-3',
      text: 'Schedule weekly report emails to your team so everyone stays aligned on goals without logging in.',
    },
    {
      id: 'reports-tip-4',
      text: 'Drill down into any chart by clicking a data point to see the underlying records.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'reportType',
      label: 'Report Type',
      hint: 'Choose from Performance, Revenue, Conversion, Activity, Pipeline, or Custom.',
    },
    {
      fieldKey: 'dateRange',
      label: 'Date Range',
      hint: 'The time period to analyze. Use custom ranges or presets like "This Month," "This Quarter," or "This AEP."',
    },
    {
      fieldKey: 'groupBy',
      label: 'Group By',
      hint: 'Break down data by agent, team, territory, carrier, product, or lead source.',
    },
    {
      fieldKey: 'filters',
      label: 'Filters',
      hint: 'Narrow results by specific criteria: agent, deal stage, product type, carrier, or territory.',
    },
    {
      fieldKey: 'visualization',
      label: 'Visualization',
      hint: 'Display as bar chart, line graph, pie chart, funnel, table, or KPI cards.',
    },
  ],
  faqs: [
    {
      question: 'Can I create custom reports?',
      answer:
        'Yes. Use the Report Builder to select your data source, choose fields, apply filters, and pick a visualization. Save custom reports and share them with your team.',
    },
    {
      question: 'How often is report data refreshed?',
      answer:
        'Reports pull live data each time they are opened. For scheduled email reports, data is captured at the scheduled send time.',
    },
    {
      question: 'Can I export reports?',
      answer:
        'Yes. Every report can be exported as CSV, Excel, or PDF. Use the Export button in the top-right corner of any report view.',
    },
    {
      question: 'Who can see reports?',
      answer:
        'Report visibility follows your role permissions. Agents see their own data, Team Leads see their team, and Managers/Admins see all data. Custom reports can be shared with specific users or teams.',
    },
  ],
  relatedArticles: [
    'ra-reports-overview',
    'ra-performance-reports',
    'ra-revenue-conversion',
    'ra-activity-targets',
  ],
};

export const reportsAnalyticsArticles: HelpArticle[] = [
  {
    id: 'ra-reports-overview',
    module: 'reports-analytics',
    title: 'Reports Overview',
    summary:
      'An introduction to the reporting system, available report types, and how to navigate the analytics dashboard.',
    content: `The Reports & Analytics module is your command center for understanding how your agency is performing. Whether you need a quick snapshot of this week's lead volume or a deep-dive into year-over-year revenue trends, the reporting system provides the data you need to make informed decisions and coach your team effectively.

The analytics dashboard is the landing page of the Reports section. It displays a configurable grid of KPI cards and charts that surface the metrics you care about most: new leads this period, deals in pipeline, closed-won revenue, average days to close, and agent activity scores. Each card is interactive—click on it to drill down into the full report behind the number. You can rearrange cards by dragging them, resize them to emphasize certain metrics, and add or remove cards to build a view that matches your role. Agents might focus on their personal metrics, while managers might display team-wide comparisons.

Below the dashboard, the report library organizes all available reports into categories: Performance, Revenue & Conversion, Pipeline, Activity, Lead Source, and Custom. Each built-in report is pre-configured with sensible defaults but can be customized with filters, date ranges, and groupings. For example, the "Performance Summary" report defaults to the current month grouped by agent, but you can switch it to the current quarter grouped by territory with two clicks.

The Report Builder lets you create entirely custom reports when the built-in options do not cover your needs. Select a data source (leads, deals, contacts, activities, invoices), choose the fields you want to display, apply filters, and select a visualization type. Save your report, and it appears in the Custom category of the report library. You can also schedule any report to be emailed as a PDF or CSV to yourself, your team, or external stakeholders on a daily, weekly, or monthly cadence.`,
    tags: [
      'reports',
      'analytics',
      'dashboard',
      'KPIs',
      'report-builder',
      'custom-reports',
      'overview',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'ra-performance-reports',
    module: 'reports-analytics',
    title: 'Performance Reports',
    summary:
      'Track agent and team performance with metrics like calls made, meetings held, deals closed, and enrollment rates.',
    content: `Performance reports give you visibility into how effectively you and your team are executing daily sales activities. These reports go beyond just revenue—they measure the behaviors and leading indicators that predict future success, such as call volume, meeting completion rate, quote-to-enrollment conversion, and average response time to new leads.

The Agent Performance report is the most commonly used view. It displays a scorecard for each agent with columns for calls logged, emails sent, meetings completed, quotes generated, deals created, and deals won—all within the selected date range. Sorting by any column lets you quickly identify top performers and agents who may need coaching. The sparkline trend next to each metric shows whether the agent is trending up or down compared to the prior period, providing context beyond a single snapshot.

The Team Comparison report aggregates individual metrics into team-level summaries. If your agency is organized into teams by territory or product line, this report reveals which teams are outperforming and which are falling behind. Use it during weekly team meetings to celebrate wins and address gaps. The drill-down capability lets you click into any team's number to see the individual agent breakdown, so you can trace a team-level issue to specific agents or accounts.

For time-based analysis, the Performance Trend report plots your chosen metrics over days, weeks, or months. This is especially powerful for comparing enrollment periods: overlay this AEP's performance against last year's to see whether your improvements are paying off. Look for patterns—many agencies see a spike in activity during the first two weeks of AEP followed by a mid-period lull, then a final rush in the last week. Understanding these patterns lets you adjust staffing, set interim goals, and keep momentum through the entire enrollment window.`,
    tags: [
      'performance',
      'agents',
      'teams',
      'scorecard',
      'metrics',
      'calls',
      'meetings',
      'conversion',
      'AEP',
    ],
    difficulty: 'intermediate',
  },
  {
    id: 'ra-revenue-conversion',
    module: 'reports-analytics',
    title: 'Revenue & Conversion Analytics',
    summary:
      'Analyze revenue streams, commission income, conversion funnels, and the financial health of your book of business.',
    content: `Revenue and conversion reports translate your sales activity into financial outcomes. They answer the questions that matter most to agency owners and managers: How much commission revenue did we earn this quarter? What is our lead-to-enrollment conversion rate? Which products and carriers are driving the most revenue? Where in the funnel are we losing the most prospects?

The Revenue Summary report displays total revenue—both closed-won deal value and commission income—broken down by the dimensions you choose: time period, agent, team, carrier, product type, or lead source. Toggle between gross premium value and net commission to see both perspectives. The trend line helps you spot seasonality: Medicare agencies typically see revenue peaks during AEP (October–December) and smaller bumps during OEP (January–March) and special enrollment periods throughout the year.

The Conversion Funnel report visualizes how leads flow through your pipeline stages from initial capture to enrollment. Each stage shows the number of records and the drop-off percentage from the prior stage. A healthy funnel narrows gradually; a steep drop at any single stage signals a problem worth investigating. For instance, if you see a 60% drop between "Quote Sent" and "Quote Accepted," your quotes may not be compelling enough, your follow-up timing may be off, or the products you are quoting may not match the prospect's needs.

The Carrier Revenue Breakdown report is unique to insurance CRMs and shows your commission income grouped by carrier. This is invaluable during carrier contract negotiations—walk into a meeting knowing exactly how much premium volume you are directing to each carrier and use that data to negotiate better commission rates or bonus tiers. The Product Mix report complements this by showing which plan types (Medicare Advantage, Medigap, PDP, ACA) generate the most revenue, helping you decide where to focus your marketing and training efforts.`,
    tags: [
      'revenue',
      'conversion',
      'funnel',
      'commissions',
      'carriers',
      'product-mix',
      'financial',
      'AEP',
    ],
    difficulty: 'intermediate',
  },
  {
    id: 'ra-activity-targets',
    module: 'reports-analytics',
    title: 'Activity Targets',
    summary:
      'Set measurable goals for sales activities and track progress in real time with the Activity Targets feature.',
    content: `Activity targets transform vague performance expectations into specific, measurable goals that agents can track in real time. Instead of telling your team to "make more calls," you set a target of 40 outbound calls per day and the CRM tracks progress automatically—displaying a progress bar on each agent's dashboard that fills as they log activities throughout the day.

To configure targets, navigate to Reports > Activity Targets and click "Set Targets." You can set targets at the individual agent level, the team level, or organization-wide. Common target metrics include daily outbound calls, weekly meetings scheduled, monthly quotes sent, quarterly deals closed, and annual revenue. For each target, define the metric, the target value, the time period, and optionally a stretch goal that represents exceptional performance. The system supports both activity-based targets (calls, emails, meetings) and outcome-based targets (deals won, revenue earned).

The real-time progress dashboard is where activity targets come alive. Each agent sees their personal targets on the Dashboard with a visual progress indicator—green when on pace, yellow when falling behind, and red when significantly under target. Managers see a team-wide view with every agent's progress side by side. During AEP, when daily activity volume is critical, this real-time visibility keeps everyone accountable and motivated. Some agencies display the team leaderboard on a shared screen in the office to foster healthy competition.

At the end of each period, the Target Achievement report summarizes who met, exceeded, or missed their targets. This report feeds directly into performance reviews, bonus calculations, and coaching conversations. Over time, the historical target data reveals trends: Is the team consistently hitting call targets but missing meeting targets? That might indicate a need for better call-to-meeting conversion training. Are certain agents always exceeding their targets? Consider raising their goals or having them mentor newer agents. Activity targets are most effective when they are ambitious but achievable, regularly reviewed, and tied to meaningful recognition or incentives.`,
    tags: [
      'targets',
      'goals',
      'activity',
      'KPIs',
      'leaderboard',
      'accountability',
      'coaching',
      'AEP',
    ],
    difficulty: 'intermediate',
  },
];
