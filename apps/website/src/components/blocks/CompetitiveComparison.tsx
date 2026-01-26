import React, { useState } from 'react';
import { Check, X, Info, TrendingDown } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

interface ComparisonFeature {
  category: string;
  features: {
    name: string;
    description?: string;
    mpbHealth: boolean | string;
    traditional: boolean | string;
    competitor1: boolean | string;
    competitor2: boolean | string;
  }[];
}

const CompetitiveComparison: React.FC = () => {
  const [selectedFamily, setSelectedFamily] = useState<'individual' | 'couple' | 'family'>('family');

  const pricingData = {
    individual: {
      mpbHealth: 166,
      traditional: 450,
      competitor1: 189,
      competitor2: 175
    },
    couple: {
      mpbHealth: 284,
      traditional: 850,
      competitor1: 365,
      competitor2: 340
    },
    family: {
      mpbHealth: 445,
      traditional: 1200,
      competitor1: 485,
      competitor2: 450
    }
  };

  const comparisonData: ComparisonFeature[] = [
    {
      category: "Cost & Savings",
      features: [
        {
          name: "Monthly Cost (Family of 4)",
          mpbHealth: "$445/mo*",
          traditional: "$1,200/mo",
          competitor1: "$485/mo",
          competitor2: "$450/mo"
        },
        {
          name: "Annual Out-of-Pocket Maximum",
          description: "Maximum you'll pay per year for eligible expenses",
          mpbHealth: "$3,000",
          traditional: "$14,000",
          competitor1: "$7,500",
          competitor2: "$8,000"
        },
        {
          name: "No Hidden Fees",
          mpbHealth: true,
          traditional: false,
          competitor1: true,
          competitor2: false
        },
      ]
    },
    {
      category: "Provider Freedom",
      features: [
        {
          name: "No Network Restrictions",
          description: "Visit any doctor, specialist, or hospital nationwide",
          mpbHealth: true,
          traditional: false,
          competitor1: true,
          competitor2: true
        },
        {
          name: "Worldwide Protection",
          mpbHealth: true,
          traditional: false,
          competitor1: true,
          competitor2: true
        },
        {
          name: "Keep Your Current Doctor",
          mpbHealth: true,
          traditional: "Network Only",
          competitor1: true,
          competitor2: "Limited"
        }
      ]
    },
    {
      category: "Benefits & Services",
      features: [
        {
          name: "24/7 Telemedicine",
          description: "Free virtual doctor visits anytime",
          mpbHealth: "Free Unlimited",
          traditional: "$25 copay",
          competitor1: "$35 copay",
          competitor2: "Limited"
        },
        {
          name: "Maternity Sharing",
          mpbHealth: "Yes/6 mo wait",
          traditional: true,
          competitor1: "12mo wait",
          competitor2: "Limited"
        },
        {
          name: "Virtual Behavioral Health Support",
          mpbHealth: true,
          traditional: "Limited",
          competitor1: "Limited",
          competitor2: false
        },
        {
          name: "Prescription Discounts",
          description: "Average 40% savings on medications",
          mpbHealth: "$0 | $14.95 | Up to 70%",
          traditional: "Formulary Only",
          competitor1: "Up to 40%",
          competitor2: "Up to 50%"
        },
        {
          name: "Virtual Urgent Care 24/7/365",
          mpbHealth: true,
          traditional: "Limited",
          competitor1: "Limited",
          competitor2: "Limited"
        },
        {
          name: "Virtual PCP",
          mpbHealth: true,
          traditional: "$50 copay",
          competitor1: "Limited",
          competitor2: "Limited"
        },
        {
          name: "Virtual Pet Care",
          mpbHealth: true,
          traditional: false,
          competitor1: false,
          competitor2: false
        },
        {
          name: "Specialty Care 100% after IUA",
          description: "IUA = Initial Unshareable Amount",
          mpbHealth: true,
          traditional: "Network Only",
          competitor1: "Limited",
          competitor2: "Limited"
        },
        {
          name: "Hospitalization 100% after IUA",
          description: "IUA = Initial Unshareable Amount",
          mpbHealth: true,
          traditional: "80% after deductible",
          competitor1: "Limited",
          competitor2: "Limited"
        },
        {
          name: "Medical Advocacy",
          description: "Personal support navigating healthcare bills and providers",
          mpbHealth: true,
          traditional: false,
          competitor1: "Limited",
          competitor2: false
        }
      ]
    },
    {
      category: "Support & Service",
      features: [
        {
          name: "Dedicated Personal Advisor",
          description: "Your own healthcare advisor for guidance",
          mpbHealth: true,
          traditional: false,
          competitor1: true,
          competitor2: false
        },
        {
          name: "Mobile App Access",
          mpbHealth: true,
          traditional: true,
          competitor1: false,
          competitor2: true
        },
        {
          name: "Average Response Time",
          mpbHealth: "< 2 hours",
          traditional: "2-3 days",
          competitor1: "24 hours",
          competitor2: "48 hours"
        }
      ]
    },
    {
      category: "Transparency & Trust",
      features: [
        {
          name: "BBB Rating",
          mpbHealth: "A+",
          traditional: "Varies",
          competitor1: "A",
          competitor2: "B+"
        },
        {
          name: "Member Satisfaction",
          mpbHealth: "99.8%",
          traditional: "~85%",
          competitor1: "~92%",
          competitor2: "~88%"
        },
        {
          name: "Years in Business",
          mpbHealth: "15+",
          traditional: "Varies",
          competitor1: "8",
          competitor2: "12"
        }
      ]
    }
  ];

  const renderCell = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-success mx-auto" />
      ) : (
        <X className="w-5 h-5 text-neutral-400 mx-auto" />
      );
    }
    return <span className="text-sm font-medium text-neutral-900">{value}</span>;
  };

  const currentPricing = pricingData[selectedFamily];
  const savingsVsTraditional = currentPricing.traditional - currentPricing.mpbHealth;
  const annualSavings = savingsVsTraditional * 12;

  return (
    <section className="py-24 bg-gradient-to-br from-white via-neutral-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 rounded-full px-4 py-2 mb-4">
            <TrendingDown className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-600">Compare & Save</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
            See How MPB Health Stacks Up
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            We believe in transparency. Here's an honest comparison of what you get with MPB Health
            versus traditional insurance and other health sharing options.
          </p>
        </div>

        {/* Family Size Selector */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white rounded-xl p-2 shadow-md border border-neutral-200">
            {(['individual', 'couple', 'family'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedFamily(type)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  selectedFamily === type
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {type === 'individual' && 'Individual'}
                {type === 'couple' && 'Couple'}
                {type === 'family' && 'Family of 4'}
              </button>
            ))}
          </div>
        </div>

        {/* Savings Banner */}
        <div className="bg-gradient-to-r from-success to-green-600 rounded-2xl p-8 mb-12 shadow-xl">
          <div className="text-center text-white">
            <div className="text-sm font-semibold uppercase tracking-wider mb-2">
              Your Potential Savings
            </div>
            <div className="text-5xl font-bold mb-2">
              ${savingsVsTraditional}/month
            </div>
            <div className="text-lg opacity-90">
              That's <span className="font-bold">${annualSavings.toLocaleString()}</span> per year vs traditional insurance!
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center bg-gradient-to-r from-blue-600 to-cyan-600">
                    <div className="text-white">
                      <div className="text-xs font-semibold uppercase tracking-wider mb-1">Best Value</div>
                      <div className="text-lg font-bold">MPB Health</div>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-600">
                    Traditional<br />Insurance
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-600">
                    Competitor<br />A
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-600">
                    Competitor<br />B
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((category, categoryIndex) => (
                  <React.Fragment key={categoryIndex}>
                    <tr className="bg-neutral-50">
                      <td colSpan={5} className="px-6 py-3">
                        <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                          {category.category}
                        </h3>
                      </td>
                    </tr>
                    {category.features.map((feature, featureIndex) => (
                      <tr key={featureIndex} className="border-t border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-900">
                              {feature.name}
                            </span>
                            {feature.description && (
                              <Tooltip content={feature.description}>
                                <Info className="w-4 h-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
                              </Tooltip>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center bg-blue-50/50 font-semibold">
                          {renderCell(feature.mpbHealth)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderCell(feature.traditional)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderCell(feature.competitor1)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderCell(feature.competitor2)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <a
            href="/get-started"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Get Your Free Quote Now
            <TrendingDown className="w-5 h-5" />
          </a>
          <p className="mt-4 text-sm text-neutral-600">
            See your personalized savings in under 60 seconds.
          </p>
        </div>
      </div>
    </section>
  );
};

export { CompetitiveComparison };
