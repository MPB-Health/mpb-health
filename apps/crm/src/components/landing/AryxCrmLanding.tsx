// ARYX CRM Landing Page
//
// Dark cinematic marketing page rendered at /landing (or /) for unauthenticated
// visitors on the ARYX-branded CRM domain (crm.aryxcloud.com).
// Mirrors the design system established in:
//   - packages/ui/src/brand/aryx-brand.css
//   - packages/ui/src/components/AryxAuthShell.tsx
//   - apps/advisor-portal/src/pages/LandingPage.tsx (sibling Advisor OS landing)
//
// CRM-tailored content: pipeline, leads, deals, automation, AI insights, multi-tenant.

import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  Building2,
  Check,
  ClipboardList,
  DollarSign,
  GitBranch,
  KanbanSquare,
  Lock,
  MessageSquare,
  Phone,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';

// ---------------------------------------------------------------------------
// Font loader — Inter Tight (matches AryxAuthShell)
// ---------------------------------------------------------------------------
function useInterTight() {
  useEffect(() => {
    const ID = 'aryx-font-inter-tight';
    if (document.getElementById(ID)) return;
    const link = document.createElement('link');
    link.id = ID;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800;900&family=Inter:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------
const ARYX = {
  orange: '#FF5A1F',
  orangeBright: '#FF7A00',
  yellow: '#FFC300',
  teal: '#2ED3A5',
  dark: '#0A0A0A',
  darkRaised: '#0F0F0F',
  darkSurface: '#141414',
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.12)',
  textPrimary: '#FAFAFA',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textMuted: '#6B7280',
} as const;

const FONT_DISPLAY = "'Inter Tight', 'Inter', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";

// ---------------------------------------------------------------------------
// Animations
// ---------------------------------------------------------------------------
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } },
};

const stagger = (delay = 0.08): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay, delayChildren: 0.1 } },
});

// ---------------------------------------------------------------------------
// Animated number — counts up when scrolled into view
// ---------------------------------------------------------------------------
function CountUp({ to, suffix = '', duration = 1.4, decimals = 0 }: { to: number; suffix?: string; duration?: number; decimals?: number }) {
  const [value, setValue] = useState(0);

  return (
    <motion.span
      viewport={{ once: true, amount: 0.6 }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      onUpdate={(latest) => {
        if (typeof latest.opacity === 'number') {
          setValue(to * latest.opacity);
        }
      }}
      transition={{ duration }}
    >
      {decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString()}{suffix}
    </motion.span>
  );
}

// ===========================================================================
// MAIN COMPONENT
// ===========================================================================
export default function AryxCrmLanding() {
  useInterTight();
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 500], [0, -120]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={pageStyles.root}>
      <div style={pageStyles.grain} aria-hidden />
      <div style={pageStyles.meshGlow} aria-hidden />

      <TopNav onScrollTo={scrollTo} />
      <HeroSection parallax={heroParallax} onSeeFeatures={() => scrollTo('features')} />
      <StatsBar />
      <FeatureShowcase id="features" />
      <HowItWorks />
      <PlatformPillars />
      <TrustSection />
      <CTASection id="cta" />
      <Footer />
    </div>
  );
}

// ===========================================================================
// TOP NAV
// ===========================================================================
function TopNav({ onScrollTo }: { onScrollTo: (id: string) => void }) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={navStyles.root}
    >
      <div style={navStyles.inner}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={navStyles.brand}>
          <span style={navStyles.wordmark}>ARYX</span>
          <span style={navStyles.tenant}>CRM</span>
        </button>
        <div style={navStyles.links}>
          <button onClick={() => onScrollTo('features')} style={navStyles.navLink}>Features</button>
          <button onClick={() => onScrollTo('pipeline')} style={navStyles.navLink}>Pipeline</button>
          <button onClick={() => onScrollTo('pillars')} style={navStyles.navLink}>Platform</button>
          <button onClick={() => onScrollTo('cta')} style={navStyles.navLink}>Pricing</button>
          <Link to="/login" style={navStyles.signInButton}>
            Sign in <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

