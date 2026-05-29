/**
 * Lightweight app shell for SSG pre-rendering.
 * Only renders marketing page content — no auth, analytics, or admin routes.
 * React hydrates over this with the full App component at runtime.
 *
 * NOTE: All imports must be synchronous (React.lazy doesn't work with renderToString).
 * This shell renders just the above-the-fold hero/content for each route.
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { EnhancedHero } from './components/blocks/EnhancedHero';
import { SolutionsSection } from './components/blocks/SolutionsSection';
import { MedicalCostSharingInfo } from './components/blocks/MedicalCostSharingInfo';

/**
 * Minimal landing page for SSG — above-the-fold content only.
 * The full page (with calculator, social proof, etc.) hydrates at runtime.
 */
const StaticLanding: React.FC = () => (
  <>
    <EnhancedHero />
    <SolutionsSection />
    <MedicalCostSharingInfo />
  </>
);

/**
 * Placeholder for other routes — renders a basic structural skeleton
 * that matches the page layout. React hydrates the real content.
 */
const PageSkeleton: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <section className="py-16 md:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-neutral-900 mb-4">{title}</h1>
      <p className="text-lg text-neutral-600 max-w-3xl">{description}</p>
    </div>
  </section>
);

export const StaticShell: React.FC = () => (
  <div className="min-h-screen flex flex-col">
    <main className="flex-1">
      <Routes>
        <Route path="/" element={<StaticLanding />} />
        <Route path="/plans" element={
          <PageSkeleton title="HealthShare Plans" description="Choose from Essential, Enhanced, or Comprehensive memberships tailored to your family's needs." />
        } />
        <Route path="/how-it-works" element={
          <PageSkeleton title="How HealthSharing Works" description="A simple, transparent process: share healthcare costs with a community that has your back." />
        } />
        <Route path="/individuals-and-families" element={
          <PageSkeleton title="For Individuals & Families" description="Affordable health sharing memberships designed for your family's unique healthcare needs." />
        } />
        <Route path="/businesses-and-organizations" element={
          <PageSkeleton title="For Businesses & Organizations" description="Offer your team affordable healthcare alternatives with flexible group health sharing plans." />
        } />
        <Route path="/faq" element={
          <PageSkeleton title="Frequently Asked Questions" description="Get answers to common questions about health sharing, memberships, and how MPB Health works." />
        } />
        <Route path="/about-us" element={
          <PageSkeleton title="About MPB Health" description="Since 2011, MPB Health has been helping families access affordable healthcare through community-based sharing." />
        } />
        <Route path="/contact" element={
          <PageSkeleton title="Contact Us" description="Have questions? Our team is here to help. Reach out by phone, email, or our online form." />
        } />
        <Route path="/get-a-quote" element={
          <PageSkeleton title="Get Your Free Quote" description="See how much you could save with a personalized health sharing membership estimate." />
        } />
      </Routes>
    </main>
  </div>
);
