import type { PageHelp, HelpArticle } from '../types';

// Section 9 / Round 5: "Contacts" was renamed to "Members" in the sidebar
// and across the UI. The Contacts module continues to back the page; only
// the user-visible label changed. The /contacts route now redirects to
// /members, with /contacts/legacy preserved for admin auditing.

export const accountsPageHelp: PageHelp = {
  pageKey: 'accounts',
  title: 'Accounts',
  description:
    'Accounts represent organizations, families, or employer groups you do business with. Use accounts to group related contacts, track policies at the household level, and manage group benefits.',
  quickTips: [
    {
      id: 'acct-tip-1',
      text: 'Create an account for each household or employer group so you can see all related contacts and policies in one place.',
    },
    {
      id: 'acct-tip-2',
      text: 'Use the "Linked Contacts" tab on an account to quickly see every individual associated with that household or organization.',
    },
    {
      id: 'acct-tip-3',
      text: 'Tag accounts with labels like "Medicare Household," "Group Benefits," or "Under-65 Family" to segment them in reports and marketing campaigns.',
    },
    {
      id: 'acct-tip-4',
      text: 'The account timeline aggregates activity from all linked contacts, giving you a full interaction history at the household or group level.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'account_name',
      label: 'Account Name',
      hint: 'A descriptive name for the account—typically the family surname, business name, or employer group name.',
    },
    {
      fieldKey: 'account_type',
      label: 'Account Type',
      hint: 'Categorize the account: Individual/Household, Small Business, Employer Group, or Referral Partner Organization.',
    },
    {
      fieldKey: 'primary_contact',
      label: 'Primary Contact',
      hint: 'The main point of contact for this account. This person receives account-level communications by default.',
    },
    {
      fieldKey: 'state',
      label: 'State',
      hint: 'The primary state for this account. Used for territory assignment and licensing compliance checks.',
    },
  ],
  faqs: [
    {
      question: 'What is the difference between an account and a contact?',
      answer:
        'An account is a grouping entity (household, business, or organization), while a contact is an individual person. One account can have many contacts. For example, a "Smith Household" account might contain John Smith and Jane Smith as separate contacts.',
    },
    {
      question: 'Can a contact belong to multiple accounts?',
      answer:
        'Yes. A contact can be linked to more than one account. This is useful when a person is both a member of a household account and an employee in a group benefits account.',
    },
    {
      question: 'How do I merge duplicate accounts?',
      answer:
        'Select two accounts from the list view, then click "Merge" in the bulk-action bar. The CRM will combine contacts, activities, and deals from both records into a single master account. You choose which field values to keep.',
    },
  ],
  relatedArticles: [
    'ac-managing-accounts',
    'ac-working-contacts',
    'ac-linking',
  ],
};

export const contactsPageHelp: PageHelp = {
  pageKey: 'contacts',
  title: 'Members',
  description:
    'Members (formerly "Contacts") are individual people — Medicare beneficiaries, plan members, HR decision-makers, or referral partners. Each Member record stores demographics, communication preferences, policy history, and a full activity timeline. The Section 9 rebrand renamed this section; the legacy /contacts paths continue to redirect to /members.',
  quickTips: [
    {
      id: 'con-tip-1',
      text: 'Always check for an existing contact before creating a new one—use Global Search (Ctrl+K) to search by name, phone, or email.',
    },
    {
      id: 'con-tip-2',
      text: 'Set communication preferences (email, phone, text, mail) on each contact so outreach respects their wishes and CMS marketing guidelines.',
    },
    {
      id: 'con-tip-3',
      text: 'Use the "Policy History" tab to view all current and past insurance policies associated with a contact, including carrier, plan name, effective dates, and premium.',
    },
    {
      id: 'con-tip-4',
      text: `Add notes after every interaction. Notes are searchable and appear in the contact's activity timeline for anyone on the team.`,
    },
  ],
  fieldHints: [
    {
      fieldKey: 'contact_first_name',
      label: 'First Name',
      hint: 'Legal first name. Used for mail merge, greeting lines, and compliance documents.',
    },
    {
      fieldKey: 'contact_last_name',
      label: 'Last Name',
      hint: 'Legal last name. Combined with first name for display and de-duplication.',
    },
    {
      fieldKey: 'date_of_birth',
      label: 'Date of Birth',
      hint: 'Used to calculate Medicare eligibility (turning 65), aging-in alerts, and birthday outreach campaigns.',
    },
    {
      fieldKey: 'medicare_id',
      label: 'Medicare Beneficiary ID (MBI)',
      hint: 'The 11-character Medicare Beneficiary Identifier. Stored encrypted and masked for non-admin roles per HIPAA best practices.',
    },
  ],
  faqs: [
    {
      question: `How do I record a contact's communication preferences?`,
      answer:
        'Open the contact record and navigate to the "Preferences" section. Toggle the allowed channels (email, phone, text, direct mail) and add any notes about preferred times or languages. These preferences are enforced by the campaign and sequence engines.',
    },
    {
      question: 'What happens when I delete a contact?',
      answer:
        'Deleting a contact is a soft delete—the record moves to the Recycle Bin and can be restored within 30 days. All associated activities and notes are preserved. After 30 days the record is permanently purged. Deals linked to the contact are not deleted but will show a "Contact Removed" notice.',
    },
    {
      question: 'Can I track multiple phone numbers or emails for one contact?',
      answer:
        'Yes. Each contact supports a primary and multiple secondary phone numbers and email addresses. You can label each one (Home, Work, Mobile) and set which is the default for outbound communications.',
    },
  ],
  relatedArticles: [
    'ac-working-contacts',
    'ac-managing-accounts',
    'ac-linking',
  ],
};

