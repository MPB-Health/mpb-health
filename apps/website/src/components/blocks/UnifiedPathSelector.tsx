import React, { useState } from 'react';
import { Shield, PiggyBank, CheckCircle2, ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';

interface PathData {
  id: string;
  title: string;
  subtitle: string;
  recommendations: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  profiles: string[];
  whatYouGet: string[];
  whatYouDont: string[];
  bestFor: string;
  imageUrl: string;
  imageAlt: string;
  /** IUA copy applies to medical sharing paths only (not Essentials / HSA-only messaging). */
  showIuaDisclaimer?: boolean;
}

const pathData: PathData[] = [
  {
    id: "individuals-and-families",
    title: "Large Medical Expense Protection",
    subtitle: "Large medical events, community cost sharing.",
    recommendations: "Recommends: Care+, Direct",
    icon: Shield,
    gradient: "from-blue-600 to-cyan-500",
    iconBg: "bg-teal-100",
    profiles: [
      "Families with children or teens",
      "Those with moderate health concerns",
      "Members wanting comprehensive sharing",
      "People prioritizing catastrophic protection",
      "Individuals between employer plans"
    ],
    whatYouGet: [
      "Emergency Care",
      "Inpatient Hospitalization",
      "Outpatient Surgery",
      "Diagnostics",
      "Specialist Care",
      "Maternity & Childbirth Sharing"
    ],
    whatYouDont: [
      "Pre-membership conditions have a 12-month waiting period",
      "Accidents are eligible immediately"
    ],
    bestFor: "Members who want strong protection against large medical bills while maintaining affordable monthly contributions and community-based sharing.",
    imageUrl: "https://images.pexels.com/photos/7176026/pexels-photo-7176026.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    imageAlt: "Healthcare professional providing care to family members",
    showIuaDisclaimer: true,
  },
  {
    id: "businesses-and-organizations",
    title: "HSA-Compatible",
    subtitle: "Tax-advantaged approach with sharing protection.",
    recommendations: "Recommends: Essentials or Secure HSA",
    icon: PiggyBank,
    gradient: "from-blue-600 to-cyan-500",
    iconBg: "bg-emerald-100",
    profiles: [
      "Self-employed professionals and business owners",
      "Those seeking tax-advantaged healthcare savings",
      "High-income earners wanting deductions",
      "Healthy individuals planning for the future"
    ],
    whatYouGet: [
      "Qualifies for Health Savings Account (HSA)",
      "Tax-deductible HSA contributions",
      "Tax-free growth on HSA investments",
      "Tax-free withdrawals for medical expenses",
      "Catastrophic sharing protection",
      "Lower monthly contributions than traditional insurance",
      "Includes Preventive Care as mandated by the ACA and RX Benefit $0"
    ],
    whatYouDont: [
      "Must meet IRS HSA eligibility requirements",
      "HSA contribution limits apply annually"
    ],
    bestFor: "Self Employed or 1099 Individuals who want to maximize tax benefits while protecting against large medical expenses and building long-term healthcare savings.",
    imageUrl: "https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    imageAlt: "Professional reviewing financial documents and healthcare savings plans",
    showIuaDisclaimer: false,
  }
];

const UnifiedPathSelector: React.FC = () => {
  const handleJumpToPlans = () => {
    const element = document.getElementById('calculator');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Navigate to the page with the calculator
      window.location.href = '/individuals-and-families#calculator';
    }
  };

  const [expandedCards, setExpandedCards] = useState<string[]>([]);

  const toggleExpand = (pathId: string) => {
    setExpandedCards(prev =>
      prev.includes(pathId)
        ? prev.filter(id => id !== pathId)
        : [...prev, pathId]
    );
  };

  return (
    <section className="py-16 bg-gradient-to-b from-neutral-50 to-white relative overflow-hidden" aria-labelledby="unified-path-heading">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 id="unified-path-heading" className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Find Your Perfect Match
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto">
            Compare our most popular memberships and discover which approach aligns with your healthcare needs and budget
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {pathData.map((path) => {
            const Icon = path.icon;
            const isExpanded = expandedCards.includes(path.id);

            return (
              <div
                key={path.id}
                id={`path-${path.id}`}
                className="relative bg-white rounded-2xl border-2 border-neutral-200 hover:border-primary-300 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden"
                role="article"
                aria-labelledby={`path-${path.id}-title`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${path.gradient}`} />

                <div className="p-6 sm:p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`flex-shrink-0 w-12 h-12 ${path.iconBg} rounded-xl flex items-center justify-center`}>
                      <Icon className="h-6 w-6 text-neutral-700" />
                    </div>
                    <div className="flex-1">
                      <h3 id={`path-${path.id}-title`} className="text-2xl font-bold text-neutral-900 mb-2">
                        {path.title}
                      </h3>
                      <p className="text-sm text-neutral-600 mb-2">
                        {path.subtitle}
                      </p>
                      <span className="inline-flex text-xs font-semibold text-primary-700 px-3 py-1 rounded-full bg-primary-50">
                        {path.recommendations}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wide">Best For</h4>
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        {path.bestFor}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success-600" />
                          Key Benefits
                        </h4>
                        <ul className="space-y-1.5" role="list">
                          {path.whatYouGet.slice(0, 3).map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-neutral-700 text-sm">
                              <span className="text-success-600 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {path.showIuaDisclaimer !== false && (
                        <div className="text-xs text-neutral-500 italic mt-2">
                          *After IUA is met
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="pt-4 border-t border-neutral-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                          <h4 className="text-sm font-bold text-neutral-900 mb-2">Typical Profiles</h4>
                          <ul className="space-y-1.5" role="list">
                            {path.profiles.map((profile, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-neutral-700 text-sm">
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600" aria-hidden="true" />
                                <span>{profile}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-neutral-900 mb-2">What's Included</h4>
                          <ul className="space-y-1.5" role="list">
                            {path.whatYouGet.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-neutral-700 text-sm">
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-success-600" aria-hidden="true" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                          {path.showIuaDisclaimer !== false && (
                            <p className="text-xs text-neutral-500 italic mt-2">*After IUA is met</p>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-neutral-900 mb-2">Important Notes</h4>
                          <ul className="space-y-1.5" role="list">
                            {path.whatYouDont.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-neutral-700 text-sm">
                                <span className="text-neutral-500 mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleExpand(path.id)}
                    className="w-full flex items-center justify-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800 mb-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    {isExpanded ? 'Show Less' : 'Show More Details'}
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      asChild
                      className={`flex-1 bg-gradient-to-r ${path.gradient} hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all duration-300`}
                    >
                      <Link to={`/${path.id}`} className="inline-flex items-center justify-center gap-2">
                        Learn More
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleJumpToPlans}
                      className="flex-1 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      Get Quote
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-24 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Not Sure Which Membership Is Right for You?
          </h3>
          <p className="text-xl mb-8 text-primary-50 max-w-2xl mx-auto">
            Our healthcare agents are here to help you find the perfect membership for your situation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              onClick={handleJumpToPlans}
              className="bg-white text-primary-700 hover:bg-neutral-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8 py-6"
            >
              Get Your Personalized Quote
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-primary-700 shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8 py-6"
            >
              <Link to="/contact">
                Speak with an Agent
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-primary-100">
            No credit card required • Get your quote in under 2 minutes
          </p>
        </div>
      </div>
    </section>
  );
};

export { UnifiedPathSelector };
