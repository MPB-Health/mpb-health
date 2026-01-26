import React from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../ui/Accordion';

const FAQAccordion: React.FC = () => {
  const faqs = [
    {
      question: "How is health sharing different from insurance?",
      answer: "Health sharing is a community-based approach where members share medical expenses, while insurance is a contract with a corporation. Health sharing typically offers more flexibility, no network restrictions, and significantly lower monthly costs. However, it's not insurance and doesn't guarantee payment of medical expenses."
    },
    {
      question: "What medical expenses can be shared?",
      answer: "Eligible medical expenses typically include hospital stays, surgeries, diagnostic tests, emergency room visits, and specialist consultations. Preventive care, maternity, virtual behavioral health, and prescription sharing vary by plan. Routine check-ups, pre-membership conditions (during waiting periods), and lifestyle-related issues may have different sharing guidelines."
    },
    {
      question: "Is there a waiting period for sharing?",
      answer: "Yes, most health sharing plans have waiting periods for certain conditions. Accidents and new illnesses are typically eligible immediately after your effective date. Pre-membership conditions usually have a 12-month waiting period. Maternity requests are ineligible for sharing during the first six months of membership. (If you are managing Diabetes, High Blood Pressure, or High Cholesterol and haven't been hospitalized for it in the last year, you are eligible for sharing related to these needs from Day One of your membership.)"
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

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-display-md font-bold text-neutral-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-neutral-600">
            Get clear answers to common questions about health sharing and membership.
          </p>
        </div>

        <div className="animate-slide-up">
          <Accordion type="single">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger>
                  <span className="text-left font-medium text-neutral-900">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-neutral-700 leading-relaxed">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-neutral-50 rounded-lg p-6">
            <p className="text-sm text-neutral-600 mb-4">
              Don't see your question answered?
            </p>
            <button className="text-primary font-medium hover:text-primary/80 transition-colors">
              Contact our member specialists →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export { FAQAccordion };