import React, { Suspense } from 'react';
import { AUTH_URLS } from '@mpbhealth/config';
import { lazyAuto } from './utils/lazyUtils';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { TerminalProvider } from './contexts/TerminalContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { HeaderWithAuth } from './components/layout/HeaderWithAuth';
import { AppDownloadSection } from './components/blocks/AppDownloadSection';
import { Footer } from './components/layout/Footer';
import { trackPageView, initializeAnalytics, loadDatabaseSnippets } from './lib/analytics';
import { usePageTracking } from './hooks/usePageTracking';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { BackToTop } from './components/layout/BackToTop';
import DashboardToggle from './components/admin/DashboardToggle';
import { StateEligibilityBanner } from './components/blocks/StateEligibilityBanner';
import { ZohoSalesIQMonitor } from './components/ZohoSalesIQMonitor';
import { SilentErrorBoundary } from './components/ErrorBoundary';
import LazyLoadErrorBoundary from './components/LazyLoadErrorBoundary';
import { Toaster } from 'sonner';
import { MANAGED_SITE_PATHS, ManagedSitePage } from './lib/sitePageFallbacks';

// Critical routes - loaded immediately
import { Landing } from './pages/Landing';
import { Plans } from './pages/Plans';
import Login from './pages/Login';
import Forbidden from './pages/Forbidden';
import Logout from './pages/Logout';
import NotFound from './pages/NotFound';

// Lazy-loaded routes - loaded on demand
const LandingMVP = lazyAuto(() => import('./pages/LandingMVP'));
const Advisors = lazyAuto(() => import('./pages/Advisors'));
const IndividualsAndFamilies = lazyAuto(() => import('./pages/IndividualsAndFamilies'));
const BusinessesOrganizations = lazyAuto(() => import('./pages/BusinessesOrganizations'));
const AdvisorsAndBrokers = lazyAuto(() => import('./pages/AdvisorsAndBrokers'));
const FAQ = lazyAuto(() => import('./pages/FAQ'));
const JoinOurTeam = lazyAuto(() => import('./pages/JoinOurTeam'));
const GetStarted = lazyAuto(() => import('./pages/GetStarted'));
const GetAQuote = lazyAuto(() => import('./pages/GetAQuote'));
const HowItWorksPage = lazyAuto(() => import('./pages/HowItWorks'));
const Enrollment = lazyAuto(() => import('./pages/Enrollment'));
const PlanComparison = lazyAuto(() => import('./pages/PlanComparison'));
const Support = lazyAuto(() => import('./pages/Support'));
const Welcome = lazyAuto(() => import('./pages/Welcome'));

// Blog & Content
const Blog = lazyAuto(() => import('./pages/Blog'));
const BlogArticle = lazyAuto(() => import('./pages/BlogArticle'));
const Events = lazyAuto(() => import('./pages/Events'));
const EventArticle = lazyAuto(() => import('./pages/EventArticle'));
const CmsPage = lazyAuto(() => import('./pages/CmsPage'));
const MemberStories = lazyAuto(() => import('./pages/MemberStories'));
const HealthyCarePodcast = lazyAuto(() => import('./pages/HealthyCarePodcast'));

// Benefits & Features
const Benefits = lazyAuto(() => import('./pages/Benefits'));
const BenefitDetail = lazyAuto(() => import('./pages/BenefitDetail'));
const Features = lazyAuto(() => import('./pages/Features'));
const FeatureDetail = lazyAuto(() => import('./pages/FeatureDetail'));
const PlanCategoryDetail = lazyAuto(() => import('./pages/PlanCategoryDetail'));

// Resources
const ResourceLibrary = lazyAuto(() => import('./pages/ResourceLibrary'));
const ResourceDetail = lazyAuto(() => import('./pages/ResourceDetail'));

