import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SEOHead } from '../components/SEOHead';
import { sanitizeHtml } from '@mpbhealth/utils';
import { useFAQ } from '../hooks/useFAQ';
import { generateFAQSchema, faqPagePaaQuestions } from '../lib/schemaMarkup';
import {
  AuroraBand,
  FaqList,
  LandingPage,
  PageHero,
  Reveal,
  SectionHead,
  Sheet,
} from '../components/landing-redesign/page-kit';

/** Aligned with About Us / marketing FAQ; also seeded as category `mpb-faq-main` in DB. */
const FALLBACK_FAQS = [
  {
    question: 'What is MPB Health?',
    answer:
      'MPB Health offers memberships that are alternatives to traditional health insurance. MPB Health is not insurance; rather, it is a community-focused organization dedicated to providing transparent, non-insurance alternatives for healthcare. We facilitate a medical cost-sharing model that empowers individuals, families, and businesses to break free from traditional network restrictions and high corporate overhead. By prioritizing people over profit, we provide innovative solutions that combine sharing, preventive care, and personalized support to help our members take back control of their healthcare journey.',
  },
  {
    question: 'Why do people choose MPB Health?',
    answer:
      'Members choose MPB Health for the greater flexibility of seeing any doctor, significantly lower monthly costs compared to traditional insurance, and access to a community-based model. Our members value a system that prioritizes transparency and shared responsibility over corporate profit margins.',
  },
  {
    question: 'How much do members typically save by joining MPB Health?',
    answer:
      'On average, our members see a 30–60% reduction in their monthly costs compared to traditional insurance premiums. Because we are a community-driven model without the high overhead of corporate insurance, those savings are passed directly back to our members.',
  },
  {
    question: 'How is MPB Health different from traditional insurance?',
    answer:
      'Traditional insurance is built around premiums, restrictive networks, and corporate risk pools. MPB Health is a community-based alternative where members contribute monthly to share in eligible medical needs based on clear guidelines rather than insurance contracts. This model offers lower monthly costs and the freedom to choose any provider without network limitations.',
  },
  {
    question: 'What makes MPB Health different from other healthshares?',
    answer:
      'While many healthshares require a religious "statement of faith," MPB Health is inclusive and open to everyone. We welcome members from all backgrounds, beliefs, and walks of life who share the common goal of taking personal responsibility for their health within a supportive community. Beyond our inclusivity, we differentiate ourselves by providing modern benefits such as $0 unlimited virtual care and behavioral health resources from day one, ensuring the community supports your daily wellness rather than just major medical events.',
  },
  {
    question: 'Is MPB Health a good fit for families?',
    answer:
      'Yes. Many families choose MPB Health because it offers total provider flexibility, allowing them to keep their trusted pediatricians and specialists. Families also benefit from significant monthly savings and immediate access to resources such as $0 unlimited virtual care and behavioral health, ensuring their everyday health needs are supported without the high costs of traditional insurance.',
  },
  {
    question: 'Who typically joins MPB Health?',
    answer:
      'MPB Health is an ideal fit for individuals, families, small business owners, and self-employed professionals who prioritize freedom and flexibility in their healthcare. Our members are typically looking for a more affordable, community-driven alternative to traditional insurance that allows them to take full control of their healthcare choices without being restricted by corporate networks.',
  },
  {
    question: 'Is MPB Health available nationwide?',
    answer:
      'Yes. MPB Health is available to members across most of the United States and Puerto Rico, providing individuals and families access to a nationwide, community-based healthcare model that travels with you.\n\nNote: Membership is currently unavailable to residents of Washington state.',
  },
  {
    question: 'Do I have to wait for an "Open Enrollment" period to join?',
    answer:
      'No. One of the greatest advantages of MPB Health is that you can join any time of the year. There are no restrictive enrollment windows, meaning you can take control of your healthcare and start your membership as early as the first of the next month.',
  },
  {
    question: 'Is maternity care eligible for sharing?',
    answer:
      "Yes. MPB Health supports growing families by sharing in eligible expenses related to prenatal care, delivery, and postnatal care. To be eligible for sharing, the pregnancy conception date must occur after at least six months of continuous membership. Once the Initial Unshareable Amount (IUA) is met for the pregnancy, the community shares in the remaining eligible costs for both the mother and the newborn's initial care.",
  },
];

/** Multi-paragraph fallback answers keep their breaks inside the native details skin. */
const FALLBACK_ITEMS = FALLBACK_FAQS.map(({ question, answer }) => {
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

const FAQ: React.FC = () => {
  const { faqItems, loading } = useFAQ();
  const paaFaqSchema = generateFAQSchema(faqPagePaaQuestions);

  const hasDatabaseFAQs = !loading && faqItems.length > 0;

  const structuredFaqs = hasDatabaseFAQs
    ? faqItems.map((item) => ({
        question: item.title,
        answer: item.content_html.replace(/<[^>]*>/g, ''),
      }))
    : FALLBACK_FAQS;

  const databaseItems = hasDatabaseFAQs
    ? faqItems.map((item) => ({
        question: item.title,
        answer: <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content_html) }} />,
      }))
    : [];

  return (
    <>
      <SEOHead
        pathname="/faq"
        structuredDataType="faq"
        structuredDataContent={{ questions: structuredFaqs }}
      />
      {/* PAA FAQ Schema — People Also Ask targeting */}
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(paaFaqSchema)}</script>
      </Helmet>

      <LandingPage>
        <PageHero
          ariaLabel="Help center"
          align="center"
          title="Questions, answered."
          lede="Straight answers about health sharing, memberships and what it's like to be a member."
          actions={
            <>
              <Link className="lr-btn lr-btn--white" to="/get-started">
                Get your quote
              </Link>
              <a className="lr-btn lr-btn--glass" href="tel:+18558164650">
                Call (855) 816-4650
              </a>
            </>
          }
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="Frequently asked questions">
            <div className="lr-inner">
              <div className="lr-faq__grid">
                <Reveal>
                  <h2 className="lr-faq__title">
                    Frequently asked
                    <br />
                    questions
                  </h2>
                  <p className="lr-body" style={{ marginTop: '1.2rem', maxWidth: '26rem' }}>
                    Clear answers about health sharing and membership. If yours isn't here, call us.
                  </p>
                </Reveal>
                <Reveal delay={0.1}>
                  {loading ? (
                    <p className="lr-body" role="status">
                      Loading…
                    </p>
                  ) : hasDatabaseFAQs ? (
                    <FaqList items={databaseItems} />
                  ) : (
                    <FaqList items={FALLBACK_ITEMS} />
                  )}
                </Reveal>
              </div>
            </div>
          </section>

          <section className="lr-sec lr-sec--soft" aria-label="Still have questions">
            <div className="lr-inner">
              <SectionHead
                title="Still have questions?"
                lede="Our member specialists are ready to help you understand"
                ledeMuted="how health sharing can work for you and your family."
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '0.8rem',
                    marginTop: '0.4rem',
                  }}
                >
                  <a className="lr-btn lr-btn--navy" href="tel:+18558164650">
                    Call (855) 816-4650
                  </a>
                  <Link className="lr-btn lr-btn--ghost" to="/contact">
                    Contact us
                  </Link>
                </div>
              </SectionHead>
            </div>
          </section>

          <AuroraBand
            title="Ready to see what you'd contribute?"
            lede="Compare every membership priced for your household in about 30 seconds."
            actions={
              <>
                <Link className="lr-btn lr-btn--white" to="/get-started">
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

export { FAQ };
export default FAQ;
