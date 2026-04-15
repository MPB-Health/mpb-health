import type { PageHelp, HelpArticle } from '../types';

/* ------------------------------------------------------------------ */
/*  Leads                                                              */
/* ------------------------------------------------------------------ */

export const leadsPageHelp: PageHelp = {
  pageKey: 'leads',
  title: 'Lead Management',
  description:
    'Capture, qualify, and nurture every prospect from first touch to conversion. The Leads module is the starting point for your Medicare and health insurance sales funnel.',
  quickTips: [
    {
      id: 'leads-tip-1',
      text: 'Use the filter bar at the top to narrow leads by status, source, state, or assigned agent. Combine filters for precise segmentation.',
    },
    {
      id: 'leads-tip-2',
      text: 'Click the magnifying glass icon or press Ctrl+Shift+F to open advanced search with full-text matching across notes and activity history.',
    },
    {
      id: 'leads-tip-3',
      text: 'Add a new lead manually by clicking "+ New Lead" or press Ctrl+N from the Leads list. The quick-add form requires only a name and one contact method.',
    },
    {
      id: 'leads-tip-4',
      text: 'Color-coded status badges (New, Contacted, Qualified, Converted, Lost) let you scan the list at a glance to see where each lead stands.',
    },
    {
      id: 'leads-tip-5',
      text: 'Open the Lead Workspace for a 360° view: contact details, activity timeline, attached documents, related deals, and inline email/call actions in one split-screen layout.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'first_name',
      label: 'First Name',
      hint: 'The lead's legal first name. Used in personalized email templates and mail-merge fields.',
    },
    {
      fieldKey: 'last_name',
      label: 'Last Name',
      hint: 'The lead's legal last name. Combined with First Name for display throughout the CRM.',
    },
    {
      fieldKey: 'email',
      label: 'Email',
      hint: 'Primary email address. Must be unique across leads. Used for email sequences and marketing campaigns.',
    },
    {
      fieldKey: 'phone',
      label: 'Phone',
      hint: 'Primary phone number in E.164 format. Click-to-call and SMS features use this field.',
    },
    {
      fieldKey: 'status',
      label: 'Status',
      hint: 'Current lifecycle stage: New → Contacted → Qualified → Converted or Lost. Changing status triggers any configured automation rules.',
    },
    {
      fieldKey: 'source',
      label: 'Source',
      hint: 'How the lead was acquired (e.g., Web Form, Referral, Medicare.gov, Community Event). Critical for ROI analysis on marketing spend.',
    },
    {
      fieldKey: 'interest',
      label: 'Product Interest',
      hint: 'The insurance product the lead expressed interest in: Medicare Advantage, Medigap, PDP, Under-65 ACA, Dental/Vision, etc.',
    },
    {
      fieldKey: 'assigned_to',
      label: 'Assigned To',
      hint: 'The agent or team responsible for this lead. Auto-assigned by territory rules or manually set by a Team Lead.',
    },
  ],
  faqs: [
    {
      question: 'How do I import leads from a spreadsheet?',
      answer:
        'Go to Leads > Import (or click the upload icon). Download the CSV template, fill in your data, then upload. The mapper screen lets you match spreadsheet columns to CRM fields. Duplicates are detected by email and phone during import.',
    },
    {
      question: 'What is lead scoring and how does it work?',
      answer:
        'Lead scoring assigns a numeric value to each lead based on engagement signals (email opens, website visits, form submissions) and demographic fit (state, age, product interest). Higher scores indicate warmer leads. Configure scoring rules under Settings > Lead Scoring.',
    },
    {
      question: 'Can I merge duplicate leads?',
      answer:
        'Yes. Select two or more leads from the list, then click "Merge" in the bulk-action bar. The CRM shows a side-by-side comparison so you can choose the master record and which field values to keep.',
    },
  ],
  relatedArticles: [
    'lp-adding-leads',
    'lp-workspace',
    'lp-statuses',
    'lp-reactivation',
  ],
};

/* ------------------------------------------------------------------ */
/*  Pipeline Board                                                     */
/* ------------------------------------------------------------------ */

