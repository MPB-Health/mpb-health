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

export default function LandingPage() {
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
