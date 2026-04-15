import type { PageHelp, HelpArticle } from '../types';

export const documentsPageHelp: PageHelp = {
  pageKey: 'documents',
  title: 'Documents',
  description:
    'Store, organize, and share important documents such as policy applications, signed forms, carrier correspondence, and compliance records.',
  quickTips: [
    {
      id: 'docs-tip-1',
      text: 'Drag and drop files directly onto a contact or deal record to upload and auto-link them in one step.',
    },
    {
      id: 'docs-tip-2',
      text: 'Use document tags like "SOA," "Enrollment Form," or "ID Verification" to quickly filter and locate files later.',
    },
    {
      id: 'docs-tip-3',
      text: 'Enable version tracking on critical documents so you can view and restore previous versions at any time.',
    },
    {
      id: 'docs-tip-4',
      text: 'Set expiration dates on time-sensitive documents like Scope of Appointment forms to receive automatic renewal reminders.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'documentName',
      label: 'Document Name',
      hint: 'A descriptive name for the document. The system auto-fills from the file name, but you can edit it for clarity.',
    },
    {
      fieldKey: 'documentType',
      label: 'Document Type',
      hint: 'Categorize as Application, SOA, ID Copy, Carrier Letter, Compliance Record, or Custom.',
    },
    {
      fieldKey: 'linkedRecord',
      label: 'Linked Record',
      hint: 'The contact, account, deal, or case this document belongs to. A document can be linked to multiple records.',
    },
    {
      fieldKey: 'expirationDate',
      label: 'Expiration Date',
      hint: 'Optional. If set, the system sends reminders before the document expires.',
    },
    {
      fieldKey: 'visibility',
      label: 'Visibility',
      hint: 'Control who can see this document: Everyone, My Team, Only Me, or specific roles.',
    },
  ],
  faqs: [
    {
      question: 'What file types can I upload?',
      answer:
        'The CRM supports PDF, Word (.doc/.docx), Excel (.xls/.xlsx), images (PNG, JPG, GIF), and plain text files. Maximum file size is 25 MB per document.',
    },
    {
      question: 'Can I generate documents from templates?',
      answer:
        'Yes. Navigate to Templates, select a document template, and click "Generate." The system merges contact and deal data into the template and saves the resulting document automatically.',
    },
    {
      question: 'How do I share a document with a client?',
      answer:
        'Open the document, click "Share," and choose email or client portal link. Shared links can be set to expire and can require the client to verify their identity before viewing.',
    },
  ],
  relatedArticles: [
    'document-management',
    'call-logging-tracking',
  ],
  videoUrl: 'https://help.mpbhealth.com/videos/documents-overview',
};

export const callsPageHelp: PageHelp = {
  pageKey: 'calls',
  title: 'Calls',
  description:
    'Log inbound and outbound calls, track call outcomes, record notes, and maintain a complete communication history for every client interaction.',
  quickTips: [
    {
      id: 'calls-tip-1',
      text: 'Use the click-to-call feature on any contact record to initiate a call and auto-create a call log entry.',
    },
    {
      id: 'calls-tip-2',
      text: 'Log call disposition immediately after hanging up—it takes seconds and keeps your records accurate for compliance.',
    },
    {
      id: 'calls-tip-3',
      text: 'Link calls to specific cases or deals so the conversation context appears in the full activity timeline.',
    },
    {
      id: 'calls-tip-4',
      text: 'Schedule follow-up calls directly from a completed call log to ensure timely client outreach.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'callDirection',
      label: 'Direction',
      hint: 'Inbound or Outbound. The system sets this automatically when using click-to-call or receiving calls through integrated phone systems.',
    },
    {
      fieldKey: 'callDisposition',
      label: 'Disposition',
      hint: 'The outcome of the call: Connected, Left Voicemail, No Answer, Busy, Wrong Number, or Disconnected.',
    },
    {
      fieldKey: 'duration',
      label: 'Duration',
      hint: 'Call length in minutes and seconds. Auto-populated if using an integrated phone provider.',
    },
    {
      fieldKey: 'callNotes',
      label: 'Notes',
      hint: 'Summary of what was discussed. Keep notes factual and relevant—they may be reviewed for compliance purposes.',
    },
    {
      fieldKey: 'relatedContact',
      label: 'Related Contact',
      hint: 'The person called or who called in. The system auto-matches by phone number when possible.',
    },
  ],
  faqs: [
    {
      question: 'Does the CRM record phone calls?',
      answer:
        'Call recording depends on your integrated phone provider. If recording is enabled, recordings are attached to the call log automatically. Ensure you comply with state and federal call recording consent laws.',
    },
    {
      question: 'How do I log a call that happened outside the CRM?',
      answer:
        'Go to the Calls page and click "Log Call," or open a contact record and use the "Log Call" quick action. Fill in the date, time, duration, and notes manually.',
    },
    {
      question: 'Can I see all calls for a specific time period?',
      answer:
        'Yes. The Calls list page supports date-range filtering. You can also create saved views like "My Calls This Week" or "Team Calls Today" for quick access.',
    },
  ],
  relatedArticles: [
    'document-management',
    'call-logging-tracking',
  ],
  videoUrl: 'https://help.mpbhealth.com/videos/calls-overview',
};

