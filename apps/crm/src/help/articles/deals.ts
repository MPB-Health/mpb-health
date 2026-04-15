import type { PageHelp, HelpArticle } from '../types';

export const dealsPageHelp: PageHelp = {
  pageKey: 'deals',
  title: 'Deals',
  description:
    'Track every insurance opportunity from initial proposal through enrollment and commission payment. Deals connect leads, contacts, accounts, and products into a single revenue-focused record.',
  quickTips: [
    {
      id: 'deal-tip-1',
      text: 'Create a deal directly from a lead or contact record by clicking "Convert to Deal" or "+ New Deal" to link it automatically.',
    },
    {
      id: 'deal-tip-2',
      text: 'Set the expected close date and deal value to feed accurate numbers into your forecasting reports.',
    },
    {
      id: 'deal-tip-3',
      text: 'Attach the relevant product (e.g., a specific Medicare Advantage plan) to the deal so commission calculations are accurate.',
    },
    {
      id: 'deal-tip-4',
      text: 'Use the "Stalled Deals" Saved Filter to quickly find deals that have not moved stages in the last 14 days.',
    },
    {
      id: 'deal-tip-5',
      text: `Log every interaction on the deal's activity timeline—carriers and compliance auditors may request proof of agent activity.`,
    },
  ],
  fieldHints: [
    {
      fieldKey: 'deal_name',
      label: 'Deal Name',
      hint: 'A descriptive name, typically combining the contact name and product (e.g., "John Smith – AETNA MA HMO 2026").',
    },
    {
      fieldKey: 'deal_value',
      label: 'Deal Value',
      hint: 'The estimated annual premium or commission revenue for this deal. Used in pipeline reports and forecasting.',
    },
    {
      fieldKey: 'deal_stage',
      label: 'Stage',
      hint: 'Current position in the deal pipeline: Qualification → Needs Analysis → Proposal → Enrollment → Closed Won / Closed Lost.',
    },
    {
      fieldKey: 'expected_close_date',
      label: 'Expected Close Date',
      hint: 'When you anticipate the deal will close. Drives the forecasting timeline and overdue-deal alerts.',
    },
    {
      fieldKey: 'probability',
      label: 'Probability (%)',
      hint: 'Likelihood of winning this deal (0–100). Auto-set by stage defaults but can be overridden manually.',
    },
    {
      fieldKey: 'carrier',
      label: 'Carrier',
      hint: 'The insurance carrier for this deal (e.g., UnitedHealthcare, Humana, Aetna). Links to your product catalog.',
    },
  ],
  faqs: [
    {
      question: 'When should I create a deal vs. keep working the lead?',
      answer:
        'Create a deal once a lead has expressed clear intent to explore a specific plan or product. In Medicare terms, this is typically when you have a signed Scope of Appointment and are beginning a needs analysis. Until then, keep working the prospect as a lead.',
    },
    {
      question: 'Can I track multiple deals for one contact?',
      answer:
        'Yes. A contact can have multiple deals—for example, one deal for Medicare Advantage and another for a standalone Prescription Drug Plan. Each deal tracks its own stage, value, and timeline independently.',
    },
    {
      question: 'What happens to a deal when I mark it "Closed Lost"?',
      answer:
        `The deal moves out of the active pipeline and into the Closed Lost archive. You will be prompted to enter a loss reason. The deal's data is preserved for reporting and can be reopened later if circumstances change.`,
    },
  ],
  relatedArticles: [
    'deals-creating',
    'deals-pipeline',
    'deals-stages',
  ],
};

export const dealPipelinePageHelp: PageHelp = {
  pageKey: 'deal-pipeline',
  title: 'Deal Pipeline',
  description:
    'A visual Kanban board for your deals. Drag cards between stage columns to progress opportunities toward enrollment and commission.',
  quickTips: [
    {
      id: 'dp-tip-1',
      text: 'Drag a deal card between columns to update its stage. The move is logged, and any stage-triggered automations fire immediately.',
    },
    {
      id: 'dp-tip-2',
      text: 'Column headers show the total count and weighted value of deals in each stage—use this for quick revenue estimates.',
    },
    {
      id: 'dp-tip-3',
      text: 'Filter the board by carrier, product type, or date range to focus on a specific segment of your business.',
    },
    {
      id: 'dp-tip-4',
      text: 'Cards turn amber when a deal has been in the same stage beyond the average cycle time, signaling it may need attention.',
    },
  ],
  fieldHints: [],
  faqs: [
    {
      question: 'Can I have separate deal pipelines for different lines of business?',
      answer:
        'Yes. Go to Settings > Deal Pipelines and create as many pipelines as you need—one for Medicare, one for Under-65, one for Group Benefits, etc. Each has its own stages and automation rules.',
    },
    {
      question: 'How does the weighted pipeline value work?',
      answer:
        `Each deal's value is multiplied by its stage probability. A $10,000 deal at the "Proposal" stage (60% probability) contributes $6,000 to the weighted total. This gives you a more realistic revenue forecast than the raw sum.`,
    },
    {
      question: 'What do the card colors mean?',
      answer:
        'Green cards are on track (activity within the last 7 days), amber cards are at risk (no activity for 7–14 days), and red cards are stalled (no activity for 14+ days). These thresholds are configurable under Settings > Deal Pipelines.',
    },
  ],
  relatedArticles: [
    'deals-pipeline',
    'deals-creating',
    'deals-stages',
  ],
};

