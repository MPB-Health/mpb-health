import { detectBrand } from '@mpbhealth/ui';
import { LandingNav } from '../components/landing/LandingNav';
import { HeroSection } from '../components/landing/HeroSection';
import { TrustBar } from '../components/landing/TrustBar';
import { AIShowcase } from '../components/landing/AIShowcase';
import { FeaturesGrid } from '../components/landing/FeaturesGrid';
import { PipelineFlow } from '../components/landing/PipelineFlow';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { PricingSection } from '../components/landing/PricingSection';
import { CTASection } from '../components/landing/CTASection';
import { LandingFooter } from '../components/landing/LandingFooter';
import AryxCrmLanding from '../components/landing/AryxCrmLanding';

// Brand-gated landing page:
//   * crm.aryxcloud.com (or localStorage.brand=aryx) → AryxCrmLanding
//     dark cinematic ARYX flagship CRM experience.
//   * crm.mpb.health (default)                       → existing MPB Health
//     white-themed marketing landing (HeroSection, TrustBar, AIShowcase, etc.).
export default function LandingPage() {
  if (detectBrand() === 'aryx') {
    return <AryxCrmLanding />;
  }

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <HeroSection />
      <TrustBar />
      <AIShowcase />
      <FeaturesGrid />
      <PipelineFlow />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
