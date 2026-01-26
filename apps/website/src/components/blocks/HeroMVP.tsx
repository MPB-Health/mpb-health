import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { typography } from '../../lib/typography';
import { trackAndNavigateToQuote } from '../../lib/leadRoutingTracker';

export function HeroMVP() {
  return (
    <>
      <section className="relative overflow-hidden py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 items-center">
          <div className="lg:col-span-7">
            <h1 className={`${typography.headings.h1.hero} text-gray-900`}>
              HealthShare Memberships Built for You
            </h1>
            <p className={`mt-4 max-w-2xl ${typography.body.default} text-gray-600`}>
              Save 30–60% vs. traditional insurance with community‑powered care and clear monthly costs.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={() => trackAndNavigateToQuote({
                  ctaType: 'get_quote',
                  ctaText: 'Get My Quote',
                  ctaLocation: 'hero_mvp_primary'
                })}
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm md:text-base font-medium bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-300"
              >
                Get My Quote
              </button>
              <a
                href="#plans"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm md:text-base font-medium bg-white text-gray-900 shadow ring-1 ring-gray-200 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
              >
                Compare Plans
              </a>
              <Link
                to="/advisors"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm md:text-base font-medium text-blue-700 hover:text-blue-800 transition-colors"
              >
                Find a Local Agent →
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
              <span>
                Talk to an agent:{' '}
                <a className="font-medium text-gray-900" href="tel:+18005551234">
                  (800) 555‑1234
                </a>
              </span>
              <span className="hidden md:inline">•</span>
              <span>Mon–Fri 9am–5pm ET</span>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-900">4.9/5</span>
              <span className="text-sm text-gray-600">from 12,000+ families</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 to-white p-6 md:p-10 ring-1 ring-gray-100 shadow-sm">
              <div className="text-sm text-gray-500">Estimate Your Share</div>
              <form className="mt-4 grid grid-cols-1 gap-3">
                <label className="text-sm text-gray-700">Household Size</label>
                <select className="rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500">
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4+</option>
                </select>
                <label className="text-sm text-gray-700">Primary State</label>
                <input
                  className="rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., FL"
                />
                <button
                  type="button"
                  onClick={() => trackAndNavigateToQuote({
                    ctaType: 'calculator_result',
                    ctaText: 'Get Estimate',
                    ctaLocation: 'hero_mvp_calculator'
                  })}
                  className="mt-2 inline-flex items-center justify-center rounded-xl px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-300"
                >
                  Get Estimate
                </button>
              </form>
              <p className="mt-3 text-xs text-gray-500">
                This is a quick estimate. See plan details for specifics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
