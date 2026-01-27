import React from 'react';
import {
  Heart,
  Shield,
  Activity,
  ClipboardList,
  Lock,
  UserCheck,
  CheckCircle,
} from 'lucide-react';

export interface LoginVisualPanelProps {
  appName: string;
  tagline?: string;
  accentVariant?: 'blue' | 'teal' | 'purple' | 'red';
  features?: Array<{ icon: React.ReactNode; title: string; description: string }>;
}

const accentGradients: Record<string, string> = {
  blue: 'from-[#062C54] via-[#0A4E8E] to-[#083D71]',
  teal: 'from-[#042f2e] via-[#0f766e] to-[#115e59]',
  purple: 'from-[#2e1065] via-[#581c87] to-[#3b0764]',
  red: 'from-[#450A0A] via-[#991B1B] to-[#7F1D1D]',
};

const floatingIcons = [
  { Icon: Heart, top: '12%', left: '15%', animation: 'login-animate-float', delay: '0s' },
  { Icon: Shield, top: '22%', right: '12%', animation: 'login-animate-float-reverse', delay: '0.5s' },
  { Icon: Activity, top: '48%', left: '8%', animation: 'login-animate-float-slow', delay: '1s' },
  { Icon: ClipboardList, top: '42%', right: '18%', animation: 'login-animate-float', delay: '1.5s' },
  { Icon: Lock, bottom: '28%', left: '22%', animation: 'login-animate-float-reverse', delay: '2s' },
  { Icon: UserCheck, bottom: '16%', right: '14%', animation: 'login-animate-float-slow', delay: '2.5s' },
];

/* SVG lines connecting icon pairs — coordinates are percentages */
const connectionLines = [
  { x1: '20%', y1: '16%', x2: '82%', y2: '26%', delay: '0s' },
  { x1: '82%', y1: '26%', x2: '76%', y2: '46%', delay: '0.6s' },
  { x1: '14%', y1: '52%', x2: '28%', y2: '68%', delay: '1.2s' },
  { x1: '28%', y1: '68%', x2: '80%', y2: '80%', delay: '1.8s' },
  { x1: '76%', y1: '46%', x2: '80%', y2: '80%', delay: '2.4s' },
  { x1: '20%', y1: '16%', x2: '14%', y2: '52%', delay: '3s' },
];

const defaultFeatures = [
  {
    icon: <Heart className="h-5 w-5" />,
    title: '50,000+ Members',
    description: 'Trusted by healthcare professionals nationwide',
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption & compliance',
  },
  {
    icon: <Activity className="h-5 w-5" />,
    title: '99.9% Uptime',
    description: 'Reliable access when you need it most',
  },
];

const trustBadges = [
  { icon: <Shield className="h-4 w-4" />, label: 'HIPAA Compliant' },
  { icon: <Lock className="h-4 w-4" />, label: '256-bit Encrypted' },
  { icon: <CheckCircle className="h-4 w-4" />, label: 'SOC 2 Type II' },
];

export function LoginVisualPanel({
  appName,
  tagline = 'Empowering Health, Securing Futures',
  accentVariant = 'blue',
  features,
}: LoginVisualPanelProps) {
  const gradient = accentGradients[accentVariant] || accentGradients.blue;
  const displayFeatures = features || defaultFeatures;

  return (
    <>
      {/* ── Mobile / Tablet compact header ── */}
      <div className={`lg:hidden bg-gradient-to-r ${gradient} px-6 py-8 text-white`}>
        <div className="max-w-md mx-auto text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-7 w-7 text-white/90" />
            <h1 className="text-2xl font-extrabold tracking-tight">
              MPB <span className="font-light">Health</span>
            </h1>
          </div>
          <p className="text-sm text-white/70">{appName}</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {trustBadges.map((badge) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-1.5 text-[11px] text-white/70 bg-white/10 rounded-full px-2.5 py-1"
              >
                {badge.icon}
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Desktop full panel ── */}
      <div
        className={`hidden lg:flex relative w-1/2 bg-gradient-to-br ${gradient} overflow-hidden flex-col items-center justify-center p-12`}
      >
        {/* Dot grid background */}
        <div className="absolute inset-0 login-dot-grid" />

        {/* SVG connection lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
            </linearGradient>
          </defs>
          {connectionLines.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="url(#lineGrad)"
              strokeWidth="1"
              className="login-animate-pulse-line"
              style={{ animationDelay: line.delay }}
              strokeDasharray="8 12"
            />
          ))}
        </svg>

        {/* Floating icons */}
        {floatingIcons.map(({ Icon, animation, delay, ...pos }, i) => (
          <div
            key={i}
            className={`absolute w-12 h-12 rounded-xl bg-white/[0.07] backdrop-blur-sm border border-white/[0.12] flex items-center justify-center ${animation}`}
            style={{
              ...pos,
              animationDelay: delay,
            } as React.CSSProperties}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5 text-white/70" />
          </div>
        ))}

        {/* Central content */}
        <div className="relative z-10 text-center space-y-8 max-w-sm">
          {/* Brand */}
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight login-animate-glow">
              MPB <span className="font-light">Health</span>
            </h1>
            <p className="text-base text-white/60">{tagline}</p>
            <p className="text-sm font-medium text-white/40 uppercase tracking-widest">
              {appName}
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {trustBadges.map((badge) => (
              <span
                key={badge.label}
                className="login-shimmer-badge inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] rounded-full px-3 py-1.5"
              >
                {badge.icon}
                {badge.label}
              </span>
            ))}
          </div>

          {/* Feature highlights */}
          <div className="space-y-3 pt-4">
            {displayFeatures.map((feature, i) => (
              <div
                key={i}
                className={`login-stagger-${i + 1} flex items-start gap-3 text-left bg-white/[0.05] backdrop-blur-sm rounded-lg border border-white/[0.08] p-3`}
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/80">
                  {feature.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/90">{feature.title}</p>
                  <p className="text-xs text-white/50">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
