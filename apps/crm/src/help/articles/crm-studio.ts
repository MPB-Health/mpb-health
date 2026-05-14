import type { PageHelp, HelpArticle } from '../types';

export const studioPageHelp: PageHelp = {
  pageKey: 'studio',
  title: 'CRM Studio (Legacy)',
  description:
    'Section 9 / Round 5: Studio was retired from the sidebar. /studio* now redirects into Settings, with the legacy admin module preserved at /studio/legacy. Existing custom modules continue to resolve at /custom/:moduleApiName so the schemas you authored here still work — only the entry point moved.',
  quickTips: [
    {
      id: 'studio-tip-1',
      text: 'Plan your custom module structure on paper before building it in Studio. Decide on fields, relationships, and layouts upfront to avoid rework.',
    },
    {
      id: 'studio-tip-2',
      text: 'Use field dependencies to show or hide fields based on other field values—for example, show "Supplement Plan Letter" only when Plan Type is "Medigap."',
    },
    {
      id: 'studio-tip-3',
      text: 'Test custom layouts by switching to "Preview Mode" to see exactly what agents will experience when creating or editing records.',
    },
    {
      id: 'studio-tip-4',
      text: 'Export your Studio configuration periodically as a backup. You can reimport it to restore settings or replicate the setup in another organization.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'moduleName',
      label: 'Module Name',
      hint: 'The display name for your custom module (e.g., "Carrier Contracts," "Certifications"). Use a clear, plural noun.',
    },
    {
      fieldKey: 'moduleKey',
      label: 'Module Key',
      hint: 'A unique, lowercase identifier used in the API and automation rules. Cannot be changed after creation.',
    },
    {
      fieldKey: 'moduleIcon',
      label: 'Icon',
      hint: 'Choose an icon that visually represents the module. It appears in the sidebar navigation and record headers.',
    },
    {
      fieldKey: 'fieldType',
      label: 'Field Type',
      hint: 'Text, Number, Date, Dropdown, Multi-Select, Checkbox, Lookup (relationship), Formula, or Auto-Number.',
    },
    {
      fieldKey: 'layoutSections',
      label: 'Layout Sections',
      hint: 'Group related fields into collapsible sections. Use section headers like "Basic Info," "Policy Details," "Internal Notes."',
    },
  ],
  faqs: [
    {
      question: 'Can I delete a custom module after creating it?',
      answer:
        'Yes, but deletion is permanent and removes all records within that module. The system requires you to type the module name to confirm. Consider deactivating the module instead if you might need the data later.',
    },
    {
      question: 'How do custom fields affect existing records?',
      answer:
        'When you add a new field, existing records show it as blank until updated. You can set a default value that applies to new records only or use a bulk update to populate the field across existing records.',
    },
    {
      question: 'Can I create relationships between custom modules and standard modules?',
      answer:
        'Yes. Use Lookup fields to create one-to-many or many-to-many relationships. For example, a custom "Certifications" module can link to Contacts via a Lookup field, showing all certifications on the contact record.',
    },
    {
      question: 'Is there a limit to the number of custom fields?',
      answer:
        'Each module supports up to 500 custom fields. If you approach this limit, consider whether some fields should be consolidated or moved to a related custom module.',
    },
  ],
  relatedArticles: [
    'crm-studio-overview',
    'creating-custom-modules',
    'custom-fields-layouts',
  ],
  videoUrl: 'https://help.mpbhealth.com/videos/crm-studio-overview',
};

