import React, { useMemo } from 'react';
import type { FAQItem } from '../../types/advisors';
import { typography } from '../../lib/typography';
import { generateFAQSchema } from '../../lib/schemaUtils';

const faqs: FAQItem[] = [
  {
    q: 'Is this insurance?',
    a: 'No. MPB Health facilitates access to qualified health sharing programs. Members share eligible medical expenses according to program guidelines.',
  },
  {
    q: 'Can I see any doctor?',
    a: 'Yes. There are no network restrictions—see any licensed provider in the U.S.',
  },
  {
    q: 'How are costs so much lower?',
    a: 'Members contribute a predictable monthly amount. There are no insurer overheads or network pricing—program guidelines govern eligibility and sharing.',
  },
  {
    q: 'What about maternity?',
    a: 'Maternity sharing options are available. Review the specific program guidelines for waiting periods and inclusions.',
  },
  {
    q: 'Am I covered when traveling?',
    a: 'Worldwide sharing options are available; see guidelines for details on eligible services while abroad.',
  },
  {
    q: "What's an IUA?",
    a: 'An Initial Unshareable Amount (IUA) is the amount a member is responsible for per need before the community shares the rest, based on the chosen program tier.',
  },
];

export function FAQMVPSection() {
  const schemaJson = useMemo(() => {
    const faqItems = faqs.map(({ q, a }) => ({
      question: q,
      answer: a,
    }));
    return generateFAQSchema(faqItems);
  }, []);

  return (
    <section aria-labelledby="faq-title" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="faq-title" className={`${typography.headings.h2.section} text-gray-900`}>
          Frequently asked questions
        </h2>
        <dl className="mt-8 grid gap-4 md:grid-cols-2">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <dt className="font-medium text-gray-900">{item.q}</dt>
              <dd className="mt-2 text-gray-700">{item.a}</dd>
            </div>
          ))}
        </dl>
        {schemaJson && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: schemaJson }}
          />
        )}
      </div>
    </section>
  );
}
