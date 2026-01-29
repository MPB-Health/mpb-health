import React, { useState, useEffect } from 'react';
import { ArrowRight, Play, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { typography } from '../../lib/typography';
import HeroCalculator from '../HeroCalculator';
import { AffiliateProvider } from '../AffiliateProvider';
import { siteMediaService } from '../../lib/siteMediaService';

const EnhancedHero: React.FC = () => {
  const [showVideo, setShowVideo] = useState(false);
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState('/assets/young-parents-happy-mother.mp4');

  useEffect(() => {
    const loadMediaSettings = async () => {
      const [heroUrl, bgUrl] = await Promise.all([
        siteMediaService.getVideoUrl('video_homepage_hero'),
        siteMediaService.getMediaSetting('video_background_mp4')
      ]);
      setHeroVideoUrl(heroUrl);
      if (bgUrl) setBackgroundVideoUrl(bgUrl);
    };
    loadMediaSettings();
  }, []);

  return (
    <section className="relative bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/30 py-16 md:py-24 overflow-hidden">
      {/* Background video with overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={backgroundVideoUrl} type="video/mp4" />
        </video>
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/75 to-blue-50/80" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.08) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="animate-fade-in">
            {/* Health Share Tagline */}
            <div className="inline-block bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-200 rounded-lg px-4 py-2 mb-4">
              <span className="text-sm font-semibold text-blue-700">
                Not Insurance — The Smarter, More Affordable Way to Pay for Healthcare Costs
              </span>
            </div>

            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-white border border-blue-200 rounded-full px-4 py-2 shadow-sm mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                ))}
              </div>
              <span className="text-sm font-medium text-neutral-700">
                4.9/5 from 12,000+ families
              </span>
            </div>

            {/* Headline */}
            <h1 className={`${typography.headings.h1.hero} mb-6`}>
              <span className={typography.gradients.brand}>
                HealthShare Memberships Built for You
              </span>
            </h1>

            {/* Subheadline */}
            <p className={`${typography.body.large} text-neutral-600 mb-8`}>
              Discover why smart families are ditching expensive health insurance for community-based health sharing.
              <span className="font-semibold text-neutral-900"> Real people. Real savings. Real care.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={() => {
                  const calculator = document.getElementById('calculator');
                  if (calculator) {
                    calculator.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="flex-1 sm:flex-initial"
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  Get Your Quote
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </button>

              <button
                onClick={() => setShowVideo(!showVideo)}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-neutral-200 text-neutral-900 font-semibold rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Play className="w-5 h-5" />
                Watch How It Works
              </button>
            </div>

          </div>

          {/* Right Column - Compact Calculator */}
          <div className="relative animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {showVideo ? (
              <div className="relative bg-white rounded-2xl shadow-2xl p-2">
                <div className="aspect-video bg-neutral-900 rounded-xl overflow-hidden">
                    <iframe
                    title="vimeo-player"
                    src={heroVideoUrl}
                    className="w-full h-full"
                    frameBorder="0"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <AffiliateProvider>
                  <HeroCalculator />
                </AffiliateProvider>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export { EnhancedHero };
