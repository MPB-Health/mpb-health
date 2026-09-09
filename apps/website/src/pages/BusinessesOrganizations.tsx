import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  Building2,
  CheckSquare,
  Clock,
  CreditCard,
  Dna,
  DollarSign,
  Download,
  Edit,
  FileText,
  Headphones,
  Heart,
  HeartPulse,
  Infinity as InfinityIcon,
  PawPrint,
  Pill,
  Plus,
  Shield,
  Stethoscope,
  TrendingUp,
  UserMinus,
  Users,
} from 'lucide-react';
import { MarketingHydrationSeo } from '../components/MarketingHydrationSeo';
import BusinessRateCalculator from '../components/BusinessRateCalculator';
import {
  AuroraBand,
  CompareTable,
  FaqSection,
  LandingPage,
  PageHero,
  PlanGrid,
  Reveal,
  SectionHead,
  Sheet,
} from '../components/landing-redesign/page-kit';
import { BUSINESS_COMPARE, BUSINESS_PLANS } from '../components/landing-redesign/plansData';
import {
  generateHealthSharePlanSchema,
  generateOrganizationSchema,
  generateServiceSchema,
  generateFAQSchema,
  businessesFaqQuestions,
} from '../lib/schemaMarkup';

const employerGroupForms = [
  { to: '/list-bill-update', label: 'Employee updates', Icon: Edit },
  {
    to: 'https://www.cognitoforms.com/MPoweringBenefits1/UpdateFormOfPayment',
    label: 'Update form of payment',
    Icon: CreditCard,
    external: true,
  },
  { to: '/employee-removal', label: 'Employee removal', Icon: UserMinus },
] as const;

const whyChooseItems = [
  {
    Icon: DollarSign,
    title: 'Cost-sharing for the self-employed',
    description:
      'Replace hefty premiums with a fixed monthly share that pools funds for eligible medical costs, saving 40 to 60% versus typical plans.',
  },
  {
    Icon: Users,
    title: 'Share monthly contributions',
    description:
      'Each participating employee or self-employed member pays a fixed share into a communal pool. Contributions fund eligible medical expenses for all members. HSA compatible.',
  },
  {
    Icon: TrendingUp,
    title: 'Tax-friendly options',
    description:
      'Qualifying individuals may deduct the MEC portion of their membership, whether they are independent contractors, freelancers or traditional employees. Consult your tax advisor for guidance specific to your situation.',
  },
] as const;

const services: ReadonlyArray<{ Icon: React.ElementType; title: string; note?: string }> = [
  { Icon: Shield, title: 'Protection from large medical expenses' },
  { Icon: Brain, title: '$0 virtual behavioral health' },
  { Icon: Clock, title: '$0 unlimited 24/7/365 virtual urgent care' },
  { Icon: Stethoscope, title: '$0 continuous, personalized virtual primary care' },
  { Icon: CheckSquare, title: 'Preventive services that satisfy federal health mandates' },
  {
    Icon: Building2,
    title: 'Maternity sharing: prenatal, delivery, postnatal and newborn care',
    note: 'Applicable with eligibility requirements',
  },
  { Icon: Pill, title: 'Over 1,000 medications at $0 or under $14.95' },
  { Icon: Plus, title: 'Save on prescriptions at nationwide pharmacies' },
  { Icon: Heart, title: 'Save 30% on high-quality vitamins and supplements' },
  { Icon: Headphones, title: 'Personalized advocacy and expert member support' },
  { Icon: Dna, title: 'Genetic testing discounts' },
  { Icon: PawPrint, title: '$0 unlimited virtual pet care' },
];

const featureItems = [
  {
    Icon: Shield,
    title: 'Provider freedom',
    description:
      'Members choose their own providers without narrow networks or out-of-network penalties. Memberships that include MEC benefits do follow a network, since those services are provided at no cost.',
  },
  {
    Icon: InfinityIcon,
    title: 'No annual or lifetime sharing maximums',
    description:
      "Unlike many traditional plans, MPB Health's cost-sharing programs don't impose yearly or lifetime maximums on eligible expenses.",
  },
  {
    Icon: FileText,
    title: 'Transparent sharing guidelines',
    description:
      'Detailed, easy-to-understand rules outline which medical expenses are eligible, how sharing amounts are applied and any limits, so members know exactly what to expect.',
  },
] as const;

