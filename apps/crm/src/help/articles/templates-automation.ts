import type { PageHelp, HelpArticle } from '../types';

export const templatesPageHelp: PageHelp = {
  pageKey: 'templates',
  title: 'Templates',
  description:
    'Create reusable email and document templates with merge fields to streamline client communication and ensure brand consistency.',
  quickTips: [
    {
      id: 'templates-tip-1',
      text: 'Use merge fields like {{contact.firstName}} and {{deal.planName}} to personalize templates automatically when they are sent.',
    },
    {
      id: 'templates-tip-2',
      text: 'Organize templates into folders by purpose—Enrollment, Renewal, Follow-Up, Compliance—so your team can find the right one instantly.',
    },
    {
      id: 'templates-tip-3',
      text: 'Preview a template with real contact data before saving to ensure merge fields resolve correctly and the layout looks right.',
    },
    {
      id: 'templates-tip-4',
      text: 'Mark your best-performing templates as "Favorites" so they appear at the top of the template picker for quick access.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'templateName',
      label: 'Template Name',
      hint: 'A descriptive name your team will search for. Use a consistent naming convention like "AEP - Initial Outreach" or "Renewal - 60 Day Reminder."',
    },
    {
      fieldKey: 'templateType',
      label: 'Type',
      hint: 'Email Template or Document Template. Email templates support HTML formatting; document templates produce PDFs.',
    },
    {
      fieldKey: 'subject',
      label: 'Subject Line',
      hint: 'For email templates only. Supports merge fields for personalization.',
    },
    {
      fieldKey: 'folder',
      label: 'Folder',
      hint: 'Organize templates into folders. Shared folders are visible to your entire team; personal folders are private.',
    },
    {
      fieldKey: 'mergeFields',
      label: 'Available Merge Fields',
      hint: 'Click "Insert Merge Field" in the editor to browse all available fields from Contacts, Deals, Accounts, and Policies.',
    },
  ],
  faqs: [
    {
      question: 'Can I use conditional logic in templates?',
      answer:
        'Yes. Use {{#if fieldName}} blocks to show or hide sections based on data. For example, show a Medicare Advantage section only if the contact has an MA plan.',
    },
    {
      question: 'How do I share a template with my team?',
      answer:
        'Save the template to a shared folder. Anyone with access to that folder can use the template. Admins can also mark templates as "Organization-wide" in settings.',
    },
    {
      question: 'Can I attach files to email templates?',
      answer:
        'Yes. In the template editor, use the "Attachments" section to add static files or document templates that will be generated and attached when the email is sent.',
    },
  ],
  relatedArticles: [
    'email-document-templates',
    'workflow-automation-rules',
    'building-custom-workflows',
  ],
  videoUrl: 'https://help.mpbhealth.com/videos/templates-overview',
};

