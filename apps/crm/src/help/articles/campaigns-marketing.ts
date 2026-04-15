import type { PageHelp, HelpArticle } from '../types';

export const campaignsPageHelp: PageHelp = {
  pageKey: 'campaigns',
  title: 'Campaigns',
  description:
    'Plan, execute, and measure marketing campaigns to generate leads and nurture prospects through enrollment.',
  quickTips: [
    {
      id: 'campaigns-tip-1',
      text: 'Tag every campaign with the enrollment period (AEP, OEP, SEP) so you can filter performance reports by season.',
    },
    {
      id: 'campaigns-tip-2',
      text: 'Use A/B testing on email subject lines to improve open rates before sending to your full list.',
    },
    {
      id: 'campaigns-tip-3',
      text: 'Connect campaign UTM parameters to your web forms so inbound leads are automatically attributed to the right campaign.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'campaignName',
      label: 'Campaign Name',
      hint: 'A descriptive name including the enrollment period and target audience (e.g., "AEP 2026 – Medicare Advantage Mailer").',
    },
    {
      fieldKey: 'campaignType',
      label: 'Type',
      hint: 'The channel or tactic: Email, Direct Mail, Seminar, Webinar, Digital Ads, Social Media, or Referral.',
    },
    {
      fieldKey: 'startDate',
      label: 'Start Date',
      hint: 'When the campaign begins running. For AEP campaigns, CMS allows marketing to start October 1.',
    },
    {
      fieldKey: 'endDate',
      label: 'End Date',
      hint: `When the campaign stops. Used to calculate ROI over the campaign's active window.`,
    },
    {
      fieldKey: 'budget',
      label: 'Budget',
      hint: 'The total planned spend for this campaign. Tracked against actual spend for ROI calculation.',
    },
    {
      fieldKey: 'status',
      label: 'Status',
      hint: 'Planning, Active, Paused, or Completed. Controls whether automated actions (emails, ads) continue running.',
    },
  ],
  faqs: [
    {
      question: 'How are leads attributed to a campaign?',
      answer:
        'Leads are linked to campaigns via UTM parameters on web forms, direct list uploads tagged with the campaign name, or manual association on the lead record.',
    },
    {
      question: `Can I reuse last year's AEP campaign?`,
      answer:
        'Yes. Clone any campaign to create a copy with all settings, templates, and audience segments intact. Update the dates, content, and product references for the new plan year.',
    },
    {
      question: 'What CMS compliance rules apply to marketing campaigns?',
      answer:
        'CMS requires that all Medicare marketing materials are filed and approved before distribution, contain required disclaimers, and follow scope-of-appointment rules for seminars. The CRM includes a compliance checklist on each campaign to help you track approval status.',
    },
  ],
  relatedArticles: ['cm-creating-campaign', 'cm-campaign-analytics', 'cm-social-media'],
};

export const socialMediaPageHelp: PageHelp = {
  pageKey: 'social-media',
  title: 'Social Media',
  description:
    `Schedule posts, monitor engagement, and manage your agency's social media presence across platforms.`,
  quickTips: [
    {
      id: 'social-tip-1',
      text: 'Schedule educational content about Medicare enrollment periods in advance to maintain a consistent posting cadence.',
    },
    {
      id: 'social-tip-2',
      text: 'Use the content calendar view to ensure you are not posting too frequently or leaving gaps between posts.',
    },
    {
      id: 'social-tip-3',
      text: 'Track which posts generate the most lead inquiries by tagging them with the associated campaign.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'platform',
      label: 'Platform',
      hint: 'The social network to post on: Facebook, LinkedIn, Instagram, or X (Twitter).',
    },
    {
      fieldKey: 'scheduledDate',
      label: 'Scheduled Date',
      hint: `When the post should be published. The system converts to the platform's timezone automatically.`,
    },
    {
      fieldKey: 'content',
      label: 'Post Content',
      hint: 'The text of your post. Character limits vary by platform—the editor warns you if you exceed them.',
    },
    {
      fieldKey: 'mediaAttachments',
      label: 'Media',
      hint: 'Attach images or videos. Use branded visuals for higher engagement. Max file size is 25 MB.',
    },
  ],
  faqs: [
    {
      question: 'Can I post to multiple platforms at once?',
      answer:
        `Yes. When creating a post, select all the platforms you want to publish on. The system will adapt the post format to each platform's requirements.`,
    },
    {
      question: 'Are there CMS compliance considerations for social media?',
      answer:
        'Yes. CMS requires that social media posts about Medicare plans include required disclaimers. The CRM can auto-append your compliance disclaimer to every post.',
    },
    {
      question: 'How do I connect my social accounts?',
      answer:
        'Go to Settings > Integrations > Social Media and follow the OAuth flow for each platform. You will need admin access to your business pages.',
    },
  ],
  relatedArticles: ['cm-social-media', 'cm-creating-campaign', 'cm-campaign-analytics'],
};

