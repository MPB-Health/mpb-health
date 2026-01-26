import React from 'react';
import { motion } from 'framer-motion';
import {
  Smartphone,
  Monitor,
  Zap,
  Shield,
  Clock,
  Activity,
  MessageSquare,
  FileText,
  Stethoscope,
  ArrowRight,
  Star,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
}

interface Stat {
  value: string;
  label: string;
  icon: React.ElementType;
}

const MemberExperienceSection: React.FC = () => {
  const features: Feature[] = [
    {
      icon: Monitor,
      title: "Unified Dashboard",
      description: "Access everything in one intuitive portal"
    },
    {
      icon: Smartphone,
      title: "Mobile Apps",
      description: "iOS and Android apps for on-the-go management"
    },
    {
      icon: Stethoscope,
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
      icon: Zap,
      title: "Real-Time Sync",
      description: "Notifications across all devices"
    }
  ];

  const stats: Stat[] = [
    { value: "99.9%", label: "Uptime", icon: Activity },
    { value: "< 2 min", label: "Avg Response", icon: Clock },
    { value: "4.8/5", label: "App Rating", icon: Star },
    { value: "Always On", label: "Access", icon: Zap }
  ];

  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-blue-50/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-400/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-teal-400/8 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 border border-primary-200 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-primary-600" />
            <span className="text-sm font-semibold text-primary-700">MPB Member Care Technology</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-slate-900">
            Healthcare Technology{' '}
            <span className="bg-gradient-to-r from-primary-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h2>

          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12">
            Advanced portal and mobile apps designed for seamless healthcare management.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-teal-100 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-primary-300 hover:shadow-lg transition-all duration-300">
                  <stat.icon className="h-8 w-8 text-primary-600 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                  <div className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">{stat.value}</div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href="https://app.mpb.health/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg shadow-primary-600/25 hover:shadow-primary-600/35 hover:scale-105"
            >
              Access Portal
              <ExternalLink className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/get-started"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-primary-300 text-primary-700 font-semibold rounded-xl hover:bg-primary-50 hover:border-primary-400 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              Get Started
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid lg:grid-cols-3 gap-8 mb-16"
        >
          <div className="relative group lg:col-span-2">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-200 to-teal-200 rounded-2xl blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
            <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-primary-300 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center">
              <img
                src="/assets/image copy copy.png"
                alt="MPB Health Member Portal Dashboard"
                className="w-full h-auto rounded-xl shadow-lg"
                loading="lazy"
              />
              <div className="absolute bottom-10 left-10 right-10 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-6 py-3 shadow-lg">
                <p className="text-sm font-semibold text-slate-900">MPB Health Member Portal Dashboard</p>
              </div>
            </div>
          </div>

          <div className="relative group lg:col-span-1">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-200 to-primary-200 rounded-2xl blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
            <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-primary-300 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center h-full">
              <div className="flex items-center justify-center w-full h-full">
                <img
                  src="/assets/image copy.png"
                  alt="MPB Health Mobile App"
                  className="max-w-[85%] h-auto drop-shadow-2xl mx-auto"
                  loading="lazy"
                />
              </div>
              <div className="absolute bottom-10 left-6 right-6 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
                <p className="text-sm font-semibold text-slate-900 text-center">MPB Health Mobile App</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">
            Platform Features
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.7 + index * 0.05 }}
                className="group"
              >
                <div className="h-full bg-white border border-slate-200 rounded-xl p-6 hover:bg-slate-50 hover:border-primary-300 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors duration-300">
                    <feature.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export { MemberExperienceSection };