export const automationPageHelp: PageHelp = {
  pageKey: 'automation',
  title: 'Workflow Automation',
  description:
    'Build rules and workflows that automate repetitive tasks such as lead assignment, follow-up reminders, status updates, and notification emails.',
  quickTips: [
    {
      id: 'auto-tip-1',
      text: 'Start with simple trigger-action rules before building complex multi-step workflows. Get familiar with conditions and actions first.',
    },
    {
      id: 'auto-tip-2',
      text: 'Always test a new automation rule on a small data set or in sandbox mode before activating it for your entire team.',
    },
    {
      id: 'auto-tip-3',
      text: 'Use the "Execution Log" to troubleshoot rules that aren\'t firing as expected—it shows every trigger event and whether conditions were met.',
    },
    {
      id: 'auto-tip-4',
      text: 'Combine time-based triggers with record conditions to build powerful automations like "Send renewal reminder 90 days before policy expiration."',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'ruleName',
      label: 'Rule Name',
      hint: 'A clear, descriptive name that explains what the rule does. Example: "Auto-Assign New Web Leads to Round Robin."',
    },
    {
      fieldKey: 'trigger',
      label: 'Trigger',
      hint: 'The event that starts the rule: Record Created, Record Updated, Field Changed, Date/Time Reached, or Manual.',
    },
    {
      fieldKey: 'conditions',
      label: 'Conditions',
      hint: 'Optional filters that must be true for the actions to execute. Use AND/OR logic to combine multiple conditions.',
    },
    {
      fieldKey: 'actions',
      label: 'Actions',
      hint: 'What happens when the rule fires: Update Field, Send Email, Create Task, Assign Record, Send Notification, Call Webhook, or Wait.',
    },
    {
      fieldKey: 'status',
      label: 'Status',
      hint: 'Active or Inactive. Deactivate a rule to stop it from firing without deleting it.',
    },
  ],
  faqs: [
    {
      question: 'How many automation rules can I create?',
      answer:
        'There is no hard limit on the number of rules, but performance is best when you keep rules focused and avoid overlapping triggers. Review your rules quarterly to consolidate or retire unused ones.',
    },
    {
      question: 'Can one rule trigger another?',
      answer:
        'Yes, through chain execution. When a rule updates a record, that update can trigger another rule. Be cautious of infinite loops—the system halts execution after 10 chained triggers.',
    },
    {
      question: 'What happens if a rule fails?',
      answer:
        'Failed executions are logged in the Execution Log with the error details. The system retries transient failures (like email delivery) up to three times. Persistent failures require manual review.',
    },
  ],
  relatedArticles: [
    'email-document-templates',
    'workflow-automation-rules',
    'building-custom-workflows',
  ],
  videoUrl: 'https://help.mpbhealth.com/videos/automation-overview',
};

