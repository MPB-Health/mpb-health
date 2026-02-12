import React, { Suspense } from 'react';
import { lazyAuto } from './utils/lazyUtils';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { TerminalProvider } from './contexts/TerminalContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { HeaderWithAuth } from './components/layout/HeaderWithAuth';
import { AppDownloadSection } from './components/blocks/AppDownloadSection';
import { Footer } from './components/layout/Footer';
import { trackPageView, initializeAnalytics } from './lib/analytics';
import { usePageTracking } from './hooks/usePageTracking';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { BackToTop } from './components/layout/BackToTop';
import DashboardToggle from './components/admin/DashboardToggle';
import { StateEligibilityBanner } from './components/blocks/StateEligibilityBanner';
import { ZohoSalesIQMonitor } from './components/ZohoSalesIQMonitor';
import { SilentErrorBoundary } from './components/ErrorBoundary';
import LazyLoadErrorBoundary from './components/LazyLoadErrorBoundary';
import { LeadNotificationWrapper } from './components/notifications/LeadNotificationWrapper';

// Critical routes - loaded immediately
import { Landing } from './pages/Landing';
import { Plans } from './pages/Plans';
import Login from './pages/Login';
import Forbidden from './pages/Forbidden';
import Logout from './pages/Logout';

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
const ResetPassword = lazyAuto(() => import('./pages/ResetPassword'));
const ForgotPassword = lazyAuto(() => import('./pages/ForgotPassword'));
const MFAEnrollment = lazyAuto(() => import('./pages/MFAEnrollment'));

// Advisor Portal
const AdvisorDirectory = lazyAuto(() => import('./pages/AdvisorDirectory'));
const AdvisorLogin = lazyAuto(() => import('./pages/advisor/AdvisorLogin'));
const AdvisorOnboarding = lazyAuto(() => import('./pages/advisor/AdvisorOnboarding'));
const AdvisorDashboard = lazyAuto(() => import('./pages/advisor/AdvisorDashboard'));
const AdvisorTraining = lazyAuto(() => import('./pages/advisor/AdvisorTraining'));
const TrainingUniversity = lazyAuto(() => import('./pages/advisor/TrainingUniversity'));
const TrainingModuleView = lazyAuto(() => import('./pages/advisor/TrainingModuleView'));
const SOPLibrary = lazyAuto(() => import('./pages/advisor/SOPLibrary'));
const AdvisorProfile = lazyAuto(() => import('./pages/advisor/AdvisorProfile'));
const AdvisorContentHub = lazyAuto(() => import('./pages/advisor/AdvisorContentHub'));
const AdvisorContentDetail = lazyAuto(() => import('./pages/advisor/AdvisorContentDetail'));
const AdvisorBulletins = lazyAuto(() => import('./pages/advisor/AdvisorBulletins'));
const AdvisorMeetings = lazyAuto(() => import('./pages/advisor/AdvisorMeetings'));
const AdvisorForms = lazyAuto(() => import('./pages/advisor/AdvisorForms'));
const AdvisorResourcesLanding = lazyAuto(() => import('./pages/advisor/AdvisorResourcesLanding'));
const AdvisorPlanDetail = lazyAuto(() => import('./pages/advisor/AdvisorPlanDetail'));

