import { Suspense, type ReactNode } from 'react';
import { Route } from 'react-router-dom';
import { AdvisorPageLoader } from '../components/loading';
import {
  AddAdvisor,
  AdminTickets,
  AssignedLeadDetail,
  AuditLog,
  AuthConfirm,
  BulletinDetail,
  Bulletins,
  ChangePassword,
  ChatPage,
  Contact,
  ConversationThread,
  Dashboard,
  EventForm,
  EventsManager,
  ForgotPassword,
  Forms,
  Inbox,
  Integrations,
  ApiKeys,
  LeadsList,
  Login,
  NewTicket,
  NotificationPreferences,
  OrganizationSettings,
  Overview,
  Profile,
  QuickLinks,
  ResetPassword,
  SettingsHub,
  SOPDocument,
  SOPLibrary,
  SubmitGroup,
  TeamManagement,
  TicketDetailPage,
  Tickets,
  Training,
  TrainingModule,
  UserPreferences,
  VideoLibrary,
} from './lazyPages';

export function routeFallback(message: string, subtitle?: string) {
  return (
    <AdvisorPageLoader
      message={message}
      subtitle={subtitle ?? 'Fetching this section…'}
      delayMs={0}
    />
  );
}

function lazyPage(message: string, subtitle: string | undefined, node: ReactNode) {
  return <Suspense fallback={routeFallback(message, subtitle)}>{node}</Suspense>;
}

/** Auth pages — `nested` uses relative paths under /:tenantSlug on AOS. */
export function authRouteElements(nested = false) {
  const p = (segment: string) => (nested ? segment : `/${segment}`);

  return (
    <>
      <Route path={p('login')} element={lazyPage('Loading…', 'Preparing sign-in.', <Login />)} />
      <Route path={p('forgot-password')} element={lazyPage('Loading…', 'Preparing password reset.', <ForgotPassword />)} />
      <Route path={p('reset-password')} element={lazyPage('Loading…', 'Preparing reset form.', <ResetPassword />)} />
      <Route path={p('change-password')} element={lazyPage('Loading…', 'Preparing password change.', <ChangePassword />)} />
      <Route
        path={nested ? 'auth/confirm' : '/auth/confirm'}
        element={lazyPage('Signing in…', 'Completing secure sign-in.', <AuthConfirm />)}
      />
    </>
  );
}