export const crmStudioArticles: HelpArticle[] = [
  {
    id: 'crm-studio-overview',
    module: 'crm-studio',
    title: 'CRM Studio Overview',
    summary:
      'Get oriented with CRM Studio—the customization hub where you tailor modules, fields, and layouts to match your agency\'s processes.',
    content: `CRM Studio is the centralized customization environment where administrators and power users configure the CRM to match their agency's specific workflows, data requirements, and terminology. Rather than forcing your team to adapt to a rigid, one-size-fits-all structure, Studio lets you mold the CRM around how your agency actually operates. This is particularly valuable for health insurance agencies that need to track Medicare-specific data points, carrier relationships, certification statuses, and compliance milestones that generic CRM platforms don't accommodate out of the box.

When you first open CRM Studio, you see a dashboard listing all modules—both standard (Contacts, Leads, Deals, Cases) and any custom modules your organization has created. Each module card shows the number of custom fields, the active layout configuration, and quick links to edit fields, layouts, and relationships. The left sidebar provides navigation to global settings like picklist value management, field dependency rules, and module relationship maps.

The three core capabilities of CRM Studio are custom modules, custom fields, and custom layouts. Custom modules let you create entirely new record types—such as "Carrier Contracts," "Agent Certifications," or "Compliance Audits"—that live alongside standard modules and support all the same features: list views, detail pages, automation triggers, reporting, and API access. Custom fields let you add data points to any module, whether standard or custom, using a variety of field types from simple text and dates to complex formulas and multi-level lookups. Custom layouts control the visual arrangement of fields on create, edit, and detail pages, letting you group fields into logical sections and control which fields appear based on user role or record type.

Getting started with Studio is best done incrementally. Identify one workflow that your current setup doesn't support well—perhaps tracking which carriers each agent is certified with—and build a focused solution using a custom module with the fields and relationships you need. Test it with a small group, gather feedback, and iterate. This approach builds your team's confidence in Studio and produces practical results quickly, rather than attempting a comprehensive customization project that takes weeks to plan and execute.`,
    tags: [
      'CRM Studio',
      'customization',
      'modules',
      'fields',
      'layouts',
      'configuration',
      'admin',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'creating-custom-modules',
    module: 'crm-studio',
    title: 'Creating Custom Modules',
    summary:
      'Build new record types to track data unique to your agency, from carrier contracts to agent certifications.',
    content: `Custom modules extend the CRM beyond its standard record types, letting you track any entity that matters to your business. For a health insurance agency, common custom modules include Carrier Contracts (tracking contracted carriers, commission schedules, and contract renewal dates), Agent Certifications (recording AHIP, carrier-specific, and state certifications with expiration tracking), Compliance Audits (documenting internal quality reviews and CMS audit findings), and Policy Records (maintaining a detailed history of every policy sold, distinct from the Deals module which tracks the sales process).

To create a custom module, navigate to CRM Studio and click "New Module." You provide a display name, a unique module key (used internally by the API and automation engine), an icon, and a description. The module key follows a lowercase, hyphenated convention (e.g., "carrier-contracts") and cannot be changed after creation, so choose carefully. After saving, the new module appears in the sidebar navigation and you can immediately start adding fields and designing the layout.

Every custom module automatically inherits a set of system fields: a unique record ID, created date, modified date, created by, and owner. From there, you add the fields that capture your specific data requirements. For a Carrier Contracts module, you might add fields like Carrier Name (lookup to Accounts), Contract Start Date, Contract End Date, Commission Type (dropdown: Level, Graded, Heaped), Commission Percentage, Auto-Renewal (checkbox), and Contract Document (file attachment). Each field has properties you can configure: whether it's required, its default value, validation rules, and help text that appears when users hover over the field label.

After defining fields, establish relationships to other modules. A Carrier Contracts module might relate to Accounts (the carrier) via a lookup field and to Contacts (certified agents) via a many-to-many junction. These relationships enable powerful queries—for example, "Show me all agents certified with Carrier X whose contracts expire in the next 60 days"—and they surface related records on detail pages so users see the full picture without navigating away. Finally, set up list view columns, default sort order, and any automation rules specific to the new module, such as sending a notification when a contract is within 30 days of expiration.`,
    tags: [
      'custom modules',
      'CRM Studio',
      'carrier contracts',
      'certifications',
      'record types',
      'module creation',
    ],
    difficulty: 'intermediate',
  },
  {
    id: 'custom-fields-layouts',
    module: 'crm-studio',
    title: 'Custom Fields & Layouts',
    summary:
      'Add custom fields to capture the data you need and design record layouts that make your team more productive.',
    content: `Custom fields let you extend any module—standard or custom—with additional data points tailored to your agency's needs. The CRM supports a comprehensive set of field types: Text (single-line and multi-line), Number (integer and decimal), Currency, Date and DateTime, Checkbox, Dropdown (single-select), Multi-Select, Lookup (relationship to another module), Formula (calculated from other fields), Auto-Number (sequential identifiers), Email, Phone, URL, and File Attachment. Choosing the right field type matters because it determines validation behavior, how the field appears in filters and reports, and what merge field formatting is available in templates.

When creating a field, consider its operational impact beyond just storing data. A "Plan Type" dropdown on a Deal record, for example, might have values like "Medicare Advantage," "Medicare Supplement," "Part D," and "ACA." This single field can drive field dependencies (showing carrier-specific fields only when the relevant plan type is selected), automation rules (routing MA leads to the MA specialist team), report groupings (deals won by plan type this quarter), and template conditional sections (different email content for MA vs. Supplement clients). Investing time in thoughtful field design pays compounding returns across the entire system.

Layout customization controls how fields are arranged on record create, edit, and detail pages. The layout editor uses a drag-and-drop interface where you organize fields into sections, set the number of columns per section (one or two), and determine field ordering within each section. Common section groupings for a health insurance contact record include "Personal Information" (name, DOB, SSN last four, Medicare ID), "Contact Details" (phone, email, address), "Insurance Profile" (current coverage, plan type, carrier, effective date), "Agent Assignment" (assigned agent, team, territory), and "Internal Notes" (private notes, tags, lead score).

Advanced layout features include conditional field visibility and role-based layouts. Conditional visibility rules hide or show fields based on other field values—for example, the "Supplement Plan Letter" field only appears when Plan Type equals "Medicare Supplement." Role-based layouts let you present different field arrangements to different user roles. A sales agent might see a streamlined layout focused on contact information and deal progression, while a compliance officer sees a layout emphasizing documentation status, SOA completion, and audit fields. These capabilities ensure every team member sees exactly the information relevant to their role without visual clutter from irrelevant fields.`,
    tags: [
      'custom fields',
      'layouts',
      'field types',
      'CRM Studio',
      'record layout',
      'field dependencies',
      'role-based layouts',
    ],
    difficulty: 'intermediate',
  },
];