export const templatesAutomationArticles: HelpArticle[] = [
  {
    id: 'email-document-templates',
    module: 'templates-automation',
    title: 'Email & Document Templates',
    summary:
      'Create polished, personalized email and document templates with merge fields to communicate consistently and efficiently.',
    content: `Templates are one of the biggest time-savers in the CRM, especially for health insurance agencies that send the same types of communications repeatedly during enrollment periods. Instead of typing out plan comparison summaries, appointment confirmations, or compliance disclosures from scratch each time, you create a template once, insert merge fields where personalized data should appear, and reuse it across hundreds of client interactions.

Email templates are built using a rich text editor that supports formatting, images, links, and merge fields. Merge fields pull data directly from the CRM—contact names, plan details, effective dates, agent information—and populate them automatically when the email is sent. This means an email addressed "Dear {{contact.firstName}}" becomes "Dear Margaret" for one recipient and "Dear James" for another, all without manual editing. You can also use conditional blocks to include or exclude sections based on the recipient's data, such as showing Medicare Supplement information only for clients with a Medigap policy.

Document templates work similarly but produce formatted PDF output suitable for printing or e-signature. Common document templates in a Medicare agency include Scope of Appointment forms, plan comparison worksheets, enrollment checklists, and personalized benefit summaries. The document generation engine supports tables, headers, footers, page breaks, and images, so you can produce professional-looking documents that match your agency's branding. Generated documents are automatically saved to the Documents module and linked to the relevant contact or deal record.

Managing templates at scale requires good organizational habits. Use folders to group templates by purpose (Enrollment, Renewal, Service, Compliance) and by communication channel (Email vs. Document). Establish naming conventions so templates are easy to find—for example, prefixing with the enrollment period like "AEP 2026 - Plan Comparison Email." Periodically review template performance metrics: the CRM tracks open rates and click rates for email templates, helping you identify which subject lines and content resonate best with your audience.`,
    tags: [
      'templates',
      'email templates',
      'document templates',
      'merge fields',
      'personalization',
      'PDF',
      'SOA',
      'AEP',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'workflow-automation-rules',
    module: 'templates-automation',
    title: 'Workflow Automation Rules',
    summary:
      'Set up trigger-based automation rules to eliminate manual tasks and ensure consistent processes across your team.',
    content: `Workflow automation rules let you define "if this happens, then do that" logic that the CRM executes automatically. Every rule consists of three components: a trigger (the event that starts the rule), optional conditions (filters that must be true), and one or more actions (what the system does). By combining these components, you can automate a wide range of tasks that would otherwise require manual effort and are prone to being forgotten during busy periods.

Common automation rules in a health insurance CRM include automatic lead assignment based on geography or product specialty, sending a welcome email when a new contact is created, creating a follow-up task when a deal reaches the "Proposal Sent" stage, escalating a case that has been open for more than 48 hours, and sending renewal reminders a configurable number of days before a policy expiration date. Each of these rules saves minutes per occurrence, but across hundreds of clients and multiple agents, the cumulative time savings are substantial.

Building a rule starts in the Automation section of the CRM. Click "New Rule," give it a descriptive name, and select a trigger type. Record-based triggers fire when a record is created or updated; field-change triggers fire when a specific field value changes; time-based triggers fire at a scheduled date or relative to a date field on a record. Next, add conditions if you need to narrow when the rule applies—for example, only trigger for leads with a source of "Website" or only for deals with a value above a certain threshold. Finally, define the actions: update a field, send a templated email, create a task, assign the record to a user or queue, post a notification, or call an external webhook.

After saving a rule, it enters an "Inactive" state by default so you can test it before it affects real data. Use the "Test Rule" feature to simulate the trigger with a sample record and verify that conditions evaluate correctly and actions produce the expected result. Once satisfied, activate the rule. The Execution Log provides a real-time feed of every time the rule fires, showing the triggering record, whether conditions passed, and the outcome of each action. This log is invaluable for debugging rules that aren't behaving as intended.`,
    tags: [
      'automation',
      'workflow rules',
      'triggers',
      'conditions',
      'actions',
      'lead assignment',
      'follow-up',
      'reminders',
    ],
    difficulty: 'intermediate',
  },
  {
    id: 'building-custom-workflows',
    module: 'templates-automation',
    title: 'Building Custom Workflows',
    summary:
      'Design multi-step, branching workflows with the visual workflow builder for complex business processes.',
    content: `While simple automation rules handle straightforward "if-then" scenarios, complex business processes often require multi-step workflows with branching logic, wait steps, and parallel paths. The CRM's visual workflow builder provides a drag-and-drop canvas where you can design these sophisticated automations without writing code. Think of it as a flowchart that the system executes automatically whenever the workflow is triggered.

The workflow builder canvas starts with a trigger node, just like a simple rule. From there, you add action nodes (send email, update record, create task), decision nodes (if/else branches based on field values or conditions), wait nodes (pause for a specified duration or until a condition is met), and parallel split nodes (execute multiple paths simultaneously). For example, an enrollment follow-up workflow might send a welcome email immediately, wait three days, check if the client has submitted their application, and then either send a reminder email or create a congratulations task depending on the result.

Decision nodes are particularly powerful for health insurance workflows because client situations vary widely. A single "New Lead" workflow can branch based on the lead's age (Medicare-eligible or under-65), their state of residence (different carrier availability), and their expressed interest (Medicare Advantage, Supplement, Part D, or ACA). Each branch can follow a completely different sequence of actions, yet everything is managed in one visual workflow rather than dozens of separate rules.

Once your workflow is designed, use the built-in simulation feature to walk through it step by step with test data before activating it. The simulator highlights which path the workflow follows and shows you the outcome of each node. After activation, the workflow dashboard displays running instances, completed instances, and any that are paused at wait nodes. You can manually advance or cancel a running workflow instance if needed. For ongoing optimization, review the workflow analytics to see average completion times, drop-off points where instances frequently stall, and the distribution of paths taken through decision nodes.`,
    tags: [
      'workflows',
      'workflow builder',
      'visual builder',
      'branching logic',
      'multi-step',
      'enrollment',
      'process automation',
    ],
    difficulty: 'advanced',
  },
];
