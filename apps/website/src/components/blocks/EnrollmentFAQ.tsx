import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/Accordion';

export function EnrollmentFAQ() {
  const faqs = [
    {
      question: 'Is MPB Health insurance?',
      answer: 'No, MPB Health is not insurance. We are a medical cost sharing community where members share eligible healthcare costs. This model has been used successfully for decades and offers an alternative to traditional health insurance.',
    },
    {
      question: 'How are rates set?',
      answer: 'Your monthly share is based on three factors: (1) Your Age Band (18-29, 30-49, or 50-64), (2) Your chosen IUA ($1,250, $2,500, or $5,000), and (3) A $50 monthly surcharge if any household member uses tobacco or vapes. This transparent structure ensures fair pricing based on your specific situation.',
    },
    {
      question: 'When do 2026 rates apply?',
      answer: '2026 rates apply to any coverage with a start date on or after January 1, 2026. If your coverage begins before January 1, 2026, current rates will apply. Always refer to the official price sheet to confirm your rate based on your Age Band and IUA.',
    },
    {
      question: 'What memberships are available?',
      answer: 'We offer three memberships: (1) Care+ includes comprehensive sharing with bundled direct primary care, (2) Direct offers cost sharing with optional DPC add-on, and (3) Essentials provides virtual care access and basic protection. All memberships include transparent pricing and no hidden fees.',
    },
    {
      question: 'Do you serve my area?',
      answer: 'MPB Health serves members across the United States. Our medical cost sharing model works nationwide, and our direct primary care network is expanding continuously. Contact us to confirm availability in your specific location.',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Get quick answers to common questions about MPB Health
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-gray-200 rounded-lg px-6"
            >
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-blue-600">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
