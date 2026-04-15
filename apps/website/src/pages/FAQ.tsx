import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/Accordion';
import { Button } from '../components/ui/button';
import { Phone } from 'lucide-react';
import { sanitizeHtml } from '@mpbhealth/utils';
import { useFAQ } from '../hooks/useFAQ';

const FALLBACK_FAQS = [
  {
    question: "How is health sharing different from insurance?",
    answer: "Health sharing is a community-based approach where members share medical expenses, while insurance is a contract with a corporation. Health sharing typically offers more flexibility, no network restrictions, and significantly lower monthly costs. However, it's not insurance and doesn't guarantee payment of medical expenses."
  },
  {
    question: "What medical expenses can be shared?",
    answer: "Eligible medical expenses typically include hospital stays, surgeries, diagnostic tests, emergency room visits, and specialist consultations. Preventive care, maternity, virtual behavioral health, and prescription sharing vary by membership. Routine check-ups, pre-membership conditions (during waiting periods), and lifestyle-related issues may have different sharing guidelines."
  },
  {
    question: "Is there a waiting period for sharing?",
    answer: "We don't decline membership based on medical history. New medical needs are shareable right away, while pre-existing conditions may have a phase-in period. Certain managed conditions—like diabetes, high blood pressure, and high cholesterol—can be eligible from Day One if there's been no hospitalization in the past year. Pre-membership conditions have a 12-month waiting period before they become eligible for sharing. Accidents are eligible immediately."
  },
  {
    question: "Can I use any doctor or hospital?",
    answer: "Yes! Unlike traditional insurance, health sharing has no network restrictions for Medical Cost Sharing injury or illness. You can visit any licensed healthcare provider, specialist, or hospital in the United States. This freedom of choice is one of the key benefits of health sharing over traditional insurance plans. For preventative care services, there is a network of providers."
  },
  {
    question: "How do I submit medical expenses for sharing?",
    answer: "Submit expenses easily through our online member portal or mobile app. Upload your medical bills and supporting documentation. Our team reviews submissions according to sharing guidelines. Typical end-to-end processing time is about 60 days. Needs can be processed in as little as 2 weeks, however, times may vary."
  },
  {
    question: "Are prescription drugs shareable?",
    answer: "Prescription sharing varies by plan. All members receive prescription discounts through our partner network. Higher-tier memberships may include full prescription sharing for eligible medications. Contact our team for plan-specific details."
  },
  {
    question: "How are monthly sharing amounts determined?",
    answer: "Monthly sharing amounts are based on age, family size, and chosen membership level. Adults and children have different rates. Families receive discounts compared to individual memberships. Amounts are fixed and do not increase based on usage."
  },
  {
    question: "What is Direct Debit?",
    answer: "Direct debit is a secure, automatic way to pay your monthly share amount. On your draft date, your payment is taken from the bank account or card you have on file, so you don't have to make a manual payment each month. You can update your payment method through the member portal before your draft date."
  },
  {
    question: "Can someone else pay for my membership (third-party payor)?",
    answer: "Yes. A third party—such as an employer, family member, or sponsor—may pay your monthly share amount as long as they are the account holder on the payment method used. The member remains responsible for making sure payments are made on time. In some group or employer arrangements, additional authorization forms may be required; if needed, we will provide those during enrollment."
  }
];

const FAQ: React.FC = () => {
  const { faqItems, loading } = useFAQ();

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
                      <p className="text-neutral-700 leading-relaxed text-base">
                        {faq.answer}
                      </p>
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