// Info Pages
const AboutUs = lazyAuto(() => import('./pages/AboutUs'));
const Contact = lazyAuto(() => import('./pages/Contact'));
const PrivacyPolicy = lazyAuto(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazyAuto(() => import('./pages/TermsAndConditions'));
const StateNotices = lazyAuto(() => import('./pages/StateNotices'));
const WashingtonStatement = lazyAuto(() => import('./pages/WashingtonStatement'));
const NewsletterUnsubscribe = lazyAuto(() => import('./pages/NewsletterUnsubscribe'));

// Member Portal
const MemberDashboard = lazyAuto(() => import('./pages/MemberDashboard'));
const MemberPortalDashboard = lazyAuto(() => import('./pages/member/MemberPortalDashboard'));
const Claims = lazyAuto(() => import('./pages/member/Claims'));
const MemberFormsIndex = lazyAuto(() => import('./pages/member/MemberFormsIndex'));
const MemberPortal = lazyAuto(() => import('./pages/MemberPortal'));

// Member Forms
const MemberFeedbackProtected = lazyAuto(() => import('./pages/member/forms/MemberFeedbackProtected'));
const ReferFriendProtected = lazyAuto(() => import('./pages/member/forms/ReferFriendProtected'));
const ReviewUsProtected = lazyAuto(() => import('./pages/member/forms/ReviewUsProtected'));
const ChangeAdvisorProtected = lazyAuto(() => import('./pages/member/forms/ChangeAdvisorProtected'));
const WelcomeCallProtected = lazyAuto(() => import('./pages/member/forms/WelcomeCallProtected'));
const WelcomeSurveyProtected = lazyAuto(() => import('./pages/member/forms/WelcomeSurveyProtected'));

// Forms
const EmployerFormsIndex = lazyAuto(() => import('./pages/EmployerFormsIndex'));
const MemberFormsIndexPublic = lazyAuto(() => import('./pages/MemberFormsIndex'));
const ListBillSetupForm = lazyAuto(() => import('./pages/forms/ListBillSetupForm'));
const ListBillConversionForm = lazyAuto(() => import('./pages/forms/ListBillConversionForm'));
const ListBillUpdateForm = lazyAuto(() => import('./pages/forms/ListBillUpdateForm'));
const EmployeeRemovalForm = lazyAuto(() => import('./pages/forms/EmployeeRemovalForm'));
const AdultDependentInformationForm = lazyAuto(() => import('./pages/forms/AdultDependentInformationForm'));
const PermissionToDiscussPlanForm = lazyAuto(() => import('./pages/forms/PermissionToDiscussPlanForm'));
const CancelMembershipForm = lazyAuto(() => import('./pages/forms/CancelMembershipForm'));
const MemberFeedbackForm = lazyAuto(() => import('./pages/forms/MemberFeedbackForm'));
const MembershipChangesForm = lazyAuto(() => import('./pages/forms/MembershipChangesForm'));
const ReferAFriendForm = lazyAuto(() => import('./pages/forms/ReferAFriendForm'));
const ReviewUs = lazyAuto(() => import('./pages/ReviewUs'));
const RequestRxQuoteForm = lazyAuto(() => import('./pages/forms/RequestRxQuoteForm'));
const RequestToScheduleAppointmentForm = lazyAuto(() => import('./pages/forms/RequestToScheduleAppointmentForm'));
const ScheduleWelcomeCall = lazyAuto(() => import('./pages/ScheduleWelcomeCall'));
const UpdateFormOfPaymentForm = lazyAuto(() => import('./pages/forms/UpdateFormOfPaymentForm'));
const WelcomeCallSurveyForm = lazyAuto(() => import('./pages/forms/WelcomeCallSurveyForm'));
const DependentOver18InformationForm = lazyAuto(() => import('./pages/forms/DependentOver18InformationForm'));

// Auth
const AuthConfirm = lazyAuto(() => import('./pages/AuthConfirm'));
const ResetPassword = lazyAuto(() => import('./pages/ResetPassword'));
const ForgotPassword = lazyAuto(() => import('./pages/ForgotPassword'));
const MFAEnrollment = lazyAuto(() => import('./pages/MFAEnrollment'));

// Advisor Directory (public page on website)
const AdvisorDirectory = lazyAuto(() => import('./pages/AdvisorDirectory'));

// Admin Portal
const AdminLogin = lazyAuto(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazyAuto(() => import('./pages/admin/AdminDashboard'));
const BlogAdmin = lazyAuto(() => import('./pages/BlogAdmin'));
const ResourceAdmin = lazyAuto(() => import('./pages/ResourceAdmin'));
const NewsletterSubscribers = lazyAuto(() => import('./pages/admin/NewsletterSubscribers'));
const GeminiBlogGenerator = lazyAuto(() => import('./pages/admin/GeminiBlogGenerator'));
const NewsletterCampaignManager = lazyAuto(() => import('./pages/admin/NewsletterCampaignManager'));
const FAQAdmin = lazyAuto(() => import('./pages/admin/FAQAdmin'));
const EventsAdmin = lazyAuto(() => import('./pages/admin/EventsAdmin'));
const ListBillSetupProtected = lazyAuto(() => import('./pages/admin/ListBillSetupProtected'));
const ListBillConversionProtected = lazyAuto(() => import('./pages/admin/ListBillConversionProtected'));
const ListBillUpdateProtected = lazyAuto(() => import('./pages/admin/ListBillUpdateProtected'));
const EmployeeRemovalProtected = lazyAuto(() => import('./pages/admin/EmployeeRemovalProtected'));
const AdvisorTrainingAdmin = lazyAuto(() => import('./pages/admin/AdvisorTrainingAdmin'));
const AdvisorContentAdmin = lazyAuto(() => import('./pages/admin/AdvisorContentAdmin'));
const ZohoSalesIQDashboard = lazyAuto(() => import('./pages/ZohoSalesIQDashboard'));

// New Admin Pages
const ReportsAnalytics = lazyAuto(() => import('./pages/admin/ReportsAnalytics'));
const MembershipManagement = lazyAuto(() => import('./pages/admin/MembershipManagement'));
const ProviderDirectory = lazyAuto(() => import('./pages/admin/ProviderDirectory'));
const NotificationsAdmin = lazyAuto(() => import('./pages/admin/NotificationsAdmin'));
const SystemSettings = lazyAuto(() => import('./pages/admin/SystemSettings'));
const HandbookHub = lazyAuto(() => import('./pages/admin/HandbookHub'));
const UserManagement = lazyAuto(() => import('./pages/admin/UserManagement'));
const BulkAdvisorImport = lazyAuto(() => import('./pages/admin/BulkAdvisorImport'));

// CRM Module
const CRMDashboard = lazyAuto(() => import('./pages/admin/CRMDashboard'));
const LeadPipeline = lazyAuto(() => import('./pages/admin/LeadPipeline'));
const LeadsList = lazyAuto(() => import('./pages/admin/LeadsList'));
const LeadDetail = lazyAuto(() => import('./pages/admin/LeadDetail'));
const CRMTemplates = lazyAuto(() => import('./pages/admin/CRMTemplates'));
const CRMCalendar = lazyAuto(() => import('./pages/admin/CRMCalendar'));
const CRMReports = lazyAuto(() => import('./pages/admin/CRMReports'));
const QuoteResultsReturned = lazyAuto(() => import('./pages/admin/QuoteResultsReturned'));

// Advisor Portal CMS - Legacy
const AdvisorPortalCMSLegacy = lazyAuto(() => import('./pages/admin/AdvisorPortalCMS'));

// Advisor Portal CMS - New Command Center
const AdvisorCMSHub = lazyAuto(() => import('./pages/admin/advisor-cms/AdvisorCMSHub'));
const AdvisorCMSNavigation = lazyAuto(() => import('./pages/admin/advisor-cms/NavigationManager'));
const AdvisorCMSBulletins = lazyAuto(() => import('./pages/admin/advisor-cms/BulletinsManager'));
const AdvisorCMSForms = lazyAuto(() => import('./pages/admin/advisor-cms/FormsManager'));
const AdvisorCMSTraining = lazyAuto(() => import('./pages/admin/advisor-cms/TrainingManager'));
const AdvisorCMSQuickActions = lazyAuto(() => import('./pages/admin/advisor-cms/QuickActionsManager'));
const AdvisorCMSDirectory = lazyAuto(() => import('./pages/admin/advisor-cms/DirectoryManager'));
const AdvisorCMSVideos = lazyAuto(() => import('./pages/admin/advisor-cms/VideosManager'));
const AdvisorCMSEnrollment = lazyAuto(() => import('./pages/admin/advisor-cms/EnrollmentLinksManager'));
const AdvisorCMSSettings = lazyAuto(() => import('./pages/admin/advisor-cms/PortalSettingsManager'));
const AdvisorCMSToolkit = lazyAuto(() => import('./pages/admin/advisor-cms/AdvisorToolkitManager'));
const AdvisorCMSPricingCharts = lazyAuto(() => import('./pages/admin/advisor-cms/PricingChartsManager'));
const AdvisorCMSReferenceMaterials = lazyAuto(() => import('./pages/admin/advisor-cms/ReferenceMaterialsManager'));
const AdvisorCMSFlyers = lazyAuto(() => import('./pages/admin/advisor-cms/FlyersManager'));
const AdvisorCMSSharingGuidelines = lazyAuto(() => import('./pages/admin/advisor-cms/SharingGuidelinesManager'));
const AdvisorCMSARM = lazyAuto(() => import('./pages/admin/advisor-cms/ARMManager'));

// Website CMS Suite
const CmsAdminLayout = lazyAuto(() => import('./pages/admin/cms/CmsAdminLayout'));
const CmsHub = lazyAuto(() => import('./pages/admin/cms/CmsHub'));
const CmsPagesList = lazyAuto(() => import('./pages/admin/cms/PagesList'));
const CmsPageEditor = lazyAuto(() => import('./pages/admin/cms/PageEditor'));
const CmsMediaLibrary = lazyAuto(() => import('./pages/admin/cms/MediaLibrary'));
const CmsBlogEditor = lazyAuto(() => import('./pages/admin/cms/CmsBlogEditor'));
const CmsTemplateLibrary = lazyAuto(() => import('./pages/admin/cms/TemplateLibrary'));
const CmsThemeEditor = lazyAuto(() => import('./pages/admin/cms/ThemeEditor'));
const CmsFormBuilder = lazyAuto(() => import('./pages/admin/cms/CmsFormBuilder'));
const CmsPopupBuilder = lazyAuto(() => import('./pages/admin/cms/PopupBuilder'));
const CmsRedirectManager = lazyAuto(() => import('./pages/admin/cms/RedirectManager'));
const CmsContentCalendar = lazyAuto(() => import('./pages/admin/cms/ContentCalendar'));
const CmsSeoSuite = lazyAuto(() => import('./pages/admin/cms/SeoSuite'));
const CmsContentPermissions = lazyAuto(() => import('./pages/admin/cms/ContentPermissions'));

// Forms Manager
const FormsManager = lazyAuto(() => import('./pages/admin/FormsManager'));

// Dynamic Form Page (for CMS-created forms)
const DynamicFormPage = lazyAuto(() => import('./pages/forms/DynamicFormPage'));

// Additional Features
const EducationEnrollment = lazyAuto(() => import('./pages/EducationEnrollment'));
const CareSupportHub = lazyAuto(() => import('./pages/CareSupportHub'));
const InsightsAnalytics = lazyAuto(() => import('./pages/InsightsAnalytics'));
const DownloadApp = lazyAuto(() => import('./pages/DownloadApp'));

// Handbooks - All use dynamic page for CMS control
const DynamicHandbookPage = lazyAuto(() => import('./pages/handbooks/DynamicHandbookPage'));

// Prefetch common routes when the browser is idle
if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  window.requestIdleCallback(() => {
    import('./pages/FAQ').catch(() => {});
    import('./pages/AboutUs').catch(() => {});
    import('./pages/Blog').catch(() => {});
    import('./pages/GetStarted').catch(() => {});
    import('./pages/IndividualsAndFamilies').catch(() => {});
    import('./pages/Contact').catch(() => {});
  });
}

function PageSpinner() {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const id = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(id);
  }, []);
  if (!visible) return null;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8f3fc] to-white">
      <div className="text-center">
        <div className="inline-block w-16 h-16 border-4 border-[#0a4c8f] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium text-[#0a4c8f]">Loading...</p>
      </div>
    </div>
  );
}