export const pipelinePageHelp: PageHelp = {
  pageKey: 'pipeline',
  title: 'Pipeline Board',
  description:
    'A Kanban-style board that visualizes your leads across customizable stages. Drag cards between columns to advance prospects through your sales process.',
  quickTips: [
    {
      id: 'pipe-tip-1',
      text: 'Drag and drop a lead card from one column to the next to change its pipeline stage. The stage change is saved instantly and logged in the activity history.',
    },
    {
      id: 'pipe-tip-2',
      text: 'Click the column header to rename a stage or adjust its sort order. Changes apply to all users who share the same pipeline view.',
    },
    {
      id: 'pipe-tip-3',
      text: 'Toggle between "My Pipeline" and "Team Pipeline" using the dropdown at the top to see either your personal leads or your entire team's board.',
    },
    {
      id: 'pipe-tip-4',
      text: 'Hover over a card to see a quick-peek summary with the lead's last activity, next task, and contact info—no click required.',
    },
    {
      id: 'pipe-tip-5',
      text: 'Right-click any card to access quick actions: reassign, schedule a call, create a task, or convert to a deal.',
    },
  ],
  fieldHints: [],
  faqs: [
    {
      question: 'Can I create multiple pipelines for different products?',
      answer:
        'Yes. Go to Settings > Pipelines and click "+ New Pipeline." Each pipeline has its own set of stages. For example, you might have a "Medicare Advantage" pipeline and a separate "Under-65 ACA" pipeline with different qualification steps.',
    },
    {
      question: 'What happens when I drag a lead to the "Converted" column?',
      answer:
        'The lead's status changes to Converted and the CRM prompts you to create a Deal (if one doesn't already exist). Any automation rules tied to the Converted stage—such as a welcome email sequence—will also trigger.',
    },
    {
      question: 'How do I archive or hide stages I no longer use?',
      answer:
        'In Settings > Pipelines, click the three-dot menu next to the stage and select "Archive." Archived stages are hidden from the board but their historical data is preserved for reporting.',
    },
  ],
  relatedArticles: [
    'lp-pipeline-board',
    'lp-adding-leads',
    'lp-statuses',
  ],
};

/* ------------------------------------------------------------------ */
/*  Reactivation                                                       */
/* ------------------------------------------------------------------ */

export const reactivationPageHelp: PageHelp = {
  pageKey: 'reactivation',
  title: 'Lead Reactivation',
  description:
    'Surface and re-engage leads that went cold. The Reactivation module identifies dormant leads with renewal potential and helps you bring them back into the active pipeline.',
  quickTips: [
    {
      id: 'react-tip-1',
      text: 'Leads appear here automatically when they have had no activity for a configurable number of days (default: 30). Adjust the threshold in Settings > Reactivation.',
    },
    {
      id: 'react-tip-2',
      text: 'Use the "Reactivate" button on a lead card to move it back into your active pipeline with a fresh status of "Contacted." A reactivation note is logged automatically.',
    },
    {
      id: 'react-tip-3',
      text: 'The "Renewal Opportunity" badge highlights leads whose policies expire within 90 days—these are your highest-priority reactivation targets.',
    },
    {
      id: 'react-tip-4',
      text: 'Schedule a bulk reactivation email campaign by selecting multiple leads and clicking "Send Reactivation Sequence." Pre-built templates are available for AEP and OEP outreach.',
    },
  ],
  fieldHints: [],
  faqs: [
    {
      question: 'What qualifies a lead as "cold"?',
      answer:
        'A lead is considered cold when there has been no two-way interaction (call, email reply, meeting) for the number of days defined in your reactivation threshold. Outbound-only touches like unanswered calls do not reset the clock.',
    },
    {
      question: 'Can I exclude certain leads from the reactivation list?',
      answer:
        'Yes. Mark a lead as "Do Not Reactivate" from its detail page or via the bulk-action bar. These leads will be excluded until you manually remove the flag.',
    },
    {
      question: 'Does reactivating a lead affect my conversion metrics?',
      answer:
        'Reactivated leads are tracked separately in reports. The "Reactivation Conversion Rate" metric shows how many reactivated leads eventually convert to deals, so your primary conversion funnel remains clean.',
    },
  ],
  relatedArticles: [
    'lp-reactivation',
    'lp-statuses',
    'lp-adding-leads',
  ],
};

/* ------------------------------------------------------------------ */
/*  Articles                                                           */
/* ------------------------------------------------------------------ */

export const leadsPipelineArticles: HelpArticle[] = [
  {
    id: 'lp-adding-leads',
    module: 'leads-pipeline',
    title: 'Adding and Managing Leads',
    summary:
      'Everything you need to know about creating, importing, and organizing leads in the CRM.',
    content: `Leads are the lifeblood of your Medicare and health insurance practice, and MPB CRM gives you several ways to add them. The quickest method is the "+ New Lead" button (or Ctrl+N) on the Leads page. The minimal quick-add form asks only for a name and at least one contact method—phone or email—so you can capture a prospect mid-call without slowing down. All other fields can be filled in later.

For bulk entry, the Import tool accepts CSV and Excel files. Download the provided template to ensure your columns map correctly, then upload your file. The import wizard walks you through column mapping, lets you set default values for missing fields (e.g., source = "Purchased List"), and runs duplicate detection against existing records. Duplicates can be skipped, merged, or flagged for manual review.

Once leads are in the system, keep them organized by updating statuses promptly. A lead's status drives pipeline position, automation triggers, and reporting accuracy. Use inline editing on the list view to rapidly triage new leads: set the status, assign an agent, and tag the product interest without opening each record individually.

Leads that come in through web forms, landing pages, or marketing integrations are created automatically with the source and campaign pre-filled. Make sure your web-form field mappings are configured under Settings > Web Forms so that data flows cleanly into the right CRM fields. When a lead is ready to move forward, convert it into a Deal directly from the lead record or from the Pipeline Board.`,
    tags: ['leads', 'add-lead', 'import', 'CSV', 'quick-add', 'manage'],
    difficulty: 'beginner',
  },
  {
    id: 'lp-pipeline-board',
    module: 'leads-pipeline',
    title: 'Using the Pipeline Board',
    summary:
      'Master the Kanban-style pipeline board to visualize and advance leads through your sales stages.',
    content: `The Pipeline Board presents your leads as cards arranged in columns, where each column represents a stage in your sales process (e.g., New → Contacted → Needs Analysis → Proposal Sent → Converted). This visual layout makes it easy to see at a glance where each prospect stands and where bottlenecks are forming.

To move a lead forward, simply drag its card from one column to the next. The CRM updates the lead's status and pipeline stage in real time, logs the change in the activity timeline, and fires any automation rules tied to the new stage—such as sending a follow-up email or creating a task for the assigned agent. If a stage requires specific information (for example, "Needs Analysis" might require a completed fact-finder form), the CRM can be configured to prompt the agent before allowing the move.

Filtering the board is just as flexible as filtering the list view. Use the top-bar filters to narrow by assigned agent, product interest, lead source, or date range. You can also search for a specific lead by name, and the matching card will be highlighted on the board. For teams managing multiple product lines, switch between pipelines using the pipeline dropdown—each pipeline has its own set of stages tailored to that product's sales cycle.

At the bottom of each column, a summary bar shows the count and total weighted value of leads in that stage. This is particularly useful for forecasting: if you know your historical close rate from "Proposal Sent" is 40%, you can quickly estimate how much revenue is likely to close this month. Customize column colors in Settings > Pipelines to create a visual coding system that matches your team's workflow.`,
    tags: ['pipeline', 'kanban', 'drag-drop', 'stages', 'board', 'visualization'],
    difficulty: 'beginner',
  },
  {
    id: 'lp-workspace',
    module: 'leads-pipeline',
    title: 'Lead Workspace Deep Dive',
    summary:
      'Explore the all-in-one Lead Workspace where you manage contacts, activities, documents, and deal creation from a single screen.',
    content: `The Lead Workspace is a split-screen power view designed for agents who want to manage every aspect of a lead without navigating away. Open it by clicking the "Workspace" icon on any lead row, or navigate to Leads > [Lead Name] > Workspace. The left panel shows the lead's full profile—contact details, custom fields, tags, and score—while the right panel is a tabbed area for Activity, Emails, Calls, Tasks, Documents, and Deals.

In the Activity tab you will see a chronological feed of every interaction: emails sent and received, calls logged with recordings and transcripts, tasks created and completed, notes added by any team member, and automated actions triggered by workflows. Each entry is timestamped and attributed to the user who performed it, creating a complete audit trail that is invaluable for compliance and team handoffs.

The Emails tab lets you compose and send messages directly from the workspace using your connected email account. Templates are accessible from the compose window—select a pre-built AEP outreach template, and the CRM will auto-fill merge fields like the lead's first name, current plan, and renewal date. Sent emails are tracked for opens and clicks, and this engagement data feeds back into the lead's score.

The Documents tab is where you attach and manage files related to the lead: scanned applications, Scope of Appointment forms, plan comparison PDFs, and ID copies. Documents can be tagged with categories and are searchable across the entire CRM. When you are ready to move the lead to the next stage, click "Convert to Deal" at the top of the workspace to seamlessly transition the lead into your deals pipeline with all the context carried over.`,
    tags: ['workspace', 'lead-detail', 'activity-feed', 'documents', 'email', 'calls'],
    difficulty: 'intermediate',
  },
  {
    id: 'lp-reactivation',
    module: 'leads-pipeline',
    title: 'Re-engaging Cold Leads',
    summary:
      'Strategies and CRM tools for bringing dormant leads back into your active pipeline.',
    content: `In the Medicare and health insurance world, timing is everything. A lead who was not ready to switch plans in March might be highly motivated once AEP opens in October. The Reactivation module automatically surfaces leads that have gone dormant—meaning no meaningful two-way interaction for a configurable number of days—and presents them in a prioritized list based on renewal proximity and engagement history.

To reactivate a lead, click the "Reactivate" button on the lead's card. This moves the lead back into your active pipeline with a status of "Contacted" and logs a reactivation event in the activity timeline. The CRM can optionally prompt you to select a reason for reactivation (e.g., "Upcoming AEP," "Rate Increase Reported," "Referral from Existing Client") which helps with campaign analysis later.

For bulk reactivation, select multiple leads and choose "Send Reactivation Sequence" from the action bar. The CRM ships with pre-built email sequences tailored to common reactivation scenarios: an AEP reminder series, a birthday/aging-in outreach, and a general "we haven't heard from you" nurture track. Each sequence includes multiple touchpoints with configurable delays, and leads who reply or click are automatically removed from the sequence and flagged for personal follow-up.

Track your reactivation success with the dedicated "Reactivation Funnel" report under Reports > Leads. This report shows how many leads entered the reactivation pool, how many were re-engaged, and how many ultimately converted to deals. Over time, analyzing this data helps you refine your dormancy threshold, improve your outreach timing, and maximize the ROI of leads you have already paid to acquire.`,
    tags: ['reactivation', 'cold-leads', 'AEP', 'dormant', 're-engage', 'sequences'],
    difficulty: 'intermediate',
  },
  {
    id: 'lp-statuses',
    module: 'leads-pipeline',
    title: 'Understanding Lead Statuses',
    summary:
      'A breakdown of every lead status, what it means, and when to transition between them.',
    content: `Lead statuses are the backbone of your sales process—they tell you and your team exactly where a prospect stands at any moment. MPB CRM ships with five default statuses: New, Contacted, Qualified, Converted, and Lost. Each status can be customized or extended under Settings > Lead Statuses, but understanding the defaults is essential before making changes.

"New" is assigned automatically when a lead enters the system via any channel (web form, import, manual creation, API). It signals that no agent has reached out yet. Your goal is to move leads out of "New" as quickly as possible—industry data shows that contacting a lead within five minutes of submission increases conversion rates by up to 400%. The Dashboard's "New Leads" widget and the Today view both highlight New leads to help you act fast.

"Contacted" means at least one outbound touch has been made—a call, email, or text. However, it does not imply the lead has responded. Use this status to track that initial outreach has happened. Once the lead responds and you have a meaningful conversation about their needs, move them to "Qualified." The Qualified status indicates the lead has confirmed interest, meets your basic criteria (e.g., lives in a state where you are licensed, is Medicare-eligible or approaching eligibility), and is worth investing time in a needs analysis or plan comparison.

"Converted" means the lead has become a deal—they are actively considering a plan and you are working toward enrollment. Conversion typically happens when you submit a Scope of Appointment or begin a formal plan comparison. "Lost" is the terminal status for leads who are no longer viable: they chose another agent, are not eligible, requested no further contact, or simply went unresponsive after multiple attempts. Always log a loss reason so your reporting captures why leads are dropping off, which is critical for improving your acquisition strategy over time.`,
    tags: ['statuses', 'lifecycle', 'new', 'contacted', 'qualified', 'converted', 'lost'],
    difficulty: 'beginner',
  },
];
