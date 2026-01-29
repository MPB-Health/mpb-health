import React, { RefObject } from 'react';
import { Video, Shield, PiggyBank } from 'lucide-react';
import { Button } from '../ui/button';

interface PathOption {
  id: string;
  title: string;
  subtitle: string;
  recommendations: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
}

const pathOptions: PathOption[] = [
  {
    id: "routine-virtual-care",
    title: "Routine & Virtual Care",
    subtitle: "Everyday care with 24/7 virtual visits.",
    recommendations: "Recommends: Essentials / MEC+Essentials",
    icon: Video,
    gradient: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-100"
  },
  {
    id: "big-bill-protection",
    title: "Large Medical Expense Protection",
    subtitle: "Large medical events, community cost sharing.",
    recommendations: "Recommends: Care+, Direct",
    icon: Shield,
    gradient: "from-teal-500 to-green-500",
    iconBg: "bg-teal-100"
  },
  {
    id: "hsa-compatible",
    title: "HSA-Compatible",
    subtitle: "Tax-advantaged approach with sharing protection.",
    recommendations: "Recommends: Secure HSA",
    icon: PiggyBank,
    gradient: "from-emerald-500 to-teal-500",
    iconBg: "bg-emerald-100"
  }
];

interface GuidedPathProps {
  pathExplainersRef?: RefObject<{ openExplainer: (id: string) => void }>;
}

const GuidedPath: React.FC<GuidedPathProps> = ({ pathExplainersRef }) => {
  const handleSeeWhy = (id: string) => {
    const element = document.getElementById(`explainer-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => {
        pathExplainersRef?.current?.openExplainer(id);
      }, 600);
    } else {
      console.warn(`Element with id "explainer-${id}" not found`);
    }
  };

  const handleJumpToPlans = () => {
    const element = document.getElementById('calculator');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Navigate to the page with the calculator
      window.location.href = '/individuals-and-families#calculator';
    }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-white to-neutral-50" aria-labelledby="guided-path-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 id="guided-path-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
            Find Your Perfect Plan
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 max-w-3xl mx-auto">
            Answer a few simple questions and we'll recommend the best healthcare sharing option for you and your family.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {pathOptions.map((option) => {
            const Icon = option.icon;

            return (
              <div
                key={option.id}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-neutral-200 hover:border-transparent"
                tabIndex={0}
                role="article"
                aria-labelledby={`path-${option.id}-title`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                <div className="relative p-8">
                  <div className={`w-16 h-16 ${option.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8 text-neutral-700" />
                  </div>

                  <h3 id={`path-${option.id}-title`} className="text-2xl font-bold text-neutral-900 mb-2">
                    {option.title}
                  </h3>

                  <p className="text-base text-neutral-600 mb-4">
                    {option.subtitle}
                  </p>

                  <p className="text-sm font-semibold text-neutral-700 mb-8 pb-4 border-b border-neutral-200">
                    {option.recommendations}
                  </p>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleSeeWhy(option.id)}
                      className={`flex-1 bg-gradient-to-r ${option.gradient} hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold`}
                      aria-label={`See why ${option.title} fits your needs`}
                    >
                      See why this fits
                    </Button>

                    <Button
                      onClick={handleJumpToPlans}
                      variant="outline"
                      className="flex-1 border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 font-semibold transition-all duration-300"
                      aria-label="Jump to plan comparison calculator"
                    >
                      Jump to plans
                    </Button>
                  </div>
                </div>

                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${option.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export { GuidedPath };
