import type { PageHelp, HelpArticle } from '../types';

export const settingsPageHelp: PageHelp = {
  pageKey: 'settings',
  title: 'Settings & Administration',
  description:
    'Configure your organization\'s CRM settings including user management, roles, permissions, approval workflows, and system preferences.',
  quickTips: [
    {
      id: 'settings-tip-1',
      text: 'Review user roles and permissions quarterly to ensure team members have appropriate access as responsibilities change.',
    },
    {
      id: 'settings-tip-2',
      text: 'Set up approval processes for high-value deals and discount requests to maintain oversight without creating bottlenecks.',
    },
    {
      id: 'settings-tip-3',
      text: 'Configure your fiscal year and business hours first—many other features like SLA timers and forecasting depend on these settings.',
    },
    {
      id: 'settings-tip-4',
      text: 'Use the audit log in Settings to track who changed critical configuration like roles, automation rules, or data deletion policies.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'orgName',
      label: 'Organization Name',
      hint: 'Your agency name as it appears in the CRM header, automated emails, and client-facing communications.',
    },
    {
      fieldKey: 'timezone',
      label: 'Default Timezone',
      hint: 'The timezone used for system-generated timestamps, SLA calculations, and scheduled automations. Individual users can override with their local timezone.',
    },
    {
      fieldKey: 'fiscalYear',
      label: 'Fiscal Year Start',
      hint: 'The month your fiscal year begins. Affects forecasting periods, quota calculations, and annual report date ranges.',
    },
    {
      fieldKey: 'businessHours',
      label: 'Business Hours',
      hint: 'Define your operating hours and days. Used by SLA timers, auto-responders, and scheduling features.',
    },
    {
      fieldKey: 'dataRetention',
      label: 'Data Retention Policy',
      hint: 'How long deleted records are retained in the recycle bin before permanent removal. Minimum 30 days; recommended 90 days for compliance.',
    },
  ],
  faqs: [
    {
      question: 'How do I add a new user?',
      answer:
        'Go to Settings > Users, click "Invite User," enter their email and select a role. They receive an invitation email with instructions to set up their account. You can also bulk-import users via CSV.',
    },
    {
      question: 'Can I restrict data access by territory or team?',
      answer:
        'Yes. Use "Data Sharing Rules" in Settings to configure record visibility. You can set organization-wide defaults (Private or Public) and then create sharing rules that grant access based on role hierarchy, team membership, or territory assignment.',
    },
    {
      question: 'How do I reset a user\'s password?',
      answer:
        'Go to Settings > Users, find the user, click their profile, and select "Reset Password." They receive an email with a secure reset link. Admins cannot see or set passwords directly.',
    },
    {
      question: 'What happens when I deactivate a user?',
      answer:
        'Deactivated users can no longer log in, but their records, activities, and assignments are preserved. You can reassign their open records to another user during deactivation.',
    },
  ],
  relatedArticles: [
    'organization-settings',
    'user-roles-permissions',
    'approval-processes',
  ],
  videoUrl: 'https://help.mpbhealth.com/videos/settings-overview',
};

