// =============================================
// MPB — Hero, Radial Benefits, and Advisors MVP
// Stack: Vite + React + Tailwind (no backend needed for MVP)
// Files included in this snippet:
// 1) src/components/Hero.tsx
// 2) src/components/RadialBenefits.tsx
// 3) src/pages/Advisors.tsx
// 4) src/data/types.ts (shared types)
// 5) public/data/advisors.json (sample)
// 6) scripts/csv-to-json.mjs (optional helper script)
// 7) Example routing changes for src/App.tsx
// 8) Minimal netlify.toml (optional)
// =============================================

// 1) src/components/Hero.tsx
// -------------------------------------------------
import React from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 items-center">
          {/* Copy */}
          <div className="lg:col-span-7">
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900">
              Affordable, Transparent Health Sharing
            </h1>
            <p className="mt-4 max-w-2xl text-base md:text-lg text-gray-600">
              Save 30–60% vs. traditional insurance with community‑powered care and clear monthly costs.
            </p>

            {/* Primary CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#quote"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm md:text-base font-medium bg-blue-600 text-white shadow hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Get My Quote
              </a>
              <a
                href="#plans"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm md:text-base font-medium bg-white text-gray-900 shadow ring-1 ring-gray-200 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Compare Plans
              </a>
              <Link
                to="/advisors"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm md:text-base font-medium text-blue-700 hover:text-blue-800"
              >
                Find a Local Advisor →
              </Link>
            </div>

            {/* Micro-trust row */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
              <span>Talk to an advisor: <a className="font-medium text-gray-900" href="tel:+18005551234">(800) 555‑1234</a></span>
              <span className="hidden md:inline">•</span>
              <span>Mon–Fri 9am–5pm ET</span>
            </div>
          </div>

          {/* Optional art / safe decorative area */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 to-white p-6 md:p-10 ring-1 ring-gray-100 shadow-sm">
              <div className="text-sm text-gray-500">Estimate Your Share</div>
              <form className="mt-4 grid grid-cols-1 gap-3">
                <label className="text-sm text-gray-700">Household Size</label>
                <select className="rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500">
                  <option>1</option><option>2</option><option>3</option><option>4+</option>
                </select>
                <label className="text-sm text-gray-700">Primary State</label>
                <input className="rounded-xl border-gray-200 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., FL" />
                <button type="button" className="mt-2 inline-flex items-center justify-center rounded-xl px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500">
                  Get Estimate
                </button>
              </form>
              <p className="mt-3 text-xs text-gray-500">This is a quick estimate. See plan details for specifics.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 2) src/components/RadialBenefits.tsx
// -------------------------------------------------
import React from "react";

type Benefit = {
  title: string;
  blurb: string;
};

const benefits: Benefit[] = [
  { title: "Save 30–60%", blurb: "Families often pay far less than traditional insurance." },
  { title: "Real Community", blurb: "Bills are shared by a nationwide member community." },
  { title: "Any Provider", blurb: "No networks. See any licensed doctor, anywhere." },
  { title: "Transparent Pricing", blurb: "Clear monthly amounts. No surprise bills." },
  { title: "Worldwide Sharing", blurb: "Support that travels with you globally." },
  { title: "Maternity Sharing", blurb: "From prenatal to delivery, robust options." },
];

export function RadialBenefits() {
  return (
    <section aria-labelledby="benefits-title" className="relative py-16 md:py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.06),transparent_60%)]"/>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="benefits-title" className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900">
            Why Families Choose Health Sharing
          </h2>
          <p className="mt-3 text-gray-600">
            Smarter, community‑powered healthcare for predictable costs.
          </p>
          <a
            href="#how-it-works"
            className="mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium bg-white text-gray-900 shadow ring-1 ring-gray-200 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            See how it works
          </a>
        </div>

        {/* Radial layout */}
        <div className="relative mt-12 grid place-items-center">
          {/* Center hub */}
          <div className="relative z-10 rounded-full bg-white/70 backdrop-blur p-6 md:p-8 shadow-lg ring-1 ring-white/40 text-center">
            <div className="text-sm text-gray-500">Member‑first benefits</div>
            <div className="mt-1 text-lg font-medium text-gray-900">Six pillars</div>
          </div>

          {/* Spokes */}
          <ul className="pointer-events-none relative size-[28rem] md:size-[36rem]" aria-label="Benefits">
            {benefits.map((b, i) => {
              const angles = [0, 60, 120, 180, 240, 300];
              const angle = angles[i % angles.length];
              const r = 210; // radius in px, adjusted by container size via CSS
              const rad = (angle * Math.PI) / 180;
              const x = 50 + (r * Math.cos(rad)) / ( (window?.innerWidth || 1200) > 768 ? 10 : 12 );
              const y = 50 + (r * Math.sin(rad)) / ( (window?.innerWidth || 1200) > 768 ? 10 : 12 );
              return (
                <li
                  key={b.title}
                  className="pointer-events-auto absolute w-56 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/65 backdrop-blur p-4 shadow-md ring-1 ring-white/30"
                  style={{ left: `${x}%`, top: `${y}%` }}
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

// 3) src/pages/Advisors.tsx
// -------------------------------------------------
import React, { useEffect, useMemo, useState } from "react";
import type { Advisor } from "../data/types";

function groupByState(list: Advisor[]) {
  const map = new Map<string, Advisor[]>();
  list.forEach((a) => {
    const key = (a.state || "").toUpperCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  });
  return Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b));
}

export default function Advisors() {
  const [all, setAll] = useState<Advisor[]>([]);
  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("");

  useEffect(() => {
    fetch("/data/advisors.json", { cache: "no-cache" })
      .then((r) => r.json())
      .then((data: Advisor[]) => setAll(data || []))
      .catch(() => setAll([]));
  }, []);

  const states = useMemo(() => {
    const s = new Set<string>();
    all.forEach((a) => a.state && s.add(a.state.toUpperCase()));
    return Array.from(s).sort();
  }, [all]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return all.filter((a) => {
      const matchesQ = !ql || [a.display_name, a.city, a.state]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(ql));
      const matchesState = !stateFilter || (a.state || "").toUpperCase() === stateFilter;
      return matchesQ && matchesState;
    });
  }, [all, q, stateFilter]);

  const grouped = useMemo(() => groupByState(filtered), [filtered]);

  return (
    <section aria-labelledby="advisors-title" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 id="advisors-title" className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900">
              Find an Advisor by State
            </h1>
            <p className="mt-2 text-gray-600">Search by name or city, then open the advisor’s page.</p>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or city"
            className="w-full md:w-1/2 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Search advisors"
          />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-full md:w-64 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Filter by state"
          >
            <option value="">All States</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        <div className="mt-10 space-y-10">
          {grouped.length === 0 && (
            <p className="text-gray-600">No advisors found. Try a different search.</p>
          )}
          {grouped.map(([state, advisors]) => (
            <section key={state} aria-labelledby={`state-${state}`}>
              <h2 id={`state-${state}`} className="sticky top-16 z-10 bg-white/80 backdrop-blur px-2 py-2 text-lg font-semibold text-gray-900">
                {state}
              </h2>
              <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm">
                {advisors.map((a) => (
                  <li key={a.advisor_id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 px-4 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{a.display_name}</div>
                      <div className="text-sm text-gray-600">{a.city}{a.city && a.state ? ", " : ""}{a.state}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.phone && (
                        <a href={`tel:${a.phone}`} className="rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50">
                          Call
                        </a>
                      )}
                      {a.email && (
                        <a href={`mailto:${a.email}`} className="rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50">
                          Email
                        </a>
                      )}
                      {a.landing_url && (
                        <a
                          href={a.landing_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                        >
                          View Advisor Page
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

// 4) src/data/types.ts
// -------------------------------------------------
export type Advisor = {
  advisor_id: string;
  display_name: string;
  city?: string;
  state?: string;
  landing_url?: string;
  photo_url?: string;
  phone?: string;
  email?: string;
};

// 5) public/data/advisors.json (sample)
// -------------------------------------------------
// Place this file at public/data/advisors.json
// [
//   { "advisor_id": "a1", "display_name": "Wendy Thompson", "city": "Boca Raton", "state": "FL", "landing_url": "https://joinmympb.com/wendy", "phone": "18005551234", "email": "wendy@example.com" },
//   { "advisor_id": "a2", "display_name": "Carlos Rivera", "city": "Miami", "state": "FL", "landing_url": "https://joinmympb.com/carlos" },
//   { "advisor_id": "a3", "display_name": "Julia Park", "city": "Austin", "state": "TX", "landing_url": "https://joinmympb.com/julia" }
// ]

// 6) scripts/csv-to-json.mjs (optional)
// -------------------------------------------------
// Usage: node scripts/csv-to-json.mjs advisors.csv public/data/advisors.json
// Converts CSV with headers: advisor_id,display_name,city,state,landing_url,photo_url,phone,email
import fs from "node:fs";
import { parse } from "csv-parse/sync";

if (process.argv.length < 4) {
  console.error("Usage: node scripts/csv-to-json.mjs <in.csv> <out.json>");
  process.exit(1);
}

const [ , , inPath, outPath ] = process.argv;
const csv = fs.readFileSync(inPath, "utf8");
const rows = parse(csv, { columns: true, skip_empty_lines: true });
fs.mkdirSync(require("node:path").dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(rows, null, 2));
console.log(`Wrote ${rows.length} advisors → ${outPath}`);

// 7) Example routing (src/App.tsx)
// -------------------------------------------------
// Add routes for the new components. Assumes React Router.
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Hero from "./components/Hero";
import { RadialBenefits } from "./components/RadialBenefits";
import Advisors from "./pages/Advisors";

export default function App() {
  return (
    <BrowserRouter>
      <main className="min-h-screen">
        {/* Home */}
        <Routes>
          <Route
            path="/"
            element={(
              <>
                <Hero />
                <div id="plans" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                  {/* Plan cards / calculator section */}
                </div>
                <RadialBenefits />
              </>
            )}
          />

          {/* Advisors Directory */}
          <Route path="/advisors" element={<Advisors />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

// 8) Minimal netlify.toml (optional but recommended)
// -------------------------------------------------
/*
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/advisors"
  to = "/index.html"
  status = 200

# Add more SPA routes if needed
*/


// =============================================
// NEXT SET — Plan Cards, How‑It‑Works, FAQ+Schema, Compliance, Sticky Header
// Files added in this block:
// 9) src/components/PlanCards.tsx
// 10) src/components/HowItWorks.tsx
// 11) src/components/FAQ.tsx
// 12) src/components/ComplianceNote.tsx
// 13) src/components/StickyHeader.tsx
// 14) App wiring example (augment previous routes)
// =============================================

// 9) src/components/PlanCards.tsx
// -------------------------------------------------
import React from "react";

type Plan = {
  id: string;
  name: string;
  priceFrom: string; // display only e.g. "$159/mo"
  bullets: string[];
  href: string; // plan details route or external URL
};

const plans: Plan[] = [
  {
    id: "essentials",
    name: "Essentials",
    priceFrom: "$50/mo",
    bullets: ["Low monthly share", "Everyday care coverage", "Great for individuals"],
    href: "/plans/essentials"
  },
  {
    id: "direct",
    name: "Direct",
    priceFrom: "$201/mo",
    bullets: ["Freedom to choose providers", "Predictable costs", "Popular for families"],
    href: "/plans/direct"
  },
  {
    id: "careplus",
    name: "Care+",
    priceFrom: "$166/mo",
    bullets: ["Enhanced sharing options", "Preventive & urgent care", "Balanced value"],
    href: "/plans/care-plus"
  },
  ];

export default function PlanCards() {
  return (
    <section id="plans" aria-labelledby="plans-title" className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 id="plans-title" className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900">Plans at a Glance</h2>
            <p className="mt-2 text-gray-600">Choose the option that fits your needs. See details before you enroll.</p>
          </div>
          <a href="/compare" className="hidden md:inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50">Compare plans →</a>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <li key={p.id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
                <div className="text-sm text-gray-700">From <span className="font-medium">{p.priceFrom}</span></div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {p.bullets.map((b) => (<li key={b} className="flex gap-2"><span aria-hidden>•</span><span>{b}</span></li>))}
              </ul>
              <a href={p.href} className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">See plan details</a>
            </li>
          ))}
        </ul>

        <div className="mt-4 md:hidden">
          <a href="/compare" className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50">Compare plans →</a>
        </div>

        {/* 2026 rates notice widget */}
        <div className="mt-6 rounded-xl bg-blue-50/60 p-4 text-sm text-blue-900 ring-1 ring-blue-100">
          <strong>Important:</strong> Effective start dates on or after January 1, 2026 may reflect updated rates. See the official price sheets: {" "}
          <a className="underline" href="https://mpb.health/wp-content/uploads/2025/10/2026-prices-Care-Direct-Secure-HSA.pdf" target="_blank" rel="noopener noreferrer">Care / Direct / Secure HSA</a>.
        </div>
      </div>
    </section>
  );
}

// 10) src/components/HowItWorks.tsx (Split‑Screen)
// -------------------------------------------------
import React, { useState } from "react";

type Step = { id: number; title: string; blurb: string; detail: string; cta?: { label: string; href: string } };

const steps: Step[] = [
  { id: 1, title: "Get your estimate", blurb: "Answer a few questions.", detail: "Start with a quick estimate of your monthly share based on household and state.", cta: { label: "Get My Quote", href: "#quote" } },
  { id: 2, title: "Choose your plan", blurb: "Pick the right tier.", detail: "Compare Essentials, Direct, Care+, and Secure HSA with clear benefits and costs." },
  { id: 3, title: "Enroll online", blurb: "Simple and secure.", detail: "Complete your membership application with secure e‑sign and quick confirmation." },
  { id: 4, title: "Use any provider", blurb: "No networks.", detail: "Visit any licensed provider in the U.S. and submit eligible bills for sharing." }
];

export default function HowItWorks() {
  const [active, setActive] = useState<number>(1);
  return (
    <section id="how-it-works" aria-labelledby="hiw-title" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-12">
        {/* Left rail */}
        <div className="lg:col-span-4 xl:col-span-3">
          <h2 id="hiw-title" className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900">How it works</h2>
          <ol className="relative mt-6 space-y-4 before:absolute before:left-[10px] before:top-0 before:h-full before:w-px before:bg-gradient-to-b from-gray-200 to-gray-300">
            {steps.map((s) => (
              <li key={s.id} className="relative pl-10">
                <button
                  onClick={() => setActive(s.id)}
                  className={`group text-left inline-flex w-full items-start gap-3 rounded-xl px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 ${active===s.id? 'bg-blue-50/70' : ''}`}
                  aria-current={active===s.id}
                >
                  <span className={`mt-1 inline-flex size-5 items-center justify-center rounded-full ring-2 ${active===s.id? 'bg-blue-600 ring-blue-600 text-white' : 'bg-white ring-gray-300 text-gray-700'}`}>{s.id}</span>
                  <div>
                    <div className="font-medium text-gray-900">{s.title}</div>
                    <div className="text-sm text-gray-600">{s.blurb}</div>
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-8 xl:col-span-9">
          {steps.map((s) => (
            <div key={s.id} role="tabpanel" aria-labelledby={`step-${s.id}`} hidden={active!==s.id}
                 className="rounded-2xl bg-white/70 backdrop-blur p-6 md:p-8 shadow-lg ring-1 ring-white/40">
              <div className="text-sm uppercase tracking-wide text-gray-500">Step {s.id}</div>
              <h3 id={`step-${s.id}`} className="mt-1 text-xl md:text-2xl font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-3 text-gray-700">{s.detail}</p>
              <div className="mt-6 flex gap-3">
                {s.cta && (
                  <a href={s.cta.href} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">{s.cta.label}</a>
                )}
                <a href="#plans" className="rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50">Compare plans</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 11) src/components/FAQ.tsx (with JSON‑LD)
// -------------------------------------------------
import React from "react";

const faqs = [
  { q: "Is this insurance?", a: "No. MPB Health facilitates access to qualified health sharing programs. Members share eligible medical expenses according to program guidelines." },
  { q: "Can I see any doctor?", a: "Yes. There are no network restrictions—see any licensed provider in the U.S." },
  { q: "How are costs so much lower?", a: "Members contribute a predictable monthly amount. There are no insurer overheads or network pricing—program guidelines govern eligibility and sharing." },
  { q: "What about maternity?", a: "Maternity sharing options are available. Review the specific program guidelines for waiting periods and inclusions." },
  { q: "Am I covered when traveling?", a: "Worldwide sharing options are available; see guidelines for details on eligible services while abroad." },
  { q: "What’s an IUA?", a: "An Initial Unshareable Amount (IUA) is the amount a member is responsible for per need before the community shares the rest, based on the chosen program tier." }
];

function jsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a }
    }))
  };
  return { __html: JSON.stringify(schema) };
}

export default function FAQ() {
  return (
    <section aria-labelledby="faq-title" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="faq-title" className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900">Frequently asked questions</h2>
        <dl className="mt-8 grid gap-4 md:grid-cols-2">
          {faqs.map((item) => (
            <div key={item.q} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <dt className="font-medium text-gray-900">{item.q}</dt>
              <dd className="mt-2 text-gray-700">{item.a}</dd>
            </div>
          ))}
        </dl>
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd()} />
      </div>
    </section>
  );
}

// 12) src/components/ComplianceNote.tsx
// -------------------------------------------------
import React from "react";

export default function ComplianceNote() {
  return (
    <section aria-labelledby="compliance-title" className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-700 ring-1 ring-gray-200">
          <h2 id="compliance-title" className="sr-only">Compliance and disclosures</h2>
          MPB Health provides access to qualified Health Sharing Programs. Health sharing is not insurance and does not guarantee payment of medical expenses. Program eligibility, waiting periods, and sharing limits apply. Always review the official guidelines and price sheets before enrolling.
          <div className="mt-2">
            <a className="underline" href="https://mpb.health/wp-content/uploads/2025/10/2026-prices-Care-Direct-Secure-HSA.pdf" target="_blank" rel="noopener noreferrer">Official price sheets</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// 13) src/components/StickyHeader.tsx
// -------------------------------------------------
import React, { useEffect, useState } from "react";

export default function StickyHeader() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-gray-900">Affordable, Transparent Health Sharing</div>
        <div className="flex items-center gap-2">
          <a href="#quote" className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Get My Quote</a>
          <a href="/advisors" className="rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50">Find an Advisor</a>
        </div>
      </div>
    </div>
  );
}

// 14) App wiring example (augment previous)
// -------------------------------------------------
// In src/App.tsx (from the earlier snippet), import and place the new components:
import PlanCards from "./components/PlanCards";
import HowItWorks from "./components/HowItWorks";
import FAQ from "./components/FAQ";
import ComplianceNote from "./components/ComplianceNote";
import StickyHeader from "./components/StickyHeader";

// Then in the home route element:
{/* <StickyHeader /> */}
{/* <Hero /> */}
{/* <PlanCards /> */}
{/* <RadialBenefits /> */}
{/* <HowItWorks /> */}
{/* <FAQ /> */}
{/* <ComplianceNote /> */}
