import type { PageHelp, HelpArticle } from '../types';

export const referralPartnersPageHelp: PageHelp = {
  pageKey: 'referral-partners',
  title: 'Referral Partners',
  description:
    'Track and manage relationships with professionals and organizations that refer Medicare prospects to your agency.',
  quickTips: [
    {
      id: 'ref-tip-1',
      text: 'Log every referral with a source partner so you can measure which relationships generate the most enrollments.',
    },
    {
      id: 'ref-tip-2',
      text: 'Set reminder tasks to touch base with top referral partners monthly to keep the relationship warm.',
    },
    {
      id: 'ref-tip-3',
      text: 'Use the referral partner report to identify your highest-converting sources and invest more time in those relationships.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'partnerName',
      label: 'Partner Name',
      hint: 'The individual or organization name (e.g., "Dr. Smith Family Practice" or "ABC Financial Advisors").',
    },
    {
      fieldKey: 'partnerType',
      label: 'Type',
      hint: 'Categorize the partner: Medical Office, Financial Advisor, Attorney, Community Organization, Employer, or Other.',
    },
    {
      fieldKey: 'contactInfo',
      label: 'Contact Info',
      hint: 'Primary phone, email, and address for the referral partner.',
    },
    {
      fieldKey: 'referralCount',
      label: 'Referral Count',
      hint: 'Automatically tallied from leads linked to this partner. Updated in real time.',
    },
    {
      fieldKey: 'conversionRate',
      label: 'Conversion Rate',
      hint: 'Percentage of referrals that converted to enrolled clients. Calculated automatically from linked deals.',
    },
    {
      fieldKey: 'status',
      label: 'Status',
      hint: 'Active, Inactive, or Prospective. Use "Prospective" for partners you are cultivating but have not yet received referrals from.',
    },
  ],
  faqs: [
    {
      question: 'How do I attribute a lead to a referral partner?',
      answer:
        'When creating or editing a lead, select the referral partner from the "Referred By" dropdown. This links the lead to the partner for tracking and reporting.',
    },
    {
      question: 'Can I track referral fees or commissions shared with partners?',
      answer:
        'Yes. On each referral partner record, you can set a referral fee structure (flat amount or percentage). The system calculates amounts owed based on closed referrals.',
    },
    {
      question: 'How do I find my most productive referral partners?',
      answer:
        'Navigate to Reports > Referral Network. The Partner Performance report ranks all partners by referral volume, conversion rate, and revenue generated.',
    },
  ],
  relatedArticles: ['rn-referral-partners', 'rn-outside-advisors', 'rn-community-events'],
};

export const outsideAdvisorsPageHelp: PageHelp = {
  pageKey: 'outside-advisors',
  title: 'Outside Advisors',
  description:
    `Manage relationships with external advisors—financial planners, estate attorneys, accountants—who influence your clients' insurance decisions.`,
  quickTips: [
    {
      id: 'advisor-tip-1',
      text: 'Tag advisors by specialty (financial planning, estate law, tax) to quickly find the right expert for a client referral.',
    },
    {
      id: 'advisor-tip-2',
      text: 'Link advisors to the client accounts they serve so you have context when coordinating care.',
    },
    {
      id: 'advisor-tip-3',
      text: 'Schedule quarterly check-ins with key advisors to discuss mutual clients and identify new referral opportunities.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'advisorName',
      label: 'Advisor Name',
      hint: `The individual's full name and credentials (e.g., "Sarah Johnson, CFP").`,
    },
    {
      fieldKey: 'firm',
      label: 'Firm',
      hint: 'The company or practice the advisor belongs to.',
    },
    {
      fieldKey: 'specialty',
      label: 'Specialty',
      hint: `The advisor's area of expertise: Financial Planning, Estate Law, Tax/Accounting, or Other.`,
    },
    {
      fieldKey: 'linkedAccounts',
      label: 'Linked Accounts',
      hint: 'Client accounts this advisor is associated with. Helps coordinate when multiple professionals serve the same client.',
    },
    {
      fieldKey: 'lastContactDate',
      label: 'Last Contact Date',
      hint: 'When you last communicated with this advisor. Use this to track relationship health.',
    },
  ],
  faqs: [
    {
      question: 'What is the difference between a referral partner and an outside advisor?',
      answer:
        'Referral partners send you new leads. Outside advisors are professionals who serve your existing clients in complementary roles (e.g., a financial planner helping a client with retirement decisions that affect their Medicare choices).',
    },
    {
      question: 'Can I share client information with outside advisors through the CRM?',
      answer:
        `The CRM does not share data externally by default. You can generate a summary report or PDF for a specific client to share with an advisor, with the client's consent.`,
    },
    {
      question: 'How do I track interactions with advisors?',
      answer:
        'Log calls, emails, and meetings on the advisor record just like any other contact. The activity timeline shows your full communication history.',
    },
  ],
  relatedArticles: ['rn-outside-advisors', 'rn-referral-partners', 'rn-community-events'],
};