/** Authenticated app pages — always relative (nested under layout route). */
export function appRouteElements() {
  return (
    <>
      <Route index element={lazyPage('Loading page…', undefined, <Dashboard />)} />
      <Route path="overview" element={lazyPage('Loading page…', undefined, <Overview />)} />
      <Route path="training" element={lazyPage('Loading page…', undefined, <Training />)} />
      <Route path="training/mpb" element={lazyPage('Loading page…', undefined, <Training section="mpb" />)} />
      <Route path="training/sedera" element={lazyPage('Loading page…', undefined, <Training section="sedera" />)} />
      <Route path="training/zion" element={lazyPage('Loading page…', undefined, <Training section="zion" />)} />
      <Route path="training/mpb-cards" element={lazyPage('Loading page…', undefined, <Training section="mpb-cards" />)} />
      <Route path="training/secure-hsa" element={lazyPage('Loading page…', undefined, <Training section="secure-hsa" />)} />
      <Route path="training/care-plus" element={lazyPage('Loading page…', undefined, <Training section="care-plus" />)} />
      <Route path="training/:moduleId" element={lazyPage('Loading page…', undefined, <TrainingModule />)} />
      <Route path="forms" element={lazyPage('Loading page…', undefined, <Forms />)} />
      <Route path="forms/advisor" element={lazyPage('Loading page…', undefined, <Forms section="advisor" />)} />
      <Route path="forms/employer" element={lazyPage('Loading page…', undefined, <Forms section="employer" />)} />
      <Route path="forms/member" element={lazyPage('Loading page…', undefined, <Forms section="member" />)} />
      <Route path="quick-links" element={lazyPage('Loading page…', undefined, <QuickLinks />)} />
      <Route path="sops" element={lazyPage('Loading page…', undefined, <SOPLibrary />)} />
      <Route path="sops/advisor-toolkit" element={lazyPage('Loading page…', undefined, <SOPLibrary section="advisor-toolkit" />)} />
      <Route path="sops/pricing-charts" element={lazyPage('Loading page…', undefined, <SOPLibrary section="pricing-charts" />)} />
      <Route path="sops/reference-materials" element={lazyPage('Loading page…', undefined, <SOPLibrary section="reference-materials" />)} />
      <Route path="sops/quick-reference" element={lazyPage('Loading page…', undefined, <SOPLibrary section="quick-reference" />)} />
      <Route path="sops/flyers-sedera" element={lazyPage('Loading page…', undefined, <SOPLibrary section="flyers-sedera" />)} />
      <Route path="sops/flyers" element={lazyPage('Loading page…', undefined, <SOPLibrary section="flyers" />)} />
      <Route path="sops/sharing-guidelines" element={lazyPage('Loading page…', undefined, <SOPLibrary section="sharing-guidelines" />)} />
      <Route path="sops/healthsharing-zion" element={lazyPage('Loading page…', undefined, <SOPLibrary section="healthsharing-zion" />)} />
      <Route path="sops/zion" element={lazyPage('Loading page…', undefined, <SOPLibrary section="zion" />)} />
      <Route path="sops/arm" element={lazyPage('Loading page…', undefined, <SOPLibrary section="arm" />)} />
      <Route path="sops/rx" element={lazyPage('Loading page…', undefined, <SOPLibrary section="rx" />)} />
      <Route path="sops/handbooks" element={lazyPage('Loading page…', undefined, <SOPLibrary section="handbooks" />)} />
      <Route path="sops/:documentId" element={lazyPage('Loading page…', undefined, <SOPDocument />)} />
      <Route path="bulletins" element={lazyPage('Loading page…', undefined, <Bulletins />)} />
      <Route path="bulletins/:slug" element={lazyPage('Loading page…', undefined, <BulletinDetail />)} />
      <Route path="videos" element={lazyPage('Loading page…', undefined, <VideoLibrary />)} />
      <Route path="submit-group" element={lazyPage('Loading page…', undefined, <SubmitGroup />)} />
      <Route path="contact" element={lazyPage('Loading page…', undefined, <Contact />)} />
      <Route path="tickets/new" element={lazyPage('Loading page…', undefined, <NewTicket />)} />
      <Route path="tickets/:ticketId" element={lazyPage('Loading page…', undefined, <TicketDetailPage />)} />
      <Route path="tickets" element={lazyPage('Loading page…', undefined, <Tickets />)} />
      <Route path="admin/tickets" element={lazyPage('Loading page…', undefined, <AdminTickets />)} />
      <Route path="add-advisor" element={lazyPage('Loading page…', undefined, <AddAdvisor />)} />
      <Route path="chat" element={lazyPage('Loading page…', undefined, <ChatPage />)} />
      <Route path="chat/:conversationId" element={lazyPage('Loading page…', undefined, <ChatPage />)} />
      <Route path="inbox" element={lazyPage('Loading page…', undefined, <Inbox />)} />
      <Route path="inbox/:conversationId" element={lazyPage('Loading page…', undefined, <ConversationThread />)} />
      <Route path="leads" element={lazyPage('Loading page…', undefined, <LeadsList />)} />
      <Route path="leads/:leadId" element={lazyPage('Loading page…', undefined, <AssignedLeadDetail />)} />
      <Route path="audit-log" element={lazyPage('Loading page…', undefined, <AuditLog />)} />
      <Route path="events/manage/new" element={lazyPage('Loading page…', undefined, <EventForm />)} />
      <Route path="events/manage/:eventId/edit" element={lazyPage('Loading page…', undefined, <EventForm />)} />
      <Route path="events/manage" element={lazyPage('Loading page…', undefined, <EventsManager />)} />
      <Route path="profile" element={lazyPage('Loading page…', undefined, <Profile />)} />
      <Route path="settings" element={lazyPage('Loading page…', undefined, <SettingsHub />)} />
      <Route path="settings/organization" element={lazyPage('Loading page…', undefined, <OrganizationSettings />)} />
      <Route path="settings/team" element={lazyPage('Loading page…', undefined, <TeamManagement />)} />
      <Route path="settings/notifications" element={lazyPage('Loading page…', undefined, <NotificationPreferences />)} />
      <Route path="settings/preferences" element={lazyPage('Loading page…', undefined, <UserPreferences />)} />
      <Route path="settings/api-keys" element={lazyPage('Loading page…', undefined, <ApiKeys />)} />
      <Route path="settings/integrations" element={lazyPage('Loading page…', undefined, <Integrations />)} />
    </>
  );
}