export const campaignsMarketingArticles: HelpArticle[] = [
  {
    id: 'cm-creating-campaign',
    module: 'campaigns-marketing',
    title: 'Creating a Marketing Campaign',
    summary:
      'Step-by-step guide to planning, building, and launching a marketing campaign for Medicare enrollment.',
    content: `Marketing campaigns are how you generate new leads and stay top-of-mind with prospects during critical enrollment windows. A well-structured campaign in the CRM ties together your audience, messaging, channel, budget, and compliance requirements into a single trackable entity.

To create a campaign, navigate to Campaigns and click "New Campaign." Start by giving it a clear, descriptive name that includes the enrollment period and channel—something like "AEP 2026 – Email Drip – T65 Prospects." Select the campaign type (Email, Direct Mail, Seminar, Webinar, Digital Ads, Social Media, or Referral) and set the start and end dates. For AEP campaigns, remember that CMS permits Medicare marketing materials to be distributed starting October 1, so plan your launch accordingly.

Next, define your target audience. You can build an audience segment from your existing leads and contacts using filters like age, zip code, product interest, last contact date, and enrollment status. For example, you might target contacts who are turning 65 within the next six months and live in your licensed states. Save this segment so you can reuse or refine it for future campaigns. If you are running a direct mail campaign, export the segment as a mailing list with the required fields for your print vendor.

Before launching, complete the built-in compliance checklist. This includes confirming that all materials have been filed with CMS (if required), disclaimers are present, scope-of-appointment forms are prepared for seminars, and your multi-language requirements are met. Once everything is in order, set the campaign status to "Active." The CRM will begin executing any automated actions—sending emails on schedule, tracking web form submissions, and attributing incoming leads to this campaign for ROI reporting.`,
    tags: [
      'campaigns',
      'marketing',
      'AEP',
      'OEP',
      'lead-generation',
      'compliance',
      'CMS',
      'audience',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'cm-campaign-analytics',
    module: 'campaigns-marketing',
    title: 'Campaign Analytics',
    summary:
      'Understand campaign performance metrics, ROI calculation, and how to optimize future campaigns based on data.',
    content: `Every campaign in the CRM automatically tracks a comprehensive set of performance metrics so you can measure what is working and double down on successful strategies. The Campaign Analytics dashboard surfaces the numbers that matter most: leads generated, cost per lead, conversion rate from lead to deal, total revenue attributed, and overall return on investment (ROI).

The funnel view shows how many people entered each stage of your campaign. For an email campaign, this means total recipients, opens, clicks, replies, leads created, and deals closed. For a seminar campaign, it tracks invitations sent, RSVPs, attendees, scope-of-appointment forms completed, and enrollments. By comparing drop-off rates between stages, you can pinpoint where prospects disengage—maybe your email gets opened but the landing page does not convert, suggesting you need to improve the page's call to action.

Attribution modeling in the CRM supports both first-touch and multi-touch models. First-touch attribution gives full credit to the campaign that first brought the lead into your system, while multi-touch spreads credit across every campaign the lead interacted with before converting. Choose the model that best matches your marketing strategy—agencies with long nurture cycles often prefer multi-touch, while those focused on high-volume AEP lead generation may find first-touch more actionable.

Use the "Compare Campaigns" feature to evaluate two or more campaigns side-by-side. This is especially powerful at the end of an enrollment period when you want to determine whether email outreach or community seminars produced better results for a given territory. Export the comparison report to share with your team during post-season reviews, and use the insights to allocate next year's marketing budget more effectively.`,
    tags: [
      'analytics',
      'campaigns',
      'ROI',
      'attribution',
      'conversion',
      'metrics',
      'performance',
    ],
    difficulty: 'intermediate',
  },
  {
    id: 'cm-social-media',
    module: 'campaigns-marketing',
    title: 'Social Media Management',
    summary:
      'Schedule, publish, and measure social media content that drives awareness and generates leads for your agency.',
    content: `Social media is an increasingly important channel for health insurance agents, especially for building trust with the under-65 market and educating Medicare-eligible individuals about their options. The CRM's social media module lets you manage your Facebook, LinkedIn, Instagram, and X (Twitter) presence from a single interface without switching between platforms.

Start by connecting your social accounts under Settings > Integrations > Social Media. Once connected, you can compose posts directly in the CRM. The editor supports platform-specific formatting—character limits, hashtag suggestions, and image size recommendations are displayed as you type. You can write a single post and publish it across all connected platforms simultaneously, or customize the copy for each network. For example, your LinkedIn post might take a professional, educational tone while your Facebook version is more conversational.

The content calendar gives you a visual overview of all scheduled and published posts across platforms. Drag and drop posts to reschedule them, and use color coding to distinguish between educational content, promotional offers, event announcements, and compliance-related posts. Consistency is key—aim for at least three posts per week during enrollment season and one to two per week during off-season to maintain visibility.

Track engagement metrics—likes, comments, shares, clicks, and follower growth—directly in the CRM. The social analytics dashboard shows which types of content resonate most with your audience. Link your social posts to campaigns so that any leads generated from social media are properly attributed. For CMS compliance, the CRM can automatically append required disclaimers to Medicare-related posts and flag content that may need review before publishing.`,
    tags: [
      'social-media',
      'Facebook',
      'LinkedIn',
      'Instagram',
      'scheduling',
      'content-calendar',
      'engagement',
    ],
    difficulty: 'intermediate',
  },
];