const BusinessesOrganizations = () => {
  // Generate structured data for business plans
  const mecEssentialsSchema = generateHealthSharePlanSchema(
    'HSA Essentials',
    'Minimum Essential Care membership satisfying ACA employer mandate requirements. Affordable preventive care solution for businesses.',
    125,
    195,
    ['ACA Compliant', 'Employer Mandate Satisfaction', 'Preventive Care', 'Telemedicine', 'Business Solution']
  );

  const secureHSABusinessSchema = generateHealthSharePlanSchema(
    'Secure HSA Business',
    'HSA-compatible health sharing for businesses seeking tax-advantaged healthcare solutions for employees.',
    239,
    1070,
    ['HSA Compatible', 'Tax Advantages', 'Employee Benefits', 'Medical Cost Sharing', 'Family Membership Options']
  );

  const orgSchema = generateOrganizationSchema();
  const serviceSchema = generateServiceSchema();
  const businessFaqSchema = generateFAQSchema(businessesFaqQuestions);

  return (
    <>
      <MarketingHydrationSeo>
        <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(mecEssentialsSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(secureHSABusinessSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(businessFaqSchema)}</script>
      </MarketingHydrationSeo>

      <LandingPage>
        <PageHero
          ariaLabel="Businesses and organizations"
          kicker="For businesses & organizations"
          title={
            <>
              Healthcare
              <br />
              your team can
              <br />
              actually use.
            </>
          }
          lede={
            <>
              Cost-sharing healthcare designed for business owners, contractors and freelancers.{' '}
              <strong>Lower costs. Healthier teams. Simplified administration.</strong>
            </>
          }
          actions={
            <>
              <a className="lr-btn lr-btn--white" href="#estimate">
                Get a group quote
              </a>
              <Link className="lr-btn lr-btn--glass" to="/compare-plans">
                Compare memberships
              </Link>
            </>
          }
          rail={[
            { value: '40–60%', label: 'Typical savings vs. premiums' },
            { value: '2–50', label: 'Employees per group' },
            { value: '$0', label: 'Virtual care, included' },
          ]}
          media={{
            type: 'video',
            src: '/assets/organization.mp4',
            poster: '/assets/businessTeamWorking.png',
          }}
          caption={
            <>
              <HeartPulse />
              <p>
                <strong>Not insurance.</strong> A community that shares eligible medical expenses.
              </p>
            </>
          }
        />

        <Sheet>
          <section className="lr-sec lr-sec--top lr-toolrow-sec" aria-label="Employer group forms">
            <div className="lr-inner">
              <Reveal>
                <div className="lr-toolrow">
                  <p className="lr-eyebrow">Employer group forms</p>
                  <nav className="lr-toolrow__links" aria-label="Employer group forms">
                    {employerGroupForms.map(({ to, label, Icon, ...rest }) =>
                      'external' in rest && rest.external ? (
                        <a
                          key={to}
                          href={to}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lr-btn lr-btn--ghost lr-btn--sm"
                        >
                          <Icon strokeWidth={1.8} />
                          {label}
                        </a>
                      ) : (
                        <Link key={to} to={to} className="lr-btn lr-btn--ghost lr-btn--sm">
                          <Icon strokeWidth={1.8} />
                          {label}
                        </Link>
                      )
                    )}
                  </nav>
                </div>
              </Reveal>
            </div>
          </section>

          <section className="lr-sec" aria-label="Why teams choose MPB Health">
            <div className="lr-inner">
              <div className="lr-split">
                <Reveal>
                  <div className="lr-split__media">
                    <img
                      src="/assets/businessTeamWorking.png"
                      alt="Business professionals working together"
                      width={600}
                      height={500}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </Reveal>
                <Reveal delay={0.1}>
                  <p className="lr-eyebrow">Why teams choose MPB Health</p>
                  <h2 className="lr-h2">
                    Better benefits.
                    <br />
                    Smaller line item.
                  </h2>
                  <p className="lr-twotone">
                    A healthcare sharing membership built for small teams.{' '}
                    <span>Fixed monthly shares, HSA compatibility and no premium creep.</span>
                  </p>
                  <ul className="lr-rows">
                    {whyChooseItems.map(({ Icon, title, description }) => (
                      <li key={title}>
                        <span className="lr-cell__tile">
                          <Icon strokeWidth={1.8} />
                        </span>
                        <div>
                          <h3>{title}</h3>
                          <p>{description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            </div>
          </section>

          <section className="lr-sec lr-sec--soft" aria-label="What a membership includes">
            <div className="lr-inner">
              <SectionHead
                eyebrow="Complete protection"
                title="Everything a membership includes."
                lede="One stop access to telehealth, cost sharing, virtual behavioral health and more."
                ledeMuted="Features vary by membership."
              />
              <div className="lr-cells lr-cells--compact lr-cells--4">
                {services.map(({ Icon, title, note }, i) => (
                  <Reveal key={title} delay={(i % 4) * 0.05}>
                    <div className="lr-cell">
                      <span className="lr-cell__tile">
                        <Icon strokeWidth={1.8} />
                      </span>
                      <div>
                        <h3>{title}</h3>
                        {note ? <p>{note}</p> : null}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.1}>
                <p className="lr-note" style={{ textAlign: 'center', marginInline: 'auto' }}>
                  Sharing of eligible expenses is subject to membership guidelines and eligibility requirements.
                  Preventive services that satisfy federal mandates are included with MEC memberships.
                </p>
              </Reveal>
            </div>
          </section>

          <section className="lr-sec" aria-label="Memberships" id="memberships">
            <div className="lr-inner">
              <SectionHead
                eyebrow="Memberships"
                title="Two memberships. One for every team."
                lede="Start with ACA-compliant essentials or add full medical cost sharing."
                ledeMuted="Both are HSA compatible and include $0 virtual care."
              />
              <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
                <PlanGrid plans={BUSINESS_PLANS} cols={2} />
              </div>
              <Reveal delay={0.1}>
                <p className="lr-note" style={{ textAlign: 'center', marginInline: 'auto' }}>
                  Monthly amounts shown are starting contributions per member and vary by age, household, state and
                  member responsibility amount. MPB Health memberships are not insurance.
                </p>
                <p style={{ textAlign: 'center', marginTop: '1.4rem' }}>
                  <Link to="/compare-plans" className="lr-more">
                    See every membership side by side <ArrowRight />
                  </Link>
                </p>
              </Reveal>

              <div style={{ marginTop: 'clamp(3.5rem, 6vw, 5.5rem)' }}>
                <SectionHead
                  eyebrow="Side by side"
                  title="What each membership shares."
                  align="left"
                >
                  <p style={{ margin: '0.25rem 0 0' }}>
                    <a
                      href="/docs/plan-comparison-guide.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lr-more"
                    >
                      Download the comparison guide <Download />
                    </a>
                  </p>
                </SectionHead>
                <Reveal>
                  <CompareTable columns={BUSINESS_COMPARE.columns} groups={BUSINESS_COMPARE.groups} />
                </Reveal>
              </div>
            </div>
          </section>

          <section
            className="lr-sec lr-sec--soft"
            aria-label="Estimate your group contribution"
            id="estimate"
            style={{ scrollMarginTop: '90px' }}
          >
            <div className="lr-inner">
              <SectionHead
                eyebrow="Estimate"
                title="Estimate your group contribution."
                lede="Tell us about your team and see both memberships priced in about 60 seconds."
                ledeMuted="No email required. Estimates are informational, not a binding quote."
              />
              <Reveal>
                <div className="lr-panel lr-formwrap lr-bizcalc">
                  <BusinessRateCalculator />
                </div>
              </Reveal>
            </div>
          </section>

          <section className="lr-sec" aria-label="What makes it work">
            <div className="lr-inner">
              <SectionHead
                eyebrow="What makes it work"
                title="Freedom, no ceilings, clear rules."
                align="left"
              />
              <ol className="lr-steps lr-steps--cols" style={{ '--cols': 3 } as React.CSSProperties}>
                {featureItems.map((feature, i) => (
                  <Reveal as="li" key={feature.title} delay={i * 0.08}>
                    <span className="lr-steps__num">0{i + 1}</span>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </Reveal>
                ))}
              </ol>
            </div>
          </section>

          <FaqSection
            items={businessesFaqQuestions}
            intro={
              <>
                Questions about HSAs, compliance or group billing? Our advisors handle those every day.{' '}
                <Link to="/faq" className="lr-more">
                  Browse all FAQs <ArrowRight />
                </Link>
              </>
            }
          />

          <AuroraBand
            title="Give your team healthcare they'll actually thank you for."
            lede="Get a group estimate in about a minute, or talk with an advisor who works with small businesses every day."
            actions={
              <>
                <a className="lr-btn lr-btn--white" href="#estimate">
                  Get a group quote
                </a>
                <a className="lr-btn lr-btn--glass" href="tel:+18558164650">
                  Call (855) 816-4650
                </a>
              </>
            }
            note="MPB Health memberships are not insurance and do not guarantee payment of medical expenses. Eligible expenses are shared according to the membership guidelines. Consult your tax advisor regarding deductibility."
          />
        </Sheet>
      </LandingPage>
    </>
  );
};

export { BusinessesOrganizations };
export default BusinessesOrganizations;
