import type { PageHelp, HelpArticle } from '../types';

export const webFormsPageHelp: PageHelp = {
  pageKey: 'web-forms',
  title: 'Web Forms',
  description:
    'Build and embed lead capture forms on your website to automatically create contacts, leads, and cases in the CRM from visitor submissions.',
  quickTips: [
    {
      id: 'forms-tip-1',
      text: 'Keep web forms short—name, phone, email, and one or two qualifying questions. Longer forms have significantly lower completion rates.',
    },
    {
      id: 'forms-tip-2',
      text: 'Set up a "Thank You" redirect URL so visitors land on a confirmation page with next steps after submitting a form.',
    },
    {
      id: 'forms-tip-3',
      text: 'Enable reCAPTCHA on all public-facing forms to prevent spam submissions from cluttering your CRM.',
    },
    {
      id: 'forms-tip-4',
      text: 'Use hidden fields to capture UTM parameters from the page URL so you can track which marketing campaigns drive form submissions.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'formName',
      label: 'Form Name',
      hint: 'An internal name for this form. Not visible to visitors. Use descriptive names like "Homepage Quote Request" or "AEP Landing Page."',
    },
    {
      fieldKey: 'targetModule',
      label: 'Target Module',
      hint: 'Which CRM module receives the submission: Leads, Contacts, or Cases. Most lead capture forms should target the Leads module.',
    },
    {
      fieldKey: 'fieldMapping',
      label: 'Field Mapping',
      hint: 'Map each form field to a CRM field. Unmapped fields are stored as "Additional Info" on the created record.',
    },
    {
      fieldKey: 'assignmentRule',
      label: 'Assignment Rule',
      hint: 'How submitted records are assigned: specific user, round-robin across a team, or based on field values (e.g., state-based routing).',
    },
    {
      fieldKey: 'notificationEmails',
      label: 'Notification Emails',
      hint: 'Email addresses that receive an instant notification when a form is submitted. Separate multiple addresses with commas.',
    },
    {
      fieldKey: 'redirectUrl',
      label: 'Thank-You URL',
      hint: 'The page visitors are redirected to after successful submission. Leave blank to show a default confirmation message.',
    },
  ],
  faqs: [
    {
      question: 'Can I embed a form on multiple pages?',
      answer:
        'Yes. The embed code works on any page. You can use the same form across multiple pages and differentiate traffic sources using hidden UTM fields.',
    },
    {
      question: 'How do I prevent duplicate leads from form submissions?',
      answer:
        'Enable "Duplicate Check" in the form settings. The system checks incoming submissions against existing records by email address and phone number. Duplicates can be merged automatically or flagged for manual review.',
    },
    {
      question: 'Can visitors upload files through web forms?',
      answer:
        'Yes. Add a "File Upload" field to your form. Accepted file types and maximum size are configurable. Uploaded files are attached to the created record in the Documents module.',
    },
    {
      question: 'Do web forms work on mobile devices?',
      answer:
        'Yes. All forms are responsive and adapt to screen sizes automatically. Test your form on mobile before launching to ensure the layout and button sizes provide a good user experience.',
    },
  ],
  relatedArticles: [
    'building-web-forms',
    'embedding-forms-website',
    'managing-form-submissions',
  ],
  videoUrl: 'https://help.mpbhealth.com/videos/web-forms-overview',
};

