import React, { useState } from 'react';
import { MarketingHydrationSeo } from '../components/MarketingHydrationSeo';
import {
  Heart,
  Shield,
  Users,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Award,
  ArrowRight,
  Globe,
  Check
} from 'lucide-react';
import { LandingHeader } from '../components/landing-redesign/LandingHeader';
import { LandingFooter } from '../components/landing-redesign/LandingFooter';
import '../components/landing-redesign/landing-redesign.css';
import './how-it-works.css';
import './about-us.css';

const coreValues = [
  {
    icon: Shield,
    iconClass: '',
    title: 'Transparency',
    description: 'We communicate openly and honestly, ensuring our members have clear insights into their healthcare options and costs.',
  },
  {
    icon: Heart,
    iconClass: 'abt-value-card__icon--teal',
    title: 'Compassion',
    description: "We listen with empathy and understanding, treating each member's circumstances with kindness and respect.",
  },
  {
    icon: Users,
    iconClass: 'abt-value-card__icon--green',
    title: 'Care',
    description: 'We deliver personalized support and attention, going the extra mile to ensure every member receives the highest quality healthcare experience.',
  }
];

const stats = [
  { icon: Users, value: '50K+', label: 'Members Served' },
  { icon: TrendingUp, value: '30-60%', label: 'Average Savings' },
  { icon: Award, value: '98%', label: 'Satisfaction Rate' },
  { icon: Globe, value: 'US-Wide', label: 'Membership' }
];

const achievements = [
  'Industry-leading medical cost sharing platform',
  'Dedicated support and personalized guidance',
  'Comprehensive membership options for all life stages',
  'Transparent pricing with no hidden fees',
  'Community-driven approach to healthcare',
  'Innovative technology for seamless experience'
];

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

