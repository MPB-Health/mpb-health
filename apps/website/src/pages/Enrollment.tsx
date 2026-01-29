import { useNavigate, Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { EnrollmentHero } from '../components/blocks/EnrollmentHero';
import { CredibilityStrip } from '../components/blocks/CredibilityStrip';
import { EnrollmentHowItWorks } from '../components/blocks/EnrollmentHowItWorks';
import { EnrollmentMembership } from '../components/blocks/EnrollmentMembership';
import { PlanForkSection } from '../components/blocks/PlanForkSection';
import { Pricing2026Notice } from '../components/blocks/Pricing2026Notice';
import { CalculatorCTA } from '../components/blocks/CalculatorCTA';
import { EnrollmentFAQ } from '../components/blocks/EnrollmentFAQ';
import { EnrollmentTrust } from '../components/blocks/EnrollmentTrust';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Enrollment() {
  const navigate = useNavigate();

  const scrollToAnchor = (anchor: string) => {
    const element = document.querySelector(anchor);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleComparePlans = () => {
    scrollToAnchor('#compare-plans');
  };

  const handleHowItWorks = () => {
    scrollToAnchor('#how-it-works');
  };

  const handleCardClick = (anchor: string) => {
    scrollToAnchor(anchor);
  };

  const handleSeeRates = (planType: string, anchor: string) => {
    scrollToAnchor(anchor);
  };

  const handleGetRate = () => {
    navigate('/calculator');
  };

  return (
    <>
      <SEOHead pathname="/enrollment" />
      <div className="min-h-screen bg-white">
      {/* Enrollment Notice Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-white">
            <AlertCircle className="h-5 w-5 flex-shrink-0 animate-pulse" />
            <div className="text-center">
              <p className="text-sm sm:text-base font-semibold">
                Online enrollment portal coming soon!
              </p>
              <p className="text-xs sm:text-sm opacity-90">
                Complete our quote form and we'll guide you through the enrollment process
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Form CTA Section */}
      <div className="bg-white border-b border-neutral-200 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-neutral-600 mb-6">
            Use our rate calculator to see your personalized monthly cost right now!
          </p>
          <Link to="/individuals-and-families#calculator">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
              Get Your Quote
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      <EnrollmentHero
        onComparePlans={handleComparePlans}
        onHowItWorks={handleHowItWorks}
      />

      <CredibilityStrip onCardClick={handleCardClick} />

      <EnrollmentHowItWorks />

      <EnrollmentMembership />

      <PlanForkSection onSeeRates={handleSeeRates} />

      <Pricing2026Notice />

      <CalculatorCTA onGetRate={handleGetRate} />

      <EnrollmentFAQ />

      <EnrollmentTrust />
    </div>
    </>
  );
}