export const communityEventsPageHelp: PageHelp = {
  pageKey: 'community-events',
  title: 'Community Events',
  description:
    'Plan and manage Medicare educational seminars, health fairs, and community outreach events.',
  quickTips: [
    {
      id: 'events-tip-1',
      text: 'Create the event record first, then link it to a campaign to track all leads generated from the event.',
    },
    {
      id: 'events-tip-2',
      text: 'Use the RSVP tracking feature to estimate attendance and plan materials accordingly.',
    },
    {
      id: 'events-tip-3',
      text: 'After the event, bulk-create leads from the attendee sign-in sheet using the import tool.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'eventName',
      label: 'Event Name',
      hint: 'A descriptive name (e.g., "Medicare 101 Seminar – Springfield Community Center").',
    },
    {
      fieldKey: 'eventType',
      label: 'Event Type',
      hint: 'Seminar, Health Fair, Webinar, Workshop, Community Booth, or Other.',
    },
    {
      fieldKey: 'eventDate',
      label: 'Date & Time',
      hint: 'When the event takes place. Multi-day events should have start and end dates.',
    },
    {
      fieldKey: 'venue',
      label: 'Venue',
      hint: 'Location name and address, or "Virtual" with a link for webinars.',
    },
    {
      fieldKey: 'capacity',
      label: 'Capacity',
      hint: 'Maximum number of attendees. RSVP tracking will stop accepting registrations when capacity is reached.',
    },
    {
      fieldKey: 'campaign',
      label: 'Linked Campaign',
      hint: 'The marketing campaign this event belongs to. Leads generated at the event will be attributed to this campaign.',
    },
  ],
  faqs: [
    {
      question: 'Do I need to file event materials with CMS?',
      answer:
        'Yes, if you are presenting Medicare plan-specific information. CMS requires that seminar and educational event materials be filed and approved. The event record includes a compliance checklist to help track this.',
    },
    {
      question: 'How do I track RSVPs?',
      answer:
        'Each event has an RSVP list. Add contacts manually, import from a list, or share a registration web form link that automatically adds respondents to the RSVP list.',
    },
    {
      question: 'Can I send follow-up emails to event attendees?',
      answer:
        'Yes. After the event, use the "Send to Attendees" action to email everyone on the attendee list. You can use a template with merge fields to personalize the follow-up.',
    },
  ],
  relatedArticles: ['rn-community-events', 'rn-referral-partners', 'rn-outside-advisors'],
};

