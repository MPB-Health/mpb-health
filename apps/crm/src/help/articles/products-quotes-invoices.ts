import type { PageHelp, HelpArticle } from '../types';

export const productsPageHelp: PageHelp = {
  pageKey: 'products',
  title: 'Products',
  description:
    'Manage your catalog of health insurance and Medicare products, including plan details, carrier information, and commission structures.',
  quickTips: [
    {
      id: 'products-tip-1',
      text: 'Use product categories like "Medicare Advantage," "Medigap," and "Under-65 ACA" to keep your catalog organized.',
    },
    {
      id: 'products-tip-2',
      text: 'Set effective date ranges on products so expired plans automatically hide from quote selection.',
    },
    {
      id: 'products-tip-3',
      text: 'Attach carrier commission schedules directly to products to auto-calculate expected revenue on deals.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'productName',
      label: 'Product Name',
      hint: `The plan marketing name as it appears on the carrier's materials (e.g., "Aetna Medicare Advantage HMO").`,
    },
    {
      fieldKey: 'carrier',
      label: 'Carrier',
      hint: 'The insurance company underwriting this product. Select from your configured carriers list.',
    },
    {
      fieldKey: 'planType',
      label: 'Plan Type',
      hint: 'Classify the product: Medicare Advantage, Medigap, PDP, ACA, Dental/Vision, or Ancillary.',
    },
    {
      fieldKey: 'effectiveDate',
      label: 'Effective Date',
      hint: 'The date this plan becomes available for enrollment. Quotes will not include products outside their effective window.',
    },
    {
      fieldKey: 'commissionRate',
      label: 'Commission Rate',
      hint: 'Your expected commission as a flat dollar amount or percentage. Used for revenue forecasting.',
    },
  ],
  faqs: [
    {
      question: `How do I add a new plan year's products?`,
      answer:
        'Clone the existing product and update the effective dates, premiums, and benefits for the new plan year. The original product will remain for historical reporting.',
    },
    {
      question: 'Can I import products from a CSV?',
      answer:
        'Yes. Navigate to Products > Import, download the template CSV, fill in your plan data, and upload. The system will validate required fields before creating records.',
    },
    {
      question: 'What happens when a product expires?',
      answer:
        'Expired products are hidden from new quote creation but remain visible on existing deals and historical reports. You can archive them to remove them from all active views.',
    },
  ],
  relatedArticles: ['pqi-product-catalog', 'pqi-creating-quotes', 'pqi-invoice-management'],
};

export const quotesPageHelp: PageHelp = {
  pageKey: 'quotes',
  title: 'Quotes',
  description:
    'Create, customize, and send professional quotes to prospects comparing plan options, premiums, and benefits side-by-side.',
  quickTips: [
    {
      id: 'quotes-tip-1',
      text: 'Use the "Compare Plans" layout to show a prospect up to four plans side-by-side with highlighted differences.',
    },
    {
      id: 'quotes-tip-2',
      text: 'Set an expiration date on every quote to create urgency and keep your pipeline clean.',
    },
    {
      id: 'quotes-tip-3',
      text: 'Attach a personalized cover letter to quotes by selecting a template from your Templates library.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'quoteNumber',
      label: 'Quote Number',
      hint: 'Auto-generated unique identifier. The prefix can be customized under Settings > Numbering.',
    },
    {
      fieldKey: 'contact',
      label: 'Contact',
      hint: 'The prospect or client this quote is prepared for. Their demographic data will auto-populate rate fields.',
    },
    {
      fieldKey: 'products',
      label: 'Products',
      hint: 'Add one or more products to compare. Only products with active effective dates appear here.',
    },
    {
      fieldKey: 'expirationDate',
      label: 'Expiration Date',
      hint: 'The date this quote is no longer valid. Defaults to 30 days but can be adjusted per quote.',
    },
    {
      fieldKey: 'status',
      label: 'Status',
      hint: 'Draft, Sent, Viewed, Accepted, or Declined. Status updates automatically when the recipient interacts with the quote.',
    },
  ],
  faqs: [
    {
      question: 'Can the client accept a quote electronically?',
      answer:
        'Yes. When you send a quote via email, the recipient receives a link to view it online. They can select their preferred plan and click "Accept," which updates the quote status and notifies you instantly.',
    },
    {
      question: 'How do I convert an accepted quote to a deal?',
      answer:
        'Open the accepted quote and click "Convert to Deal." The system pre-fills the deal with the selected product, premium, and contact information.',
    },
    {
      question: 'Can I include multiple beneficiaries on one quote?',
      answer:
        `Yes. Add additional contacts as dependents or spouse when building the quote. Each person's age and zip code will be used to calculate their individual premiums.`,
    },
  ],
  relatedArticles: ['pqi-creating-quotes', 'pqi-product-catalog', 'pqi-invoice-management'],
};

