import type { PageHelp, HelpArticle } from '../types';

export const forecastingPageHelp: PageHelp = {
  pageKey: 'forecasting',
  title: 'Forecasting',
  description:
    'Project future revenue based on your active pipeline, historical close rates, and deal velocity. Forecasting helps you set realistic targets and identify gaps before they become problems.',
  quickTips: [
    {
      id: 'fc-tip-1',
      text: 'Switch between "Best Case," "Commit," and "Weighted" forecast views to see optimistic, conservative, and probability-adjusted projections side by side.',
    },
    {
      id: 'fc-tip-2',
      text: 'Click any forecast row to drill down into the underlying deals that make up the projection for that period.',
    },
    {
      id: 'fc-tip-3',
      text: 'Set quarterly or monthly targets under Settings > Forecasting to see how your pipeline stacks up against your goals.',
    },
    {
      id: 'fc-tip-4',
      text: 'Use the "Gap Analysis" widget to see how much additional pipeline you need to generate to hit your target, based on your historical conversion rate.',
    },
    {
      id: 'fc-tip-5',
      text: 'Export your forecast to CSV or PDF for use in team meetings, carrier reviews, or agency planning sessions.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'forecast_period',
      label: 'Forecast Period',
      hint: 'The time window for the projection—typically the current month, quarter, or year. Change this to compare different horizons.',
    },
    {
      fieldKey: 'weighted_value',
      label: 'Weighted Pipeline',
      hint: 'Each deal's value multiplied by its stage probability, summed across all open deals in the selected period.',
    },
    {
      fieldKey: 'best_case',
      label: 'Best Case',
      hint: 'Sum of all open deal values regardless of stage probability—the maximum possible revenue if every deal closes.',
    },
    {
      fieldKey: 'commit',
      label: 'Commit',
      hint: 'Total value of deals you have manually flagged as "Commit" because you have high confidence they will close.',
    },
    {
      fieldKey: 'gap_to_target',
      label: 'Gap to Target',
      hint: 'The difference between your target and your current commit or weighted forecast. A positive gap means you need more pipeline.',
    },
  ],
  faqs: [
    {
      question: 'How is the weighted forecast calculated?',
      answer:
        'Each open deal's value is multiplied by its stage probability (e.g., a $5,000 deal at the Proposal stage with 60% probability contributes $3,000). These weighted values are summed for all deals with an expected close date within the selected period.',
    },
    {
      question: 'What does "Commit" mean in forecasting?',
      answer:
        'A "Commit" deal is one you are confident will close. You manually flag deals as Commit from the deal record. The Commit forecast is the sum of these flagged deals and represents your most conservative projection.',
    },
    {
      question: 'Can I forecast by product line or carrier?',
      answer:
        'Yes. Use the filters at the top of the Forecasting page to slice the data by carrier, product type, agent, or territory. This is useful for agencies that need separate projections for Medicare Advantage, Medigap, and Under-65 lines of business.',
    },
  ],
  relatedArticles: [
    'fc-revenue',
    'fc-velocity',
  ],
};

export const forecastingArticles: HelpArticle[] = [
  {
    id: 'fc-revenue',
    module: 'forecasting',
    title: 'Revenue Forecasting',
    summary:
      'How to use the forecasting module to project future revenue, set targets, and identify pipeline gaps.',
    content: `Revenue forecasting in MPB CRM transforms your pipeline data into actionable projections. Rather than guessing how much revenue will close this month or quarter, the forecasting module applies historical conversion rates and deal probabilities to your active pipeline and generates three views: Best Case (everything closes), Weighted (probability-adjusted), and Commit (deals you have manually flagged as confident wins).

To get started, navigate to the Forecasting page. The default view shows the current quarter broken into monthly buckets. Each bucket displays the three forecast views plus your target (if set). The bar chart at the top visualizes the gap between your Commit forecast and your target, making it immediately obvious whether you are on track. If the gap is large, the system calculates how many additional deals—at your average deal size and conversion rate—you need to generate to close the gap.

Accuracy improves when you keep your pipeline clean. Review your open deals weekly and update expected close dates, values, and probabilities. Move stalled deals to Closed Lost rather than letting them linger at inflated probabilities. The CRM tracks your "Forecast Accuracy" over time—comparing what you projected at the start of each period against what actually closed—so you can calibrate your estimates and build credibility with agency leadership.

For agencies with multiple lines of business, use the carrier and product-line filters to create segment-specific forecasts. During AEP, for instance, you might want a separate Medicare Advantage forecast versus your year-round Under-65 ACA forecast. Export any view to PDF or CSV for use in team meetings, carrier production reports, or agency planning sessions. Over time, the historical data the CRM accumulates becomes a powerful tool for setting realistic annual targets and staffing appropriately for enrollment seasons.`,
    tags: ['forecasting', 'revenue', 'projections', 'targets', 'gap-analysis', 'AEP'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-velocity',
    module: 'forecasting',
    title: 'Deal Velocity Metrics',
    summary:
      'Understand how fast deals move through your pipeline and use velocity data to improve your sales process.',
    content: `Deal velocity measures how quickly opportunities progress from creation to close. It is calculated as: Velocity = (Number of Deals × Average Deal Value × Win Rate) ÷ Average Sales Cycle Length. A higher velocity means you are generating more revenue per unit of time—the ultimate efficiency metric for a health insurance sales team.

The Velocity dashboard, accessible from Forecasting > Velocity, breaks this formula into its four components and displays each as a trend line over time. You can immediately see whether improvements in one area (e.g., higher win rate) are being offset by declines in another (e.g., longer sales cycles). For Medicare agencies, velocity naturally fluctuates with enrollment periods—AEP typically shows the highest velocity due to shorter decision cycles, while off-season may see longer sales cycles as consumers are less motivated to switch plans.

Drill into any component for deeper insights. Clicking "Average Sales Cycle" reveals a stage-by-stage breakdown showing how long deals spend in Qualification, Needs Analysis, Proposal, and Enrollment. If deals are piling up in "Needs Analysis" for two weeks but flying through "Proposal" in two days, you know where to focus process improvements—perhaps agents need better tools for running plan comparisons, or the fact-finder form is too complex.

Use velocity data to set realistic expectations for new agents. If your team's average sales cycle is 21 days and a new agent is taking 35 days, that is a coaching opportunity. Conversely, if a top performer has a 14-day cycle, study their approach and share best practices. The Velocity dashboard also supports filtering by agent, territory, product line, and carrier, so you can compare velocity across different segments of your business and identify which areas are performing best.`,
    tags: ['velocity', 'sales-cycle', 'win-rate', 'deal-size', 'performance', 'metrics'],
    difficulty: 'advanced',
  },
];
