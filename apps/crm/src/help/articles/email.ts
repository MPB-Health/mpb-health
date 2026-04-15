import type { PageHelp, HelpArticle } from '../types';

export const inboxPageHelp: PageHelp = {
  pageKey: 'email-inbox',
  title: 'Email Inbox',
  description:
    'Send, receive, and manage emails directly within the CRM. Every conversation is automatically linked to the relevant lead, contact, or deal.',
  quickTips: [
    {
      id: 'inbox-tip-1',
      text: 'Use the "Link to Record" button to associate an email with a specific lead or deal if it was not auto-matched.',
    },
    {
      id: 'inbox-tip-2',
      text: 'Pin important emails to keep them at the top of your inbox for quick reference during follow-ups.',
    },
    {
      id: 'inbox-tip-3',
      text: 'Set up email rules to automatically categorize incoming messages by carrier, enrollment period, or priority.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'to',
      label: 'To',
      hint: 'Start typing a name or email—the CRM will suggest matching contacts and leads from your database.',
    },
    {
      fieldKey: 'subject',
      label: 'Subject',
      hint: 'Keep subject lines clear and specific. For compliance, avoid misleading language about Medicare benefits.',
    },
    {
      fieldKey: 'template',
      label: 'Template',
      hint: 'Select a pre-built email template to save time. Templates can include merge fields for personalization.',
    },
    {
      fieldKey: 'scheduleSend',
      label: 'Schedule Send',
      hint: 'Choose a future date and time to send the email. Useful for reaching contacts in different time zones.',
    },
    {
      fieldKey: 'signature',
      label: 'Signature',
      hint: 'Your default email signature. Manage multiple signatures under Settings > Email > Signatures.',
    },
  ],
  faqs: [
    {
      question: 'How do I connect my email account?',
      answer:
        'Go to Settings > Email > Connected Accounts and click "Add Account." The CRM supports Gmail, Outlook/Office 365, and generic IMAP/SMTP connections.',
    },
    {
      question: 'Are my emails stored in the CRM?',
      answer:
        'Yes. All sent and received emails are synced and stored in the CRM, linked to the corresponding contact or lead record. This gives your team full visibility into communication history.',
    },
    {
      question: 'Can I send emails on behalf of another agent?',
      answer:
        'If your administrator has enabled shared mailboxes, you can send from a team alias. Individual agent emails require that agent's connected account.',
    },
  ],
  relatedArticles: ['email-inbox', 'email-sequences', 'email-deliverability'],
};

export const emailSequencesPageHelp: PageHelp = {
  pageKey: 'email-sequences',
  title: 'Email Sequences',
  description:
    'Automate multi-step email campaigns that nurture leads through the enrollment decision process.',
  quickTips: [
    {
      id: 'seq-tip-1',
      text: 'Start sequences with a warm, educational email rather than a hard sell—Medicare prospects respond better to helpful information.',
    },
    {
      id: 'seq-tip-2',
      text: 'Set "exit conditions" so contacts are automatically removed from a sequence when they reply, book a meeting, or enroll.',
    },
    {
      id: 'seq-tip-3',
      text: 'Space emails 3–5 days apart to stay top-of-mind without overwhelming prospects during busy enrollment periods.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'sequenceName',
      label: 'Sequence Name',
      hint: 'A clear name describing the purpose and audience (e.g., "T65 Welcome Series" or "AEP Renewal Nurture").',
    },
    {
      fieldKey: 'steps',
      label: 'Steps',
      hint: 'Each step is an email in the sequence. Set the delay between steps and the email template for each.',
    },
    {
      fieldKey: 'exitConditions',
      label: 'Exit Conditions',
      hint: 'Rules that automatically remove a contact: replied, booked meeting, deal created, or manually removed.',
    },
    {
      fieldKey: 'sendWindow',
      label: 'Send Window',
      hint: 'Restrict delivery to business hours in the recipient's timezone for better open rates.',
    },
  ],
  faqs: [
    {
      question: 'What is the difference between a sequence and a campaign?',
      answer:
        'A sequence is a series of automated, one-to-one emails sent from your personal address. A campaign is a one-to-many broadcast. Sequences feel more personal and typically have higher reply rates.',
    },
    {
      question: 'Can I A/B test sequence emails?',
      answer:
        'Yes. On any step, create a variant with a different subject line or body. The system splits recipients evenly and reports which version performs better.',
    },
    {
      question: 'Will a sequence stop if the contact replies?',
      answer:
        'By default, yes. Reply detection is an automatic exit condition. You can customize this behavior or add additional exit triggers.',
    },
  ],
  relatedArticles: ['email-sequences', 'email-inbox', 'email-deliverability'],
};

