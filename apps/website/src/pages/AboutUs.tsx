import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Heart, Shield, Users } from 'lucide-react';
import { MarketingHydrationSeo } from '../components/MarketingHydrationSeo';
import {
  AuroraBand,
  CountUp,
  FaqSection,
  LandingPage,
  PageHero,
  Reveal,
  SectionHead,
  Sheet,
} from '../components/landing-redesign/page-kit';

/** Plain-text stat values get NumberFlow's mask padding so the four cells share one baseline. */
const PLAIN_DT: React.CSSProperties = { padding: '0.25em 0' };

const BOOKING_URL = 'https://outlook.office.com/book/SpeakWithaAdvisor@NETORG6712533.onmicrosoft.com/';

const coreValues = [
  {
    Icon: Shield,
    title: 'Transparency',
    description:
      'We communicate openly and honestly, ensuring our members have clear insights into their healthcare options and costs.',
  },
  {
    Icon: Heart,
    title: 'Compassion',
    description:
      "We listen with empathy and understanding, treating each member's circumstances with kindness and respect.",
  },
  {
    Icon: Users,
    title: 'Care',
    description:
      'We deliver personalized support and attention, going the extra mile to ensure every member receives the highest quality healthcare experience.',
  },
] as const;

const achievements = [
  'Industry-leading medical cost sharing platform',
  'Dedicated support and personalized guidance',
  'Comprehensive membership options for all life stages',
  'Transparent pricing with no hidden fees',
  'Community-driven approach to healthcare',
  'Innovative technology for seamless experience',
] as const;

const faqs = [
  {
    question: 'What is MPB Health?',
    answer: 'MPB Health offers memberships that are alternatives to traditional health insurance. MPB Health is not insurance; rather, it is a community-focused organization dedicated to providing transparent, non-insurance alternatives for healthcare. We facilitate a medical cost-sharing model that empowers individuals, families, and businesses to break free from traditional network restrictions and high corporate overhead. By prioritizing people over profit, we provide innovative solutions that combine sharing, preventive care, and personalized support to help our members take back control of their healthcare journey.',
  },
  {
    question: 'Why do people choose MPB Health?',
    answer: 'Members choose MPB Health for the greater flexibility of seeing any doctor, significantly lower monthly costs compared to traditional insurance, and access to a community-based model. Our members value a system that prioritizes transparency and shared responsibility over corporate profit margins.',
  },
  {
    question: 'How much do members typically save by joining MPB Health?',
    answer: 'On average, our members see a 30–60% reduction in their monthly costs compared to traditional insurance premiums. Because we are a community-driven model without the high overhead of corporate insurance, those savings are passed directly back to our members.',
  },
  {
    question: 'How is MPB Health different from traditional insurance?',
    answer: 'Traditional insurance is built around premiums, restrictive networks, and corporate risk pools. MPB Health is a community-based alternative where members contribute monthly to share in eligible medical needs based on clear guidelines rather than insurance contracts. This model offers lower monthly costs and the freedom to choose any provider without network limitations.',
  },
  {
    question: 'What makes MPB Health different from other healthshares?',
    answer:
      'While many healthshares require a religious "statement of faith," MPB Health is inclusive and open to everyone. We welcome members from all backgrounds, beliefs, and walks of life who share the common goal of taking personal responsibility for their health within a supportive community. Beyond our inclusivity, we differentiate ourselves by providing modern benefits such as $0 unlimited virtual care and behavioral health resources from day one, ensuring the community supports your daily wellness rather than just major medical events.',
  },
  {
    question: 'Is MPB Health a good fit for families?',
    answer: "Yes. Many families choose MPB Health because it offers total provider flexibility, allowing them to keep their trusted pediatricians and specialists. Families also benefit from significant monthly savings and immediate access to resources such as $0 unlimited virtual care and behavioral health, ensuring their everyday health needs are supported without the high costs of traditional insurance.",
  },
  {
    question: 'Who typically joins MPB Health?',
    answer: 'MPB Health is an ideal fit for individuals, families, small business owners, and self-employed professionals who prioritize freedom and flexibility in their healthcare. Our members are typically looking for a more affordable, community-driven alternative to traditional insurance that allows them to take full control of their healthcare choices without being restricted by corporate networks.',
  },
  {
    question: 'Is MPB Health available nationwide?',
    answer:
      'Yes. MPB Health is available to members across most of the United States and Puerto Rico, providing individuals and families access to a nationwide, community-based healthcare model that travels with you.\n\nNote: Membership is currently unavailable to residents of Washington state.',
  },
  {
    question: 'Do I have to wait for an "Open Enrollment" period to join?',
    answer: 'No. One of the greatest advantages of MPB Health is that you can join any time of the year. There are no restrictive enrollment windows, meaning you can take control of your healthcare and start your membership as early as the first of the next month.',
  },
  {
    question: 'Is maternity care eligible for sharing?',
    answer: "Yes. MPB Health supports growing families by sharing in eligible expenses related to prenatal care, delivery, and postnatal care. To be eligible for sharing, the pregnancy conception date must occur after at least six months of continuous membership. Once the Initial Unshareable Amount (IUA) is met for the pregnancy, the community shares in the remaining eligible costs for both the mother and the newborn's initial care.",
  },
];

