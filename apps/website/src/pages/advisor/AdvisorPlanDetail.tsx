import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  BookOpen,
  DollarSign,
  Map,
  Download,
  ExternalLink,
  ChevronRight,
  Loader2,
  AlertCircle,
  Shield,
  Heart,
  Sparkles,
  Star,
  Zap,
  Info,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';

interface PlanDetails {
  id: string;
  plan_slug: string;
  plan_name: string;
  description: string;
  icon: string;
  color: string;
  overview_content: string | null;
  pricing_content: string | null;
  handbook_url: string | null;
  handbook_title: string | null;
  flyer_url: string | null;
  flyer_title: string | null;
  qrg_url: string | null;
  qrg_title: string | null;
  state_guidelines: StateGuideline[] | null;
  is_active: boolean;
}

interface StateGuideline {
  state: string;
  status: 'available' | 'restricted' | 'unavailable';
  notes: string;
}

// Default plan details
const DEFAULT_PLAN_DETAILS: Record<string, Omit<PlanDetails, 'id'>> = {
  'secure-hsa': {
    plan_slug: 'secure-hsa',
    plan_name: 'Secure HSA',
    description: 'Health Savings Account compatible plan with preventive care benefits',
    icon: 'Shield',
    color: 'blue',
    overview_content: 'The Secure HSA plan provides HSA-compatible health sharing with preventive care benefits. Members can contribute to a Health Savings Account while enjoying comprehensive health sharing coverage.',
    pricing_content: null,
    handbook_url: null,
    handbook_title: 'Secure HSA Member Handbook',
    flyer_url: null,
    flyer_title: 'Secure HSA Plan Overview Flyer',
    qrg_url: null,
    qrg_title: 'Secure HSA Quick Reference Guide',
    state_guidelines: null,
    is_active: true,
  },
  'direct': {
    plan_slug: 'direct',
    plan_name: 'Direct',
    description: 'Direct primary care membership with comprehensive coverage',
    icon: 'Zap',
    color: 'purple',
    overview_content: 'The Direct plan offers direct primary care access combined with health sharing coverage for larger medical needs.',
    pricing_content: null,
    handbook_url: null,
    handbook_title: 'Direct Plan Member Handbook',
    flyer_url: null,
    flyer_title: 'Direct Plan Overview Flyer',
    qrg_url: null,
    qrg_title: 'Direct Plan Quick Reference Guide',
    state_guidelines: null,
    is_active: true,
  },
  'care-plus': {
    plan_slug: 'care-plus',
    plan_name: 'Care+',
    description: 'Enhanced care plan with additional benefits and services',
    icon: 'Heart',
    color: 'rose',
    overview_content: 'Care+ is an enhanced health sharing plan that includes additional benefits and services beyond standard coverage.',
    pricing_content: null,
    handbook_url: null,
    handbook_title: 'Care+ Member Handbook',
    flyer_url: null,
    flyer_title: 'Care+ Plan Overview Flyer',
    qrg_url: null,
    qrg_title: 'Care+ Quick Reference Guide',
    state_guidelines: null,
    is_active: true,
  },
  'premium-care': {
    plan_slug: 'premium-care',
    plan_name: 'Premium Care',
    description: 'Premium tier membership with comprehensive health sharing',
    icon: 'Star',
    color: 'amber',
    overview_content: 'Premium Care offers our most comprehensive health sharing coverage with premium benefits and services.',
    pricing_content: null,
    handbook_url: null,
    handbook_title: 'Premium Care Member Handbook',
    flyer_url: null,
    flyer_title: 'Premium Care Overview Flyer',
    qrg_url: null,
    qrg_title: 'Premium Care Quick Reference Guide',
    state_guidelines: null,
    is_active: true,
  },
  'premium-hsa': {
    plan_slug: 'premium-hsa',
    plan_name: 'Premium HSA',
    description: 'Premium HSA-compatible plan with maximum benefits',
    icon: 'Sparkles',
    color: 'emerald',
    overview_content: 'Premium HSA combines our premium tier benefits with HSA compatibility for maximum flexibility and tax advantages.',
    pricing_content: null,
    handbook_url: null,
    handbook_title: 'Premium HSA Member Handbook',
    flyer_url: null,
    flyer_title: 'Premium HSA Overview Flyer',
    qrg_url: null,
    qrg_title: 'Premium HSA Quick Reference Guide',
    state_guidelines: null,
    is_active: true,
  },
  'essentials': {
    plan_slug: 'essentials',
    plan_name: 'Essentials',
    description: 'Essential coverage plan for everyday healthcare needs',
    icon: 'FileText',
    color: 'gray',
    overview_content: 'The Essentials plan provides core health sharing coverage for everyday healthcare needs at an affordable rate.',
    pricing_content: null,
    handbook_url: null,
    handbook_title: 'Essentials Member Handbook',
    flyer_url: null,
    flyer_title: 'Essentials Plan Overview Flyer',
    qrg_url: null,
    qrg_title: 'Essentials Quick Reference Guide',
    state_guidelines: null,
    is_active: true,
  },
  'mec-essentials': {
    plan_slug: 'mec-essentials',
    plan_name: 'MEC+Essentials',
    description: 'Minimum Essential Coverage plus essential health benefits',
    icon: 'Shield',
    color: 'indigo',
    overview_content: 'MEC+Essentials combines Minimum Essential Coverage compliance with essential health sharing benefits.',
    pricing_content: null,
    handbook_url: null,
    handbook_title: 'MEC+Essentials Member Handbook',
    flyer_url: null,
    flyer_title: 'MEC+Essentials Overview Flyer',
    qrg_url: null,
    qrg_title: 'MEC+Essentials Quick Reference Guide',
    state_guidelines: null,
    is_active: true,
  },
};

