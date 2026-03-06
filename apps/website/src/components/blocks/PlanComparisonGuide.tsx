import React from 'react';
import { Check, X, Download } from 'lucide-react';

interface ComparisonRow {
  feature: string;
  carePlus: string | boolean;
  direct: string | boolean;
  essentials: string | boolean;
}

interface ComparisonCategory {
  name: string;
  note?: string;
  rows: ComparisonRow[];
}

const comparisonData: ComparisonCategory[] = [
  {
    name: 'Membership Overview',
    rows: [
      { feature: 'Best For', carePlus: 'Individuals & families seeking protection from large medical expenses', direct: 'Those who value preventive care and DPC', essentials: 'Those seeking hospital debt relief (no medical cost sharing)' },
      { feature: 'Monthly Contribution', carePlus: 'From $166/month*', direct: 'From $201/month*', essentials: 'From $50/month*' },
      { feature: 'Initial Unshareable Amount (IUA)', carePlus: '$1,250, $2,500, $5,000', direct: '$1,250, $2,500, $5,000', essentials: 'N/A' },
    ],
  },
  {
    name: 'Health Sharing Benefits',
    note: '*After IUA is Met',
    rows: [
      { feature: 'Large Medical Expense Sharing', carePlus: true, direct: true, essentials: false },
      { feature: 'Hospitalization', carePlus: true, direct: true, essentials: false },
      { feature: 'Surgery', carePlus: true, direct: true, essentials: false },
      { feature: 'Emergency Room Visits', carePlus: true, direct: true, essentials: false },
      { feature: 'Diagnostic Imaging (MRI, CT, X-ray)', carePlus: true, direct: true, essentials: false },
      { feature: 'Lab Work', carePlus: true, direct: true, essentials: false },
      { feature: 'Lifetime Sharing Limit', carePlus: 'None', direct: 'None', essentials: 'N/A' },
    ],
  },
  {
    name: 'Preventive & Wellness',
    rows: [
      { feature: 'Preventive Care Sharing', carePlus: false, direct: true, essentials: false },
      { feature: 'Annual Wellness Visit', carePlus: false, direct: '$175', essentials: false },
      { feature: 'Mammogram, Colonoscopy', carePlus: false, direct: true, essentials: false },
      { feature: 'Immunizations', carePlus: false, direct: 'Youth only', essentials: false },
    ],
  },
  {
    name: 'Virtual Behavioral Health',
    rows: [
      { feature: 'Virtual Behavioral Health Care', carePlus: true, direct: true, essentials: true },
    ],
  },
  {
    name: 'Maternity',
    rows: [
      { feature: 'Maternity & Childbirth Sharing', carePlus: 'After 6 months', direct: 'After 6 months', essentials: false },
      { feature: 'Prenatal Care', carePlus: true, direct: true, essentials: false },
      { feature: 'Delivery & Postpartum', carePlus: true, direct: true, essentials: false },
    ],
  },
  {
    name: 'Additional Benefits',
    rows: [
      { feature: '24/7 Virtual Care', carePlus: '$0 consults', direct: '$0 consults', essentials: '$0 consults' },
      { feature: 'RX Benefits', carePlus: 'Up to 80% off', direct: 'Up to 80% off', essentials: 'Up to 80% off' },
      { feature: 'DNA Test Discounts', carePlus: true, direct: true, essentials: true },
      { feature: 'Vision Discounts', carePlus: 'Add-on', direct: 'Add-on', essentials: 'Add-on' },
      { feature: 'Dental Discounts', carePlus: 'Add-on', direct: 'Add-on', essentials: 'Add-on' },
    ],
  },
  {
    name: 'Special Features',
    rows: [
      { feature: 'HSA Compatible', carePlus: false, direct: false, essentials: false },
      { feature: 'DPC Compatible', carePlus: 'Pairs Well', direct: 'Ideal Pairing', essentials: 'Pairs Well' },
      { feature: 'Network Restrictions', carePlus: 'None - Any Provider', direct: 'None - Any Provider', essentials: 'None - Any Provider' },
    ],
  },
  {
    name: 'Eligibility',
    rows: [
      { feature: 'Who Can Enroll', carePlus: 'Individuals, Families, Groups', direct: 'Individuals, Families, Groups', essentials: 'Individuals, Families' },
      { feature: 'Pre-membership Conditions', carePlus: '12-month waiting period', direct: '12-month waiting period', essentials: 'N/A' },
    ],
  },
];