export const dealsArticles: HelpArticle[] = [
  {
    id: 'deals-creating',
    module: 'deals',
    title: 'Creating and Managing Deals',
    summary:
      'Step-by-step guide to creating deals, linking them to contacts and products, and managing them through to close.',
    content: `A deal in MPB CRM represents a specific revenue opportunity—one person considering one insurance product. Creating a deal is the moment a lead transitions from "interested" to "actively evaluating options." The fastest way to create a deal is from a lead or contact record: click "Convert to Deal" and the CRM pre-fills the contact information, links the deal to the relevant account, and sets the stage to "Qualification."

When filling out the deal form, pay special attention to a few key fields. The Deal Name should be descriptive enough to identify at a glance—a good convention is "Contact Name – Carrier Plan Year" (e.g., "Mary Jones – Humana Gold Plus 2026"). The Deal Value should reflect the estimated annual premium or, if your agency tracks commissions, the expected first-year commission. Set the Expected Close Date to when you realistically believe enrollment will happen—during AEP this is often the date you plan to submit the application.

Once created, manage the deal by keeping its activity timeline up to date. Log every call, email, and meeting. Attach documents like plan comparison spreadsheets, signed Scope of Appointment forms, and carrier-specific applications. As you progress through conversations, move the deal to the appropriate stage: Needs Analysis once you have completed the fact finder, Proposal once you have presented plan options, and Enrollment once the application is submitted. The CRM can be configured to require certain actions before a stage change—for example, ensuring a Scope of Appointment document is attached before moving past Qualification.

When a deal reaches its conclusion, mark it as "Closed Won" (enrolled) or "Closed Lost" (chose another carrier, not eligible, etc.). For Closed Won deals, the CRM updates the contact's policy history, triggers any post-enrollment automations (like a welcome email sequence), and records the revenue for commission tracking. For Closed Lost deals, always enter a loss reason—this data is gold for improving your sales process and understanding competitive dynamics in your market.`,
    tags: ['deals', 'create', 'manage', 'enrollment', 'close', 'commission'],
    difficulty: 'beginner',
  },
  {
    id: 'deals-pipeline',
    module: 'deals',
    title: 'Using the Deal Pipeline',
    summary:
      'Visualize and manage your deals on the Kanban-style deal pipeline board.',
    content: `The Deal Pipeline is a visual board that organizes your active deals into stage-based columns, much like the lead Pipeline Board but focused on revenue opportunities. Each card represents a deal and displays the contact name, deal value, expected close date, and carrier. This at-a-glance format makes it easy to see how much revenue is in each stage and where deals might be getting stuck.

Drag-and-drop is the primary interaction model. Grab a deal card and move it to the next column when you complete the activities associated with the current stage. The system records the stage change with a timestamp, calculates how long the deal spent in the previous stage (known as "stage duration"), and updates the weighted pipeline value in the column header. Stage duration data feeds into your Deal Velocity metrics, which show how quickly deals flow through your pipeline on average.

The board supports multiple filter dimensions. Use the top bar to filter by carrier, product line, assigned agent, expected close date range, or deal value range. You can also toggle between "My Deals" and "Team Deals" to see your personal pipeline or your entire team's. For managers, the "Team Deals" view is particularly useful during weekly pipeline reviews—sort by expected close date to focus on deals that should close this week and identify any that need escalation.

Automation rules can be attached to stage transitions. For example, moving a deal into "Enrollment" can automatically create a task to upload the application to the carrier portal, send a confirmation email to the client, and notify the back-office team to begin commission tracking. These automations reduce manual follow-up and ensure consistent processes across your team—especially important during the high-volume AEP and OEP windows when agents are juggling dozens of concurrent enrollments.`,
    tags: ['deal-pipeline', 'kanban', 'stages', 'drag-drop', 'velocity', 'automation'],
    difficulty: 'beginner',
  },
  {
    id: 'deals-stages',
    module: 'deals',
    title: 'Deal Stages Explained',
    summary:
      `Understand each default deal stage, its purpose, and how to customize stages for your agency's workflow.`,
    content: `MPB CRM ships with five default deal stages, each designed to mirror the typical Medicare or health insurance sales cycle: Qualification, Needs Analysis, Proposal, Enrollment, and Closed (Won or Lost). Understanding what each stage represents—and when to move a deal forward—is key to maintaining accurate pipeline data and reliable forecasting.

"Qualification" is the entry point. A deal lands here when a lead has expressed clear interest in a specific product and you have confirmed basic eligibility (age, state, current coverage status). At this stage you should have a signed Scope of Appointment if the prospect is a Medicare beneficiary. The default probability for Qualification is 20%, reflecting the early-stage uncertainty. Move the deal to "Needs Analysis" once you have scheduled or completed a fact-finding session to understand the client's health needs, prescription medications, preferred doctors, and budget.

"Needs Analysis" (40% probability) is where you do the heavy lifting: running plan comparisons, checking provider networks, and estimating out-of-pocket costs. Once you have a recommendation ready, advance the deal to "Proposal" (60% probability) and present your plan options to the client. The CRM can generate a side-by-side comparison PDF from the deal's attached products, which you can email or review in a meeting. After the client selects a plan and you submit the enrollment application, move the deal to "Enrollment" (80% probability).

"Enrollment" remains the active stage until the carrier confirms the application has been processed. Once confirmed, mark the deal as "Closed Won" (100%)—this updates the contact's policy record, records revenue, and triggers any post-enrollment workflows. If the deal falls through at any stage, mark it "Closed Lost" and log the reason. Administrators can customize stage names, probabilities, required fields, and automation triggers under Settings > Deal Pipelines > Stages, allowing you to tailor the process to your agency's unique workflow.`,
    tags: ['stages', 'qualification', 'needs-analysis', 'proposal', 'enrollment', 'closed'],
    difficulty: 'intermediate',
  },
];
