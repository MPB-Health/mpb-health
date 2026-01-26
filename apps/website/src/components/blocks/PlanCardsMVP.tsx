import React from 'react';
import type { Plan } from '../../types/advisors';
import { typography } from '../../lib/typography';

const plans: Plan[] = [
  {
    id: 'careplus',
    name: 'Care+',
    priceFrom: '$166/mo',
    bullets: ['Enhanced sharing options', 'Preventive & urgent care', 'Balanced value'],
    href: '/plans#care-plus',
  },
  {
    id: 'secure-hsa',
    name: 'Secure HSA',
    priceFrom: '$239/mo',
    bullets: ['Best for: Self Employed or 1099 Individuals', 'HSA-compatible', 'Tax advantages'],
    href: '/plans#secure-hsa',
  },
  {
    id: 'direct',
    name: 'Direct',
    priceFrom: '$201/mo',
    bullets: ['Large Medical Expense Protection', 'Freedom to choose providers', 'Popular for families'],
    href: '/plans#direct',
  },
];

export function PlanCardsMVP() {
  return (
    <section id="plans" aria-labelledby="plans-title" className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 id="plans-title" className={`${typography.headings.h2.section} text-gray-900`}>
              Find Your Perfect Match
            </h2>
            <p className="mt-2 text-gray-600">
              Compare our most popular memberships and discover which approach aligns with your healthcare needs and budget
            </p>
          </div>
          <a
            href="/plans"
            className="hidden md:inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50 transition-colors"
          >
            Compare plans →
          </a>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <li key={p.id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
                <div className="text-sm text-gray-700">
                  From <span className="font-medium">{p.priceFrom}</span>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {p.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span aria-hidden>•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <a
                href={p.href}
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                See plan details
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-4 md:hidden">
          <a
            href="/plans"
            className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50 transition-colors"
          >
            Compare plans →
          </a>
        </div>

        <div className="mt-6 rounded-xl bg-blue-50/60 p-4 text-sm text-blue-900 ring-1 ring-blue-100">
          <strong>Important:</strong> Effective start dates on or after January 1, 2026 may reflect
          updated rates. See the official price sheets:{' '}
          <a
            className="underline"
            href="https://mpb.health/wp-content/uploads/2025/10/2026-prices-Care-Direct-Secure-HSA.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Care / Direct
          </a>
          .
        </div>
      </div>
    </section>
  );
}