export const invoicesPageHelp: PageHelp = {
  pageKey: 'invoices',
  title: 'Invoices',
  description:
    'Track billing, payments, and commission receivables across your book of business.',
  quickTips: [
    {
      id: 'invoices-tip-1',
      text: 'Set up automatic payment reminders to reduce overdue invoices without manual follow-up.',
    },
    {
      id: 'invoices-tip-2',
      text: 'Link invoices to deals so commission revenue rolls up correctly in your forecasting reports.',
    },
    {
      id: 'invoices-tip-3',
      text: 'Use the "Recurring" flag for monthly premium billing to auto-generate invoices each cycle.',
    },
  ],
  fieldHints: [
    {
      fieldKey: 'invoiceNumber',
      label: 'Invoice Number',
      hint: 'Auto-generated sequential number. Customize the prefix in Settings > Numbering.',
    },
    {
      fieldKey: 'dueDate',
      label: 'Due Date',
      hint: 'When payment is expected. Overdue invoices are flagged automatically and can trigger reminder emails.',
    },
    {
      fieldKey: 'amount',
      label: 'Amount',
      hint: 'Total amount due. Calculated from line items or entered manually for flat-fee billing.',
    },
    {
      fieldKey: 'paymentStatus',
      label: 'Payment Status',
      hint: 'Unpaid, Partial, Paid, or Overdue. Updated automatically when payments are recorded.',
    },
    {
      fieldKey: 'relatedDeal',
      label: 'Related Deal',
      hint: 'The deal this invoice is associated with. Links revenue back to the originating opportunity.',
    },
  ],
  faqs: [
    {
      question: 'How do I record a partial payment?',
      answer:
        'Open the invoice, click "Record Payment," enter the amount received, and save. The status changes to "Partial" and the remaining balance is displayed prominently.',
    },
    {
      question: 'Can I export invoices for my accountant?',
      answer:
        'Yes. Use the Export button on the Invoices list to download a CSV or PDF summary. You can filter by date range, status, and carrier before exporting.',
    },
    {
      question: 'How do recurring invoices work?',
      answer:
        'Mark an invoice as recurring and set the frequency (monthly, quarterly, annually). The system auto-generates the next invoice on schedule and sends it if auto-send is enabled.',
    },
  ],
  relatedArticles: ['pqi-invoice-management', 'pqi-creating-quotes', 'pqi-product-catalog'],
};