export const settingsArticles: HelpArticle[] = [
  {
    id: 'organization-settings',
    module: 'settings',
    title: 'Organization Settings',
    summary:
      'Configure foundational settings like timezone, fiscal year, business hours, and branding that affect the entire CRM.',
    content: `Organization settings form the foundation upon which every other CRM feature operates. When you first set up your agency's CRM instance, configuring these settings correctly saves significant rework down the line. The most impactful settings to get right from the start are your default timezone, fiscal year start month, business hours, and currency—these influence SLA calculations, forecasting periods, scheduled automation timing, and financial reporting across the entire system.

The timezone setting determines how timestamps are displayed system-wide and when time-based automations execute. If your agency operates across multiple time zones, set the organization default to your headquarters' timezone and let individual users configure their local timezone in their profile. Business hours define when your agency is operational—typically used by SLA timers to calculate response times excluding nights and weekends, and by auto-responders to set client expectations for reply times outside business hours. You can define multiple business hour profiles if you have teams in different regions or with different schedules.

Branding settings let you customize the CRM's appearance and client-facing communications. Upload your agency logo, set brand colors for the header and sidebar, and configure the "From" name and address for system-generated emails. These details matter because they affect the professionalism of every email, PDF document, and web form your agency sends through the CRM. Consistent branding builds trust with Medicare beneficiaries who may be wary of communications from unfamiliar sources.

Data management settings control how your organization handles record deletion, data retention, and duplicate management. The recycle bin retention period determines how long deleted records remain recoverable—set this to at least 90 days for compliance with CMS record-keeping requirements. Duplicate detection rules can be configured to warn users when they create a record that matches an existing contact by name, email, phone number, or Medicare ID. The audit log, accessible from Settings, provides a comprehensive trail of administrative actions including role changes, automation rule modifications, data deletions, and configuration updates—essential for compliance audits and internal accountability.`,
    tags: [
      'settings',
      'organization',
      'timezone',
      'fiscal year',
      'business hours',
      'branding',
      'data retention',
      'audit log',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'user-roles-permissions',
    module: 'settings',
    title: 'User Roles & Permissions',
    summary:
      'Set up roles and permissions to control what each team member can see, edit, and administer in the CRM.',
    content: `The roles and permissions system controls what every user in your CRM can access, view, create, edit, and delete. Getting this right is critical for both data security and operational efficiency—agents should see the data they need to do their jobs effectively while being prevented from accidentally modifying records outside their responsibility or accessing sensitive information they shouldn't see. For Medicare agencies, proper role configuration is also a compliance consideration, as CMS guidelines require appropriate access controls for protected health information.

Roles in the CRM follow a hierarchical structure. A typical agency might have roles like Administrator, Agency Owner, Sales Manager, Senior Agent, Agent, and Support Specialist. Users higher in the hierarchy can see records owned by users below them, while users at the same level may or may not see each other's records depending on the organization-wide default sharing setting. Each role is assigned a permission profile that specifies module-level access (which modules the role can see in the navigation), record-level operations (create, read, edit, delete for each module), and field-level restrictions (which specific fields are visible or editable).

Creating a new role starts in Settings > Roles & Permissions. Click "New Role," name it, position it within the hierarchy, and then configure its permission profile. The permission editor presents a grid with modules as rows and operations as columns, making it easy to see the complete access picture at a glance. For common patterns, you can clone an existing role and modify it rather than starting from scratch. For example, if you need a "Junior Agent" role that's identical to "Agent" but without delete permissions, clone "Agent" and uncheck the delete column.

Field-level security adds a finer layer of control. You can mark specific fields as "Hidden" or "Read-Only" for certain roles. For instance, the "Commission Rate" field on a Deal record might be visible to Managers and Administrators but hidden from Agents, while the "SSN Last Four" field on a Contact record might be read-only for everyone except Administrators. These field-level rules are enforced in the UI, API, reports, and exports, providing consistent protection regardless of how users interact with the data. Review your role and permission configuration at least quarterly, especially when team members change positions, new hires join, or organizational responsibilities shift.`,
    tags: [
      'roles',
      'permissions',
      'user management',
      'access control',
      'security',
      'HIPAA',
      'field-level security',
      'role hierarchy',
    ],
    difficulty: 'intermediate',
  },
  {
    id: 'approval-processes',
    module: 'settings',
    title: 'Approval Processes',
    summary:
      'Configure multi-step approval workflows for deals, discounts, policy exceptions, and other actions requiring management sign-off.',
    content: `Approval processes add a structured review and authorization step to actions that require management oversight before proceeding. In a health insurance agency, common scenarios include approving deals above a certain value, authorizing commission overrides or special pricing, signing off on marketing materials for compliance review, and approving policy exception requests. The CRM's approval process engine supports single-step and multi-step approvals, parallel and sequential approver chains, and automatic escalation when approvals are overdue.

Setting up an approval process starts in Settings > Approval Processes. Click "New Process" and define the entry criteria—the conditions under which a record must go through approval. For example, an approval process for deals might specify "Deal Value > $10,000" or "Discount Percentage > 15%." When a record meets these criteria, the submitting user clicks "Submit for Approval" and the record enters a "Pending Approval" state that restricts editing until the approval is resolved. The approver (or approvers) receive a notification with a link to review the record and can approve, reject, or request changes with comments.

Multi-step approval processes chain multiple reviewers in sequence or parallel. A sequential chain is useful when approvals must follow a specific order—for example, team lead first, then compliance officer, then agency owner. A parallel configuration is appropriate when multiple independent approvals are needed simultaneously—for example, both the sales manager and finance manager must approve. You configure each step with its approver (a specific user, the record owner's manager, or a role), the actions to take on approval or rejection (update a field, send a notification, trigger an automation), and an optional time limit after which the approval auto-escalates.

The approval inbox gives approvers a centralized view of all pending approvals across all processes. From the inbox, they can review record details, see the submitter's comments, view previous approvers' decisions in multi-step processes, and take action without navigating to the individual record. For mobile approvers, the CRM sends email notifications with one-click approve and reject links that work directly from the email. Approval history is permanently recorded on each record, creating an audit trail that documents who approved what, when, and with what comments—valuable for compliance reviews and dispute resolution.`,
    tags: [
      'approval processes',
      'approvals',
      'workflow',
      'compliance',
      'authorization',
      'multi-step approval',
      'escalation',
      'audit trail',
    ],
    difficulty: 'advanced',
  },
];