export const referralNetworkArticles: HelpArticle[] = [
  {
    id: 'rn-referral-partners',
    module: 'referral-network',
    title: 'Managing Referral Partners',
    summary:
      'Build, nurture, and measure your referral network to create a sustainable pipeline of Medicare prospects.',
    content: `Referral partners are one of the most valuable and sustainable lead sources for Medicare insurance agents. Unlike paid advertising that stops producing the moment you cut the budget, a strong referral network generates a steady stream of warm prospects who already trust you because someone they know recommended your services. The CRM's referral partner management tools help you build these relationships systematically rather than relying on memory and sticky notes.

Start by creating a referral partner record for every professional or organization that has sent you a lead—or that you believe could send referrals in the future. Common referral partner types include primary care physicians and medical offices, financial advisors and estate planners, elder law attorneys, senior centers and community organizations, employer HR departments, and other insurance agents who do not handle Medicare. For each partner, record their contact information, specialty, geographic area, and any referral agreement details such as fee structures or reciprocal referral expectations.

The key to a thriving referral network is consistent relationship maintenance. Use the CRM's task system to set recurring reminders—monthly check-in calls, quarterly lunch meetings, or annual thank-you gifts for your top partners. When a referral partner sends you a lead, always attribute it by selecting the partner in the "Referred By" field on the lead record. This not only gives you accurate source tracking in your reports but also lets you send the partner a timely thank-you note. Many agents find that a simple "thank you for the referral" email within 24 hours dramatically increases the likelihood of receiving additional referrals.

The Referral Partner Performance report is your analytical lens on the network. It ranks partners by total referrals sent, conversion rate (referrals that became enrolled clients), and total revenue generated. Use this data to identify your top five partners and invest more relationship-building time with them. Conversely, if a partner's referrals consistently have low conversion rates, it may indicate a mismatch in expectations—perhaps they are referring people who are not yet eligible for Medicare, in which case an educational conversation can realign the relationship.`,
    tags: [
      'referrals',
      'partners',
      'network',
      'lead-sources',
      'relationship-management',
      'physicians',
      'financial-advisors',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'rn-outside-advisors',
    module: 'referral-network',
    title: 'Working with Outside Advisors',
    summary:
      'Coordinate with financial planners, attorneys, and other professionals who serve your shared clients.',
    content: `In the Medicare and health insurance world, your clients' decisions are rarely made in isolation. A retiree choosing between Medicare Advantage and Medigap is often simultaneously working with a financial planner on retirement income, an estate attorney on healthcare directives, and an accountant on tax-efficient withdrawal strategies. The CRM's Outside Advisors feature helps you coordinate with these professionals to deliver a better client experience and strengthen your professional network.

To add an outside advisor, navigate to Referral Network > Outside Advisors and click "New Advisor." Enter their name, credentials, firm, specialty, and contact details. Then link them to the client accounts they serve—this creates a visible web of relationships so you can see at a glance which professionals are involved with each client. For example, when you open a client's account record, the "Advisors" tab might show their financial planner, estate attorney, and CPA, complete with contact information and your last communication date with each.

Coordination with outside advisors typically happens during key life transitions: retirement, spouse's death, disability, or a change in financial circumstances that triggers a Special Enrollment Period. When these events occur, the CRM helps you proactively reach out to relevant advisors. For instance, if a client's spouse passes away and they are now eligible for a Medicare SEP, you might contact their financial planner to discuss how the coverage change affects their overall retirement plan. Log these interactions on the advisor record's activity timeline so your communication history is preserved.

The Advisor Network report provides a high-level view of your professional relationships. It shows the total number of advisors you work with, grouped by specialty, along with the number of shared clients and interactions logged. Agents who actively maintain advisor relationships often find that these professionals become a significant referral source over time—a financial planner who trusts you with their clients' Medicare decisions will naturally send new prospects your way when those clients are aging into Medicare eligibility.`,
    tags: [
      'advisors',
      'financial-planners',
      'attorneys',
      'coordination',
      'client-service',
      'professional-network',
      'SEP',
    ],
    difficulty: 'intermediate',
  },
  {
    id: 'rn-community-events',
    module: 'referral-network',
    title: 'Community Events',
    summary:
      'Plan, promote, and execute Medicare educational seminars and community outreach events to generate leads and build local presence.',
    content: `Community events—Medicare educational seminars, health fairs, and wellness workshops—are a proven lead generation strategy for health insurance agents. They position you as a trusted local expert, give prospects a low-pressure environment to learn about their options, and create face-to-face connections that digital marketing cannot replicate. The CRM's event management tools help you plan, promote, execute, and follow up on these events without dropping any details.

To create an event, navigate to Referral Network > Community Events and click "New Event." Fill in the basics: event name, type (seminar, health fair, webinar, workshop, or community booth), date and time, venue, and capacity. Link the event to a marketing campaign so all leads generated are properly attributed. If this is a Medicare plan-specific event, use the compliance checklist to confirm that your materials have been filed with CMS, your scope-of-appointment forms are prepared, and your disclaimers are included in all promotional materials.

Promotion is critical to event attendance. Use the CRM's integrated tools to create and send invitation emails to your contact segments, post on social media, and generate a registration web form that you can embed on your website or share as a link. The RSVP tracking feature gives you a real-time count of confirmed attendees so you can plan seating, handouts, and refreshments. Set up automated reminder emails—one week before, one day before, and the morning of the event—to minimize no-shows. For webinars, the CRM can generate and distribute unique join links to each registrant.

After the event, the real work begins. Import your attendee sign-in sheet (if paper-based) or review the automatically captured web registrations. Create leads from attendees who are not already in your system, and log the event interaction on existing contact records. Send a follow-up email within 24 hours thanking attendees, providing any promised resources (slides, plan comparison sheets), and offering to schedule a one-on-one consultation. The event's performance metrics—registrations, attendance rate, leads created, and eventual enrollments—flow into your campaign analytics, helping you decide which event types and venues deserve repeat investment.`,
    tags: [
      'events',
      'seminars',
      'health-fairs',
      'community',
      'lead-generation',
      'CMS-compliance',
      'RSVP',
      'follow-up',
    ],
    difficulty: 'beginner',
  },
];
