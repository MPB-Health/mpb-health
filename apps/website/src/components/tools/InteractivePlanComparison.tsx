import React, { useState } from 'react';
import { Check, X, Star, ArrowRight, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PRICING_DATA } from '../../lib/pricingData';

const features = [
  { id: 'sharing', label: 'Medical Cost Sharing', essential: true },
  { id: 'telemedicine', label: 'Telemedicine', essential: true },
  { id: 'rx', label: 'Rx Discounts', essential: true },
  { id: 'preventive', label: 'Preventive Care', essential: false },
  { id: 'maternity', label: 'Maternity Sharing', essential: false },
  { id: 'dental', label: 'Dental/Vision', essential: false },
  { id: 'wellness', label: 'Wellness Programs', essential: false },
  { id: 'enrollment', label: 'Enrollment Fee', essential: true },
  { id: 'annual', label: 'Annual Fee', essential: true },
];

const planFeatures: Record<string, Record<string, boolean | string>> = {
  'essentials': {
    sharing: true,
    telemedicine: true,
    rx: true,
    preventive: false,
    maternity: false,
    dental: true,
    wellness: false,
    enrollment: '$25',
    annual: '$0',
  },
  'care-plus': {
    sharing: true,
    telemedicine: true,
    rx: true,
    preventive: false,
    maternity: true,
    dental: 'Add-on',
    wellness: true,
    enrollment: '$0',
    annual: '$25',
  },
  'direct': {
    sharing: true,
    telemedicine: true,
    rx: true,
    preventive: true,
    maternity: true,
    dental: 'Add-on',
    wellness: true,
    enrollment: '$100',
    annual: '$25',
  },
  };

export const InteractivePlanComparison: React.FC = () => {
  const [selectedPlans, setSelectedPlans] = useState(['care-plus', 'direct', 'secure-hsa']);
  const [filters, setFilters] = useState({
    householdType: 'individual' as 'individual' | 'couple' | 'family',
    age: 35,
    showEssential: false,
  });

  const availablePlans = Object.keys(PRICING_DATA);

  const togglePlan = (planId: string) => {
    if (selectedPlans.includes(planId)) {
      if (selectedPlans.length > 1) {
        setSelectedPlans(selectedPlans.filter(p => p !== planId));
      }
    } else {
      if (selectedPlans.length < 4) {
        setSelectedPlans([...selectedPlans, planId]);
      }
    }
  };

  const getPrice = (planId: string) => {
    const plan = PRICING_DATA[planId];
    if (!plan) return 0;

    const tier = plan.benefitTiers.find(t => t.householdType === filters.householdType);
    if (!tier) return 0;

    const ageRange = tier.ageRanges.find(r => filters.age >= r.ageMin && filters.age <= r.ageMax);
    return ageRange?.price || 0;
  };

  const renderFeatureValue = (planId: string, featureId: string) => {
    const value = planFeatures[planId]?.[featureId];

    if (typeof value === 'string') {
      return <span className="text-sm font-semibold text-neutral-700">{value}</span>;
    }

    if (value === true) {
      return (
        <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
          <Check className="h-5 w-5 text-green-600" />
        </div>
      );
    }

    return (
      <div className="inline-flex items-center justify-center w-8 h-8 bg-neutral-100 rounded-full">
        <X className="h-5 w-5 text-neutral-400" />
      </div>
    );
  };

  const visibleFeatures = filters.showEssential ? features.filter(f => f.essential) : features;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header & Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Compare Plans Side-by-Side
            </h2>
            <p className="text-neutral-600">
              Select up to 4 plans to compare features and pricing
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <select
              value={filters.householdType}
              onChange={(e) => setFilters({...filters, householdType: e.target.value as any})}
              className="px-4 py-2 border-2 border-neutral-200 rounded-xl focus:border-blue-600 focus:outline-none"
            >
              <option value="individual">Individual</option>
              <option value="couple">Couple</option>
              <option value="family">Family</option>
            </select>

            <input
              type="number"
              value={filters.age}
              onChange={(e) => setFilters({...filters, age: Number(e.target.value)})}
              min={18}
              max={64}
              className="w-24 px-4 py-2 border-2 border-neutral-200 rounded-xl focus:border-blue-600 focus:outline-none"
              placeholder="Age"
            />

            <button
              onClick={() => setFilters({...filters, showEssential: !filters.showEssential})}
              className={cn(
                'flex items-center gap-2 px-4 py-2 border-2 rounded-xl font-medium transition-colors',
                filters.showEssential
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-neutral-200 text-neutral-600 hover:border-blue-300'
              )}
            >
              <Filter className="h-4 w-4" />
              {filters.showEssential ? 'Show All' : 'Essential Only'}
            </button>
          </div>
        </div>

        {/* Plan Selector */}
        <div className="mt-6 flex flex-wrap gap-3">
          {availablePlans.map((planId) => {
            const plan = PRICING_DATA[planId];
            const isSelected = selectedPlans.includes(planId);

            return (
              <button
                key={planId}
                onClick={() => togglePlan(planId)}
                className={cn(
                  'px-4 py-2 rounded-xl font-semibold transition-all',
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                )}
              >
                {plan.productLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                    Features
                  </span>
                </th>
                {selectedPlans.map((planId) => {
                  const plan = PRICING_DATA[planId];
                  const price = getPrice(planId);

                  return (
                    <th key={planId} className="px-6 py-4 text-center">
                      <div className="space-y-2">
                        <p className="text-lg font-bold text-neutral-900">{plan.productLabel}</p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-bold text-blue-600">${price}</span>
                          <span className="text-sm text-neutral-600">/mo</span>
                        </div>
                        {planId === 'care-plus' && (
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-semibold text-yellow-600">POPULAR</span>
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {visibleFeatures.map((feature, index) => (
                <tr
                  key={feature.id}
                  className={cn(
                    'border-b border-neutral-100',
                    index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                  )}
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-neutral-700">
                      {feature.label}
                    </span>
                  </td>
                  {selectedPlans.map((planId) => (
                    <td key={planId} className="px-6 py-4 text-center">
                      {renderFeatureValue(planId, feature.id)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <a href="/get-started">
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl">
            Get Your Personalized Quote
            <ArrowRight className="h-5 w-5" />
          </button>
        </a>
      </div>
    </div>
  );
};
