import { Button } from '../ui/Button';
import { ArrowRight } from 'lucide-react';

interface EnrollmentHeroProps {
  onComparePlans: () => void;
  onHowItWorks: () => void;
}

export function EnrollmentHero({ onComparePlans, onHowItWorks }: EnrollmentHeroProps) {
  return (
    <>
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Lower Your Healthcare Costs with MPB Health
          </h1>

          <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-4">
            Not insurance. MPB Health provides medical cost sharing and direct primary care with transparent rates by Age Band and IUA (2026 pricing effective January 1, 2026).
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base px-8 py-6"
              onClick={onComparePlans}
            >
              Compare Plans
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base px-8 py-6"
              onClick={onHowItWorks}
            >
              How It Works
            </Button>
          </div>

          <p className="mt-6 text-sm text-gray-600 border-t border-gray-200 pt-4 max-w-2xl mx-auto">
            <strong>Important:</strong> MPB Health is a medical cost sharing community and not insurance.
          </p>
        </div>
      </div>
    </section>
    </>
  );
}
