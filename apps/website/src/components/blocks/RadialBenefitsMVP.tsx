import React from 'react';
import type { Benefit } from '../../types/advisors';

const benefits: Benefit[] = [
  { title: 'Save 30–60%', blurb: 'Families often pay far less than traditional insurance.' },
  { title: 'Real Community', blurb: 'Bills are shared by a nationwide member community.' },
  { title: 'Any Provider', blurb: 'No networks. See any licensed doctor, anywhere.' },
  { title: 'Transparent Pricing', blurb: 'Clear monthly amounts. No surprise bills.' },
  { title: 'Worldwide Sharing', blurb: 'Support that travels with you globally.' },
  { title: 'Maternity Sharing', blurb: 'From prenatal to delivery, robust options.' },
];

export function RadialBenefitsMVP() {
  return (
    <section aria-labelledby="benefits-title" className="relative py-16 md:py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.06),transparent_60%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="benefits-title"
            className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900"
          >
            Why Families Choose Health Sharing
          </h2>
          <p className="mt-3 text-gray-600">
            Smarter, community‑powered healthcare for predictable costs.
          </p>
          <a
            href="#how-it-works"
            className="mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium bg-white text-gray-900 shadow ring-1 ring-gray-200 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
          >
            See how it works
          </a>
        </div>

        <div className="relative mt-12 grid place-items-center">
          <div className="relative z-10 rounded-full bg-white/70 backdrop-blur p-6 md:p-8 shadow-lg ring-1 ring-white/40 text-center">
            <div className="text-sm text-gray-500">Member‑first benefits</div>
            <div className="mt-1 text-lg font-medium text-gray-900">Six pillars</div>
          </div>

          <ul
            className="pointer-events-none absolute inset-0 flex items-center justify-center w-full h-[28rem] md:h-[36rem]"
            aria-label="Benefits"
          >
            {benefits.map((b, i) => {
              const angles = [0, 60, 120, 180, 240, 300];
              const angle = angles[i % angles.length];
              const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
              const radius = isMobile ? 140 : 180;
              const rad = (angle * Math.PI) / 180;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;

              return (
                <li
                  key={b.title}
                  className="pointer-events-auto absolute w-48 md:w-56 rounded-xl bg-white/65 backdrop-blur p-4 shadow-md ring-1 ring-white/30"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                >
                  <div className="text-sm font-semibold text-gray-900">{b.title}</div>
                  <p className="mt-1 text-sm text-gray-600">{b.blurb}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