const AboutUs: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <>
      <MarketingHydrationSeo />

      <div className="lr hiw abt">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="hiw-hero" aria-label="About MPB Health">
          <LandingHeader />
          <div className="hiw-hero__content">
            <div className="hiw-hero__copy">
              <p className="abt-label">About Us</p>
              <h1 className="hiw-hero__title">Community-Driven Healthcare Solutions</h1>
              <p className="hiw-hero__lede">
                Making quality healthcare accessible and affordable through innovative cost-sharing
                solutions.
              </p>
              <div className="abt-hero__stats">
                {stats.map((stat) => (
                  <span key={stat.label} className="abt-stat">
                    <stat.icon aria-hidden="true" />
                    <strong>{stat.value}</strong> {stat.label}
                  </span>
                ))}
              </div>
            </div>
            <img
              className="hiw-hero__img"
              src="/assets/team-photo.avif"
              alt="The MPB Health team"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </section>

        {/* ── Our story ────────────────────────────────────────────── */}
        <section className="hiw-section" aria-label="Our story">
          <div className="hiw-inner">
            <div className="abt-story">
              <div>
                <p className="abt-label">Our Story</p>
                <h2 className="abt-story__title">Transforming Healthcare Together</h2>
                <p className="abt-story__lede">
                  MPB Health is a leading provider of alternative healthcare solutions, empowering
                  individuals and families to access affordable care through a supportive,
                  member-driven community.
                </p>
                <p className="abt-story__text">
                  Our innovative medical cost sharing model helps members save up to 50% on medical
                  expenses versus traditional insurance plans. Based in the United States, we
                  prioritize transparency, compassionate support, and comprehensive membership
                  options—so you can make informed healthcare decisions and enjoy true peace of
                  mind.
                </p>

                <ul className="abt-checklist">
                  {achievements.slice(0, 3).map((achievement) => (
                    <li key={achievement}>
                      <span className="abt-checklist__check">
                        <Check aria-hidden="true" />
                      </span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>

                <div className="abt-story__actions">
                  <a
                    href="https://outlook.office.com/book/SpeakWithaAdvisor@NETORG6712533.onmicrosoft.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="abt-btn abt-btn--primary"
                  >
                    Schedule a Consultation
                    <ArrowRight aria-hidden="true" />
                  </a>
                </div>
              </div>

              <img
                className="abt-story__img"
                src="/assets/team-photo.avif"
                alt="MPB Health Team"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </section>

        {/* ── Our mission ──────────────────────────────────────────── */}
        <section className="hiw-section" aria-label="Our mission">
          <div className="hiw-inner">
            <div className="abt-mission">
              <img
                className="abt-mission__img"
                src="/assets/mpbhealthteam.jpg"
                alt="MPB Health Team"
                loading="lazy"
                decoding="async"
              />
              <div>
                <p className="abt-label">Our Mission</p>
                <h2 className="abt-mission__title">
                  Together, We Share the Care That Empowers Healthier Lives
                </h2>
                <p className="abt-mission__text">
                  Our mission is to empower individuals to live healthier, happier lives through
                  innovative, comprehensive healthcare solutions—providing personalized support and
                  guidance so our members can make informed decisions and access the best care
                  possible.
                </p>

                <ul className="abt-mission__list">
                  {achievements.slice(3).map((achievement) => (
                    <li key={achievement}>
                      <span className="abt-checklist__check">
                        <Check aria-hidden="true" />
                      </span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Our values ───────────────────────────────────────────── */}
        <section className="hiw-section" aria-label="Our values">
          <div className="hiw-inner">
            <div className="hiw-section__header">
              <p className="abt-label">Our Values</p>
              <h2 className="hiw-title">What Drives Us Every Day</h2>
              <p className="hiw-body">
                Our core values guide everything we do, from how we serve our members to how we
                build our community
              </p>
            </div>

            <div className="abt-values-grid">
              {coreValues.map((value) => (
                <div key={value.title} className="abt-value-card">
                  <div className={`abt-value-card__icon ${value.iconClass}`}>
                    <value.icon aria-hidden="true" />
                  </div>
                  <h3 className="abt-value-card__title">{value.title}</h3>
                  <p className="abt-value-card__text">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section className="hiw-section" aria-label="Frequently asked questions">
          <div className="hiw-inner">
            <div className="hiw-section__header">
              <p className="abt-label">FAQ</p>
              <h2 className="hiw-title">Frequently Asked Questions</h2>
              <p className="hiw-body">
                Get answers to common questions about our healthcare solutions
              </p>
            </div>

            <div className="abt-faq-list">
              {faqs.map((faq, index) => (
                <div key={faq.question} className="abt-faq">
                  <button type="button" onClick={() => toggleFaq(index)} className="abt-faq__btn">
                    <h3 className="abt-faq__q">{faq.question}</h3>
                    {openFaqIndex === index ? (
                      <ChevronUp className="abt-faq__chevron" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="abt-faq__chevron" aria-hidden="true" />
                    )}
                  </button>
                  {openFaqIndex === index && (
                    <div className="abt-faq__body">
                      {faq.answer.split('\n\n').map((paragraph, pIndex) => (
                        <p key={pIndex}>{paragraph}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────── */}
        <section className="abt-cta" aria-label="Get started">
          <div className="abt-cta__card">
            <p className="abt-label">Get Started</p>
            <h2 className="abt-cta__title">Ready to Experience Better Healthcare?</h2>
            <p className="abt-cta__text">
              Join thousands of members who are saving on healthcare while getting the care they
              need. Let's talk about your options.
            </p>
            <div className="abt-cta__actions">
              <a
                href="https://outlook.office.com/book/SpeakWithaAdvisor@NETORG6712533.onmicrosoft.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="abt-btn abt-btn--primary"
              >
                Schedule a Call
                <ArrowRight aria-hidden="true" />
              </a>
              <a href="/plans" className="abt-btn abt-btn--ghost">
                View Memberships
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer (same as landing page) ────────────────────────── */}
        <LandingFooter />
      </div>
    </>
  );
};

export { AboutUs };
export default AboutUs;
