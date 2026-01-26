import React, { useRef, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { useBenefits } from '../../hooks/useBenefits';
import { trackEvent } from '../../lib/analytics';

interface BenefitsCarouselProps {
  onCTAClick: () => void;
}

export const BenefitsCarousel: React.FC<BenefitsCarouselProps> = ({ onCTAClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { benefits, loading } = useBenefits();

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || !benefits.length) return;

    const handleScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft;
      const itemWidth = scrollContainer.offsetWidth;
      const currentIndex = Math.round(scrollLeft / itemWidth);

      trackEvent('benefit_swipe', {
        index: currentIndex,
        total: benefits.length + 1,
      });
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [benefits.length]);

  if (loading) {
    return (
      <div className="w-full py-12 flex items-center justify-center">
        <p className="text-neutral-600">Loading benefits...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-6"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="flex-none w-full snap-center px-4">
          <div className="rounded-3xl p-8 bg-white/50 backdrop-blur-xl shadow-2xl border border-white/40 text-center h-full flex flex-col justify-center min-h-[340px]">
            <h2 className="text-display-sm font-bold text-neutral-900 mb-3">
              Why Families Choose Health Sharing
            </h2>
            <p className="text-lg text-neutral-600 mb-6 leading-relaxed">
              Smarter, community-powered healthcare for predictable costs.
            </p>
            <Button
              size="lg"
              onClick={onCTAClick}
              className="mx-auto shadow-lg hover:shadow-xl transition-shadow"
            >
              See how it works
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {benefits.map((benefit) => {
          const iconName = benefit.icon;
          return (
            <div
              key={benefit.benefit_key}
              className="flex-none w-full snap-center px-4"
            >
              <div className="rounded-2xl p-7 bg-white/50 backdrop-blur-xl shadow-xl border border-white/40 h-full flex flex-col min-h-[340px]">
                <div className="flex flex-col items-center text-center flex-1 justify-center">
                  <div className="inline-flex w-16 h-16 rounded-xl bg-primary/10 items-center justify-center mb-4">
                    <span className="text-3xl" aria-hidden="true">{iconName}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                    {benefit.title}
                  </h3>
                  <p
                    className="text-base text-neutral-700 leading-relaxed"
                    aria-describedby={`benefit-desc-${benefit.benefit_key}`}
                    id={`benefit-desc-${benefit.benefit_key}`}
                  >
                    {benefit.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {[...Array(benefits.length + 1)].map((_, index) => (
          <div
            key={index}
            className="h-2 w-2 rounded-full bg-neutral-300 transition-colors"
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
