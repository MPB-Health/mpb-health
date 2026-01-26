import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FolderOpen,
  ChevronRight,
  Shield,
  Heart,
  Sparkles,
  Star,
  Zap,
  FileText,
  Loader2,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';

interface PlanResource {
  id: string;
  plan_slug: string;
  plan_name: string;
  description: string;
  icon: string;
  color: string;
  order_index: number;
  is_active: boolean;
}

// Default plans if none exist in CMS
const DEFAULT_PLANS: Omit<PlanResource, 'id'>[] = [
  {
    plan_slug: 'secure-hsa',
    plan_name: 'Secure HSA',
    description: 'Health Savings Account compatible plan with preventive care benefits',
    icon: 'Shield',
    color: 'blue',
    order_index: 1,
    is_active: true,
  },
  {
    plan_slug: 'direct',
    plan_name: 'Direct',
    description: 'Direct primary care membership with comprehensive coverage',
    icon: 'Zap',
    color: 'purple',
    order_index: 2,
    is_active: true,
  },
  {
    plan_slug: 'care-plus',
    plan_name: 'Care+',
    description: 'Enhanced care plan with additional benefits and services',
    icon: 'Heart',
    color: 'rose',
    order_index: 3,
    is_active: true,
  },
  {
    plan_slug: 'premium-care',
    plan_name: 'Premium Care',
    description: 'Premium tier membership with comprehensive health sharing',
    icon: 'Star',
    color: 'amber',
    order_index: 4,
    is_active: true,
  },
  {
    plan_slug: 'premium-hsa',
    plan_name: 'Premium HSA',
    description: 'Premium HSA-compatible plan with maximum benefits',
    icon: 'Sparkles',
    color: 'emerald',
    order_index: 5,
    is_active: true,
  },
  {
    plan_slug: 'essentials',
    plan_name: 'Essentials',
    description: 'Essential coverage plan for everyday healthcare needs',
    icon: 'FileText',
    color: 'gray',
    order_index: 6,
    is_active: true,
  },
  {
    plan_slug: 'mec-essentials',
    plan_name: 'MEC+Essentials',
    description: 'Minimum Essential Coverage plus essential health benefits',
    icon: 'Shield',
    color: 'indigo',
    order_index: 7,
    is_active: true,
  },
];

const iconMap: Record<string, React.ReactNode> = {
  Shield: <Shield className="w-8 h-8" />,
  Zap: <Zap className="w-8 h-8" />,
  Heart: <Heart className="w-8 h-8" />,
  Star: <Star className="w-8 h-8" />,
  Sparkles: <Sparkles className="w-8 h-8" />,
  FileText: <FileText className="w-8 h-8" />,
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

export default function AdvisorResourcesLanding() {
  const [plans, setPlans] = useState<PlanResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('advisor_plan_resources')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.log('Using default plans (table may not exist yet)');
        // Use default plans if table doesn't exist or is empty
        setPlans(DEFAULT_PLANS.map((p, i) => ({ ...p, id: `default-${i}` })));
      } else if (data && data.length > 0) {
        setPlans(data);
      } else {
        // Use defaults if no data
        setPlans(DEFAULT_PLANS.map((p, i) => ({ ...p, id: `default-${i}` })));
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      setPlans(DEFAULT_PLANS.map((p, i) => ({ ...p, id: `default-${i}` })));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading resources...</p>
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
              <FolderOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
              <p className="text-gray-600">Access plan documents, handbooks, and resources</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">{plans.length} Plans Available</span>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const colors = colorClasses[plan.color] || colorClasses.blue;
            const icon = iconMap[plan.icon] || <FileText className="w-8 h-8" />;

            return (
              <Link
                key={plan.id}
                to={`/advisor/resources/${plan.plan_slug}`}
                className="group"
              >
                <Card className={`h-full p-6 hover:shadow-xl transition-all duration-300 border-2 ${colors.border} hover:border-blue-400 overflow-hidden relative`}>
                  {/* Background gradient on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${colors.bg} ${colors.text}`}>
                        {icon}
                      </div>
                      <Badge variant="outline" className={`${colors.text}`}>
                        Plan
                      </Badge>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {plan.plan_name}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {plan.description}
                    </p>

                    <div className="flex items-center text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                      View Resources
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* CMS Notice */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Plan resources can be managed from the{' '}
            <Link to="/admin/advisor-cms" className="underline hover:text-blue-600">
              Advisor Portal CMS
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
