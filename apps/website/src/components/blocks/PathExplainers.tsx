import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/Accordion';
import { Button } from '../ui/Button';

interface PathExplainerData {
  id: string;
  title: string;
  gradient: string;
  profiles: string[];
  whatYouGet: string[];
  whatYouDont: string[];
  bestFor: string;
}

const pathExplainers: PathExplainerData[] = [
  {
    id: "routine-virtual-care",
    title: "Routine & Virtual Care",
    gradient: "from-blue-500 to-cyan-500",
    profiles: [
      "Healthy individuals needing preventive care",
      "Families prioritizing wellness and routine checkups",
      "Those seeking unlimited telemedicine access",
      "Budget-conscious members with low medical needs",
      "Young professionals wanting basic membership"
    ],
    whatYouGet: [
      "24/7 telemedicine and virtual doctor visits",
      "Preventive care and wellness visits",
      "Prescription discount programs",
      "Routine checkups and screenings",
      "Virtual behavioral health support resources",
      "Lowest monthly contribution options"
    ],
    whatYouDont: [
      "Limited sharing for major medical events",
      "Higher out-of-pocket for hospital stays",
      "May not cover all specialist visits",
      "Not suitable for chronic conditions requiring frequent care"
    ],
    bestFor: "Individuals and families who prioritize everyday wellness, preventive care, and virtual access while keeping monthly costs low.",
  },
  {
    id: "big-bill-protection",
    title: "Large Medical Expense Protection",
    gradient: "from-teal-500 to-green-500",
    profiles: [
      "Families with children or teens",
      "Those with moderate health concerns",
      "Members wanting comprehensive sharing",
      "People prioritizing catastrophic protection",
      "Individuals between employer plans"
    ],
    whatYouGet: [
      "Large medical expense sharing for hospitalizations",
      "Surgery and emergency room sharing",
      "Specialist visits and procedures",
      "Maternity and childbirth sharing"
    ],
    whatYouDont: [
      "Pre-membership conditions have waiting periods",
      "Initial Unshareable Amount (IUA) applies first",
      "Some elective procedures may not be shared",
      "Sharing limits apply per medical need"
    ],
    bestFor: "Members who want strong protection against large medical bills while maintaining affordable monthly contributions and community-based sharing.",
  },
  {
    id: "hsa-compatible",
    title: "HSA-Compatible Memberships",
    gradient: "from-emerald-500 to-teal-500",
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
      "Lower monthly contributions than traditional insurance"
    ],
    whatYouDont: [
      "Must meet IRS HSA eligibility requirements",
      "HSA contribution limits apply annually"
    ],
    bestFor: "Self Employed or 1099 Individuals who want to maximize tax benefits while protecting against major medical expenses and building long-term healthcare savings.",
  }
];

export interface PathExplainersHandle {
  openExplainer: (id: string) => void;
}

const PathExplainers = forwardRef<PathExplainersHandle>((props, ref) => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  useImperativeHandle(ref, () => ({
    openExplainer: (id: string) => {
      setOpenItems([id]);
    }
  }));
  const handleCalculateClick = () => {
    const calculator = document.querySelector('#calculator');
    if (calculator) {
      calculator.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Navigate to the page with the calculator
      window.location.href = '/individuals-and-families#calculator';
    }
  };

  return (
    <section className="py-16 bg-white" aria-labelledby="path-explainers-heading">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 id="path-explainers-heading" className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Understand Your Options
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Explore detailed information about each plan family to find the perfect fit for your healthcare needs.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4" value={openItems} onValueChange={setOpenItems}>
          {pathExplainers.map((explainer) => (
            <AccordionItem
              key={explainer.id}
              value={explainer.id}
              id={`explainer-${explainer.id}`}
              className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <AccordionTrigger
                className="px-6 py-5 hover:no-underline group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                aria-label={`Expand details about ${explainer.title}`}
              >
                <div className="flex items-center gap-4 text-left w-full">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${explainer.gradient} flex-shrink-0`} />
                  <h3 className="text-xl font-bold text-neutral-900 flex-1">
                    {explainer.title}
                  </h3>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-6 pb-6">
                <div className="space-y-6 pt-4">
                  {/* Typical Profiles */}
                  <div>
                    <h4 className="text-lg font-semibold text-neutral-900 mb-3">
                      Typical Profiles
                    </h4>
                    <ul className="space-y-2" role="list">
                      {explainer.profiles.map((profile, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-neutral-700">
                          <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-600" aria-hidden="true" />
                          <span>{profile}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* What You Get */}
                  <div>
                    <h4 className="text-lg font-semibold text-neutral-900 mb-3">
                      What You Get
                    </h4>
                    <ul className="space-y-2" role="list">
                      {explainer.whatYouGet.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-neutral-700">
                          <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-green-600" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* What You Don't Get */}
                  <div>
                    <h4 className="text-lg font-semibold text-neutral-900 mb-3">
                      Important Considerations
                    </h4>
                    <ul className="space-y-2" role="list">
                      {explainer.whatYouDont.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-neutral-700">
                          <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Best For */}
                  <div className="bg-neutral-50 rounded-lg p-4 border-l-4 border-neutral-900">
                    <h4 className="text-base font-semibold text-neutral-900 mb-2">
                      Best For:
                    </h4>
                    <p className="text-neutral-700 leading-relaxed">
                      {explainer.bestFor}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      asChild
                      className={`flex-1 bg-gradient-to-r ${explainer.gradient} hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold`}
                      aria-label="View detailed plan comparison"
                    >
                      <Link to="/individuals-and-families" className="inline-flex items-center justify-center">
                        Compare Details
                      </Link>
                    </Button>

                    <Button
                      onClick={handleCalculateClick}
                      className={`flex-1 bg-gradient-to-r ${explainer.gradient} hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold`}
                      aria-label="Calculate your personalized rate"
                    >
                      Calculate My Rate
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
});

PathExplainers.displayName = 'PathExplainers';

export { PathExplainers };
export type { PathExplainersHandle };