const renderValue = (value: string | boolean) => {
  if (value === true) {
    return (
      <div className="flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center">
          <X className="w-4 h-4 text-neutral-400" />
        </div>
      </div>
    );
  }
  return <span className="text-sm text-neutral-700 text-center block">{value}</span>;
};

interface PlanComparisonGuideProps {
  showDownloadButton?: boolean;
  title?: string;
  subtitle?: string;
}

export const PlanComparisonGuide: React.FC<PlanComparisonGuideProps> = ({
  showDownloadButton = true,
  title = 'Complete Membership Comparison Guide',
  subtitle = 'Compare all features side-by-side to find the perfect fit',
}) => {
  return (
    <section className="py-16 bg-white print:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">{title}</h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">{subtitle}</p>
          {showDownloadButton && (
            <a
              href="/docs/plan-comparison-guide.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-6 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors print:hidden"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Printable Version
            </a>
          )}
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 shadow-lg">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gradient-to-r from-primary-700 to-primary-600">
                <th className="text-left py-4 px-6 text-white font-semibold w-1/4">Features</th>
                <th className="text-center py-4 px-4 text-white font-semibold w-1/4">
                  <div>Care+</div>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-success-500 text-white text-xs rounded-full">Best Value</span>
                </th>
                <th className="text-center py-4 px-4 text-white font-semibold w-1/4">
                  <div>Direct</div>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-success-500 text-white text-xs rounded-full">Best for Preventive</span>
                </th>
                <th className="text-center py-4 px-4 text-white font-semibold w-1/4">
                  <div>Essentials</div>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-success-500 text-white text-xs rounded-full">Best for Debt Relief</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((category, _catIndex) => (
                <React.Fragment key={category.name}>
                  {/* Category Header */}
                  <tr className="bg-primary-50">
                    <td colSpan={4} className="py-3 px-6 font-bold text-primary-800 text-lg">
                      {category.name}
                      {category.note && <span className="ml-2 text-sm font-normal text-primary-600">{category.note}</span>}
                    </td>
                  </tr>
                  {/* Category Rows */}
                  {category.rows.map((row, rowIndex) => (
                    <tr
                      key={row.feature}
                      className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-neutral-50'} hover:bg-primary-50/50 transition-colors`}
                    >
                      <td className="py-3 px-6 text-sm font-medium text-neutral-800">{row.feature}</td>
                      <td className="py-3 px-4">{renderValue(row.carePlus)}</td>
                      <td className="py-3 px-4">{renderValue(row.direct)}</td>
                      <td className="py-3 px-4">{renderValue(row.essentials)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-8 print:bg-yellow-50">
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> MPB Health is NOT a health sharing ministry and is not insurance. Members share each other's medical expenses according to the membership guidelines. This is not a contract of insurance and benefits are not guaranteed.
          </p>
        </div>

        {/* Notes Section */}
        <div className="mt-8 bg-neutral-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-primary-900 mb-4">Important Notes</h3>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li><strong>*Pricing:</strong> Monthly contributions shown are the lowest starting rates (Member Only, ages 18-29, $5,000 IUA). Actual rates vary by age, household size, and IUA selection. Use our <a href="/get-started" className="text-primary-600 hover:underline">rate calculator</a> for a personalized quote.</li>
            <li><strong>Initial Unshareable Amount (IUA):</strong> This is the amount you pay before sharing begins for each medical need. Think of it like a deductible.</li>
            <li><strong>Pre-membership Conditions:</strong> Conditions diagnosed or treated in the 24 months prior to membership have a waiting period before they become shareable.</li>
            <li><strong>Maternity:</strong> Conception must occur 6+ months after membership effective date for maternity expenses to be shareable.</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default PlanComparisonGuide;

