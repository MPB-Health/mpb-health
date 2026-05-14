import type { PageHelp, HelpArticle } from '../types';

// CRM rebuild Section 9 / Round 5 — Recruiting clone parity. Help coverage
// for the new top-level Recruiting workspace, mirroring Leads structurally
// but kept fully separate from consumer Members and Leads (no commingling
// of records, lists, or sends per spec).

export const recruitingPageHelp: PageHelp = {
  pageKey: 'recruiting',
  title: 'Recruiting',
  description:
    'A top-level workspace dedicated to recruiting health insurance agents and agencies. Structurally a clone of Leads — subsection button bar, profile layout, top-row Note / Call / Email / Text / Task actions, Pin to Today, in-profile email composer with template insert, bulk-assign and mass-email — but data, sends, and cadences are kept fully separate from consumer Members and Leads.',
  quickTips: [
    {
      id: 'rec-tip-1',
      text: 'Use the subsection bar (Working / Nurture / LinkedIn / Do Not Contact) to slice the agent pipeline the same way you do for consumer leads.',
    },
    {
      id: 'rec-tip-2',
      text: 'License #, NPN, agency affiliation, and appointed carriers are the recruiting-specific fields you will fill in after the prospect is created. They drive the per-rep templates that ship in P5.',
    },
    {
      id: 'rec-tip-3',
      text: 'Bulk-assign and bulk-email work just like they do on Leads — select rows, pick an owner or template, send. Sends are attributed to crm_email_log.recruit_id so the timeline and Daily Log auto-capture both work end-to-end.',
    },
    {
      id: 'rec-tip-4',
      text: 'Recruiting-specific cadences live under /cadences with a Recruiting scope filter. Leads cadences and Recruiting cadences never crosstalk: enrolling a consumer lead in a recruiting-scoped cadence is rejected by the database.',
    },
    {
      id: 'rec-tip-5',
      text: 'Pin to Today works for recruits the same as for leads. Pinned recruits show up in the rep focus list under /today so you do not lose track of high-priority outreach.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'first_name',
      label: 'First name',
      hint: 'The agent or agency-principal first name. Required.',
    },
    {
      fieldKey: 'last_name',
      label: 'Last name',
      hint: 'The agent or agency-principal last name. Required.',
    },
    {
      fieldKey: 'agency_affiliation',
      label: 'Agency affiliation',
      hint: 'Agency or FMO they currently produce through. Helps territory and product targeting.',
    },
    {
      fieldKey: 'license_number',
      label: 'License #',
      hint: 'State producer license number. Used for compliance checks before any outbound recruiting messaging.',
    },
    {
      fieldKey: 'npn',
      label: 'NPN',
      hint: 'National Producer Number from NIPR. The single most important identity field for an agent record.',
    },
    {
      fieldKey: 'appointed_carriers',
      label: 'Appointed carriers',
      hint: 'List of carriers the agent currently holds active appointments with. Drives which talking points are relevant.',
    },
    {
      fieldKey: 'pipeline_stage',
      label: 'Pipeline stage',
      hint: 'Recruiting pipeline stage (Prospect → Contacted → Interviewing → Contracted → Onboarding → Active → Inactive). The exact stage list is finalized in a future round.',
    },
  ],
  faqs: [
    {
      question: 'Why is Recruiting separated from Leads instead of being a tag?',
      answer:
        'Spec requirement: agent recruiting messaging, cadences, and reporting must never commingle with consumer Members and Leads. The Recruiting workspace is a structural clone of Leads but uses a separate database table (crm_recruiting_records), separate cadence scope (module_scope = "recruiting"), and separate audit columns (crm_email_log.recruit_id) so a misclick can never send a consumer-leads cadence to an agent.',
    },
    {
      question: 'Can I move someone between Members, Leads, and Recruiting?',
      answer:
        'Not directly — by design. If a Member or Lead turns out to be an agent, create a new Recruiting record (with their NPN and license #) and add a note linking the original record so you keep the historical context. The two pipelines are deliberately air-gapped to protect compliance.',
    },
    {
      question: 'Where do my Recruiting activities show up in the Daily Log?',
      answer:
        'Sales Daily Logs auto-captures every recruiting activity (call, note, email, task) the same way it does for leads. Calls, notes, emails, and template-driven sends all land in the rep&apos;s daily log under the appropriate section.',
    },
  ],
  relatedArticles: ['rec-overview', 'rec-bulk-actions'],
};

export const recruitingArticles: HelpArticle[] = [
  {
    id: 'rec-overview',
    module: 'recruiting',
    title: 'Recruiting workspace overview',
    summary:
      'How the Recruiting section mirrors Leads, what is shared, and what is intentionally kept separate.',
    content: `The Recruiting workspace is a structural clone of Leads built specifically for recruiting health insurance agents and agencies. You get the same subsection button bar (Working / Nurture / LinkedIn / Do Not Contact), the same Lead-Profile-style layout, the same five-button top action row (Note / Call / Email / Text / Task), the same Pin to Today affordance, and the same in-profile email composer with template insert.

What is intentionally separate:
• Records live in their own table (crm_recruiting_records) and have recruiting-specific fields (license #, NPN, appointed carriers, agency affiliation).
• The pipeline has its own stage list — agent recruiting does NOT use the consumer 8-stage pipeline. The default stages today are Prospect → Contacted → Interviewing → Contracted → Onboarding → Active → Inactive; the final list is locked in a future round.
• Cadences are scoped per module via crm_follow_up_cadences.module_scope. Leads cadences cannot be applied to recruits, and recruiting cadences cannot be applied to consumer leads — both client-side and server-side enforcement.
• Email sends from the Recruit Profile (or recruiting bulk-email) attribute to crm_email_log.recruit_id, so the recruit timeline, Templates usage metrics, and Daily Log all stay clean.

What is shared:
• Per-rep "My Templates" library and the admin-curated Master Template Library are both available from the Recruit Profile composer.
• The crm_focus_items table (Pin to Today) accepts entity_type='recruiting'.
• Sales Daily Logs auto-captures every recruiting activity via the same trigger that captures leads activities.`,
    tags: ['recruiting', 'overview', 'navigation', 'pipeline'],
    difficulty: 'beginner',
  },
  {
    id: 'rec-bulk-actions',
    module: 'recruiting',
    title: 'Bulk-assign and bulk-email recruits',
    summary:
      'Select recruits in the list, then use the bulk-actions toolbar to reassign owners or send a master-template email to dozens of agents at once.',
    content: `Bulk actions on the Recruiting list mirror the Leads bulk actions:

1. Check the box on each row you want to act on, or use the header checkbox to select-all in the current view.
2. The blue toolbar slides in at the top with the count.
3. Pick "Assign" to reassign the recruits to a different rep (or "Unassigned" to put them back into the pool). Activity history is preserved automatically — only the owner changes.
4. Pick "Send Email" to mass-send a Master Library or personal template. The modal renders #firstname / {{first_name}} tokens from each recruit&apos;s profile so each send is personalized. Recruits without an email on file are skipped with a warning so the rest of the batch still goes through.
5. "Mark Lost" sets stage = inactive, subsection = do_not_contact, and flags DNC across the selection in one click.

Every send writes a row to crm_email_log with recruit_id populated, so the recruit timeline picks it up. Daily Log auto-capture picks up the implicit crm_activities row written alongside, so reps see the bulk send reflected in their daily log totals automatically.`,
    tags: ['recruiting', 'bulk-actions', 'mass-email', 'assign'],
    difficulty: 'beginner',
  },
];