export const emailArticles: HelpArticle[] = [
  {
    id: 'email-inbox',
    module: 'email',
    title: 'Using the Email Inbox',
    summary:
      'Master the CRM's built-in email client to manage all prospect and client communications from one place.',
    content: `The CRM's integrated email inbox eliminates the need to switch between your email client and your CRM throughout the day. Every email you send or receive is automatically matched to the corresponding lead, contact, or deal record, giving you and your team a complete communication timeline for every relationship.

To get started, connect your email account under Settings > Email > Connected Accounts. The CRM supports Google Workspace (Gmail), Microsoft 365 (Outlook), and custom IMAP/SMTP servers. Once connected, your inbox syncs bidirectionally—emails you send from the CRM appear in your regular email client's Sent folder, and replies land in both places. This means you can use the CRM exclusively without worrying about missing messages.

The inbox view organizes conversations by contact, so you see a threaded history of every exchange with a particular person rather than a flat chronological list. Use the filter bar to narrow by linked record type (leads, contacts, deals), date range, read/unread status, or custom tags. For high-volume periods like AEP, create saved views—such as "Unread – AEP Leads" or "Awaiting Reply – Renewals"—to focus on the messages that need immediate attention.

Composing emails is streamlined with templates, merge fields, and scheduling. Select a template from your library, and the CRM automatically inserts the recipient's name, plan details, upcoming appointment time, or any other field from their record. If you want to send the email at an optimal time, use the Schedule Send feature to queue it for delivery during business hours in the recipient's timezone. Every sent email is logged on the contact's timeline, along with open and click tracking data so you know exactly when and how often your message was viewed.`,
    tags: [
      'email',
      'inbox',
      'sync',
      'Gmail',
      'Outlook',
      'templates',
      'tracking',
      'communication',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'email-sequences',
    module: 'email',
    title: 'Email Sequences & Automation',
    summary:
      'Set up automated, multi-step email sequences that nurture leads toward enrollment without manual follow-up.',
    content: `Email sequences let you automate the follow-up process that is critical to converting Medicare prospects into enrolled clients. Instead of manually remembering to send a second or third touch, you define a series of timed emails that go out automatically—each one building on the last to educate the prospect, address common objections, and guide them toward scheduling a consultation.

To create a sequence, go to Email > Sequences and click "New Sequence." Name it descriptively (e.g., "T65 New-to-Medicare Welcome Series") and add your first step. Each step consists of an email template and a delay—the number of days to wait before sending. A typical sequence might look like: Day 0 – Welcome and introduction, Day 3 – Educational content about Medicare Parts A & B, Day 7 – Comparison of Medicare Advantage vs. Medigap, Day 14 – Invitation to schedule a free consultation. You can add as many steps as you like, though most effective sequences contain four to eight emails.

Exit conditions are what make sequences intelligent. By default, the sequence stops for a contact when they reply to any email in the series—this prevents the awkward scenario of a prospect receiving an automated follow-up after they have already responded. You can add additional exit conditions: deal created, meeting booked, enrollment completed, or manual removal by an agent. These conditions ensure your automation enhances the client experience rather than detracting from it.

Performance tracking is built into every sequence. The dashboard shows overall metrics—send count, open rate, click rate, reply rate, and meeting-booked rate—as well as per-step breakdowns. If step three has a notably lower open rate, experiment with a different subject line. If step five generates the most replies, consider what makes that email effective and apply those lessons to earlier steps. Over time, refining your sequences based on data will significantly improve your lead-to-enrollment conversion rate.`,
    tags: [
      'sequences',
      'automation',
      'drip',
      'follow-up',
      'nurture',
      'enrollment',
      'T65',
      'conversion',
    ],
    difficulty: 'intermediate',
  },
  {
    id: 'email-deliverability',
    module: 'email',
    title: 'Email Deliverability',
    summary:
      'Ensure your emails reach the inbox by understanding authentication, reputation, and best practices.',
    content: `Email deliverability determines whether your messages land in the prospect's inbox or get filtered into spam. For health insurance agents, poor deliverability means missed opportunities and wasted campaign spend. The CRM provides tools and guidance to help you maintain a strong sender reputation and maximize inbox placement.

The first step is proper email authentication. Under Settings > Email > Domains, add your sending domain and configure three DNS records: SPF (Sender Policy Framework), DKIM (DomainKeys Identified Mail), and DMARC (Domain-based Message Authentication, Reporting and Conformance). These records prove to receiving mail servers that the CRM is authorized to send on your behalf. The setup wizard walks you through each record and verifies them once published. Without these records, major providers like Gmail and Outlook are increasingly likely to reject or spam-folder your messages.

Sender reputation is built over time and depends on engagement signals. Mailbox providers track how often your emails are opened, replied to, marked as spam, or bounced. To protect your reputation, the CRM automatically suppresses hard bounces (invalid addresses) and processes unsubscribe requests immediately. For new sending domains, use the built-in warm-up feature: start by sending a small volume (50–100 emails per day) and gradually increase over two to four weeks. This tells mailbox providers that your domain is legitimate and consistently sends wanted mail.

Content quality also affects deliverability. Avoid spam-trigger words in subject lines, keep your text-to-image ratio balanced, and always include a plain-text version alongside HTML. The CRM's spam score checker analyzes your email before sending and flags potential issues. For Medicare-related emails, ensure you include required CMS disclaimers—not only for compliance but because their absence can trigger spam filters trained on health insurance content. Finally, maintain a clean list by regularly removing contacts who have not engaged in the last 90 days; sending to disengaged recipients drags down your overall engagement metrics and harms deliverability.`,
    tags: [
      'deliverability',
      'SPF',
      'DKIM',
      'DMARC',
      'spam',
      'reputation',
      'authentication',
      'warm-up',
    ],
    difficulty: 'advanced',
  },
];