// ===========================================================================
// 1. HERO
// ===========================================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HeroSection({ parallax, onSeeFeatures }: { parallax: any; onSeeFeatures: () => void }) {
  return (
    <section style={heroStyles.section}>
      <motion.div
        aria-hidden
        style={heroStyles.aurora}
        animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <Particles />

      <motion.div style={{ ...heroStyles.container, y: parallax }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger(0.08)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}
        >
          <motion.div variants={fadeUp} style={heroStyles.pill}>
            <Sparkles size={12} style={{ color: ARYX.orange }} />
            <span>Powering modern health-sharing revenue teams</span>
          </motion.div>

          <motion.div variants={fadeUp} style={{ textAlign: 'center' }}>
            <div style={heroStyles.wordmark}>ARYX</div>
            <div style={heroStyles.tagline}>CRM</div>
          </motion.div>

          <motion.h1 variants={fadeUp} style={heroStyles.headline}>
            The Revenue<br />
            <span style={heroStyles.headlineAccent}>Operating System.</span>
          </motion.h1>

          <motion.p variants={fadeUp} style={heroStyles.subhead}>
            One platform for the entire revenue cycle — leads, pipeline, quotes, campaigns,
            partners, and AI automation. Built for health-sharing scale. Engineered for
            compliance. Designed for closers.
          </motion.p>

          <motion.div variants={fadeUp} style={heroStyles.ctaRow}>
            <Link to="/login" style={heroStyles.ctaPrimary}>
              Get Started <ArrowRight size={16} />
            </Link>
            <button onClick={onSeeFeatures} style={heroStyles.ctaGhost}>
              See features
            </button>
          </motion.div>

          {/* CRM dashboard mock */}
          <motion.div
            variants={fadeUp}
            style={heroStyles.platformMock}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
          >
            <div style={heroStyles.mockChrome}>
              <span style={{ ...heroStyles.mockDot, background: '#FF5F57' }} />
              <span style={{ ...heroStyles.mockDot, background: '#FEBC2E' }} />
              <span style={{ ...heroStyles.mockDot, background: '#28C840' }} />
              <span style={heroStyles.mockUrl}>crm.aryxcloud.com</span>
            </div>
            <div style={heroStyles.mockBody}>
              <div style={heroStyles.mockSidebar}>
                {[
                  { label: 'Today', icon: Activity },
                  { label: 'Pipeline', icon: KanbanSquare },
                  { label: 'Leads', icon: Users },
                  { label: 'Deals', icon: DollarSign },
                  { label: 'Campaigns', icon: Send },
                  { label: 'Reports', icon: BarChart3 },
                ].map((item, i) => (
                  <div key={item.label} style={{ ...heroStyles.mockNavItem, ...(i === 1 ? heroStyles.mockNavActive : {}) }}>
                    <item.icon size={11} style={{ flexShrink: 0 }} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <div style={heroStyles.mockMain}>
                {/* KPI cards */}
                <div style={heroStyles.mockGrid}>
                  {[
                    { label: 'Pipeline Value', value: '$2.4M', tint: ARYX.orange, trend: '+18.2%' },
                    { label: 'Active Leads', value: '1,284', tint: ARYX.teal, trend: '+12.4%' },
                    { label: 'Deals to Close', value: '47', tint: ARYX.yellow, trend: '+8.1%' },
                  ].map((stat) => (
                    <div key={stat.label} style={heroStyles.mockStat}>
                      <div style={heroStyles.mockStatLabel}>{stat.label}</div>
                      <div style={{ ...heroStyles.mockStatValue, color: stat.tint }}>{stat.value}</div>
                      <div style={heroStyles.mockStatTrend}>
                        <TrendingUp size={10} style={{ color: ARYX.teal }} />
                        <span>{stat.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mini pipeline */}
                <div style={heroStyles.mockPipeline}>
                  <div style={heroStyles.mockPipelineHeader}>Pipeline · 7 days</div>
                  <div style={heroStyles.mockPipelineRow}>
                    {['New', 'Qualified', 'Proposal', 'Negotiation', 'Won'].map((label, i) => {
                      const widths = [85, 70, 55, 35, 20];
                      const intensity = 0.15 + (4 - i) * 0.12;
                      return (
                        <div key={label} style={heroStyles.mockStage}>
                          <div style={heroStyles.mockStageLabel}>{label}</div>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${widths[i]}%` }}
                            transition={{ duration: 1.2, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                            style={{
                              ...heroStyles.mockStageBar,
                              background: `linear-gradient(90deg, ${ARYX.orange} 0%, ${ARYX.orangeBright}${Math.round(intensity * 100)} 100%)`,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: (i * 73) % 100,
    y: (i * 41) % 100,
    delay: (i * 0.3) % 4,
    size: 1.5 + ((i * 13) % 5) * 0.5,
  }));

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${ARYX.orange}99 0%, transparent 70%)`,
          }}
          animate={{ y: [0, -40, 0], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 4 + p.delay, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ===========================================================================
// 2. STATS BAR
// ===========================================================================
function StatsBar() {
  const stats = [
    { label: 'Leads processed', to: 250, suffix: 'K+' },
    { label: 'Closed-won revenue', to: 84, suffix: 'M+', prefix: '$' },
    { label: 'Automations / month', to: 1.2, suffix: 'M', decimals: 1 },
    { label: 'Uptime SLA', to: 99.9, suffix: '%', decimals: 1 },
  ] as const;

  return (
    <section style={statsStyles.section}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={stagger(0.1)}
        style={statsStyles.container}
      >
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp} style={statsStyles.stat}>
            <div style={statsStyles.statValue}>
              {'prefix' in s && s.prefix ? <span style={statsStyles.statSuffix}>{s.prefix}</span> : null}
              <CountUp to={s.to} suffix={s.suffix} decimals={'decimals' in s ? s.decimals : 0} />
            </div>
            <div style={statsStyles.statLabel}>{s.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

// ===========================================================================
// 3. FEATURE SHOWCASE
// ===========================================================================
function FeatureShowcase({ id }: { id: string }) {
  const features = [
    {
      icon: KanbanSquare,
      title: 'Visual Pipeline',
      desc: 'Drag-and-drop kanban for every deal stage. Drop-in stage automations, weighted forecasting, and instant value rollups.',
      tint: ARYX.orange,
    },
    {
      icon: Users,
      title: 'Lead Capture & Routing',
      desc: 'Multi-channel intake from web forms, ads, partners, and events. Smart routing rules assign leads in milliseconds.',
      tint: ARYX.teal,
    },
    {
      icon: DollarSign,
      title: 'Quotes & Deals',
      desc: 'Build, send, and version quotes. Track open rates, accept e-signature, and convert to enrollments in one click.',
      tint: ARYX.yellow,
    },
    {
      icon: Send,
      title: 'Campaigns & Cadences',
      desc: 'Multi-step email, SMS, and call cadences. A/B test creative, throttle by send window, attribute by touchpoint.',
      tint: ARYX.orangeBright,
    },
    {
      icon: Building2,
      title: 'Accounts & Partners',
      desc: 'Group accounts, referral partners, and outside advisors — all with relationships, commissions, and territories.',
      tint: ARYX.teal,
    },
    {
      icon: BarChart3,
      title: 'Reporting & Forecasts',
      desc: 'Real-time dashboards with cohort retention, sales velocity, partner ROI, and AI-driven revenue forecasts.',
      tint: ARYX.orange,
    },
  ];

  return (
    <section id={id} style={featureStyles.section}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger(0.08)}
        style={featureStyles.container}
      >
        <motion.div variants={fadeUp} style={featureStyles.header}>
          <div style={featureStyles.eyebrow}>FEATURES</div>
          <h2 style={featureStyles.title}>
            The full revenue stack.<br />
            <span style={featureStyles.titleAccent}>In one platform.</span>
          </h2>
          <p style={featureStyles.subtitle}>
            ARYX CRM replaces a stack of disconnected sales tools — lead capture, pipeline,
            quoting, campaigns, partner management, and analytics — with one purpose-built
            system for health-sharing growth.
          </p>
        </motion.div>

        <div style={featureStyles.grid}>
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              style={featureStyles.card}
            >
              <div style={{ ...featureStyles.iconWrap, background: `${f.tint}15`, border: `1px solid ${f.tint}30` }}>
                <f.icon size={22} style={{ color: f.tint }} />
              </div>
              <h3 style={featureStyles.cardTitle}>{f.title}</h3>
              <p style={featureStyles.cardDesc}>{f.desc}</p>
              <div style={featureStyles.cardLink}>
                Explore <ArrowUpRight size={14} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ===========================================================================
// 4. HOW IT WORKS (Pipeline flow)
// ===========================================================================
function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Capture',
      desc: 'Leads flow in from your website, paid ads, referral partners, and community events — all routed instantly.',
      icon: UserPlus,
      tint: ARYX.orange,
    },
    {
      number: '02',
      title: 'Engage',
      desc: 'Multi-channel cadences keep prospects warm. AI suggests next-best actions and prioritizes your call list.',
      icon: MessageSquare,
      tint: ARYX.yellow,
    },
    {
      number: '03',
      title: 'Close',
      desc: 'Send quotes, e-sign applications, collect first payment — all from the deal record. No tab-switching.',
      icon: Target,
      tint: ARYX.teal,
    },
    {
      number: '04',
      title: 'Grow',
      desc: 'Track retention, expansion, referrals. Forecasts and partner attribution show where to double-down.',
      icon: TrendingUp,
      tint: ARYX.orangeBright,
    },
  ];

  return (
    <section id="pipeline" style={howStyles.section}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger(0.12)}
        style={howStyles.container}
      >
        <motion.div variants={fadeUp} style={featureStyles.header}>
          <div style={featureStyles.eyebrow}>HOW IT WORKS</div>
          <h2 style={featureStyles.title}>
            From cold lead to lifetime customer<br />
            <span style={featureStyles.titleAccent}>in one continuous flow.</span>
          </h2>
        </motion.div>

        <div style={howStyles.timeline}>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.6, delay: 0.2, ease: 'easeOut' }}
            style={howStyles.timelineLine}
          />
          {steps.map((step) => (
            <motion.div key={step.number} variants={fadeUp} style={howStyles.step}>
              <div style={howStyles.stepNumberWrap}>
                <div style={{ ...howStyles.stepNumber, borderColor: `${step.tint}40`, color: step.tint, boxShadow: `0 0 30px ${step.tint}30` }}>
                  {step.number}
                </div>
                <div style={{ ...howStyles.stepIconCircle, borderColor: `${step.tint}50` }}>
                  <step.icon size={16} style={{ color: step.tint }} />
                </div>
              </div>
              <h3 style={howStyles.stepTitle}>{step.title}</h3>
              <p style={howStyles.stepDesc}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ===========================================================================
// 5. PLATFORM PILLARS
// ===========================================================================
function PlatformPillars() {
  const pillars = [
    {
      icon: Brain,
      title: 'Intelligence',
      desc: 'AI baked into every workflow — not bolted on as an afterthought.',
      points: [
        'Lead scoring & churn prediction',
        'AI dialer with live transcript & coaching',
        'Smart next-best-action suggestions',
        'Predictive revenue forecasts',
      ],
      tint: ARYX.orange,
    },
    {
      icon: Workflow,
      title: 'Automation',
      desc: 'Visual workflow builder. From simple drip campaigns to complex multi-step routing.',
      points: [
        'Drag-and-drop workflow canvas',
        'Trigger-condition-action recipes',
        'Custom webhooks & API connectors',
        'Bulk operations & macros',
      ],
      tint: ARYX.teal,
    },
    {
      icon: Star,
      title: 'Multi-Tenant',
      desc: 'Built white-label from day one. Your brand, your domain, your data.',
      points: [
        'Tenant-isolated data architecture',
        'Custom domain & theme per tenant',
        'Module licensing & feature gating',
        'SSO, SCIM, and audit log per tenant',
      ],
      tint: ARYX.yellow,
    },
  ];

  return (
    <section id="pillars" style={pillarStyles.section}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={stagger(0.12)}
        style={pillarStyles.container}
      >
        <motion.div variants={fadeUp} style={{ ...featureStyles.header, marginBottom: '4rem' }}>
          <div style={featureStyles.eyebrow}>PLATFORM PILLARS</div>
          <h2 style={featureStyles.title}>
            Built on three<br />
            <span style={featureStyles.titleAccent}>uncompromising pillars.</span>
          </h2>
        </motion.div>

        <div style={pillarStyles.grid}>
          {pillars.map((p) => (
            <motion.div key={p.title} variants={fadeUp} style={pillarStyles.card}>
              <div
                aria-hidden
                style={{
                  ...pillarStyles.cardGlow,
                  background: `radial-gradient(circle at 50% 0%, ${p.tint}30 0%, transparent 60%)`,
                }}
              />
              <div style={{ ...pillarStyles.cardIcon, background: `${p.tint}15`, border: `1px solid ${p.tint}40` }}>
                <p.icon size={28} style={{ color: p.tint }} />
              </div>
              <h3 style={pillarStyles.cardTitle}>{p.title}</h3>
              <p style={pillarStyles.cardDesc}>{p.desc}</p>
              <ul style={pillarStyles.list}>
                {p.points.map((pt) => (
                  <li key={pt} style={pillarStyles.listItem}>
                    <Check size={14} style={{ color: p.tint, flexShrink: 0, marginTop: 3 }} />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Integrations strip */}
        <motion.div variants={fadeUp} style={pillarStyles.integrationsStrip}>
          <div style={pillarStyles.integrationsLabel}>WORKS WITH YOUR STACK</div>
          <div style={pillarStyles.integrationsRow}>
            {[
              { icon: Phone, label: 'GoTo Connect' },
              { icon: Send, label: 'Resend' },
              { icon: DollarSign, label: 'Stripe' },
              { icon: ShieldCheck, label: 'Supabase' },
              { icon: GitBranch, label: 'Webhooks' },
              { icon: Zap, label: 'Zapier' },
              { icon: ClipboardList, label: 'Calendly' },
              { icon: MessageSquare, label: 'Twilio' },
            ].map((i) => (
              <div key={i.label} style={pillarStyles.integration}>
                <i.icon size={14} style={{ color: ARYX.textTertiary }} />
                <span>{i.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ===========================================================================
// 6. TRUST / TESTIMONIAL
// ===========================================================================
function TrustSection() {
  return (
    <section style={trustStyles.section}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={stagger(0.1)}
        style={trustStyles.container}
      >
        <motion.div variants={fadeIn} style={trustStyles.quoteCard}>
          <div style={trustStyles.quoteMark}>"</div>
          <p style={trustStyles.quoteText}>
            ARYX CRM gave us a single command center for the entire revenue org. Our sales
            team closes faster, our partners see live commission data, and our compliance
            officer finally trusts the audit trail. We retired four tools the day we went live.
          </p>
          <div style={trustStyles.quoteAttribution}>
            <div style={trustStyles.quoteAvatar}>MH</div>
            <div>
              <div style={trustStyles.quoteName}>Revenue Operations</div>
              <div style={trustStyles.quoteRole}>Founding Tenant</div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} style={trustStyles.badgeRow}>
          {[
            { icon: Shield, label: 'HIPAA Compliant' },
            { icon: ShieldCheck, label: 'SOC 2 Type II' },
            { icon: Lock, label: '256-bit Encryption' },
            { icon: ClipboardList, label: '99.9% SLA' },
            { icon: MessageSquare, label: '24/7 Support' },
            { icon: Activity, label: 'Real-time Sync' },
          ].map((b) => (
            <div key={b.label} style={trustStyles.badge}>
              <b.icon size={14} style={{ color: ARYX.orange }} />
              <span>{b.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

// ===========================================================================
// 7. CTA + FOOTER
// ===========================================================================
function CTASection({ id }: { id: string }) {
  return (
    <section id={id} style={ctaStyles.section}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={stagger(0.1)}
        style={ctaStyles.container}
      >
        <motion.div variants={fadeIn} style={ctaStyles.glow} aria-hidden />
        <motion.h2 variants={fadeUp} style={ctaStyles.title}>
          Ready to operate your<br />
          <span style={ctaStyles.titleAccent}>revenue engine on ARYX?</span>
        </motion.h2>
        <motion.p variants={fadeUp} style={ctaStyles.subtitle}>
          Join the health-sharing leaders running their entire revenue cycle on ARYX. Request
          access and we'll have your team in production in days.
        </motion.p>
        <motion.div variants={fadeUp} style={ctaStyles.buttons}>
          <Link to="/login" style={ctaStyles.primary}>
            Request Access <ArrowRight size={16} />
          </Link>
          <Link to="/login" style={ctaStyles.ghost}>
            Already have an account? Sign in
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={footerStyles.section}>
      <div style={footerStyles.container}>
        <div style={footerStyles.brandBlock}>
          <span style={footerStyles.wordmark}>ARYX</span>
          <span style={footerStyles.tenant}>CRM</span>
        </div>
        <p style={footerStyles.tagline}>
          ARYX is the revenue platform behind modern health sharing. Built for scale.
          Engineered for compliance. Designed for closers.
        </p>
        <div style={footerStyles.bottomRow}>
          <span style={footerStyles.copyright}>
            © {new Date().getFullYear()} ARYX Platform. All rights reserved.
          </span>
          <div style={footerStyles.legalLinks}>
            <span>Privacy</span>
            <span>Terms</span>
            <span>Security</span>
            <span>Status</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ===========================================================================
// STYLES
// ===========================================================================
const pageStyles: Record<string, CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: ARYX.dark,
    color: ARYX.textPrimary,
    fontFamily: FONT_BODY,
    position: 'relative',
    overflow: 'hidden',
  },
  grain: {
    position: 'fixed',
    inset: 0,
    backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
    backgroundSize: '3px 3px',
    pointerEvents: 'none',
    zIndex: 1,
  },
  meshGlow: {
    position: 'fixed',
    inset: 0,
    background:
      'radial-gradient(ellipse 60% 40% at 20% 10%, rgba(255,90,31,0.06) 0%, transparent 50%),' +
      'radial-gradient(ellipse 50% 40% at 80% 60%, rgba(46,211,165,0.04) 0%, transparent 50%),' +
      'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(255,90,31,0.05) 0%, transparent 60%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
};

const navStyles: Record<string, CSSProperties> = {
  root: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'rgba(10,10,10,0.7)',
    backdropFilter: 'blur(16px) saturate(1.2)',
    WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
    borderBottom: `1px solid ${ARYX.border}`,
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0.875rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  wordmark: {
    fontFamily: FONT_DISPLAY,
    fontSize: '1.4rem',
    fontWeight: 800,
    letterSpacing: '-0.04em',
    background: `linear-gradient(135deg, ${ARYX.orangeBright} 0%, ${ARYX.orange} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  tenant: {
    fontSize: '0.6875rem',
    fontWeight: 500,
    color: ARYX.textTertiary,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  navLink: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: ARYX.textTertiary,
    fontSize: '0.875rem',
    fontWeight: 500,
    padding: '0.5rem 0.875rem',
    borderRadius: 8,
    fontFamily: FONT_BODY,
  },
  signInButton: {
    background: `linear-gradient(135deg, ${ARYX.orangeBright} 0%, ${ARYX.orange} 100%)`,
    border: 'none',
    color: '#fff',
    fontSize: '0.8125rem',
    fontWeight: 600,
    padding: '0.5rem 1rem',
    borderRadius: 8,
    fontFamily: FONT_DISPLAY,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    marginLeft: '0.5rem',
    boxShadow: `0 6px 20px ${ARYX.orange}40, inset 0 1px 0 rgba(255,255,255,0.18)`,
    letterSpacing: '0.01em',
    textDecoration: 'none',
  },
};

const heroStyles: Record<string, CSSProperties> = {
  section: {
    position: 'relative',
    zIndex: 2,
    minHeight: '90vh',
    padding: '5rem 1.5rem 6rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aurora: {
    position: 'absolute',
    top: '-10%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80%',
    height: '60%',
    background: `radial-gradient(ellipse, ${ARYX.orange}28 0%, transparent 60%)`,
    pointerEvents: 'none',
    filter: 'blur(40px)',
  },
  container: {
    position: 'relative',
    zIndex: 2,
    maxWidth: 1100,
    width: '100%',
    margin: '0 auto',
    textAlign: 'center',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.875rem',
    background: 'rgba(255,90,31,0.08)',
    border: `1px solid ${ARYX.orange}30`,
    borderRadius: 999,
    fontSize: '0.75rem',
    fontWeight: 500,
    color: ARYX.textSecondary,
    letterSpacing: '0.02em',
  },
  wordmark: {
    fontFamily: FONT_DISPLAY,
    fontSize: 'clamp(4rem, 12vw, 8rem)',
    fontWeight: 900,
    letterSpacing: '-0.05em',
    lineHeight: 0.9,
    background: `linear-gradient(135deg, ${ARYX.orangeBright} 0%, ${ARYX.orange} 60%, #E04E18 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: '0 0 80px rgba(255,90,31,0.35)',
    filter: 'drop-shadow(0 0 60px rgba(255,90,31,0.3))',
  },
  tagline: {
    fontFamily: FONT_DISPLAY,
    fontSize: '0.875rem',
    fontWeight: 500,
    color: ARYX.textTertiary,
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    marginTop: '0.5rem',
  },
  headline: {
    fontFamily: FONT_DISPLAY,
    fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
    fontWeight: 800,
    letterSpacing: '-0.035em',
    lineHeight: 1.02,
    margin: 0,
    color: ARYX.textPrimary,
  },
  headlineAccent: {
    background: `linear-gradient(135deg, ${ARYX.orangeBright} 0%, ${ARYX.orange} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subhead: {
    maxWidth: 720,
    fontSize: '1.0625rem',
    lineHeight: 1.6,
    color: ARYX.textSecondary,
    margin: '0 auto',
  },
  ctaRow: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: '0.5rem',
  },
  ctaPrimary: {
    background: `linear-gradient(135deg, ${ARYX.orangeBright} 0%, ${ARYX.orange} 100%)`,
    border: 'none',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 600,
    padding: '0.9rem 1.5rem',
    borderRadius: 10,
    fontFamily: FONT_DISPLAY,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: `0 12px 32px ${ARYX.orange}50, inset 0 1px 0 rgba(255,255,255,0.2)`,
    letterSpacing: '0.01em',
    textDecoration: 'none',
  },
  ctaGhost: {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${ARYX.borderStrong}`,
    cursor: 'pointer',
    color: ARYX.textPrimary,
    fontSize: '1rem',
    fontWeight: 600,
    padding: '0.9rem 1.5rem',
    borderRadius: 10,
    fontFamily: FONT_DISPLAY,
    letterSpacing: '0.01em',
  },
  platformMock: {
    width: '100%',
    maxWidth: 980,
    marginTop: '3rem',
    background: `linear-gradient(180deg, ${ARYX.darkSurface} 0%, ${ARYX.darkRaised} 100%)`,
    border: `1px solid ${ARYX.borderStrong}`,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 100px rgba(255,90,31,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  mockChrome: {
    padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.02)',
    borderBottom: `1px solid ${ARYX.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  mockDot: { width: 10, height: 10, borderRadius: '50%' },
  mockUrl: {
    marginLeft: '0.75rem',
    fontSize: '0.6875rem',
    color: ARYX.textTertiary,
    fontFamily: 'ui-monospace, monospace',
  },
  mockBody: { display: 'flex', minHeight: 340 },
  mockSidebar: {
    width: 180,
    padding: '1rem 0.5rem',
    borderRight: `1px solid ${ARYX.border}`,
    background: 'rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  mockNavItem: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
    color: ARYX.textTertiary,
    borderRadius: 6,
    fontWeight: 500,
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  mockNavActive: {
    background: `${ARYX.orange}15`,
    color: ARYX.orange,
    fontWeight: 600,
  },
  mockMain: { flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  mockGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' },
  mockStat: {
    padding: '0.875rem',
    background: 'rgba(255,255,255,0.02)',
    border: `1px solid ${ARYX.border}`,
    borderRadius: 8,
    textAlign: 'left',
  },
  mockStatLabel: {
    fontSize: '0.6875rem',
    color: ARYX.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '0.375rem',
  },
  mockStatValue: {
    fontFamily: FONT_DISPLAY,
    fontSize: '1.25rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  mockStatTrend: {
    marginTop: '0.25rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.6875rem',
    color: ARYX.teal,
    fontWeight: 600,
  },
  mockPipeline: {
    padding: '0.875rem',
    background: 'rgba(255,255,255,0.02)',
    border: `1px solid ${ARYX.border}`,
    borderRadius: 8,
  },
  mockPipelineHeader: {
    fontFamily: FONT_DISPLAY,
    fontSize: '0.75rem',
    fontWeight: 600,
    color: ARYX.textSecondary,
    marginBottom: '0.625rem',
    textAlign: 'left',
  },
  mockPipelineRow: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  mockStage: { display: 'flex', alignItems: 'center', gap: '0.625rem' },
  mockStageLabel: {
    width: 80,
    fontSize: '0.6875rem',
    color: ARYX.textTertiary,
    fontWeight: 500,
    textAlign: 'left',
  },
  mockStageBar: {
    height: 8,
    borderRadius: 4,
    background: ARYX.orange,
    transformOrigin: 'left',
  },
};

const statsStyles: Record<string, CSSProperties> = {
  section: {
    position: 'relative',
    zIndex: 2,
    padding: '4rem 1.5rem',
    borderTop: `1px solid ${ARYX.border}`,
    borderBottom: `1px solid ${ARYX.border}`,
    background: 'rgba(255,255,255,0.015)',
  },
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '2rem',
    textAlign: 'center',
  },
  stat: { display: 'flex', flexDirection: 'column', gap: '0.375rem' },
  statValue: {
    fontFamily: FONT_DISPLAY,
    fontSize: 'clamp(2.25rem, 4vw, 3.25rem)',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1,
    background: `linear-gradient(135deg, ${ARYX.orangeBright} 0%, ${ARYX.orange} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  statSuffix: { color: ARYX.orange },
  statLabel: {
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: ARYX.textTertiary,
    letterSpacing: '0.05em',
  },
};

const featureStyles: Record<string, CSSProperties> = {
  section: { position: 'relative', zIndex: 2, padding: '7rem 1.5rem' },
  container: { maxWidth: 1200, margin: '0 auto' },
  header: {
    textAlign: 'center',
    marginBottom: '3.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.875rem',
  },
  eyebrow: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: ARYX.orange,
    letterSpacing: '0.2em',
    fontFamily: FONT_DISPLAY,
  },
  title: {
    fontFamily: FONT_DISPLAY,
    fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
    fontWeight: 800,
    letterSpacing: '-0.035em',
    lineHeight: 1.05,
    margin: 0,
    color: ARYX.textPrimary,
  },
  titleAccent: {
    background: `linear-gradient(135deg, ${ARYX.orangeBright} 0%, ${ARYX.orange} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    maxWidth: 720,
    fontSize: '1rem',
    lineHeight: 1.6,
    color: ARYX.textSecondary,
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.25rem',
  },
  card: {
    padding: '1.75rem',
    background: `linear-gradient(180deg, ${ARYX.darkSurface} 0%, ${ARYX.darkRaised} 100%)`,
    border: `1px solid ${ARYX.border}`,
    borderRadius: 14,
    cursor: 'default',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.125rem',
  },
  cardTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: '1.1875rem',
    fontWeight: 700,
    letterSpacing: '-0.015em',
    color: ARYX.textPrimary,
    margin: '0 0 0.5rem 0',
  },
  cardDesc: {
    fontSize: '0.875rem',
    lineHeight: 1.55,
    color: ARYX.textTertiary,
    margin: '0 0 1rem 0',
  },
  cardLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: ARYX.orange,
    fontFamily: FONT_DISPLAY,
  },
};

const howStyles: Record<string, CSSProperties> = {
  section: {
    position: 'relative',
    zIndex: 2,
    padding: '7rem 1.5rem',
    background: 'rgba(255,255,255,0.015)',
    borderTop: `1px solid ${ARYX.border}`,
    borderBottom: `1px solid ${ARYX.border}`,
  },
  container: { maxWidth: 1200, margin: '0 auto' },
  timeline: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '2.5rem',
    marginTop: '2rem',
  },
  timelineLine: {
    position: 'absolute',
    top: 32,
    left: '6%',
    right: '6%',
    height: 2,
    background: `linear-gradient(90deg, ${ARYX.orange} 0%, ${ARYX.yellow} 33%, ${ARYX.teal} 66%, ${ARYX.orangeBright} 100%)`,
    opacity: 0.5,
    transformOrigin: 'left',
    pointerEvents: 'none',
    zIndex: 0,
  },
  step: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.625rem',
  },
  stepNumberWrap: {
    position: 'relative',
    width: 64,
    height: 64,
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(135deg, ${ARYX.darkSurface} 0%, ${ARYX.darkRaised} 100%)`,
    border: `1px solid ${ARYX.orange}40`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONT_DISPLAY,
    fontSize: '0.75rem',
    fontWeight: 700,
    color: ARYX.orange,
    letterSpacing: '0.05em',
  },
  stepIconCircle: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: ARYX.dark,
    border: `1px solid ${ARYX.orange}50`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: -8,
    right: -8,
  },
  stepTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: '1.5rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: ARYX.textPrimary,
    margin: 0,
  },
  stepDesc: {
    fontSize: '0.9375rem',
    lineHeight: 1.55,
    color: ARYX.textTertiary,
    margin: 0,
    maxWidth: 280,
  },
};

const pillarStyles: Record<string, CSSProperties> = {
  section: { position: 'relative', zIndex: 2, padding: '7rem 1.5rem' },
  container: { maxWidth: 1200, margin: '0 auto' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    position: 'relative',
    padding: '2.25rem',
    background: `linear-gradient(180deg, ${ARYX.darkSurface} 0%, ${ARYX.darkRaised} 100%)`,
    border: `1px solid ${ARYX.border}`,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
  },
  cardGlow: { position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.6 },
  cardIcon: {
    position: 'relative',
    width: 56,
    height: 56,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.25rem',
  },
  cardTitle: {
    position: 'relative',
    fontFamily: FONT_DISPLAY,
    fontSize: '1.5rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: ARYX.textPrimary,
    margin: '0 0 0.5rem 0',
  },
  cardDesc: {
    position: 'relative',
    fontSize: '0.9375rem',
    lineHeight: 1.55,
    color: ARYX.textTertiary,
    margin: '0 0 1.25rem 0',
  },
  list: {
    position: 'relative',
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: ARYX.textSecondary,
    lineHeight: 1.45,
  },
  integrationsStrip: {
    marginTop: '4rem',
    padding: '2rem',
    background: 'rgba(255,255,255,0.02)',
    border: `1px solid ${ARYX.border}`,
    borderRadius: 16,
    textAlign: 'center',
  },
  integrationsLabel: {
    fontFamily: FONT_DISPLAY,
    fontSize: '0.75rem',
    fontWeight: 700,
    color: ARYX.textTertiary,
    letterSpacing: '0.2em',
    marginBottom: '1.25rem',
  },
  integrationsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '0.625rem',
  },
  integration: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.875rem',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${ARYX.border}`,
    borderRadius: 999,
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: ARYX.textSecondary,
  },
};

const trustStyles: Record<string, CSSProperties> = {
  section: {
    position: 'relative',
    zIndex: 2,
    padding: '7rem 1.5rem',
    background: 'rgba(255,255,255,0.015)',
    borderTop: `1px solid ${ARYX.border}`,
    borderBottom: `1px solid ${ARYX.border}`,
  },
  container: {
    maxWidth: 900,
    margin: '0 auto',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '2.5rem',
  },
  quoteCard: {
    position: 'relative',
    padding: '2.5rem 2rem',
    background: `linear-gradient(180deg, ${ARYX.darkSurface} 0%, ${ARYX.darkRaised} 100%)`,
    border: `1px solid ${ARYX.border}`,
    borderRadius: 16,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 0 80px rgba(255,90,31,0.05)',
  },
  quoteMark: {
    fontFamily: FONT_DISPLAY,
    fontSize: '4rem',
    fontWeight: 900,
    lineHeight: 0.6,
    color: ARYX.orange,
    opacity: 0.3,
    marginBottom: '0.5rem',
  },
  quoteText: {
    fontFamily: FONT_DISPLAY,
    fontSize: '1.25rem',
    lineHeight: 1.5,
    color: ARYX.textPrimary,
    fontWeight: 500,
    letterSpacing: '-0.01em',
    margin: '0 auto 1.75rem',
    maxWidth: 720,
  },
  quoteAttribution: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.875rem',
  },
  quoteAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${ARYX.orangeBright} 0%, ${ARYX.orange} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    fontSize: '0.875rem',
    color: '#fff',
  },
  quoteName: {
    fontFamily: FONT_DISPLAY,
    fontSize: '0.875rem',
    fontWeight: 600,
    color: ARYX.textPrimary,
    textAlign: 'left',
  },
  quoteRole: {
    fontSize: '0.75rem',
    color: ARYX.textTertiary,
    textAlign: 'left',
  },
  badgeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '0.625rem',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.875rem',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${ARYX.border}`,
    borderRadius: 999,
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: ARYX.textSecondary,
    letterSpacing: '0.02em',
  },
};

const ctaStyles: Record<string, CSSProperties> = {
  section: { position: 'relative', zIndex: 2, padding: '7rem 1.5rem' },
  container: {
    position: 'relative',
    maxWidth: 900,
    margin: '0 auto',
    textAlign: 'center',
    padding: '4rem 2rem',
    background: `linear-gradient(180deg, ${ARYX.darkSurface} 0%, ${ARYX.darkRaised} 100%)`,
    border: `1px solid ${ARYX.borderStrong}`,
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 30px 80px rgba(0,0,0,0.5)',
  },
  glow: {
    position: 'absolute',
    top: -100,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '120%',
    height: '60%',
    background: `radial-gradient(ellipse, ${ARYX.orange}30 0%, transparent 60%)`,
    pointerEvents: 'none',
    filter: 'blur(60px)',
  },
  title: {
    position: 'relative',
    fontFamily: FONT_DISPLAY,
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: 800,
    letterSpacing: '-0.035em',
    lineHeight: 1.05,
    color: ARYX.textPrimary,
    margin: '0 0 1.25rem 0',
  },
  titleAccent: {
    background: `linear-gradient(135deg, ${ARYX.orangeBright} 0%, ${ARYX.orange} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    position: 'relative',
    maxWidth: 600,
    fontSize: '1.0625rem',
    lineHeight: 1.55,
    color: ARYX.textSecondary,
    margin: '0 auto 2rem',
  },
  buttons: {
    position: 'relative',
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primary: {
    background: `linear-gradient(135deg, ${ARYX.orangeBright} 0%, ${ARYX.orange} 100%)`,
    border: 'none',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 600,
    padding: '0.95rem 1.75rem',
    borderRadius: 10,
    fontFamily: FONT_DISPLAY,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: `0 14px 36px ${ARYX.orange}55, inset 0 1px 0 rgba(255,255,255,0.2)`,
    letterSpacing: '0.01em',
    textDecoration: 'none',
  },
  ghost: {
    background: 'none',
    border: 'none',
    color: ARYX.textTertiary,
    fontSize: '0.9375rem',
    fontWeight: 500,
    fontFamily: FONT_BODY,
    padding: '0.5rem 1rem',
    textDecoration: 'none',
  },
};

const footerStyles: Record<string, CSSProperties> = {
  section: {
    position: 'relative',
    zIndex: 2,
    padding: '3rem 1.5rem 2rem',
    borderTop: `1px solid ${ARYX.border}`,
  },
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    alignItems: 'center',
    textAlign: 'center',
  },
  brandBlock: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.625rem',
  },
  wordmark: {
    fontFamily: FONT_DISPLAY,
    fontSize: '1.5rem',
    fontWeight: 800,
    letterSpacing: '-0.04em',
    background: `linear-gradient(135deg, ${ARYX.orangeBright} 0%, ${ARYX.orange} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  tenant: {
    fontSize: '0.75rem',
    color: ARYX.textTertiary,
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
  },
  tagline: {
    fontSize: '0.875rem',
    color: ARYX.textTertiary,
    maxWidth: 600,
    margin: 0,
    lineHeight: 1.55,
  },
  bottomRow: {
    width: '100%',
    paddingTop: '1.5rem',
    borderTop: `1px solid ${ARYX.border}`,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  copyright: { fontSize: '0.75rem', color: ARYX.textMuted },
  legalLinks: {
    display: 'flex',
    gap: '1.25rem',
    fontSize: '0.75rem',
    color: ARYX.textMuted,
  },
};
