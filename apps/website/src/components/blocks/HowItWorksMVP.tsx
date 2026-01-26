import React, { useState } from 'react';
import type { HowItWorksStep } from '../../types/advisors';
import { typography } from '../../lib/typography';

const steps: HowItWorksStep[] = [
  {
    id: 1,
    title: 'Get your estimate',
    blurb: 'Answer a few questions.',
    detail:
      'Start with a quick estimate of your monthly share based on household and state.',
    cta: { label: 'Get My Quote', href: '#quote' },
  },
  {
    id: 2,
    title: 'Choose your membership',
    blurb: 'Pick the right tier.',
    detail:
      'Compare Essentials, Direct, Care+, and Secure HSA with clear benefits and costs.',
  },
  {
    id: 3,
    title: 'Enroll online',
    blurb: 'Simple and secure.',
    detail:
      'Complete your membership application with secure e‑sign and quick confirmation.',
  },
  {
    id: 4,
    title: 'Use any provider',
    blurb: 'No networks.',
    detail:
      'Visit any licensed provider in the U.S. and submit eligible bills for sharing.',
  },
];

export function HowItWorksMVP() {
  const [active, setActive] = useState<number>(1);

  return (
    <section id="how-it-works" aria-labelledby="hiw-title" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4 xl:col-span-3">
          <h2 id="hiw-title" className={`${typography.headings.h2.section} text-gray-900`}>
            How it works
          </h2>
          <ol className="relative mt-6 space-y-4 before:absolute before:left-[10px] before:top-0 before:h-full before:w-px before:bg-gradient-to-b from-gray-200 to-gray-300">
            {steps.map((s) => (
              <li key={s.id} className="relative pl-10">
                <button
                  onClick={() => setActive(s.id)}
                  className={`group text-left inline-flex w-full items-start gap-3 rounded-xl px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors ${
                    active === s.id ? 'bg-blue-50/70' : ''
                  }`}
                  aria-current={active === s.id}
                >
                  <span
                    className={`mt-1 inline-flex size-5 items-center justify-center rounded-full ring-2 text-xs transition-colors ${
                      active === s.id
                        ? 'bg-blue-600 ring-blue-600 text-white'
                        : 'bg-white ring-gray-300 text-gray-700'
                    }`}
                  >
                    {s.id}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{s.title}</div>
                    <div className="text-sm text-gray-600">{s.blurb}</div>
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:col-span-8 xl:col-span-9">
          {steps.map((s) => (
            <div
              key={s.id}
              role="tabpanel"
              aria-labelledby={`step-${s.id}`}
              hidden={active !== s.id}
              className="rounded-2xl bg-white/70 backdrop-blur p-6 md:p-8 shadow-lg ring-1 ring-white/40"
            >
              <div className="text-sm uppercase tracking-wide text-gray-500">Step {s.id}</div>
              <h3 id={`step-${s.id}`} className={`mt-1 ${typography.headings.h3.card} text-gray-900`}>
                {s.title}
              </h3>
              <p className="mt-3 text-gray-700">{s.detail}</p>
              <div className="mt-6 flex gap-3">
                {s.cta && (
                  <a
                    href={s.cta.href}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    {s.cta.label}
                  </a>
                )}
                <a
                  href="#plans"
                  className="rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Compare plans
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
