import { LandingNav } from '../components/landing/LandingNav';
import { HeroSection } from '../components/landing/HeroSection';
import { TrustBar } from '../components/landing/TrustBar';
import { FeaturesGrid } from '../components/landing/FeaturesGrid';
import { PipelineFlow } from '../components/landing/PipelineFlow';
import { PricingSection } from '../components/landing/PricingSection';
import { CTASection } from '../components/landing/CTASection';
import { LandingFooter } from '../components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <HeroSection />
      <TrustBar />
      <FeaturesGrid />
      <PipelineFlow />
      <PricingSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
