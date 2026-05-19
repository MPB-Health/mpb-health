import type { ComponentType } from 'react';
import Landing from '../pages/Landing';
import LandingMVP from '../pages/LandingMVP';
import Plans from '../pages/Plans';
import PlanComparison from '../pages/PlanComparison';
import Enrollment from '../pages/Enrollment';
import GetStarted from '../pages/GetStarted';
import GetAQuote from '../pages/GetAQuote';
import IndividualsAndFamilies from '../pages/IndividualsAndFamilies';
import BusinessesOrganizations from '../pages/BusinessesOrganizations';
import AdvisorsAndBrokers from '../pages/AdvisorsAndBrokers';
import HowItWorksPage from '../pages/HowItWorks';
import FAQ from '../pages/FAQ';
import Support from '../pages/Support';
import JoinOurTeam from '../pages/JoinOurTeam';
import DownloadApp from '../pages/DownloadApp';
import Welcome from '../pages/Welcome';
import AdvisorDirectory from '../pages/AdvisorDirectory';
import MemberStories from '../pages/MemberStories';
import HealthyCarePodcast from '../pages/HealthyCarePodcast';
import AboutUs from '../pages/AboutUs';
import Contact from '../pages/Contact';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsAndConditions from '../pages/TermsAndConditions';
import StateNotices from '../pages/StateNotices';
import WashingtonStatement from '../pages/WashingtonStatement';
import EducationEnrollment from '../pages/EducationEnrollment';
import CareSupportHub from '../pages/CareSupportHub';
import InsightsAnalytics from '../pages/InsightsAnalytics';
import ResourceLibrary from '../pages/ResourceLibrary';
import Benefits from '../pages/Benefits';
import Features from '../pages/Features';
import Blog from '../pages/Blog';
import Events from '../pages/Events';
import { ManagedPage } from '../components/ManagedPage';

/** Legacy React page for each marketing route; CMS publish overrides via ManagedPage. */
export const SITE_PAGE_FALLBACKS: Record<string, ComponentType> = {
  '/': Landing,
  '/mvp': LandingMVP,
  '/plans': Plans,
  '/compare-plans': PlanComparison,
  '/enrollment': Enrollment,
  '/get-started': GetStarted,
  '/get-a-quote': GetAQuote,
  '/individuals-and-families': IndividualsAndFamilies,
  '/businesses-and-organizations': BusinessesOrganizations,
  '/advisors-and-brokers': AdvisorsAndBrokers,
  '/how-it-works': HowItWorksPage,
  '/faq': FAQ,
  '/support': Support,
  '/join-our-team': JoinOurTeam,
  '/download-app': DownloadApp,
  '/welcome': Welcome,
  '/advisor-directory': AdvisorDirectory,
  '/member-stories': MemberStories,
  '/podcast': HealthyCarePodcast,
  '/about-us': AboutUs,
  '/contact': Contact,
  '/privacy-policy': PrivacyPolicy,
  '/terms-and-conditions': TermsAndConditions,
  '/state-notices': StateNotices,
  '/washington-statement': WashingtonStatement,
  '/education-enrollment': EducationEnrollment,
  '/care-support-hub': CareSupportHub,
  '/insights-analytics': InsightsAnalytics,
  '/resources': ResourceLibrary,
  '/benefits': Benefits,
  '/features': Features,
  '/blog': Blog,
  '/events': Events,
};

export const MANAGED_SITE_PATHS = Object.keys(SITE_PAGE_FALLBACKS);

export function ManagedSitePage({ path }: { path: string }) {
  const Fallback = SITE_PAGE_FALLBACKS[path];
  if (!Fallback) return null;
  return <ManagedPage path={path} fallback={<Fallback />} />;
}
