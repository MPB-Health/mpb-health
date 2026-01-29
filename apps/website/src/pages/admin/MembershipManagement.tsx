import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Search, 
  Filter, 
  Plus,
  Edit,
  Shield,
  Heart,
  Stethoscope,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  MoreVertical
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: 'individual' | 'family' | 'employer';
  tier: 'basic' | 'standard' | 'premium' | 'elite';
  monthly_price: number;
  annual_price?: number;
  features: string[];
  benefits: string[];
  is_active: boolean;
  is_featured: boolean;
  enrollment_count?: number;
  created_at: string;
  updated_at: string;
}

interface Benefit {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  is_active: boolean;
}

const MembershipManagement: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plans' | 'benefits' | 'pricing'>('plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      const [plansResult, benefitsResult] = await Promise.all([
        supabase.from('membership_plans').select('*').order('monthly_price', { ascending: true }),
        supabase.from('plan_benefits').select('*').order('category', { ascending: true })
      ]);

      if (!plansResult.error) {
        setPlans(plansResult.data || []);
      }

      if (!benefitsResult.error) {
        setBenefits(benefitsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }

    setLoading(false);
  };

  const filteredPlans = plans.filter(plan => {
    if (!searchQuery && categoryFilter === 'all') return true;
    const matchesSearch = !searchQuery || 
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || plan.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-slate-100 text-slate-700',
      standard: 'bg-blue-100 text-blue-700',
      premium: 'bg-purple-100 text-purple-700',
      elite: 'bg-amber-100 text-amber-700'
    };
    return colors[tier] || 'bg-gray-100 text-gray-700';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'individual':
        return <Users className="h-5 w-5" />;
      case 'family':
        return <Heart className="h-5 w-5" />;
      case 'employer':
        return <Shield className="h-5 w-5" />;
      default:
        return <Stethoscope className="h-5 w-5" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleToggleActive = async (planId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('membership_plans')
      .update({ is_active: !currentStatus })
      .eq('id', planId);

    if (!error) {
      loadData();
    }
  };

  const handleToggleFeatured = async (planId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('membership_plans')
      .update({ is_featured: !currentStatus })
      .eq('id', planId);

    if (!error) {
      loadData();
    }
  };

  const stats = {
    totalPlans: plans.length,
    activePlans: plans.filter(p => p.is_active).length,
    totalBenefits: benefits.length,
    activeBenefits: benefits.filter(b => b.is_active).length
  };

  const renderPlansTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-neutral-600" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="individual">Individual</option>
              <option value="family">Family</option>
              <option value="employer">Employer</option>
            </select>
            <Button className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Plan
            </Button>
          </div>
        </div>
      </Card>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <Card className="p-12 text-center">
          <Shield className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No plans found</h3>
          <p className="text-neutral-600">No plans match your criteria</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`p-6 hover:shadow-lg transition-shadow relative ${
                plan.is_featured ? 'ring-2 ring-amber-400' : ''
              } ${!plan.is_active ? 'opacity-60' : ''}`}
            >
              {plan.is_featured && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                    FEATURED
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    plan.category === 'individual' ? 'bg-blue-100' :
                    plan.category === 'family' ? 'bg-pink-100' : 'bg-green-100'
                  }`}>
                    {getCategoryIcon(plan.category)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{plan.name}</h3>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getTierColor(plan.tier)}`}>
                      {plan.tier}
                    </span>
                  </div>
                </div>
                <button className="text-neutral-400 hover:text-neutral-600">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                {plan.description}
              </p>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-neutral-900">
                  {formatCurrency(plan.monthly_price)}
                </span>
                <span className="text-neutral-500">/month</span>
              </div>

              {plan.features && plan.features.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-neutral-700 mb-2">Key Features:</h4>
                  <ul className="space-y-1">
                    {plan.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-neutral-600">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="line-clamp-1">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-sm text-blue-600">+{plan.features.length - 3} more features</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(plan.id, plan.is_active)}
                    className={`p-2 rounded-lg ${plan.is_active ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-400'}`}
                    title={plan.is_active ? 'Active' : 'Inactive'}
                  >
                    {plan.is_active ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleToggleFeatured(plan.id, plan.is_featured)}
                    className={`p-2 rounded-lg ${plan.is_featured ? 'bg-amber-100 text-amber-600' : 'bg-neutral-100 text-neutral-400'}`}
                    title={plan.is_featured ? 'Featured' : 'Not Featured'}
                  >
                    ⭐
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderBenefitsTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">Plan Benefits</h3>
          <Button className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Benefit
          </Button>
        </div>
      </Card>

      {benefits.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No benefits configured</h3>
          <p className="text-neutral-600">Add benefits to your membership plans</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {benefits.map((benefit) => (
            <Card key={benefit.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Heart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">{benefit.name}</h4>
                    <p className="text-sm text-neutral-600">{benefit.description}</p>
                    <span className="inline-flex mt-1 px-2 py-0.5 bg-neutral-100 rounded text-xs text-neutral-600">
                      {benefit.category}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderPricingTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Pricing Configuration</h3>
        <p className="text-neutral-600 mb-6">Manage pricing tiers and discount rules for all membership plans.</p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Monthly</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Annual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Savings</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {plans.map((plan) => {
                const annualSavings = plan.annual_price 
                  ? ((plan.monthly_price * 12) - plan.annual_price)
                  : 0;
                return (
                  <tr key={plan.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(plan.category)}
                        <div>
                          <div className="font-medium text-neutral-900">{plan.name}</div>
                          <div className="text-sm text-neutral-500 capitalize">{plan.tier}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-neutral-900">{formatCurrency(plan.monthly_price)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-neutral-900">
                        {plan.annual_price ? formatCurrency(plan.annual_price) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {annualSavings > 0 ? (
                        <span className="text-green-600 font-medium">Save {formatCurrency(annualSavings)}</span>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Pricing
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <AdminLayout activeView="coverage" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Membership Management - Admin - MPB Health</title>
        <meta name="description" content="Manage membership plans and benefits" />
      </Helmet>

      <div>
        <AdminBreadcrumb currentPage="Membership Management" />

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Membership Management</h1>
                <p className="mt-2 text-neutral-600">Manage plans and benefits</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-blue-50 border-l-4 border-blue-600">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Total Plans</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.totalPlans}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-green-50 border-l-4 border-green-600">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Active Plans</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.activePlans}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-purple-50 border-l-4 border-purple-600">
              <div className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Total Benefits</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.totalBenefits}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-amber-50 border-l-4 border-amber-600">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-amber-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Price Range</div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {plans.length > 0 ? `${formatCurrency(Math.min(...plans.map(p => p.monthly_price)))} - ${formatCurrency(Math.max(...plans.map(p => p.monthly_price)))}` : '-'}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-neutral-200">
            {[
              { id: 'plans', label: 'Plans', icon: <Shield className="h-5 w-5" /> },
              { id: 'benefits', label: 'Benefits', icon: <Heart className="h-5 w-5" /> },
              { id: 'pricing', label: 'Pricing', icon: <DollarSign className="h-5 w-5" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'plans' | 'benefits' | 'pricing')}
                className={`px-6 py-3 border-b-2 transition-colors inline-flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'plans' && renderPlansTab()}
              {activeTab === 'benefits' && renderBenefitsTab()}
              {activeTab === 'pricing' && renderPricingTab()}
            </>
          )}
        </div>
    </AdminLayout>
  );
};

export default MembershipManagement;

