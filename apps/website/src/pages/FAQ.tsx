import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SEOHead } from '../components/SEOHead';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/Accordion';
import { Button } from '../components/ui/button';
import { Phone } from 'lucide-react';
import { sanitizeHtml } from '@mpbhealth/utils';
import { useFAQ } from '../hooks/useFAQ';
import { generateFAQSchema, faqPagePaaQuestions } from '../lib/schemaMarkup';

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

      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-16">
            <h1 className="text-display-lg font-bold text-neutral-900 mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Get clear answers to common questions about health sharing and membership.
              Still have questions? Our team is here to help.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sm:p-8 mb-12">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : hasDatabaseFAQs ? (
              <Accordion type="single">
                {faqItems.map((item) => (
                  <AccordionItem key={item.id} value={`faq-${item.id}`}>
                    <AccordionTrigger>
                      <span className="text-left font-semibold text-neutral-900 text-lg">
                        {item.title}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div
                        className="text-neutral-700 leading-relaxed text-base prose prose-neutral max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content_html) }}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <Accordion type="single">
                {FALLBACK_FAQS.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger>
                      <span className="text-left font-semibold text-neutral-900 text-lg">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {faq.answer.split('\n\n').map((paragraph, pIndex) => (
                        <p
                          key={pIndex}
                          className="text-neutral-700 leading-relaxed text-base mb-4 last:mb-0"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Still Have Questions?
            </h2>
            <p className="text-neutral-700 mb-8 max-w-xl mx-auto">
              Our member specialists are ready to help you understand how health sharing
              can work for you and your family.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="tel:8558164650"
                className="flex items-center space-x-2 text-neutral-700 hover:text-primary transition-colors"
              >
                <Phone className="h-5 w-5" />
                <span className="font-medium">(855) 816-4650</span>
              </a>

              <span className="hidden sm:block text-neutral-400">|</span>

              <Link to="/get-started">
                <Button size="lg" trackingName="FAQ Get Quote" trackingLocation="faq-page">
                  Get Free Quote
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export { FAQ };
export default FAQ;