/** Multi-paragraph answers keep their breaks inside the native details skin. */
const FAQ_ITEMS = faqs.map(({ question, answer }) => {
  const parts = answer.split('\n\n');
  return {
    question,
    answer:
      parts.length === 1 ? (
        answer
      ) : (
        <>
          {parts.map((p) => (
            <p key={p} className="lr-body">
              {p}
            </p>
          ))}
        </>
      ),
  };
});

const AboutUs: React.FC = () => {
  return (
    <>
      <MarketingHydrationSeo />

      <LandingPage>
        <PageHero
          ariaLabel="About MPB Health"
          kicker="About MPB Health"
          title={
            <>
              People over
              <br />
              premiums.
            </>
          }
          lede="Making quality healthcare accessible and affordable through a supportive, member-driven community."
          actions={
            <>
              <a
                className="lr-btn lr-btn--white"
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Talk to an advisor
              </a>
              <Link className="lr-btn lr-btn--glass" to="/contact">
                Contact us
              </Link>
            </>
          }
          rail={[
            { value: '50K+', label: 'Members served' },
            { value: '30–60%', label: 'Average savings' },
            { value: '98%', label: 'Satisfaction' },
          ]}
          media={{ type: 'image', src: '/assets/team-photo.avif', alt: 'The MPB Health team' }}
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Our story">
            <div className="lr-inner">
              <div className="lr-split">
                <Reveal>
                  <div className="lr-split__media">
                    <img
                      src="/assets/mpbhealthteam.jpg"
                      alt="The MPB Health team at the Boca Raton office opening"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </Reveal>
                <Reveal delay={0.1}>
                  <p className="lr-eyebrow">Our story</p>
                  <h2 className="lr-h2">
                    Transforming
                    <br />
                    healthcare together.
                  </h2>
                  <p className="lr-body">
                    MPB Health is a leading provider of alternative healthcare solutions, empowering
                    individuals and families to access affordable care through a supportive, member-driven
                    community.
                  </p>
                  <p className="lr-body">
                    Our innovative medical cost sharing model helps members save up to 50% on medical
                    expenses versus traditional insurance plans. Based in the United States, we prioritize
                    transparency, compassionate support, and comprehensive membership options, so you can
                    make informed healthcare decisions and enjoy true peace of mind.
                  </p>
                  <ul className="lr-checks">
                    {achievements.map((text) => (
                      <li key={text}>
                        <Check strokeWidth={3} />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            </div>
          </section>

          <AuroraBand
            ariaLabel="Our mission"
            title="Together, we share the care that empowers healthier lives."
            lede="Our mission is to empower individuals to live healthier, happier lives through innovative, comprehensive healthcare solutions, providing personalized support and guidance so our members can make informed decisions and access the best care possible."
          />

          <section className="lr-sec" aria-label="What we stand for">
            <div className="lr-inner">
              <SectionHead
                eyebrow="Our values"
                title="What we stand for."
                lede="Three values guide everything we do,"
                ledeMuted="from how we serve our members to how we build our community."
              />
              <div className="lr-cells">
                {coreValues.map(({ Icon, title, description }, i) => (
                  <Reveal key={title} delay={i * 0.06}>
                    <div className="lr-cell">
                      <span className="lr-cell__tile">
                        <Icon strokeWidth={1.8} />
                      </span>
                      <div>
                        <h3>{title}</h3>
                        <p>{description}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          <section className="lr-sec lr-sec--soft" aria-label="MPB Health by the numbers">
            <div className="lr-inner">
              <SectionHead
                eyebrow="By the numbers"
                title="A community that keeps growing."
                align="left"
              />
              <Reveal>
                <dl className="lr-stats" style={{ '--cols': 4 } as React.CSSProperties}>
                  <div>
                    <dt>
                      <CountUp value={50000} suffix="+" />
                    </dt>
                    <dd>Members served</dd>
                  </div>
                  <div>
                    <dt style={PLAIN_DT}>30–60%</dt>
                    <dd>Average savings</dd>
                  </div>
                  <div>
                    <dt>
                      <CountUp value={98} suffix="%" />
                    </dt>
                    <dd>Satisfaction rate</dd>
                  </div>
                  <div>
                    <dt style={PLAIN_DT}>US-wide</dt>
                    <dd>Membership</dd>
                  </div>
                </dl>
              </Reveal>
            </div>
          </section>

          <FaqSection
            items={FAQ_ITEMS}
            intro="Get answers to common questions about our healthcare solutions."
          />

          <AuroraBand
            title="Ready to experience better healthcare?"
            lede="Join thousands of members who are saving on healthcare while getting the care they need. Let's talk about your options."
            actions={
              <>
                <Link className="lr-btn lr-btn--white" to="/get-a-quote">
                  Get your quote
                </Link>
                <a className="lr-btn lr-btn--glass" href="tel:+18558164650">
                  Call (855) 816-4650
                </a>
              </>
            }
            note="MPB Health memberships are not insurance and do not guarantee payment of medical expenses. Eligible expenses are shared according to the membership guidelines."
          />
        </Sheet>
      </LandingPage>
    </>
  );
};

export { AboutUs };
export default AboutUs;
