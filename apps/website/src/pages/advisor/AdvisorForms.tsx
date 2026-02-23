import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Building2,
  Users,
  ExternalLink,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/Badge';
import {
  advisorCMSService,
  AdvisorQuickLink,
} from '../../lib/advisorCMSService';

interface FormCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  iconBgColor: string;
  description: string;
  forms: FormItem[];
}

interface FormItem {
  label: string;
  url: string;
  description?: string;
}

// Default forms data - can be overridden by CMS
const DEFAULT_EMPLOYEE_FORMS: FormItem[] = [
  { label: 'Employer Group Update', url: 'https://www.cognitoforms.com/MPoweringBenefits1/EmployerGroupUpdate' },
  { label: 'List-Bill Setup', url: 'https://www.cognitoforms.com/MPoweringBenefits1/EmployerGroupListBillSetup' },
  { label: 'List-Bill Update', url: 'https://www.cognitoforms.com/MPoweringBenefits1/EmployerGroupUpdate' },
  { label: 'Employee Removal', url: 'https://www.cognitoforms.com/MPoweringBenefits1/NotificationEmployeeRemovalFromListBillInvoice' },
  { label: 'List-Bill Conversion', url: 'https://www.cognitoforms.com/MPoweringBenefits1/ListBillConversion' },
];

const DEFAULT_ADVISOR_FORMS: FormItem[] = [
  { label: 'Commission Structure', url: 'https://www.canva.com/design/DAGdsIAKdIk/cY1TxCRLcMfFTN-jSgC4Vg/view?utm_content=DAGdsIAKdIk&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h44ea02a2b8' },
  { label: 'Advisor Agreement', url: 'https://www.cognitoforms.com/MPoweringBenefits1/HealthcareAdvisorAgreement2026' },
  { label: 'Enroll E&O', url: 'https://advisor.mpb.health/eo/' },
  { label: 'Media Release Consent', url: 'https://advisor.mpb.health/media-release-consent/' },
  { label: 'Referring Individual', url: 'https://advisor.mpb.health/referring-individual/' },
  { label: 'Update E&O', url: 'https://advisor.mpb.health/update-eo/' },
  { label: 'List-Bill Conversion', url: 'https://mpb.health/list-bill-conversion/' },
  { label: 'Advisor Termination Request', url: 'https://advisor.mpb.health/advisor-termination/' },
];

const DEFAULT_MEMBER_FORMS: FormItem[] = [
  { label: 'Membership Changes', url: 'https://mpb.health/membership-changes/' },
  { label: 'Request Pharmacy Quote', url: 'https://mpb.health/request-rx-quote/' },
  { label: 'Permission to Discuss Plan', url: 'https://mpb.health/permission-to-discuss-plan/' },
  { label: 'Request to Schedule an Appointment', url: 'https://mpb.health/request-to-schedule-an-appointment/' },
  { label: 'Schedule a Welcome Call', url: 'https://mpb.health/schedule-a-call/' },
  { label: 'Welcome Call Survey', url: 'https://www.mpb.health/forms/welcome-call-survey/' },
  { label: 'Update Form of Payment', url: 'https://mpb.health/update-form-of-payment' },
  { label: 'Cancel Membership', url: 'https://mpb.health/cancel-membership/' },
];

export default function AdvisorForms() {
  const [cmsLinks, setCmsLinks] = useState<Record<string, AdvisorQuickLink[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCMSForms();
  }, []);

  const loadCMSForms = async () => {
    try {
      setLoading(true);
      const grouped = await advisorCMSService.getQuickLinksByCategory();
      setCmsLinks({
        employee: grouped.employer_forms || [],
        advisor: grouped.advisor_forms || [],
        member: grouped.member_forms || [],
      });
    } catch (error) {
      console.error('Failed to load CMS forms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Merge CMS links with defaults, prioritizing CMS if available
  const getFormsForCategory = (category: 'employee' | 'advisor' | 'member'): FormItem[] => {
    const cmsFormsForCategory = cmsLinks[category];
    if (cmsFormsForCategory && cmsFormsForCategory.length > 0) {
      return cmsFormsForCategory.map(link => ({
        label: link.label,
        url: link.url,
        description: link.description,
      }));
    }
    // Fall back to defaults
    switch (category) {
      case 'employee':
        return DEFAULT_EMPLOYEE_FORMS;
      case 'advisor':
        return DEFAULT_ADVISOR_FORMS;
      case 'member':
        return DEFAULT_MEMBER_FORMS;
      default:
        return [];
    }
  };

  const formCategories: FormCategory[] = [
    {
      id: 'employee',
      title: 'Employee Forms',
      icon: <Building2 className="w-6 h-6 text-blue-600" />,
      iconBgColor: 'bg-blue-100',
      description: 'Forms for employer groups and employee management',
      forms: getFormsForCategory('employee'),
    },
    {
      id: 'advisor',
      title: 'Advisor Forms',
      icon: <FileText className="w-6 h-6 text-emerald-600" />,
      iconBgColor: 'bg-emerald-100',
      description: 'Forms for advisor agreements, commissions, and compliance',
      forms: getFormsForCategory('advisor'),
    },
    {
      id: 'member',
      title: 'Member Forms',
      icon: <Users className="w-6 h-6 text-purple-600" />,
      iconBgColor: 'bg-purple-100',
      description: 'Forms for member services and account management',
      forms: getFormsForCategory('member'),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          to="/advisor"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Advisor Toolkit</h1>
              <p className="text-gray-600">Access all forms for employees, advisors, and members</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            {formCategories.map(category => (
              <div
                key={category.id}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100"
              >
                <span className={`p-1 rounded ${category.iconBgColor}`}>
                  {category.icon}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {category.forms.length} {category.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Categories */}
        <div className="space-y-8">
          {formCategories.map(category => (
            <Card key={category.id} className="overflow-hidden">
              {/* Category Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${category.iconBgColor}`}>
                    {category.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{category.title}</h2>
                    <p className="text-gray-600 text-sm">{category.description}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {category.forms.length} forms
                  </Badge>
                </div>
              </div>

              {/* Forms List */}
              <div className="divide-y divide-gray-100">
                {category.forms.map((form, index) => (
                  <a
                    key={index}
                    href={form.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      <div>
                        <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {form.label}
                        </span>
                        {form.description && (
                          <p className="text-sm text-gray-500">{form.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 group-hover:text-blue-600 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* CMS Notice */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Forms can be managed from the{' '}
            <Link to="/admin/advisor-cms" className="underline hover:text-blue-600">
              Advisor Portal CMS
            </Link>
            . Any forms added there will appear in this toolkit.
          </p>
        </div>
      </div>
    </div>
  );
}
