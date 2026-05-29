import React, { Suspense, type ComponentType } from 'react';
import { ManagedPage } from '../components/ManagedPage';

type LazyFactory = () => Promise<{ default: ComponentType<any> }>;

const lazyPage = (factory: LazyFactory) => React.lazy(factory);

const SITE_PAGE_COMPONENTS: Record<string, React.LazyExoticComponent<ComponentType<any>>> = {
  '/': lazyPage(() => import('../pages/Landing')),
  '/mvp': lazyPage(() => import('../pages/LandingMVP')),
  '/plans': lazyPage(() => import('../pages/Plans')),
  '/compare-plans': lazyPage(() => import('../pages/PlanComparison')),
  '/enrollment': lazyPage(() => import('../pages/Enrollment')),
  '/get-started': lazyPage(() => import('../pages/GetStarted')),
  '/get-a-quote': lazyPage(() => import('../pages/GetAQuote')),
  '/individuals-and-families': lazyPage(() => import('../pages/IndividualsAndFamilies')),
  '/businesses-and-organizations': lazyPage(() => import('../pages/BusinessesOrganizations')),
  '/advisors-and-brokers': lazyPage(() => import('../pages/AdvisorsAndBrokers')),
  '/how-it-works': lazyPage(() => import('../pages/HowItWorks')),
  '/faq': lazyPage(() => import('../pages/FAQ')),
  '/support': lazyPage(() => import('../pages/Support')),
  '/join-our-team': lazyPage(() => import('../pages/JoinOurTeam')),
  '/download-app': lazyPage(() => import('../pages/DownloadApp')),
  '/welcome': lazyPage(() => import('../pages/Welcome')),
  '/advisor-directory': lazyPage(() => import('../pages/AdvisorDirectory')),
  '/member-stories': lazyPage(() => import('../pages/MemberStories')),
  '/podcast': lazyPage(() => import('../pages/HealthyCarePodcast')),
  '/about-us': lazyPage(() => import('../pages/AboutUs')),
  '/contact': lazyPage(() => import('../pages/Contact')),
  '/privacy-policy': lazyPage(() => import('../pages/PrivacyPolicy')),
  '/terms-and-conditions': lazyPage(() => import('../pages/TermsAndConditions')),
  '/state-notices': lazyPage(() => import('../pages/StateNotices')),
  '/washington-statement': lazyPage(() => import('../pages/WashingtonStatement')),
  '/education-enrollment': lazyPage(() => import('../pages/EducationEnrollment')),
  '/care-support-hub': lazyPage(() => import('../pages/CareSupportHub')),
  '/insights-analytics': lazyPage(() => import('../pages/InsightsAnalytics')),
  '/resources': lazyPage(() => import('../pages/ResourceLibrary')),
  '/features': lazyPage(() => import('../pages/Features')),
  '/blog': lazyPage(() => import('../pages/Blog')),
  '/events': lazyPage(() => import('../pages/Events')),
};

export const MANAGED_SITE_PATHS = Object.keys(SITE_PAGE_COMPONENTS);

const PageSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
  </div>
);

export function ManagedSitePage({ path }: { path: string }) {
  const LazyFallback = SITE_PAGE_COMPONENTS[path];
  if (!LazyFallback) return null;
  return (
    <Suspense fallback={<PageSpinner />}>
      <ManagedPage path={path} fallback={<LazyFallback />} />
    </Suspense>
  );
}