export const productsQuotesInvoicesArticles: HelpArticle[] = [
  {
    id: 'pqi-product-catalog',
    module: 'products-quotes-invoices',
    title: 'Managing Your Product Catalog',
    summary:
      'How to build, organize, and maintain your catalog of health insurance and Medicare products across plan years.',
    content: `Your product catalog is the foundation of accurate quoting and revenue forecasting. Each product record represents a specific insurance plan offered by a carrier—for example, "UnitedHealthcare AARP Medicare Advantage HMO (2026)" or "Humana Medigap Plan G." By maintaining a well-organized catalog, you ensure every quote pulls the correct premium data, benefit summaries, and commission rates without manual re-entry.

To add a product, navigate to Products and click "New Product." Fill in the carrier, plan type, product name, and effective date range. The effective date range is especially important: the CRM uses it to filter which products appear when agents build quotes. For AEP products, set the effective start to January 1 of the plan year and the end to December 31. For SEP-eligible products that can be sold year-round, extend the range accordingly or leave the end date blank.

Organizing products into categories makes navigation faster as your catalog grows. The built-in categories—Medicare Advantage, Medigap, PDP, ACA Individual, ACA Group, Dental/Vision, and Ancillary—cover the most common plan types. Within each category, use tags like "HMO," "PPO," "High Deductible," or the carrier name to enable quick filtering. When your agency offers products across dozens of carriers and multiple states, these filters become essential during the enrollment rush.

Commission tracking is built directly into each product record. Enter your expected first-year and renewal commission as a flat dollar amount or a percentage of premium. When a deal closes and references this product, the CRM automatically calculates projected commission revenue and feeds it into your Forecasting and Reports modules. At renewal time, the system can alert you to products whose commission schedules have changed so you can update your catalog before the next enrollment period begins.`,
    tags: [
      'products',
      'catalog',
      'plans',
      'carriers',
      'commissions',
      'Medicare Advantage',
      'Medigap',
      'AEP',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'pqi-creating-quotes',
    module: 'products-quotes-invoices',
    title: 'Creating and Sending Quotes',
    summary:
      'Walk through building a professional plan comparison quote, personalizing it, and delivering it to your prospect.',
    content: `A compelling quote can be the difference between a prospect choosing you or going with another agent. The CRM's quoting engine lets you assemble side-by-side plan comparisons, personalize the presentation with your branding, and deliver it electronically—all without leaving the platform.

Start by navigating to Quotes and clicking "New Quote." Select the contact (or lead) you are quoting for; the system pulls in their date of birth, zip code, and tobacco status to calculate accurate premiums. Next, add products from your catalog—up to four plans can be displayed in the comparison view. The quote builder automatically arranges key benefit columns like monthly premium, annual deductible, max out-of-pocket, drug coverage tier, and provider network type so the prospect can compare at a glance.

Before sending, customize the quote by attaching a cover letter template, adding a personal note, and selecting your agency's branded color scheme and logo. You can also toggle which benefit rows are visible; for instance, if you are quoting Medigap plans you may want to hide the prescription drug column since those plans do not include Part D. Set an expiration date to create a sense of urgency—30 days is the default, but during AEP you may want to shorten it to 7–14 days.

When the quote is ready, click "Send" to deliver it via email. The recipient receives a secure link to view the interactive quote online. You will see real-time status updates: "Sent," "Viewed" (with a timestamp), and ultimately "Accepted" or "Declined." If the prospect accepts a plan, the CRM offers a one-click conversion to a Deal, carrying over all product and contact details so you can move straight into the enrollment workflow.`,
    tags: [
      'quotes',
      'proposals',
      'plan-comparison',
      'enrollment',
      'branding',
      'AEP',
      'sending',
    ],
    difficulty: 'beginner',
  },
  {
    id: 'pqi-invoice-management',
    module: 'products-quotes-invoices',
    title: 'Invoice Management',
    summary:
      'Track payments, manage recurring billing, and keep your revenue records accurate for commission reconciliation.',
    content: `Accurate invoice management ensures you get paid on time and have clean records for commission reconciliation with carriers. The Invoices module gives you a centralized view of all outstanding, paid, and overdue invoices linked back to the deals and contacts they originated from.

To create an invoice, open a closed-won deal and click "Generate Invoice," or navigate to Invoices and click "New Invoice" to build one from scratch. Each invoice can contain multiple line items—useful when a single client is enrolling in both a Medicare Advantage plan and a standalone dental plan, for example. The system calculates subtotals and totals automatically. You can also add custom line items for consulting fees, plan review services, or enrollment assistance charges if your agency bills for those.

For clients on monthly premium billing or agencies that invoice carriers for commission advances, the recurring invoice feature saves significant time. Mark any invoice as recurring, choose the frequency (monthly, quarterly, or annually), and set the start and end dates. The CRM generates each subsequent invoice automatically, applies the correct amounts, and optionally sends it via email without any manual intervention. You will receive a notification each time a recurring invoice is created so you can review it before it goes out.

The Invoices dashboard provides at-a-glance metrics: total outstanding balance, overdue amount, average days to payment, and month-over-month collection trends. Use the aging report to identify clients who are consistently late and set up automated payment reminders at intervals you choose—for example, 3 days before due, on the due date, and 7 days after. These reminders are sent from your connected email address and can use customizable templates so the tone matches your client communication style.`,
    tags: [
      'invoices',
      'billing',
      'payments',
      'commissions',
      'recurring',
      'aging-report',
      'revenue',
    ],
    difficulty: 'intermediate',
  },
];
