import React, { useState, useEffect } from 'react';
import { ArrowRight, Play, Shield, TrendingDown, CheckCircle, Star, Phone, X, BadgeCheck, Building2, UserCheck, Clock, LucideIcon, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { siteMediaService } from '../../lib/siteMediaService';

// Extract benefit item into its own component to properly use hooks
interface BenefitItemProps {
  icon: LucideIcon;
  text: string;
  detail: string;
}

const BenefitItem: React.FC<BenefitItemProps> = ({ icon: Icon, text, detail }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col items-center gap-2 transition-all duration-300 hover:scale-110">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <span className="font-semibold text-neutral-900 text-sm text-center max-w-[140px]">
          {text}
        </span>
      </div>
      {isHovered && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-neutral-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-10 shadow-xl">
          {detail}
        </div>
      )}
    </div>
  );
};

const BusinessesOrganizationsHero: React.FC = () => {
  const [showVideo, setShowVideo] = useState(false);
  const [savingsView, setSavingsView] = useState<'monthly' | 'annual'>('monthly');
  const [isAdvisorAvailable, setIsAdvisorAvailable] = useState(true);
  const [expandedSavings, setExpandedSavings] = useState(false);
  const [videoUrl, setVideoUrl] = useState('https://player.vimeo.com/video/1115561411?h=531f004487&autoplay=1');

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setIsAdvisorAvailable(hour >= 8 && hour < 19);
  }, []);

  useEffect(() => {
    const loadVideoUrl = async () => {
      const url = await siteMediaService.getVideoUrl('video_business_modal', { autoplay: true });
      setVideoUrl(url);
    };
    loadVideoUrl();
  }, []);

  const benefits = [
    { icon: TrendingDown, text: "Save 40-60% on Healthcare", detail: "Average business saves $4,800/employee/year" },
    { icon: UserCheck, text: "HSA Compatible", detail: "Tax-advantaged health savings options" },
    { icon: Clock, text: "Simple Administration", detail: "Easy setup in under 10 minutes" },
    { icon: CheckCircle, text: "Quick Enrollment Process", detail: "Get started in minutes" }
  ];

  return (
    <>
      <section className="relative bg-white py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <video
            className="absolute top-0 right-0 w-1/3 h-full object-cover opacity-10"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/assets/organization.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.04) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-white border-2 border-cyan-100 rounded-full px-6 py-3 shadow-lg mb-8 animate-fade-in">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current text-yellow-400" />
                ))}
              </div>
              <div className="w-px h-6 bg-neutral-300" />
              <span className="text-lg font-bold text-neutral-900">
                4.8/5 from 2,000+ businesses
              </span>
            </div>

            <div className="mb-4">
              <span className="inline-block bg-cyan-100 text-cyan-700 px-4 py-1 rounded-full text-sm font-semibold mb-6">
                SELF EMPLOYED HEALTHCARE SOLUTION
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
              Affordable Healthcare Solutions
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-blue-700">
                for Self Employed & 1099 Professionals
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-neutral-600 mb-4 leading-relaxed max-w-3xl mx-auto">
              Cost-sharing healthcare designed for business owners, contractors, and freelancers.
              <span className="block mt-2 font-semibold text-neutral-900">Lower costs. Healthier teams. Simplified administration.</span>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
              {benefits.map((benefit, index) => (
                <BenefitItem
                  key={index}
                  icon={benefit.icon}
                  text={benefit.text}
                  detail={benefit.detail}
                />
              ))}
            </div>

            <div className="bg-gradient-to-br from-green-50 to-cyan-50 border-2 border-green-200 rounded-2xl p-8 mb-12 shadow-xl">
              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => setSavingsView('monthly')}
                  className={`px-6 py-2 rounded-full font-semibold transition-all ${
                    savingsView === 'monthly'
                      ? 'bg-cyan-600 text-white shadow-lg'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSavingsView('annual')}
                  className={`px-6 py-2 rounded-full font-semibold transition-all ${
                    savingsView === 'annual'
                      ? 'bg-cyan-600 text-white shadow-lg'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  Annual
                </button>
              </div>

              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-green-200 rounded-full px-5 py-2 mb-4">
                <TrendingDown className="w-5 h-5 text-green-700" />
                <span className="text-sm font-bold text-green-800">
                  Average Savings
                </span>
              </div>

              <div className="text-6xl sm:text-7xl font-bold text-green-600 mb-4">
                ${savingsView === 'monthly' ? '400' : '4,800'}
              </div>
              <div className="text-xl text-neutral-700 mb-8">
                {savingsView === 'monthly' ? 'per month' : 'per year'} vs traditional insurance
              </div>

              <button
                onClick={() => setExpandedSavings(!expandedSavings)}
                className="inline-flex items-center gap-2 text-cyan-600 font-semibold hover:text-cyan-700 transition-colors"
              >
                {expandedSavings ? 'Hide' : 'Show'} Detailed Breakdown
                <ChevronRight className={`w-5 h-5 transition-transform ${
                  expandedSavings ? 'rotate-90' : ''
                }`} />
              </button>

              {expandedSavings && (
                <div className="mt-6 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border-2 border-red-200">
                    <div>
                      <div className="text-sm text-neutral-600 mb-1">Traditional Group Insurance</div>
                      <div className="text-3xl font-bold text-red-600">
                        ${savingsView === 'monthly' ? '650' : '7,800'}{savingsView === 'monthly' ? '/mo' : '/yr'}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">Per employee average</div>
                    </div>
                    <div className="text-red-500 text-2xl">❌</div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="text-neutral-400 font-bold text-lg">VS</div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <div>
                      <div className="text-sm text-neutral-600 mb-1">MPB Health Sharing</div>
                      <div className="text-3xl font-bold text-green-600">
                        ${savingsView === 'monthly' ? '250' : '3,000'}{savingsView === 'monthly' ? '/mo' : '/yr'}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">Per employee average</div>
                    </div>
                    <div className="text-green-600 text-2xl">✅</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
              <a
                href="#business-calculator"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('business-calculator')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold px-10 py-6 text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
                >
                  Calculate Rate
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </a>

              <a
                href="tel:8558164650"
                className="flex items-center justify-center gap-3 px-10 py-6 bg-white border-3 border-cyan-600 text-cyan-600 font-bold text-lg rounded-xl hover:bg-cyan-50 transition-all duration-300 shadow-lg hover:shadow-xl group"
              >
                <div className="relative">
                  <Phone className="w-6 h-6" />
                  {isAdvisorAvailable && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </div>
                <div className="text-left">
                  <div className="text-sm text-neutral-600 group-hover:text-neutral-700">Call Now</div>
                  <div>(855) 816-4650</div>
                </div>
              </a>
            </div>

            <button
              onClick={() => setShowVideo(!showVideo)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-100 border border-neutral-300 text-neutral-900 font-medium rounded-xl hover:bg-neutral-200 transition-all duration-300 shadow-sm hover:shadow-md mb-12"
            >
              <Play className="w-5 h-5 text-cyan-600" />
              {showVideo ? 'Hide Video' : 'Watch How It Works'}
            </button>

            {showVideo && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowVideo(false)}>
                <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setShowVideo(false)}
                    className="absolute -top-12 right-0 text-white hover:text-neutral-300 transition-colors"
                  >
                    <X className="w-8 h-8" />
                  </button>
                  <div className="bg-white rounded-2xl p-2 shadow-2xl">
                    <div className="aspect-video bg-neutral-900 rounded-xl overflow-hidden">
                      <iframe
                        title="vimeo-player"
                        src={videoUrl}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-6 bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-cyan-600" />
                <span className="font-bold text-neutral-900">BBB A+ Rated</span>
              </div>
              <div className="w-px h-8 bg-neutral-300" />
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-blue-600" />
                <span className="font-bold text-neutral-900">11 Years Experience</span>
              </div>
              <div className="w-px h-8 bg-neutral-300" />
              <div className="flex items-center gap-3">
                <BadgeCheck className="w-6 h-6 text-green-600" />
                <span className="font-bold text-neutral-900">Trusted Since 2011</span>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

export { BusinessesOrganizationsHero };
