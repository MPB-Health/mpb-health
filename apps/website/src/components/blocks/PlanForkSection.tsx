import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Check, Users, Stethoscope, PiggyBank } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PlanForkSectionProps {
  onSeeRates: (planType: string, anchor: string) => void;
}

export function PlanForkSection({ onSeeRates }: PlanForkSectionProps) {
  const handlePlanClick = async (planType: string, anchor: string) => {
    const sessionId = sessionStorage.getItem('mpb_session_id') || crypto.randomUUID();
    sessionStorage.setItem('mpb_session_id', sessionId);

    await supabase.from('plan_selections').insert({
      session_id: sessionId,
      plan_type: planType,
      action: 'clicked',
      user_agent: navigator.userAgent,
      referrer: document.referrer,
    });

    onSeeRates(planType, anchor);
  };

  const plans = [
    {
      id: 'care-plus',
      name: 'Care+',
      icon: Users,
      badge: 'Most Popular',
      badgeVariant: 'default' as const,
      description: 'Comprehensive sharing with bundled direct primary care',
      bullets: [
        'Best for: Families & individuals wanting bundled care',
        'IUA options: $1,250 / $2,500 / $5,000',
        'Includes: Unlimited telemedicine & office visits',
      ],
      anchor: '#care-plus-rates',
      pdfUrl: 'https://mpb.health/wp-content/uploads/2025/10/Care-Plus.pdf',
    },
    {
      id: 'direct',
      name: 'Direct',
      icon: Stethoscope,
      badge: null,
      badgeVariant: 'secondary' as const,
      description: 'Medical cost sharing with optional direct primary care',
      bullets: [
        'Best for: Those with existing primary care',
        'IUA options: $1,250 / $2,500 / $5,000',
        'Add DPC: Optional monthly add-on',
      ],
      anchor: '#direct-rates',
      pdfUrl: 'https://mpb.health/wp-content/uploads/2025/10/Direct.pdf',
    },
    {
      id: 'secure-hsa',
      name: 'Secure HSA',
      icon: PiggyBank,
      badge: 'HSA Eligible',
      badgeVariant: 'secondary' as const,
      description: 'High IUA plan designed for HSA compatibility',
      bullets: [
        'Best for: HSA contributors & healthy members',
        'IUA options: $1,250 / $2,500 / $5,000',
        'Lower monthly share for high-deductible approach',
      ],
      anchor: '#hsa-rates',
      pdfUrl: 'https://mpb.health/wp-content/uploads/2025/10/Secure-HSA.pdf',
    },
  ];

  return (
    <section id="compare-plans" className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Membership
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            All plans include transparent pricing by Age Band and IUA. Tobacco/vape household surcharge: +$50/mo (applied once per household).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card key={plan.id} className="relative p-6 hover:shadow-xl transition-shadow">
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant={plan.badgeVariant}>{plan.badge}</Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="inline-flex w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  onClick={() => handlePlanClick(plan.id, plan.anchor)}
                >
                  See Rates & Details
                </Button>

                <a
                  href={plan.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-sm text-blue-600 hover:text-blue-700 mt-3"
                >
                  View Price Sheet (PDF)
                </a>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
