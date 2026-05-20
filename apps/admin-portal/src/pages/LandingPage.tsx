// ARYX Admin Portal Landing Page
//
// Dark cinematic marketing page rendered at /landing for unauthenticated
// visitors on the ARYX-branded admin portal (admin.aryxcloud.com).
// Mirrors the design system established in:
//   - packages/ui/src/brand/aryx-brand.css
//   - packages/ui/src/components/AryxAuthShell.tsx
//   - apps/advisor-portal/src/pages/LandingPage.tsx
//   - apps/crm/src/components/landing/AryxCrmLanding.tsx
//
// Admin-focused content: tenant orchestration, RBAC, audit, compliance,
// module licensing, and platform observability — positioned as the
// flagship "Platform Operator OS" for white-label health-sharing tenants.

import { useEffect, useState, type CSSProperties } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { detectBrand } from '@mpbhealth/ui';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  Building2,
  Check,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  GitBranch,
  Globe,
  KeyRound,
  Layers,
  Lock,
  Network,
  Palette,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
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
      'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800;900&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap';
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
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

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
// CountUp — animated counter
// ---------------------------------------------------------------------------
function CountUp({ to, suffix = '', duration = 1.4, decimals = 0 }: { to: number; suffix?: string; duration?: number; decimals?: number }) {
  const [value, setValue] = useState(0);
  return (
    <motion.span
      viewport={{ once: true, amount: 0.6 }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      onUpdate={(latest) => {
        if (typeof latest.opacity === 'number') setValue(to * latest.opacity);
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
export default function AdminLandingPage() {
  useInterTight();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 500], [0, -120]);

  // Brand guard (runs AFTER hooks to satisfy Rules of Hooks): this is the
  // ARYX flagship landing page. MPB Health tenants (admin.mpb.health) must
  // NEVER see it — bounce them straight to /login so we don't leak the
  // white-label parent brand to MPB users.
  if (detectBrand() !== 'aryx') {
    return <Navigate to="/login" replace />;
  }

  const goLogin = () => navigate('/login');
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={pageStyles.root}>
      <div style={pageStyles.grain} aria-hidden />
      <div style={pageStyles.meshGlow} aria-hidden />

      <TopNav onSignIn={goLogin} onScrollTo={scrollTo} />
      <HeroSection onPrimary={goLogin} onSecondary={() => scrollTo('features')} parallax={heroParallax} />
      <StatsBar />
      <FeatureShowcase id="features" />
      <HowItWorks />
      <PlatformPillars />
      <TrustSection />
      <CTASection id="cta" onSignIn={goLogin} />
      <Footer />
    </div>
  );
}

// ===========================================================================
// TOP NAV
// ===========================================================================
function TopNav({ onSignIn, onScrollTo }: { onSignIn: () => void; onScrollTo: (id: string) => void }) {
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
          <span style={navStyles.tenant}>Admin · by MPB Health</span>
        </button>
        <div style={navStyles.links}>
          <button onClick={() => onScrollTo('features')} style={navStyles.navLink}>Capabilities</button>
          <button onClick={() => onScrollTo('flow')} style={navStyles.navLink}>How it works</button>
          <button onClick={() => onScrollTo('pillars')} style={navStyles.navLink}>Platform</button>
          <button onClick={() => onScrollTo('cta')} style={navStyles.navLink}>Access</button>
          <button onClick={onSignIn} style={navStyles.signInButton}>
            Sign in <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

// ===========================================================================
// 1. HERO
// ===========================================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HeroSection({ onPrimary, onSecondary, parallax }: { onPrimary: () => void; onSecondary: () => void; parallax: any }) {
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
            <span>The operator console for ARYX-powered tenants</span>
          </motion.div>

          <motion.div variants={fadeUp} style={{ textAlign: 'center' }}>
            <div style={heroStyles.wordmark}>ARYX</div>
            <div style={heroStyles.tagline}>Admin · by MPB Health</div>
          </motion.div>

          <motion.h1 variants={fadeUp} style={heroStyles.headline}>
            The Platform<br />
            <span style={heroStyles.headlineAccent}>Operator OS.</span>
          </motion.h1>

          <motion.p variants={fadeUp} style={heroStyles.subhead}>
            One mission control for tenants, users, modules, content, and compliance.
            Provision new orgs in minutes. Govern access with surgical precision. See every
            event across the platform in real time.
          </motion.p>

          <motion.div variants={fadeUp} style={heroStyles.ctaRow}>
            <button onClick={onPrimary} style={heroStyles.ctaPrimary}>
              Open Console <ArrowRight size={16} />
            </button>
            <button onClick={onSecondary} style={heroStyles.ctaGhost}>
              Explore capabilities
            </button>
          </motion.div>

          {/* Admin console mock */}
          <motion.div
            variants={fadeUp}
            style={heroStyles.platformMock}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
          >
            <div style={heroStyles.mockChrome}>
              <span style={{ ...heroStyles.mockDot, background: '#FF5F57' }} />
              <span style={{ ...heroStyles.mockDot, background: '#FEBC2E' }} />
              <span style={{ ...heroStyles.mockDot, background: '#28C840' }} />
              <span style={heroStyles.mockUrl}>admin.aryxcloud.com</span>
            </div>
            <div style={heroStyles.mockBody}>
              <div style={heroStyles.mockSidebar}>
                {[
                  { label: 'Overview', icon: Activity },
                  { label: 'Tenants', icon: Building2 },
                  { label: 'Users & RBAC', icon: UserCog },
                  { label: 'Modules', icon: Layers },
                  { label: 'Audit Log', icon: FileText },
                  { label: 'System Health', icon: Server },
                ].map((item, i) => (
                  <div key={item.label} style={{ ...heroStyles.mockNavItem, ...(i === 0 ? heroStyles.mockNavActive : {}) }}>
                    <item.icon size={11} style={{ flexShrink: 0 }} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <div style={heroStyles.mockMain}>
                <div style={heroStyles.mockMainHeader}>
                  <div style={heroStyles.mockMainTitle}>Platform Overview</div>
                  <div style={heroStyles.mockHealth}>
                    <span style={heroStyles.mockHealthDot} />
                    <span>All systems operational</span>
                  </div>
                </div>

                <div style={heroStyles.mockGrid}>
                  {[
                    { label: 'Active Tenants', value: '12', tint: ARYX.orange, delta: '+2 this month' },
                    { label: 'Total Users', value: '8,421', tint: ARYX.teal, delta: '+312 / 24h' },
                    { label: 'Events / sec', value: '1.2K', tint: ARYX.yellow, delta: 'p99: 84ms' },
                  ].map((stat) => (
                    <div key={stat.label} style={heroStyles.mockStat}>
                      <div style={heroStyles.mockStatLabel}>{stat.label}</div>
                      <div style={{ ...heroStyles.mockStatValue, color: stat.tint }}>{stat.value}</div>
                      <div style={heroStyles.mockStatDelta}>{stat.delta}</div>
                    </div>
                  ))}
                </div>

                {/* Live audit ticker */}
                <div style={heroStyles.mockTicker}>
                  <div style={heroStyles.mockTickerHeader}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <motion.span
                        style={heroStyles.mockTickerPulse}
                        animate={{ scale: [1, 1.6, 1], opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                      />
                      Live audit stream
                    </span>
                    <span style={heroStyles.mockTickerMeta}>LAST 60s</span>
                  </div>
                  {[
                    { time: '12:04:17', actor: 'sarah.k@mpb.health', action: 'role.assigned', target: 'tenant:mpb advisor → admin' },
                    { time: '12:04:11', actor: 'system', action: 'module.licensed', target: 'tenant:acme · advisor-portal' },
                    { time: '12:04:08', actor: 'd.park@mpb.health', action: 'theme.updated', target: 'tenant:mpb · primary palette' },
                    { time: '12:04:02', actor: 'system', action: 'tenant.provisioned', target: 'org:northpoint-health' },
                  ].map((row, i) => (
                    <motion.div
                      key={`${row.time}-${i}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + i * 0.15 }}
                      style={heroStyles.mockTickerRow}
                    >
                      <span style={heroStyles.mockTickerTime}>{row.time}</span>
                      <span style={heroStyles.mockTickerAction}>{row.action}</span>
                      <span style={heroStyles.mockTickerTarget}>{row.target}</span>
                    </motion.div>
                  ))}
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
    { label: 'Tenants orchestrated', to: 12, suffix: '' },
    { label: 'Users provisioned', to: 8421, suffix: '+' },
    { label: 'Audit events / day', to: 4.2, suffix: 'M', decimals: 1 },
    { label: 'Uptime SLA', to: 99.99, suffix: '%', decimals: 2 },
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
      icon: Building2,
      title: 'Multi-Tenant Orchestration',
      desc: 'Provision new tenants in minutes — isolated data, custom domain, branded theme, and module licenses scoped per org.',
      tint: ARYX.orange,
    },
    {
      icon: UserCog,
      title: 'Users & RBAC',
      desc: 'Granular role-based access with permission inheritance, SCIM provisioning, impersonation, and just-in-time elevation.',
      tint: ARYX.teal,
    },
    {
      icon: Layers,
      title: 'Module Licensing',
      desc: 'Toggle CRM, Advisor Portal, Concierge, and Staff Hub per tenant. Feature flags, tier gates, and trial expiries built in.',
      tint: ARYX.yellow,
    },
    {
      icon: Palette,
      title: 'White-Label Theming',
      desc: 'Per-tenant logo, color tokens, fonts, and email templates. Push a theme change globally in seconds without a deploy.',
      tint: ARYX.orangeBright,
    },
    {
      icon: FileText,
      title: 'Content & CMS',
      desc: 'Marketing pages, blog posts, SOPs, bulletins, media library — versioned, role-permissioned, and instantly searchable.',
      tint: ARYX.teal,
    },
    {
      icon: BarChart3,
      title: 'Unified Analytics',
      desc: 'Cross-tenant reporting on enrollments, revenue, ticket volume, ad performance, and member health. Drill from platform → tenant.',
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
          <div style={featureStyles.eyebrow}>CAPABILITIES</div>
          <h2 style={featureStyles.title}>
            Run the entire platform.<br />
            <span style={featureStyles.titleAccent}>From one console.</span>
          </h2>
          <p style={featureStyles.subtitle}>
            ARYX Admin replaces a stack of disconnected operator tools — tenant provisioning,
            IAM, CMS, billing, and observability — with one purpose-built console for
            white-label health-sharing infrastructure.
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
// 4. HOW IT WORKS
// ===========================================================================
function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Configure',
      desc: 'Spin up a tenant with domain, theme, and module licenses. White-label settings flow through every app instantly.',
      icon: Globe,
      tint: ARYX.orange,
    },
    {
      number: '02',
      title: 'Provision',
      desc: 'Invite users with role templates. SCIM keeps directories in sync. JIT elevation handles admin escalations.',
      icon: Users,
      tint: ARYX.yellow,
    },
    {
      number: '03',
      title: 'Govern',
      desc: 'Every change is signed, time-stamped, and queryable. Role guards block destructive actions before they happen.',
      icon: ShieldCheck,
      tint: ARYX.teal,
    },
    {
      number: '04',
      title: 'Scale',
      desc: 'Tenant-level metrics, capacity planning, and module-usage attribution show where the platform is growing fastest.',
      icon: BarChart3,
      tint: ARYX.orangeBright,
    },
  ];

  return (
    <section id="flow" style={howStyles.section}>
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
            From zero to multi-tenant platform<br />
            <span style={featureStyles.titleAccent}>in four moves.</span>
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
      icon: Network,
      title: 'Multi-Tenant',
      desc: 'Built tenant-first from the database up — not bolted on as an afterthought.',
      points: [
        'Row-level security per organization',
        'Per-tenant domains, themes & email senders',
        'Module licensing & feature flags',
        'Cross-tenant impersonation for support',
      ],
      tint: ARYX.orange,
    },
    {
      icon: ShieldCheck,
      title: 'Security & Compliance',
      desc: 'Enterprise controls baked into every interaction across every tenant.',
      points: [
        'HIPAA & SOC 2 Type II controls',
        'Cryptographically signed audit log',
        'Granular RBAC + JIT elevation',
        'SSO, SCIM & key rotation',
      ],
      tint: ARYX.teal,
    },
    {
      icon: Activity,
      title: 'Observability',
      desc: 'Real-time visibility from platform health down to a single tenant action.',
      points: [
        'Live event stream & alerting',
        'Per-tenant capacity & cost metrics',
        'Performance SLOs & error budgets',
        'Webhook & integration health checks',
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
            Three pillars.<br />
            <span style={featureStyles.titleAccent}>Zero compromises.</span>
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

        {/* Architecture strip */}
        <motion.div variants={fadeUp} style={pillarStyles.archStrip}>
          <div style={pillarStyles.archLabel}>THE ARYX STACK</div>
          <div style={pillarStyles.archRow}>
            {[
              { icon: Globe, label: 'Edge / CDN' },
              { icon: Server, label: 'Vercel + SSR' },
              { icon: Database, label: 'Supabase' },
              { icon: Lock, label: 'Row-level Security' },
              { icon: KeyRound, label: 'SSO & SCIM' },
              { icon: GitBranch, label: 'Webhook Bus' },
              { icon: Brain, label: 'AI Orchestrator' },
              { icon: Zap, label: 'Realtime Sync' },
            ].map((i) => (
              <div key={i.label} style={pillarStyles.archItem}>
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
            ARYX Admin gave our platform team a single console for every tenant we operate.
            We spun up a new white-label org in twelve minutes — domain, theme, modules, RBAC,
            audit hooks, all of it. The compliance team finally has a real-time audit stream
            they trust.
          </p>
          <div style={trustStyles.quoteAttribution}>
            <div style={trustStyles.quoteAvatar}>MH</div>
            <div>
              <div style={trustStyles.quoteName}>Platform Engineering</div>
              <div style={trustStyles.quoteRole}>MPB Health · Founding Tenant</div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} style={trustStyles.badgeRow}>
          {[
            { icon: Shield, label: 'HIPAA Compliant' },
            { icon: ShieldCheck, label: 'SOC 2 Type II' },
            { icon: Lock, label: '256-bit Encryption' },
            { icon: ClipboardList, label: 'Signed Audit Log' },
            { icon: KeyRound, label: 'SSO & SCIM Ready' },
            { icon: CheckCircle2, label: '99.99% Uptime' },
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
function CTASection({ id, onSignIn }: { id: string; onSignIn: () => void }) {
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

        <motion.div variants={fadeUp} style={ctaStyles.restrictedPill}>
          <AlertCircle size={12} style={{ color: ARYX.yellow }} />
          <span>Restricted access · Authorized administrators only</span>
        </motion.div>

        <motion.h2 variants={fadeUp} style={ctaStyles.title}>
          Ready to orchestrate<br />
          <span style={ctaStyles.titleAccent}>the platform?</span>
        </motion.h2>
        <motion.p variants={fadeUp} style={ctaStyles.subtitle}>
          Admin access is provisioned by the platform team. If you've been invited as an
          operator, sign in below. Otherwise, contact your tenant administrator to request
          access.
        </motion.p>
        <motion.div variants={fadeUp} style={ctaStyles.buttons}>
          <button onClick={onSignIn} style={ctaStyles.primary}>
            Sign in to console <ArrowRight size={16} />
          </button>
          <button onClick={onSignIn} style={ctaStyles.ghost}>
            Have an invite link? Continue
          </button>
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
          <span style={footerStyles.tenant}>Admin · by MPB Health</span>
        </div>
        <p style={footerStyles.tagline}>
          ARYX is the multi-tenant platform behind modern health sharing. Built for scale.
          Engineered for compliance. Operated with confidence.
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
  links: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
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
    cursor: 'pointer',
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
    cursor: 'pointer',
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
    fontFamily: FONT_MONO,
  },
  mockBody: { display: 'flex', minHeight: 360 },
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
  mockMainHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  mockMainTitle: {
    fontFamily: FONT_DISPLAY,
    fontSize: '1.0625rem',
    fontWeight: 700,
    color: ARYX.textPrimary,
  },
  mockHealth: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.6875rem',
    color: ARYX.teal,
    fontWeight: 600,
  },
  mockHealthDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: ARYX.teal,
    boxShadow: `0 0 8px ${ARYX.teal}80`,
  },
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
  mockStatDelta: {
    marginTop: '0.25rem',
    fontSize: '0.6875rem',
    color: ARYX.textTertiary,
    fontFamily: FONT_MONO,
  },
  mockTicker: {
    padding: '0.875rem',
    background: 'rgba(0,0,0,0.4)',
    border: `1px solid ${ARYX.border}`,
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  mockTickerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: FONT_DISPLAY,
    fontSize: '0.75rem',
    fontWeight: 600,
    color: ARYX.textSecondary,
    marginBottom: '0.25rem',
  },
  mockTickerPulse: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: ARYX.orange,
    boxShadow: `0 0 6px ${ARYX.orange}`,
    display: 'inline-block',
  },
  mockTickerMeta: {
    fontSize: '0.625rem',
    color: ARYX.textMuted,
    fontFamily: FONT_MONO,
    letterSpacing: '0.1em',
  },
  mockTickerRow: {
    display: 'grid',
    gridTemplateColumns: '70px 110px 1fr',
    alignItems: 'center',
    gap: '0.625rem',
    fontFamily: FONT_MONO,
    fontSize: '0.6875rem',
  },
  mockTickerTime: { color: ARYX.textMuted },
  mockTickerAction: { color: ARYX.teal },
  mockTickerTarget: { color: ARYX.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
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
  archStrip: {
    marginTop: '4rem',
    padding: '2rem',
    background: 'rgba(255,255,255,0.02)',
    border: `1px solid ${ARYX.border}`,
    borderRadius: 16,
    textAlign: 'center',
  },
  archLabel: {
    fontFamily: FONT_DISPLAY,
    fontSize: '0.75rem',
    fontWeight: 700,
    color: ARYX.textTertiary,
    letterSpacing: '0.2em',
    marginBottom: '1.25rem',
  },
  archRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '0.625rem',
  },
  archItem: {
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
  restrictedPill: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.875rem',
    background: 'rgba(255,195,0,0.08)',
    border: `1px solid ${ARYX.yellow}40`,
    borderRadius: 999,
    fontSize: '0.75rem',
    fontWeight: 500,
    color: ARYX.textSecondary,
    letterSpacing: '0.02em',
    marginBottom: '1.25rem',
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
    cursor: 'pointer',
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
  },
  ghost: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: ARYX.textTertiary,
    fontSize: '0.9375rem',
    fontWeight: 500,
    fontFamily: FONT_BODY,
    padding: '0.5rem 1rem',
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