// Analytics tracking wrapper - must be inside Router to use useLocation
const AnalyticsTracker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Track page views to Supabase (for admin dashboard)
  usePageTracking({
    enabled: true,
    excludePaths: ['/admin', '/member'],
  });

  // Track every SPA route change in GA4 / Facebook / etc.
  React.useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return <>{children}</>;
};

// Conditional footer - hide on admin and advisor dashboard routes
const ConditionalFooter: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAdvisorRoute = location.pathname.startsWith('/advisor');
  
  // Don't render footer on admin or advisor dashboard
  if (isAdminRoute || isAdvisorRoute) {
    return null;
  }
  
  return (
    <>
      <AppDownloadSection />
      <Footer />
    </>
  );
};

// If Supabase falls back to Site URL, recovery links can land on /#access_token=...
// Route those immediately to /auth/confirm so token exchange still completes.
const RecoveryHashRedirector: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!location.hash) return;
    const hash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
    const hashParams = new URLSearchParams(hash);
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (accessToken && type === 'recovery' && location.pathname !== '/auth/confirm') {
      navigate(`/auth/confirm${location.hash}`, { replace: true });
    }
  }, [location.hash, location.pathname, navigate]);

  return null;
};

const AdvisorPortalRedirect: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    const advisorPath = location.pathname === '/advisor'
      ? ''
      : location.pathname.replace(/^\/advisor/, '');

    window.location.replace(`${AUTH_URLS.advisor.origin}${advisorPath}${location.search}${location.hash}`);
  }, [location.hash, location.pathname, location.search]);

  return null;
};