// Admin Portal
const AdminLogin = lazyAuto(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazyAuto(() => import('./pages/admin/AdminDashboard'));
const MemberManagement = lazyAuto(() => import('./pages/admin/MemberManagement'));
const ClaimsProcessing = lazyAuto(() => import('./pages/admin/ClaimsProcessing'));
const BlogAdmin = lazyAuto(() => import('./pages/BlogAdmin'));
const ResourceAdmin = lazyAuto(() => import('./pages/ResourceAdmin'));
const NewsletterSubscribers = lazyAuto(() => import('./pages/admin/NewsletterSubscribers'));
const GeminiBlogGenerator = lazyAuto(() => import('./pages/admin/GeminiBlogGenerator'));
const NewsletterCampaignManager = lazyAuto(() => import('./pages/admin/NewsletterCampaignManager'));
const FAQAdmin = lazyAuto(() => import('./pages/admin/FAQAdmin'));
const ListBillSetupProtected = lazyAuto(() => import('./pages/admin/ListBillSetupProtected'));
const ListBillConversionProtected = lazyAuto(() => import('./pages/admin/ListBillConversionProtected'));
const ListBillUpdateProtected = lazyAuto(() => import('./pages/admin/ListBillUpdateProtected'));
const EmployeeRemovalProtected = lazyAuto(() => import('./pages/admin/EmployeeRemovalProtected'));
const AdvisorTrainingAdmin = lazyAuto(() => import('./pages/admin/AdvisorTrainingAdmin'));
const AdvisorContentAdmin = lazyAuto(() => import('./pages/admin/AdvisorContentAdmin'));
const ZohoSalesIQDashboard = lazyAuto(() => import('./pages/ZohoSalesIQDashboard'));

// New Admin Pages
const TransactionsManagement = lazyAuto(() => import('./pages/admin/TransactionsManagement'));
const SupportTickets = lazyAuto(() => import('./pages/admin/SupportTickets'));
const ReportsAnalytics = lazyAuto(() => import('./pages/admin/ReportsAnalytics'));
const DocumentReview = lazyAuto(() => import('./pages/admin/DocumentReview'));
const MembershipManagement = lazyAuto(() => import('./pages/admin/MembershipManagement'));
const ProviderDirectory = lazyAuto(() => import('./pages/admin/ProviderDirectory'));
const NotificationsAdmin = lazyAuto(() => import('./pages/admin/NotificationsAdmin'));
const SystemSettings = lazyAuto(() => import('./pages/admin/SystemSettings'));
const HandbookHub = lazyAuto(() => import('./pages/admin/HandbookHub'));
const UserManagement = lazyAuto(() => import('./pages/admin/UserManagement'));

// CRM Module
const CRMDashboard = lazyAuto(() => import('./pages/admin/CRMDashboard'));
const LeadPipeline = lazyAuto(() => import('./pages/admin/LeadPipeline'));
const LeadsList = lazyAuto(() => import('./pages/admin/LeadsList'));
const LeadDetail = lazyAuto(() => import('./pages/admin/LeadDetail'));
const CRMTemplates = lazyAuto(() => import('./pages/admin/CRMTemplates'));
const CRMCalendar = lazyAuto(() => import('./pages/admin/CRMCalendar'));
const CRMReports = lazyAuto(() => import('./pages/admin/CRMReports'));

// Advisor Portal CMS - Legacy
const AdvisorPortalCMSLegacy = lazyAuto(() => import('./pages/admin/AdvisorPortalCMS'));

// Advisor Portal CMS - New Command Center
const AdvisorCMSHub = lazyAuto(() => import('./pages/admin/advisor-cms/AdvisorCMSHub'));
const AdvisorCMSNavigation = lazyAuto(() => import('./pages/admin/advisor-cms/NavigationManager'));
const AdvisorCMSBulletins = lazyAuto(() => import('./pages/admin/advisor-cms/BulletinsManager'));
const AdvisorCMSForms = lazyAuto(() => import('./pages/admin/advisor-cms/FormsManager'));
const AdvisorCMSTraining = lazyAuto(() => import('./pages/admin/advisor-cms/TrainingManager'));
const AdvisorCMSQuickActions = lazyAuto(() => import('./pages/admin/advisor-cms/QuickActionsManager'));

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

// Analytics tracking wrapper - must be inside Router to use useLocation
const AnalyticsTracker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Track page views to Supabase (for admin dashboard)
  usePageTracking({
    enabled: true,
    excludePaths: [], // Track all pages including admin
  });

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

const App = () => {
  React.useEffect(() => {
    // Initialize Google Analytics and other tracking scripts
    initializeAnalytics();

    // Track initial page view to GA
    trackPageView(window.location.pathname);
  }, []);

  return (
    <HelmetProvider>
      <AuthProvider>
        <NavigationProvider>
          <TerminalProvider>
            <Router>
            <LeadNotificationWrapper>
            <AnalyticsTracker>
            <ScrollToTop />
            <StateEligibilityBanner />
            <div className="min-h-screen flex flex-col">
              <HeaderWithAuth />
            <main className="flex-1 overflow-x-hidden pt-[104px]">
              <LazyLoadErrorBoundary>
                <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8f3fc] to-white">
                    <div className="text-center">
                      <div className="inline-block w-16 h-16 border-4 border-[#0a4c8f] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-lg font-medium text-[#0a4c8f]">Loading...</p>
                    </div>
                  </div>
                }>
                  <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/mvp" element={<LandingMVP />} />
                  <Route path="/advisors" element={<Advisors />} />
                  <Route path="/plans" element={<Plans />} />
                  <Route path="/compare-plans" element={<PlanComparison />} />
                  <Route path="/enrollment" element={<Enrollment />} />
                  <Route path="/get-started" element={<GetStarted />} />
                  <Route path="/get-a-quote" element={<GetAQuote />} />
                  <Route path="/quote" element={<GetAQuote />} />
                  <Route path="/calculator" element={<GetStarted />} />
                  <Route path="/individuals-and-families" element={<IndividualsAndFamilies />} />
                  <Route path="/businesses-and-organizations" element={<BusinessesOrganizations />} />
                  <Route path="/advisors-and-brokers" element={<AdvisorsAndBrokers />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/join-our-team" element={<JoinOurTeam />} />
                  <Route path="/download-app" element={<DownloadApp />} />
                  <Route path="/welcome" element={<Welcome />} />

                  {/* Protected Member Routes */}
                  <Route path="/member" element={<MemberDashboard />} />
                  <Route path="/member/portal" element={<MemberPortalDashboard />} />
                  <Route path="/member/portal/claims" element={<Claims />} />
                  <Route path="/member/forms" element={<MemberFormsIndex />} />
                  <Route path="/member/forms/feedback" element={<MemberFeedbackProtected />} />
                  <Route path="/member/forms/refer-friend" element={<ReferFriendProtected />} />
                  <Route path="/member/forms/review" element={<ReviewUsProtected />} />
                  <Route path="/member/forms/change-advisor" element={<ChangeAdvisorProtected />} />
                  <Route path="/member/forms/welcome-call" element={<WelcomeCallProtected />} />
                  <Route path="/member/forms/welcome-survey" element={<WelcomeSurveyProtected />} />
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
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/advisor/login" element={<AdvisorLogin />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/mfa-enrollment" element={<MFAEnrollment />} />

                  {/* Advisor Routes */}
                  <Route path="/advisor/onboarding" element={<AdvisorOnboarding />} />
                  <Route path="/advisor/dashboard" element={<AdvisorDashboard />} />
                  <Route path="/advisor" element={<AdvisorDashboard />} />
                  <Route path="/advisor/bulletins" element={<AdvisorBulletins />} />
                  <Route path="/advisor/university" element={<TrainingUniversity />} />
                  <Route path="/advisor/training" element={<AdvisorTraining />} />
                  <Route path="/advisor/training/module/:moduleId" element={<TrainingModuleView />} />
                  <Route path="/advisor/sops" element={<SOPLibrary />} />
                  <Route path="/advisor/profile" element={<AdvisorProfile />} />
                  <Route path="/advisor/content" element={<AdvisorContentHub />} />
                  <Route path="/advisor/content/:slug" element={<AdvisorContentDetail />} />
                  <Route path="/advisor/resources" element={<AdvisorResourcesLanding />} />
                  <Route path="/advisor/resources/:slug" element={<AdvisorPlanDetail />} />
                  <Route path="/advisor/meetings" element={<AdvisorMeetings />} />
                  <Route path="/advisor/forms" element={<AdvisorForms />} />
                  <Route path="/advisor/toolkit" element={<AdvisorForms />} />

                  {/* Admin Training Management */}
                  <Route
                    path="/admin/advisor-training"
                    element={
                      <ProtectedRoute>
                        <AdvisorTrainingAdmin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-content"
                    element={
                      <ProtectedRoute>
                        <AdvisorContentAdmin />
                      </ProtectedRoute>
                    }
                  />

                  {/* Legacy Protected Routes (kept for backward compatibility) */}
                  <Route path="/member-portal" element={<MemberDashboard />} />
                  <Route path="/member-portal/account" element={<MemberPortal />} />
                  <Route path="/member-feedback" element={<MemberFeedbackProtected />} />
                  <Route path="/refer-a-friend" element={<ReferFriendProtected />} />
                  <Route path="/review-us" element={<ReviewUsProtected />} />
                  <Route path="/review-or-change-advisor" element={<ChangeAdvisorProtected />} />
                  <Route path="/schedule-welcome-call" element={<WelcomeCallProtected />} />
                  <Route path="/welcome-call-survey" element={<WelcomeSurveyProtected />} />

                  {/* Protected Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/members"
                    element={
                      <ProtectedRoute>
                        <MemberManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/claims"
                    element={
                      <ProtectedRoute>
                        <ClaimsProcessing />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/newsletter-subscribers"
                    element={
                      <ProtectedRoute>
                        <NewsletterSubscribers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/gemini-blog-generator"
                    element={
                      <ProtectedRoute>
                        <GeminiBlogGenerator />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/newsletter-campaigns"
                    element={
                      <ProtectedRoute>
                        <NewsletterCampaignManager />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/faq"
                    element={
                      <ProtectedRoute>
                        <FAQAdmin />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/admin/list-bill-setup" element={<ListBillSetupProtected />} />
                  <Route path="/admin/list-bill-conversion" element={<ListBillConversionProtected />} />
                  <Route path="/admin/list-bill-update" element={<ListBillUpdateProtected />} />
                  <Route path="/admin/employee-removal" element={<EmployeeRemovalProtected />} />

                  {/* Legacy Admin Routes (kept for backward compatibility) */}
                  <Route path="/list-bill-setup" element={<ListBillSetupProtected />} />
                  <Route path="/list-bill-conversion" element={<ListBillConversionProtected />} />
                  <Route path="/list-bill-update" element={<ListBillUpdateProtected />} />
                  <Route path="/employee-removal" element={<EmployeeRemovalProtected />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogArticle />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/:slug" element={<EventArticle />} />
                  <Route path="/member-stories" element={<MemberStories />} />
                  <Route path="/podcast" element={<HealthyCarePodcast />} />
                  <Route path="/logout" element={<Logout />} />
                  <Route path="/forbidden" element={<Forbidden />} />
                  <Route
                    path="/admin/blog"
                    element={
                      <ProtectedRoute>
                        <BlogAdmin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/resources"
                    element={
                      <ProtectedRoute>
                        <ResourceAdmin />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/about-us" element={<AboutUs />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                  <Route path="/state-notices" element={<StateNotices />} />
                  <Route path="/washington-statement" element={<WashingtonStatement />} />
                  <Route path="/education-enrollment" element={<EducationEnrollment />} />
                  <Route path="/care-support-hub" element={<CareSupportHub />} />
                  <Route path="/insights-analytics" element={<InsightsAnalytics />} />
                  <Route path="/resources" element={<ResourceLibrary />} />
                  <Route path="/resources/:slug" element={<ResourceDetail />} />
                  <Route path="/benefits" element={<Benefits />} />
                  <Route path="/benefits/:benefitId" element={<BenefitDetail />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/features/:featureId" element={<FeatureDetail />} />
                  <Route path="/plan-categories/:slug" element={<PlanCategoryDetail />} />
                  <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />
                  <Route
                    path="/admin/zoho-salesiq"
                    element={
                      <ProtectedRoute>
                        <ZohoSalesIQDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* New Admin Routes */}
                  <Route
                    path="/admin/transactions"
                    element={
                      <ProtectedRoute>
                        <TransactionsManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/support"
                    element={
                      <ProtectedRoute>
                        <SupportTickets />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/reports"
                    element={
                      <ProtectedRoute>
                        <ReportsAnalytics />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/documents"
                    element={
                      <ProtectedRoute>
                        <DocumentReview />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/coverage"
                    element={
                      <ProtectedRoute>
                        <MembershipManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/providers"
                    element={
                      <ProtectedRoute>
                        <ProviderDirectory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/notifications"
                    element={
                      <ProtectedRoute>
                        <NotificationsAdmin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <ProtectedRoute>
                        <SystemSettings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/handbooks"
                    element={
                      <ProtectedRoute>
                        <HandbookHub />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRoute>
                        <UserManagement />
                      </ProtectedRoute>
                    }
                  />

                  {/* CRM Routes */}
                  <Route
                    path="/admin/crm"
                    element={
                      <ProtectedRoute>
                        <CRMDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/crm/pipeline"
                    element={
                      <ProtectedRoute>
                        <LeadPipeline />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/crm/leads"
                    element={
                      <ProtectedRoute>
                        <LeadsList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/crm/leads/:id"
                    element={
                      <ProtectedRoute>
                        <LeadDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/crm/templates"
                    element={
                      <ProtectedRoute>
                        <CRMTemplates />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/crm/calendar"
                    element={
                      <ProtectedRoute>
                        <CRMCalendar />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/crm/reports"
                    element={
                      <ProtectedRoute>
                        <CRMReports />
                      </ProtectedRoute>
                    }
                  />

                  {/* Advisor Portal CMS - Command Center */}
                  <Route
                    path="/admin/advisor-cms"
                    element={
                      <ProtectedRoute>
                        <AdvisorCMSHub />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/navigation"
                    element={
                      <ProtectedRoute>
                        <AdvisorCMSNavigation />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/bulletins"
                    element={
                      <ProtectedRoute>
                        <AdvisorCMSBulletins />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/forms"
                    element={
                      <ProtectedRoute>
                        <AdvisorCMSForms />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/training"
                    element={
                      <ProtectedRoute>
                        <AdvisorCMSTraining />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/advisor-cms/quick-actions"
                    element={
                      <ProtectedRoute>
                        <AdvisorCMSQuickActions />
                      </ProtectedRoute>
                    }
                  />
                  {/* Legacy CMS (keeping for reference) */}
                  <Route
                    path="/admin/advisor-portal-cms-legacy"
                    element={
                      <ProtectedRoute>
                        <AdvisorPortalCMSLegacy />
                      </ProtectedRoute>
                    }
                  />

                  {/* Forms Manager */}
                  <Route
                    path="/admin/forms"
                    element={
                      <ProtectedRoute>
                        <FormsManager />
                      </ProtectedRoute>
                    }
                  />

                  {/* Handbook Routes - All dynamic, reading from CMS database */}
                  <Route path="/3d-flip-book/:slug" element={<DynamicHandbookPage />} />

                  {/* Dynamic Form Routes - for forms created via CMS */}
                  <Route path="/forms/:slug" element={<DynamicFormPage />} />

                  <Route path="*" element={<Landing />} />
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
            </LeadNotificationWrapper>
            </Router>
          </TerminalProvider>
        </NavigationProvider>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;