const iconMap: Record<string, React.ReactNode> = {
  Shield: <Shield className="w-10 h-10" />,
  Zap: <Zap className="w-10 h-10" />,
  Heart: <Heart className="w-10 h-10" />,
  Star: <Star className="w-10 h-10" />,
  Sparkles: <Sparkles className="w-10 h-10" />,
  FileText: <FileText className="w-10 h-10" />,
};

const colorClasses: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-500 to-blue-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200', gradient: 'from-purple-500 to-purple-600' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200', gradient: 'from-rose-500 to-rose-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200', gradient: 'from-amber-500 to-amber-600' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200', gradient: 'from-emerald-500 to-emerald-600' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', gradient: 'from-gray-500 to-gray-600' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200', gradient: 'from-indigo-500 to-indigo-600' },
};

export default function AdvisorPlanDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadPlanDetails(slug);
    }
  }, [slug]);

  const loadPlanDetails = async (planSlug: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('advisor_plan_resources')
        .select('*')
        .eq('plan_slug', planSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        // Use default if not in database
        const defaultPlan = DEFAULT_PLAN_DETAILS[planSlug];
        if (defaultPlan) {
          setPlan({ ...defaultPlan, id: `default-${planSlug}` });
        } else {
          setPlan(null);
        }
      } else {
        setPlan(data);
      }
    } catch (error) {
      console.error('Error loading plan details:', error);
      const defaultPlan = DEFAULT_PLAN_DETAILS[planSlug || ''];
      if (defaultPlan) {
        setPlan({ ...defaultPlan, id: `default-${planSlug}` });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading plan details...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Plan Not Found</h2>
            <p className="text-gray-600 mb-6">The requested plan could not be found.</p>
            <Button onClick={() => navigate('/advisor/resources')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Resources
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const colors = colorClasses[plan.color] || colorClasses.blue;
  const icon = iconMap[plan.icon] || <FileText className="w-10 h-10" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          to="/advisor/resources"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Resources
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-4 rounded-2xl ${colors.bg} ${colors.text}`}>
              {icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{plan.plan_name}</h1>
              <p className="text-gray-600">{plan.description}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Section */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <Info className={`w-5 h-5 ${colors.text}`} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Overview</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                {plan.overview_content ? (
                  <div dangerouslySetInnerHTML={{ __html: plan.overview_content }} />
                ) : (
                  <p className="text-gray-600 italic">Overview content coming soon. Check back later for detailed plan information.</p>
                )}
              </div>
            </Card>

            {/* Membership Pricing Section */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <DollarSign className={`w-5 h-5 ${colors.text}`} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Membership Pricing</h2>
              </div>
              {plan.pricing_content ? (
                <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: plan.pricing_content }} />
              ) : (
                <div className="p-6 bg-gray-50 rounded-lg text-center">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Pricing information will be displayed here.</p>
                  <p className="text-sm text-gray-500 mt-2">Contact support for current pricing details.</p>
                </div>
              )}
            </Card>

            {/* State Guidelines Section */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <Map className={`w-5 h-5 ${colors.text}`} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">State Guidelines</h2>
              </div>
              {plan.state_guidelines && plan.state_guidelines.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-900">State</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900">Status</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-900">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.state_guidelines.map((guideline, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-3 font-medium">{guideline.state}</td>
                          <td className="py-2 px-3">
                            <Badge
                              variant={
                                guideline.status === 'available' ? 'default' :
                                guideline.status === 'restricted' ? 'outline' : 'destructive'
                              }
                              className="text-xs"
                            >
                              {guideline.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-gray-600">{guideline.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-gray-50 rounded-lg text-center">
                  <Map className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">State guidelines will be displayed here.</p>
                  <p className="text-sm text-gray-500 mt-2">An interactive map may be added in a future update.</p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar - Documents */}
          <div className="space-y-6">
            {/* Handbook */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <BookOpen className={`w-5 h-5 ${colors.text}`} />
                </div>
                <h3 className="font-bold text-gray-900">Handbook</h3>
              </div>
              {plan.handbook_url ? (
                <a
                  href={plan.handbook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    <span className="font-medium text-gray-900 group-hover:text-blue-600">
                      {plan.handbook_title || 'Member Handbook'}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </a>
              ) : (
                <p className="text-sm text-gray-500 italic">Handbook not yet available</p>
              )}
            </Card>

            {/* Flyer */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <FileText className={`w-5 h-5 ${colors.text}`} />
                </div>
                <h3 className="font-bold text-gray-900">Flyer</h3>
              </div>
              {plan.flyer_url ? (
                <a
                  href={plan.flyer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    <span className="font-medium text-gray-900 group-hover:text-blue-600">
                      {plan.flyer_title || 'Plan Flyer'}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </a>
              ) : (
                <p className="text-sm text-gray-500 italic">Flyer not yet available</p>
              )}
            </Card>

            {/* Quick Reference Guide */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <FileText className={`w-5 h-5 ${colors.text}`} />
                </div>
                <h3 className="font-bold text-gray-900">Quick Reference Guide</h3>
              </div>
              {plan.qrg_url ? (
                <a
                  href={plan.qrg_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    <span className="font-medium text-gray-900 group-hover:text-blue-600">
                      {plan.qrg_title || 'QRG'}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </a>
              ) : (
                <p className="text-sm text-gray-500 italic">QRG not yet available</p>
              )}
            </Card>

            {/* CMS Notice */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Admin:</strong> Update plan content in the{' '}
                <Link to="/admin/advisor-cms" className="underline">CMS</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
