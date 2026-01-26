import React, { useState } from 'react';
import { Users, Zap, Target } from 'lucide-react';
import { getExperimentVariant, trackExperiment } from '../../lib/experiments';

const FeatureTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: 0,
      icon: Zap,
      title: 'Innovative Technology',
      description: 'MPB Tech delivers cutting-edge digital solutions and seamless platform integrations that simplify healthcare access, enhance member experience, and keep families connected to the care they deserve.',
    },
    {
      id: 1,
      icon: Users,
      title: 'People Who Listen',
      description: 'Our 5-star concierge service teams provide empathy and expertise when it matters most, supporting members and families with personalized care navigation and guidance through every healthcare decision.',
    },
    {
      id: 2,
      icon: Target,
      title: 'Purpose Driven',
      description: 'MPB Health is committed to empowering families to thrive through life\'s journey, bringing compassion, transparency, and unwavering support to every member and community we serve.',
    },
  ];

  return (
    <div className="mt-16 max-w-4xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`group relative flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-white shadow-lg scale-105'
                : 'bg-white/60 hover:bg-white/80 hover:shadow-md'
            }`}
          >
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200'
              }`}
            >
              <tab.icon className="h-5 w-5" />
            </div>
            <span
              className={`text-sm sm:text-base font-semibold transition-colors duration-300 ${
                activeTab === tab.id ? 'text-neutral-900' : 'text-neutral-600'
              }`}
            >
              {tab.title}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="relative min-h-[120px]">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`transition-all duration-500 ${
              activeTab === tab.id
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
            }`}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <p className="text-lg text-neutral-700 leading-relaxed text-center">
                {tab.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ExperimentedHero: React.FC = () => {
  const variant = getExperimentVariant('hero');
  
  React.useEffect(() => {
    trackExperiment('hero', variant, 'view');
  }, [variant]);

  const heroContent = {
    A: {
      headline: (
        <>
          <span className="bg-gradient-to-r from-neutral-900 via-primary to-neutral-800 bg-clip-text text-transparent">
            Lower Your Healthcare Costs
          </span>{" "}
          <span className="bg-gradient-to-r from-cyan-600 via-[#a3cc43] to-blue-600 bg-clip-text text-transparent">
            with MPB Health
          </span>
        </>
      ),
      subheadline: "Join 50,000+ families sharing medical costs in America's most trusted health sharing community. Save up to 60% compared to traditional insurance.",
      cta: "Get Your Free Quote",
    },
    B: {
      headline: (
        <>
          <span className="bg-gradient-to-r from-neutral-900 via-primary to-neutral-800 bg-clip-text text-transparent">
            Lower Your Healthcare Costs
          </span>{" "}
          <span className="bg-gradient-to-r from-cyan-600 via-[#a3cc43] to-blue-600 bg-clip-text text-transparent">
            with MPB Health
          </span>
        </>
      ),
      subheadline: "Discover why smart families are ditching expensive health insurance for community-based health sharing. Real people. Real savings. Real care.",
      cta: "Calculate Your Savings",
    },
  };

  const content = heroContent[variant];

  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-white to-primary/10 pt-20 pb-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/assets/young-parents-happy-mother.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-primary/20" />
      </div>
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-fade-in">
          <h1 className="text-display-lg sm:text-display-xl font-bold text-neutral-900 mb-6 text-balance">
            {typeof content.headline === 'string' ? content.headline : content.headline}
          </h1>
          <p className="text-xl text-neutral-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            {content.subheadline}
          </p>

          {/* Feature Tabs Section */}
          <FeatureTabs />
        </div>
      </div>
    </section>
  );
};

export { ExperimentedHero };