import React from 'react';
import {
  Smartphone,
  Activity,
  Clock,
  Star,
  Zap,
  ArrowRight,
  Layout,
  Video,
  FileText,
  MessageSquare,
  Shield,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

const MemberPortalHub: React.FC = () => {
  const stats = [
    { value: "99.9%", label: "Uptime", icon: Activity },
    { value: "< 2 min", label: "Avg Response", icon: Clock },
    { value: "4.8/5", label: "App Rating", icon: Star },
    { value: "Always On", label: "Access", icon: Zap }
  ];

  const features = [
    {
      icon: Layout,
      title: "Unified Dashboard",
      description: "Access everything in one intuitive portal"
    },
    {
      icon: Smartphone,
      title: "Mobile Apps",
      description: "iOS and Android apps for on-the-go management"
    },
    {
      icon: Video,
      title: "Telehealth Access",
      description: "Video visits with healthcare providers"
    },
    {
      icon: FileText,
      title: "Smart Documents",
      description: "Automated bill tracking and organization"
    },
    {
      icon: Activity,
      title: "Status Tracking",
      description: "Real-time status updates on all submissions"
    },
    {
      icon: MessageSquare,
      title: "Concierge Chat",
      description: "Direct support from your dedicated concierge"
    },
    {
      icon: Shield,
      title: "HIPAA Encryption",
      description: "Enterprise-grade data protection"
    },
    {
      icon: RefreshCw,
      title: "Real-Time Sync",
      description: "Notifications across all devices"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full mb-6">
            <Zap className="h-4 w-4 text-primary-400" />
            <span className="text-sm font-medium text-primary-300">Award-Winning Technology</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Healthcare Technology Made Simple
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Award-winning portal and mobile apps designed for seamless healthcare management.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-300 group"
            >
              <stat.icon className="h-8 w-8 text-primary-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <a
            href="https://app.mpb.health/"
            target="_blank"
            rel="noopener noreferrer"
            className="group px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-primary-500/25 flex items-center gap-2"
          >
            Access Portal
            <ExternalLink className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="/get-started"
            className="group px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
          >
            Get Started
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Platform Images */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-teal-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all">
              <img
                src="/assets/cover-image.jpg"
                alt="MPB Health Member Portal Dashboard"
                className="w-full h-auto rounded-lg shadow-2xl"
              />
              <div className="absolute bottom-8 left-8 bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2">
                <p className="text-sm font-medium text-white">MPB Health Member Portal Dashboard</p>
              </div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-primary-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all">
              <img
                src="/assets/cover-image.jpg"
                alt="MPB Health Mobile App"
                className="w-full h-auto rounded-lg shadow-2xl"
              />
              <div className="absolute bottom-8 left-8 bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2">
                <p className="text-sm font-medium text-white">MPB Health Mobile App</p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Features */}
        <div>
          <h3 className="text-2xl font-bold text-white text-center mb-8">Platform Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-primary-500/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary-400" />
                </div>
                <h4 className="font-semibold text-white text-lg mb-2">
                  {feature.title}
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export { MemberPortalHub };