export const documentsCallsArticles: HelpArticle[] = [
  {
    id: 'document-management',
    module: 'documents-calls',
    title: 'Document Management',
    summary:
      'Learn how to upload, organize, tag, and share documents within the CRM for compliance and operational efficiency.',
    content: `Effective document management is essential for health insurance agencies that must maintain accurate records of applications, Scope of Appointment (SOA) forms, carrier correspondence, and client identification documents. The CRM's document management system provides a centralized repository where every file is linked to the relevant contact, account, deal, or case record, making it easy for any authorized team member to find what they need without digging through email attachments or shared drives.

Uploading documents is straightforward. You can drag and drop files onto any record detail page, use the dedicated "Upload" button on the Documents list page, or generate documents directly from templates that auto-merge client data. When uploading, the system asks you to assign a Document Type (such as Application, SOA, or ID Copy) and optionally add tags for more granular categorization. Consistent tagging across your team is one of the most impactful habits you can build—it transforms document search from a frustrating hunt into a one-click filter.

For compliance-sensitive workflows, the document management system supports version tracking, expiration dates, and audit trails. When version tracking is enabled on a document, every time someone uploads a replacement, the previous version is preserved and accessible from the version history panel. Expiration dates are particularly useful for SOA forms and certain carrier authorizations; the system sends configurable reminders before a document expires so your team can proactively collect updated paperwork. The audit trail logs who uploaded, viewed, downloaded, or shared each document and when.

Sharing documents with clients and external partners is secure and controlled. You can email a document directly from the CRM, generate a secure portal link with an optional expiration date, or require identity verification before the recipient can view the file. For internal sharing, visibility settings let you restrict access by role or team—useful when handling sensitive information like medical records or financial documents that should only be visible to authorized personnel.`,
    tags: [
      'documents',
      'upload',
      'SOA',
      'compliance',
      'file management',
      'version tracking',
      'sharing',
      'tags',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'call-logging-tracking',
    module: 'documents-calls',
    title: 'Call Logging & Tracking',
    summary:
      'Master call logging best practices to maintain complete communication records and meet Medicare compliance requirements.',
    content: `Call logging is a foundational activity in any Medicare-focused agency. CMS regulations require that agents maintain records of client interactions, and the CRM's call logging features are designed to make this as effortless as possible while capturing all the information you need. Every call log entry records the direction (inbound or outbound), the contact involved, the date and time, call duration, disposition, and free-form notes summarizing the conversation.

The most efficient way to log calls is to use the integrated phone features. If your organization has connected a VoIP provider such as RingCentral, Twilio, or a similar service, the CRM can auto-detect when a call starts, match the phone number to an existing contact, and open a call logging form pre-populated with the contact name, direction, and start time. When the call ends, the duration is captured automatically. All you need to do is select a disposition and add your notes. For calls made outside the CRM—such as from a mobile phone—you can log them manually using the "Log Call" action available on any contact record or from the Calls list page.

Call dispositions drive reporting and follow-up workflows. When you mark a call as "Left Voicemail," the system can automatically schedule a follow-up task for the next business day. A "Connected" disposition with notes about a plan comparison request can trigger a workflow that creates a follow-up deal and schedules an appointment. The key is to be consistent with dispositions so your managers can accurately report on contact rates, conversion metrics, and team productivity. Review your organization's disposition definitions periodically to ensure everyone on the team is using them the same way.

The Calls module also provides powerful analytics for managers and supervisors. The call activity dashboard shows metrics like calls per agent per day, average call duration, disposition breakdowns, and peak calling hours. These insights help with staffing decisions during high-volume periods like AEP and OEP, and they make it easy to identify agents who might need additional coaching. Call logs are permanently linked to client records, so anyone reviewing a contact's history can see the complete communication timeline alongside emails, meetings, cases, and notes.`,
    tags: [
      'calls',
      'call logging',
      'phone',
      'VoIP',
      'disposition',
      'compliance',
      'CMS',
      'communication history',
      'AEP',
    ],
    difficulty: 'beginner',
  },
];