const App = () => {
  React.useEffect(() => {
    // Initialize env-var-driven analytics (fallback)
    initializeAnalytics();

    // Load and inject snippets configured via the admin panel
    loadDatabaseSnippets();

    // Track initial page view to GA
    trackPageView(window.location.pathname);
  }, []);

  return (
    <HelmetProvider>
      <Toaster position="top-right" richColors closeButton />
      <AuthProvider>
        <NavigationProvider>
          <TerminalProvider>
            <Router>
            <AnalyticsTracker>
            <RecoveryHashRedirector />
            <ScrollToTop />
            <StateEligibilityBanner />
            <div className="min-h-screen flex flex-col">
              <HeaderWithAuth />
            <main className="flex-1 overflow-x-hidden pt-[104px]">
              <LazyLoadErrorBoundary>
                <Suspense fallback={<PageSpinner />}>
                  <Routes>
                  <Route path="/quote" element={<Navigate to="/get-a-quote" replace />} />
                  <Route path="/calculator" element={<Navigate to="/get-started" replace />} />
                  <Route path="/freequote" element={<Navigate to="/get-started" replace />} />
                  {/* Redirects for old SEO paths — preserve link equity */}
                  <Route path="/individuals-families" element={<Navigate to="/individuals-and-families" replace />} />
                  <Route path="/businesses-organizations" element={<Navigate to="/businesses-and-organizations" replace />} />
                  <Route path="/resource-library" element={<Navigate to="/resources" replace />} />
                  {/* Marketing pages: CMS block editor overrides when published */}
                  {MANAGED_SITE_PATHS.map((sitePath) => (
                    <Route
                      key={sitePath}
                      path={sitePath}
                      element={<ManagedSitePage path={sitePath} />}
                    />
                  ))}

                  {/* Protected Member Routes */}
                  <Route path="/member" element={<ProtectedRoute requiredRole="member"><MemberDashboard /></ProtectedRoute>} />
                  <Route path="/member/portal" element={<ProtectedRoute requiredRole="member"><MemberPortalDashboard /></ProtectedRoute>} />
                  <Route path="/member/portal/claims" element={<ProtectedRoute requiredRole="member"><Claims /></ProtectedRoute>} />
                  <Route path="/member/forms" element={<ProtectedRoute requiredRole="member"><MemberFormsIndex /></ProtectedRoute>} />
                  <Route path="/member/forms/feedback" element={<ProtectedRoute requiredRole="member"><MemberFeedbackProtected /></ProtectedRoute>} />
                  <Route path="/member/forms/refer-friend" element={<ProtectedRoute requiredRole="member"><ReferFriendProtected /></ProtectedRoute>} />
                  <Route path="/member/forms/review" element={<ProtectedRoute requiredRole="member"><ReviewUsProtected /></ProtectedRoute>} />
                  <Route path="/member/forms/change-advisor" element={<ProtectedRoute requiredRole="member"><ChangeAdvisorProtected /></ProtectedRoute>} />
                  <Route path="/member/forms/welcome-call" element={<ProtectedRoute requiredRole="member"><WelcomeCallProtected /></ProtectedRoute>} />
                  <Route path="/member/forms/welcome-survey" element={<ProtectedRoute requiredRole="member"><WelcomeSurveyProtected /></ProtectedRoute>} />
                  <Route path="/advisor-directory" element={<AdvisorDirectory />} />

                  {/* Forms Index Pages */}
                  <Route path="/employer-forms" element={<EmployerFormsIndex />} />
                  <Route path="/member-forms" element={<MemberFormsIndexPublic />} />

                  {/* Employer Form Pages */}
                  <Route path="/list-bill-setup" element={<ListBillSetupForm />} />
                  <Route path="/list-bill-conversion" element={<ListBillConversionForm />} />
                  <Route path="/list-bill-update" element={<ListBillUpdateForm />} />
                  <Route path="/employee-removal" element={<EmployeeRemovalForm />} />

                  {/* Member Form Pages */}
                  <Route path="/adult-dependent-information" element={<AdultDependentInformationForm />} />
                  <Route path="/permission-to-discuss-plan" element={<PermissionToDiscussPlanForm />} />
                  <Route path="/cancel-membership" element={<CancelMembershipForm />} />
                  <Route path="/member-feedback" element={<MemberFeedbackForm />} />
                  <Route path="/membership-changes" element={<MembershipChangesForm />} />
                  <Route path="/refer-a-friend" element={<ReferAFriendForm />} />
                  <Route path="/review-us" element={<ReviewUs />} />
                  <Route path="/request-rx-quote" element={<RequestRxQuoteForm />} />
                  <Route path="/request-to-schedule-an-appointment" element={<RequestToScheduleAppointmentForm />} />
                  <Route path="/schedule-a-call" element={<ScheduleWelcomeCall />} />
                  <Route path="/update-form-of-payment" element={<UpdateFormOfPaymentForm />} />
                  <Route path="/welcome-call-survey" element={<WelcomeCallSurveyForm />} />
                  <Route path="/dependent-over-18-information" element={<DependentOver18InformationForm />} />

                  {/* Login Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/auth/confirm" element={<AuthConfirm />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/advisor/*" element={<AdvisorPortalRedirect />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/mfa-enrollment" element={<MFAEnrollment />} />

                  {/* Admin Training Management */}
                  <Route
                    path="/admin/advisor-training"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorTrainingAdmin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-content"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorContentAdmin />
                      </ProtectedRoute>
                    }
                  />

                  {/* Legacy redirects — point old URLs to canonical member portal paths */}
                  <Route path="/member-portal" element={<Navigate to="/member" replace />} />
                  <Route path="/member-portal/account" element={<MemberPortal />} />
                  <Route path="/review-or-change-advisor" element={<Navigate to="/member/forms/change-advisor" replace />} />
                  <Route path="/schedule-welcome-call" element={<Navigate to="/member/forms/welcome-call" replace />} />

                  {/* Protected Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/newsletter-subscribers"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <NewsletterSubscribers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/gemini-blog-generator"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <GeminiBlogGenerator />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/newsletter-campaigns"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <NewsletterCampaignManager />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/faq"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <FAQAdmin />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/admin/list-bill-setup" element={<ProtectedRoute requiredRole="admin"><ListBillSetupProtected /></ProtectedRoute>} />
                  <Route path="/admin/list-bill-conversion" element={<ProtectedRoute requiredRole="admin"><ListBillConversionProtected /></ProtectedRoute>} />
                  <Route path="/admin/list-bill-update" element={<ProtectedRoute requiredRole="admin"><ListBillUpdateProtected /></ProtectedRoute>} />
                  <Route path="/admin/employee-removal" element={<ProtectedRoute requiredRole="admin"><EmployeeRemovalProtected /></ProtectedRoute>} />

                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogArticle />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/:slug" element={<EventArticle />} />
                  {/* WordPress-style admin-driven pages. The slug maps to a row
                      in `cms_pages` and is rendered with the block library at
                      apps/website/src/components/cms-blocks/. Resolves live via
                      Supabase Realtime — published changes appear within ~1s. */}
                  <Route path="/p/:slug" element={<CmsPage />} />
                  <Route path="/logout" element={<Logout />} />
                  <Route path="/forbidden" element={<Forbidden />} />
                  <Route
                    path="/admin/blog"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <BlogAdmin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/events"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <EventsAdmin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/resources"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <ResourceAdmin />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/resources/:slug" element={<ResourceDetail />} />
                  <Route path="/benefits/:benefitId" element={<BenefitDetail />} />
                  <Route path="/features/:featureId" element={<FeatureDetail />} />
                  <Route path="/plan-categories/:slug" element={<PlanCategoryDetail />} />
                  <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />
                  <Route
                    path="/admin/zoho-salesiq"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <ZohoSalesIQDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* New Admin Routes */}
                  <Route
                    path="/admin/reports"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <ReportsAnalytics />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/coverage"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <MembershipManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/providers"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <ProviderDirectory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/notifications"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <NotificationsAdmin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <SystemSettings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/handbooks"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <HandbookHub />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <UserManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/users/bulk-import"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <BulkAdvisorImport />
                      </ProtectedRoute>
                    }
                  />

                  {/* CRM Routes */}
                  <Route
                    path="/admin/crm"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <CRMDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/crm/pipeline"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <LeadPipeline />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/crm/leads"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <LeadsList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/crm/leads/:id"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <LeadDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/crm/templates"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <CRMTemplates />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/crm/calendar"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <CRMCalendar />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/crm/quote-results-returned"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <QuoteResultsReturned />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/crm/reports"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <CRMReports />
                      </ProtectedRoute>
                    }
                  />

                  {/* Advisor Portal CMS - Command Center */}
                  <Route
                    path="/admin/advisor-cms"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorCMSHub />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/navigation"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorCMSNavigation />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/bulletins"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorCMSBulletins />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/forms"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorCMSForms />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/training"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorCMSTraining />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/quick-actions"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorCMSQuickActions />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/directory"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorCMSDirectory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/videos"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorCMSVideos />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/enrollment"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorCMSEnrollment />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/settings"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorCMSSettings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/advisor-toolkit"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorCMSToolkit />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/pricing-charts"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorCMSPricingCharts />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/reference-materials"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorCMSReferenceMaterials />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/flyers"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorCMSFlyers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/sharing-guidelines"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorCMSSharingGuidelines />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/arm"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorCMSARM />
                      </ProtectedRoute>
                    }
                  />
                  {/* Legacy CMS (keeping for reference) */}
                  <Route
                    path="/admin/advisor-portal-cms-legacy"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdvisorPortalCMSLegacy />
                      </ProtectedRoute>
                    }
                  />

                  {/* Website CMS Suite — uses admin sidebar via CmsAdminLayout */}
                  <Route
                    path="/admin/cms"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <CmsAdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<CmsHub />} />
                    <Route path="pages" element={<CmsPagesList />} />
                    <Route path="pages/new" element={<CmsPageEditor />} />
                    <Route path="pages/:id" element={<CmsPageEditor />} />
                    <Route path="media" element={<CmsMediaLibrary />} />
                    <Route path="blog/new" element={<CmsBlogEditor />} />
                    <Route path="blog/:id" element={<CmsBlogEditor />} />
                    <Route path="templates" element={<CmsTemplateLibrary />} />
                    <Route path="theme" element={<CmsThemeEditor />} />
                    <Route path="forms" element={<CmsFormBuilder />} />
                    <Route path="forms/new" element={<CmsFormBuilder />} />
                    <Route path="forms/:id" element={<CmsFormBuilder />} />
                    <Route path="popups" element={<CmsPopupBuilder />} />
                    <Route path="popups/:id" element={<CmsPopupBuilder />} />
                    <Route path="redirects" element={<CmsRedirectManager />} />
                    <Route path="calendar" element={<CmsContentCalendar />} />
                    <Route path="seo" element={<CmsSeoSuite />} />
                    <Route path="permissions" element={<CmsContentPermissions />} />
                  </Route>

                  {/* Forms Manager */}
                  <Route
                    path="/admin/forms"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <FormsManager />
                      </ProtectedRoute>
                    }
                  />

                  {/* Handbook Routes - All dynamic, reading from CMS database */}
                  <Route path="/3d-flip-book/:slug" element={<DynamicHandbookPage />} />

                  {/* Dynamic Form Routes - for forms created via CMS */}
                  <Route path="/forms/:slug" element={<DynamicFormPage />} />

                  <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </LazyLoadErrorBoundary>
            </main>
            <ConditionalFooter />
            <BackToTop />
            <DashboardToggle />
            <SilentErrorBoundary>
              <ZohoSalesIQMonitor />
            </SilentErrorBoundary>
          </div>
            </AnalyticsTracker>
            </Router>
          </TerminalProvider>
        </NavigationProvider>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;