export const accountsContactsArticles: HelpArticle[] = [
  {
    id: 'ac-managing-accounts',
    module: 'accounts-contacts',
    title: 'Managing Accounts',
    summary:
      'How to create, organize, and leverage accounts to manage households, families, and employer groups.',
    content: `Accounts in MPB CRM serve as umbrella records that group related contacts together. For a Medicare-focused agency, the most common account type is the Household—grouping a married couple who both have Medicare plans under one account makes it easy to see the family's full picture during AEP reviews. For agencies that also handle group benefits, an Employer Group account ties all employees to the organization.

To create an account, click "+ New Account" on the Accounts page. Fill in the account name (e.g., "The Johnson Household" or "Sunrise Senior Living"), select the account type, and set the primary state. The primary contact field should point to the person who is your main point of communication for that account. Once created, you can link existing contacts to the account via the "Linked Contacts" tab, or create new contacts directly from the account record.

The account detail page provides a consolidated view of everything happening across all linked contacts. The activity timeline merges interactions from every contact, so you can see that you called John last Tuesday and emailed Jane on Wednesday without switching between records. The "Deals" tab shows all open and closed deals for the account, and the "Documents" tab aggregates files uploaded to any linked contact—ideal for storing household-level documents like a joint Scope of Appointment form.

Use account-level tags and custom fields to drive segmentation. For example, tag accounts as "AEP Priority" if any linked contact has a policy renewing during the enrollment window. Then create a Saved Filter that shows all AEP Priority accounts so you can run targeted outreach. Account data also feeds into forecasting and reporting, allowing you to analyze revenue at the household or group level rather than just per individual.`,
    tags: ['accounts', 'household', 'employer-group', 'organization', 'manage'],
    difficulty: 'beginner',
  },
  {
    id: 'ac-working-contacts',
    module: 'accounts-contacts',
    title: 'Working with Contacts',
    summary:
      'Best practices for creating, enriching, and managing individual contact records in the CRM.',
    content: `Every person you interact with—Medicare beneficiaries, spouses, HR managers, referral partners—should have a contact record in the CRM. A well-maintained contact database is the foundation of effective sales and service. When creating a new contact, provide as much information as possible: full legal name, date of birth, email, phone, mailing address, and Medicare Beneficiary ID (if applicable). The more complete the record, the better the CRM can support automation, compliance, and personalized outreach.

The contact detail page is organized into sections. The top section shows key identifiers and quick actions (call, email, text, schedule meeting). Below that, tabs let you navigate between Profile (demographics and custom fields), Activity (chronological interaction log), Policies (current and past coverage), Deals (open and closed), Documents (attached files), and Preferences (communication channels, language, best time to reach). Spend a few seconds reviewing the Activity tab before making a call—knowing what was discussed last time builds trust and avoids redundant questions.

De-duplication is critical in a CRM with multiple lead sources. When you create or import a contact, the system runs a fuzzy match against existing records using name, email, phone, and date of birth. If a likely duplicate is found, you are prompted to merge or skip. You can also run a manual duplicate scan from Settings > Data Management > Duplicate Detection, which surfaces potential matches across the entire database with a confidence score.

Finally, leverage contact-level automation to stay proactive. Set up birthday outreach automations, aging-in alerts (contacts turning 65 in the next 12 months), and policy renewal reminders. These automations create tasks or send emails at exactly the right time, ensuring that no client falls through the cracks—even if you have hundreds of contacts to manage. The CRM does the remembering so you can focus on the conversations.`,
    tags: ['contacts', 'de-duplication', 'demographics', 'Medicare-ID', 'automation'],
    difficulty: 'beginner',
  },
  {
    id: 'ac-linking',
    module: 'accounts-contacts',
    title: 'Linking Contacts to Accounts',
    summary:
      'How to associate individual contacts with household, family, or employer accounts for unified management.',
    content: `Linking contacts to accounts creates a relational structure that mirrors real life. A married couple sharing a household, employees in a company, or members of a community organization can all be grouped under a single account. This grouping unlocks powerful capabilities: consolidated activity timelines, household-level reporting, and the ability to send coordinated communications to everyone in the account at once.

To link a contact to an account, open the account record and click "+ Link Contact" on the Linked Contacts tab. Search for the contact by name, email, or phone, then select the appropriate relationship role (e.g., "Spouse," "Dependent," "Employee," "Primary Decision Maker"). Roles help you understand the dynamics of the account and determine who should receive which communications. You can also link a contact from the contact's own detail page by selecting "Add to Account" in the actions menu.

When a contact is linked to an account, the contact's activities begin appearing in the account's aggregated timeline. Documents uploaded to the contact are also visible from the account's Documents tab, tagged with the contact's name. If you create a deal for the contact, that deal appears in both the contact's Deals tab and the account's Deals tab, giving you two views into the same data—individual and household.

For agencies that handle employer groups, linking is especially valuable. Create an account for the employer, link each employee as a contact with the role "Employee," and designate the HR manager as the "Primary Contact." When it is time for the group's annual renewal, you can pull up the account and see every employee's current plan, any open support cases, and the renewal timeline—all in one place. This eliminates the need to search for each person individually and ensures nothing is missed during a busy group renewal cycle.`,
    tags: ['linking', 'accounts', 'contacts', 'household', 'relationships', 'roles'],
    difficulty: 'intermediate',
  },
];