export const webFormsArticles: HelpArticle[] = [
  {
    id: 'building-web-forms',
    module: 'web-forms',
    title: 'Building Web Forms',
    summary:
      'Design lead capture forms with the drag-and-drop builder, configure field mappings, and set up submission handling rules.',
    content: `Web forms are one of the most effective ways to capture leads from your agency's website, landing pages, and marketing campaigns. The CRM's form builder provides a drag-and-drop interface where you design forms visually, map form fields to CRM fields, and configure what happens when a visitor submits the form—all without writing any code. The result is an embed-ready form that creates CRM records automatically from every submission.

To create a new form, navigate to Web Forms and click "New Form." Start by selecting the target module—typically Leads for prospecting forms or Cases for support request forms. This selection determines which CRM fields are available for mapping. Then drag fields onto the form canvas from the field palette on the left. Standard field types include text inputs, dropdowns, checkboxes, radio buttons, date pickers, phone number fields (with auto-formatting), email fields (with validation), text areas, and file upload fields. You can also add layout elements like section headers, descriptive text blocks, and horizontal dividers to organize longer forms.

Each form field must be mapped to a corresponding CRM field so the system knows where to store the submitted data. The builder auto-suggests mappings based on field names—a form field labeled "Email" automatically maps to the Contact Email field—but you can override any mapping. For fields that don't correspond to an existing CRM field, you have two options: create a new custom field on the fly from the builder, or leave the field unmapped and the data is stored in a catch-all "Additional Info" field on the record. Hidden fields are particularly useful for capturing contextual data the visitor doesn't see, such as the page URL, UTM campaign parameters, or a pre-set lead source value.

The final step before publishing is configuring submission settings. These include the assignment rule (who gets the new record), notification emails (who gets alerted immediately), the auto-response email (an optional confirmation message sent to the visitor), duplicate checking (whether to merge with existing records), and the redirect URL or thank-you message displayed after submission. Take time to configure the auto-response email with professional branding and a clear message about what happens next—this is your agency's first touchpoint with a potential client and sets the tone for the relationship.`,
    tags: [
      'web forms',
      'form builder',
      'lead capture',
      'drag and drop',
      'field mapping',
      'auto-response',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'embedding-forms-website',
    module: 'web-forms',
    title: 'Embedding Forms on Your Website',
    summary:
      'Learn how to embed CRM web forms on your website, landing pages, and email campaigns using various integration methods.',
    content: `Once your web form is designed and configured, the next step is embedding it on your website so visitors can find and submit it. The CRM provides three embedding methods to accommodate different website platforms and technical scenarios: JavaScript embed code, iframe embed code, and a direct form URL. Each method produces the same form experience for visitors, but they differ in how they integrate with your website's design and content management system.

The JavaScript embed method is recommended for most websites because it renders the form directly within your page's DOM, inheriting your site's CSS styles for a seamless look. Copy the JavaScript snippet from the form's "Publish" tab and paste it into your webpage's HTML where you want the form to appear. Most website builders like WordPress, Wix, Squarespace, and HubSpot have an "HTML block" or "Code embed" widget where you can paste the snippet. The form automatically adapts to the container's width and applies responsive breakpoints for mobile devices. If your website has a Content Security Policy (CSP), you may need to whitelist the CRM's domain for the script to load.

The iframe method embeds the form in an isolated frame, which is useful when you want complete visual separation from your site's styles or when your CMS restricts inline JavaScript. The iframe code includes width and height attributes you can adjust, and the CRM's embed page sends a postMessage to the parent window with the form height after rendering, enabling auto-resize if you add the companion resize script. The trade-off is that iframe forms cannot inherit your website's fonts and colors—they use the form's own styling, which you can customize in the form builder's "Appearance" settings.

The direct URL method provides a standalone page hosted on your CRM's domain where the form lives by itself. This is ideal for email campaigns, social media posts, or QR codes where you want to link directly to the form without embedding it in an existing page. The standalone page includes your agency's logo and branding from the form's appearance settings. Regardless of which method you choose, always test the form on your live website across browsers (Chrome, Safari, Edge, Firefox) and devices (desktop, tablet, phone) before promoting it. Submit a test entry to verify the record appears correctly in the CRM, the assignment rule fires, and notification emails are delivered.`,
    tags: [
      'embed forms',
      'JavaScript embed',
      'iframe',
      'website integration',
      'WordPress',
      'landing pages',
      'responsive forms',
    ],
    difficulty: 'intermediate',
  },
  {
    id: 'managing-form-submissions',
    module: 'web-forms',
    title: 'Managing Form Submissions',
    summary:
      'Monitor, review, and act on incoming form submissions with submission logs, analytics, and automated follow-up workflows.',
    content: `After your web forms are live and capturing leads, the CRM provides tools to monitor submission activity, review individual submissions, and ensure every inquiry receives timely follow-up. The form submissions dashboard is your central command center, showing submission volume over time, conversion rates by form, average time-to-response, and a real-time feed of the latest submissions. This visibility helps you spot trends—like a traffic spike from a new ad campaign—and react quickly when submission volume increases.

Each form has a dedicated submissions log that lists every entry with the submission timestamp, the visitor's data, the CRM record that was created, and the current status. Statuses include "New" (just submitted, no action taken), "Contacted" (an agent has reached out), "Qualified" (the lead meets your criteria), "Disqualified" (spam or not a fit), and "Converted" (the lead has become a client). Updating these statuses keeps your team aligned on which submissions need attention and provides accurate conversion metrics. You can filter and sort the submissions log by date range, status, form name, assigned agent, or any submitted field value.

Automated follow-up is where form submissions become truly powerful. In the form settings or through the Automation module, you can configure workflows that trigger immediately when a form is submitted. A typical sequence for a Medicare lead capture form might be: send an auto-response email thanking the visitor and explaining next steps, create a follow-up task for the assigned agent due within two hours, send an SMS notification to the agent's mobile phone, and if the lead hasn't been contacted within 24 hours, escalate to the sales manager. These automations ensure no lead falls through the cracks, even during high-volume periods like AEP when your team is stretched thin.

For ongoing optimization, use the form analytics to compare performance across forms, landing pages, and traffic sources. Key metrics include submission rate (submissions divided by form views), field drop-off rates (which fields cause visitors to abandon the form), device breakdown (desktop vs. mobile), and source attribution (organic search, paid ads, social media, direct). If a form has a high view count but low submission rate, consider shortening it, simplifying the fields, or adding a more compelling call-to-action. A/B testing is available for forms with enough traffic—create a variant with a different headline, field order, or button text and let the system split traffic evenly to determine which version performs better.`,
    tags: [
      'form submissions',
      'submission management',
      'analytics',
      'conversion tracking',
      'follow-up automation',
      'A/B testing',
      'lead management',
    ],
    difficulty: 'intermediate',
  },
];
