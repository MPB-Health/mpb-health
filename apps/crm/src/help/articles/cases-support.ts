import type { PageHelp, HelpArticle } from '../types';

export const casesPageHelp: PageHelp = {
  pageKey: 'cases',
  title: 'Cases & Support',
  description:
    'Track, manage, and resolve client support cases related to policy inquiries, claims issues, enrollment problems, and general service requests.',
  quickTips: [
    {
      id: 'cases-tip-1',
      text: 'Use the "Quick Case" button in the toolbar to create a new case directly from an incoming call without leaving the current screen.',
    },
    {
      id: 'cases-tip-2',
      text: 'Set case priority to "Urgent" for compliance-sensitive issues like grievances or appeals so they appear at the top of your queue.',
    },
    {
      id: 'cases-tip-3',
      text: 'Link cases to specific policies or enrollments so the full history is visible to any agent who picks up the case later.',
    },
    {
      id: 'cases-tip-4',
      text: 'Use internal notes to document conversations with carriers—these are hidden from client-facing summaries.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'caseType',
      label: 'Case Type',
      hint: 'Select the category that best describes the issue: Enrollment, Claims, Billing, Policy Change, Grievance, or General Inquiry.',
    },
    {
      fieldKey: 'priority',
      label: 'Priority',
      hint: 'Low, Medium, High, or Urgent. Urgent cases trigger SLA timers and manager notifications automatically.',
    },
    {
      fieldKey: 'status',
      label: 'Status',
      hint: 'Open, In Progress, Waiting on Client, Waiting on Carrier, Escalated, or Resolved.',
    },
    {
      fieldKey: 'assignedTo',
      label: 'Assigned To',
      hint: 'The agent responsible for resolving this case. Cases can be reassigned or escalated at any time.',
    },
    {
      fieldKey: 'relatedContact',
      label: 'Related Contact',
      hint: 'The beneficiary or policyholder this case pertains to. Start typing to search by name or policy number.',
    },
    {
      fieldKey: 'resolution',
      label: 'Resolution Summary',
      hint: 'Provide a clear summary of how the case was resolved. This is included in client-facing communications.',
    },
  ],
  faqs: [
    {
      question: 'How do I escalate a case to a supervisor?',
      answer:
        'Open the case, click the "Escalate" button in the action bar, select the supervisor or team, and add an escalation note explaining why the case needs elevated attention. The supervisor receives an immediate notification.',
    },
    {
      question: 'Can I merge duplicate cases?',
      answer:
        'Yes. Open one of the duplicate cases, click "More Actions" > "Merge Case," then search for and select the other case. All notes, attachments, and activity history are combined into the surviving case.',
    },
    {
      question: 'How are SLA timers calculated?',
      answer:
        'SLA timers start when a case is created and pause when the status is set to "Waiting on Client." Timer thresholds are configured per case type in Settings > Support > SLA Policies.',
    },
    {
      question: 'Can clients view their case status?',
      answer:
        'If your organization has the client portal enabled, clients can see case status, add comments, and upload documents. Portal visibility is controlled per case type in Settings.',
    },
  ],
  relatedArticles: [
    'creating-managing-cases',
    'case-resolution-workflow',
  ],
  videoUrl: 'https://help.mpbhealth.com/videos/cases-overview',
};

export const casesSupportArticles: HelpArticle[] = [
  {
    id: 'creating-managing-cases',
    module: 'cases-support',
    title: 'Creating and Managing Cases',
    summary:
      'Learn how to create, organize, and track support cases for your Medicare and health insurance clients.',
    content: `Creating a support case in the CRM begins from several convenient entry points. You can click the "New Case" button on the Cases list page, use the "Quick Case" toolbar shortcut while viewing a contact or policy record, or let the system auto-generate a case from an inbound web form submission. Whichever method you choose, the system pre-populates known fields such as the client's name, contact information, and linked policies to save you time and reduce data-entry errors.

When filling out a new case, selecting the correct Case Type is critical because it determines which SLA policy applies, which automated workflows trigger, and how the case appears in reporting dashboards. For Medicare-related issues, common types include Enrollment Assistance, Claims Dispute, Plan Comparison Request, and Annual Election Period (AEP) Support. Each type can have its own required fields—for example, a Claims Dispute case requires a claim reference number and date of service, while an Enrollment Assistance case asks for the desired effective date and plan preference.

Once a case is created, managing it effectively means keeping the status field accurate and adding detailed notes after every interaction. The CRM tracks a complete timeline of status changes, notes, emails, calls, and file attachments on each case record. Use the "Waiting on Client" and "Waiting on Carrier" statuses liberally—they pause SLA timers and signal to your team that the ball is in someone else's court. You can also set follow-up reminders directly from the case record so nothing slips through the cracks during busy enrollment periods.

For agencies handling high case volumes, the Cases list page offers powerful filtering and saved views. Create views like "My Open Urgent Cases," "Unassigned This Week," or "Escalated to Management" to keep your team focused on what matters most. Cases can be bulk-reassigned when agents are out of office, and the round-robin assignment feature distributes new cases evenly across available team members. Managers can monitor case load and resolution metrics from the Support Dashboard in the Reports module.`,
    tags: [
      'cases',
      'support',
      'create case',
      'manage cases',
      'SLA',
      'Medicare',
      'enrollment',
      'claims',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'case-resolution-workflow',
    module: 'cases-support',
    title: 'Case Resolution Workflow',
    summary:
      'Understand the end-to-end lifecycle of a support case from creation through resolution and follow-up.',
    content: `The case resolution workflow in the CRM follows a structured lifecycle designed to ensure every client issue is handled thoroughly and documented properly. When a case is first opened, it enters the "Open" status and the SLA timer begins counting. The assigned agent reviews the case details, gathers any missing information from the client, and moves the case to "In Progress" once they begin actively working on it. This status change is logged in the audit trail and visible to supervisors monitoring team workload.

As the agent works the case, they may need to contact insurance carriers, request documentation from the client, or consult with internal specialists. Each of these interactions should be logged as a case activity—either a note, a linked call record, or an attached email. When the agent is waiting for an external party to respond, setting the status to "Waiting on Carrier" or "Waiting on Client" pauses the SLA clock and communicates the current bottleneck to the rest of the team. If the issue requires authority beyond the agent's scope, the one-click Escalate action reassigns the case to a supervisor while preserving the full history.

When the issue is resolved, the agent fills in the Resolution Summary field with a clear, client-friendly explanation of what was done. The system then prompts the agent to select a Resolution Type—such as "Issue Corrected," "Information Provided," "Referred to Carrier," or "No Action Required"—which feeds into analytics for identifying recurring problems. After saving the resolution, the CRM can automatically send a satisfaction survey to the client if this feature is enabled in your organization's settings.

Post-resolution, cases move to a "Closed" status but remain fully searchable and linked to the client's record. The CRM retains case data indefinitely for compliance and audit purposes, which is especially important for Medicare-related interactions that may be subject to CMS record-keeping requirements. Managers can review resolution trends, average handle times, and first-contact resolution rates in the Cases Analytics dashboard to continuously improve support quality and identify training opportunities.`,
    tags: [
      'case resolution',
      'workflow',
      'SLA',
      'escalation',
      'compliance',
      'CMS',
      'audit trail',
      'support lifecycle',
    ],
    difficulty: 'intermediate',
  },
];
