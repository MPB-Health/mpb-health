import React from 'react';

/** Route module factories for lazy loading + prefetching. */
export const routeModules = {
  Dashboard: () => import('../pages/Dashboard'),
  Overview: () => import('../pages/Overview'),
  Training: () => import('../pages/Training'),
  TrainingModule: () => import('../pages/TrainingModule'),
  Forms: () => import('../pages/Forms'),
  QuickLinks: () => import('../pages/QuickLinks'),
  SOPLibrary: () => import('../pages/SOPLibrary'),
  SOPDocument: () => import('../pages/SOPDocument'),
  Bulletins: () => import('../pages/Bulletins'),
  BulletinDetail: () => import('../pages/BulletinDetail'),
  SubmitGroup: () => import('../pages/SubmitGroup'),
  Contact: () => import('../pages/Contact'),
  Profile: () => import('../pages/Profile'),
  Inbox: () => import('../pages/Inbox'),
  ConversationThread: () => import('../pages/ConversationThread'),
  LeadsList: () => import('../pages/LeadsList'),
  AssignedLeadDetail: () => import('../pages/AssignedLeadDetail'),
  AuditLog: () => import('../pages/AuditLog'),
  VideoLibrary: () => import('../pages/VideoLibrary'),
  Tickets: () => import('../pages/Tickets'),
  TicketDetailPage: () => import('../pages/TicketDetailPage'),
  NewTicket: () => import('../pages/NewTicket'),
  ChatPage: () => import('../pages/Chat'),
  AdminTickets: () => import('../pages/AdminTickets'),
  EventsManager: () => import('../pages/EventsManager'),
  EventForm: () => import('../pages/EventForm'),
  AddAdvisor: () => import('../pages/AddAdvisor'),
  LandingPage: () => import('../pages/LandingPage'),
  Login: () => import('../pages/Login'),
  ForgotPassword: () => import('../pages/ForgotPassword'),
  ResetPassword: () => import('../pages/ResetPassword'),
  ChangePassword: () => import('../pages/ChangePassword'),
  AuthConfirm: () => import('../pages/AuthConfirm'),
  SettingsHub: () => import('../pages/settings/SettingsHub'),
  OrganizationSettings: () => import('../pages/settings/OrganizationSettings'),
  TeamManagement: () => import('../pages/settings/TeamManagement'),
  NotificationPreferences: () => import('../pages/settings/NotificationPreferences'),
  UserPreferences: () => import('../pages/settings/UserPreferences'),
  ApiKeys: () => import('../pages/settings/ApiKeys'),
  Integrations: () => import('../pages/settings/Integrations'),
} as const;

const prefetched = new Set<string>();

export function prefetchRoute(name: keyof typeof routeModules) {
  if (prefetched.has(name)) return;
  prefetched.add(name);
  routeModules[name]().catch(() => prefetched.delete(name));
}

export const pathToModule: Record<string, keyof typeof routeModules> = {
  '/': 'Dashboard',
  '/overview': 'Overview',
  '/training': 'Training',
  '/forms': 'Forms',
  '/quick-links': 'QuickLinks',
  '/sops': 'SOPLibrary',
  '/bulletins': 'Bulletins',
  '/videos': 'VideoLibrary',
  '/tickets': 'Tickets',
  '/tickets/new': 'NewTicket',
  '/contact': 'Contact',
  '/submit-group': 'SubmitGroup',
  '/chat': 'ChatPage',
  '/inbox': 'Inbox',
  '/leads': 'LeadsList',
  '/profile': 'Profile',
  '/settings': 'SettingsHub',
  '/audit-log': 'AuditLog',
  '/events/manage': 'EventsManager',
};

export function prefetchRouteByPath(path: string) {
  const mod = pathToModule[path];
  if (mod) prefetchRoute(mod);
}

export const Dashboard = React.lazy(routeModules.Dashboard);
export const Overview = React.lazy(routeModules.Overview);
export const Training = React.lazy(routeModules.Training);
export const TrainingModule = React.lazy(routeModules.TrainingModule);
export const Forms = React.lazy(routeModules.Forms);
export const QuickLinks = React.lazy(routeModules.QuickLinks);
export const SOPLibrary = React.lazy(routeModules.SOPLibrary);
export const SOPDocument = React.lazy(routeModules.SOPDocument);
export const Bulletins = React.lazy(routeModules.Bulletins);
export const BulletinDetail = React.lazy(routeModules.BulletinDetail);
export const SubmitGroup = React.lazy(routeModules.SubmitGroup);
export const Contact = React.lazy(routeModules.Contact);
export const Profile = React.lazy(routeModules.Profile);
export const Inbox = React.lazy(routeModules.Inbox);
export const ConversationThread = React.lazy(routeModules.ConversationThread);
export const LeadsList = React.lazy(routeModules.LeadsList);
export const AssignedLeadDetail = React.lazy(routeModules.AssignedLeadDetail);
export const AuditLog = React.lazy(routeModules.AuditLog);
export const VideoLibrary = React.lazy(routeModules.VideoLibrary);
export const Tickets = React.lazy(routeModules.Tickets);
export const TicketDetailPage = React.lazy(routeModules.TicketDetailPage);
export const NewTicket = React.lazy(routeModules.NewTicket);
export const ChatPage = React.lazy(routeModules.ChatPage);
export const AdminTickets = React.lazy(routeModules.AdminTickets);
export const EventsManager = React.lazy(routeModules.EventsManager);
export const EventForm = React.lazy(routeModules.EventForm);
export const AddAdvisor = React.lazy(routeModules.AddAdvisor);
export const LandingPage = React.lazy(routeModules.LandingPage);
export const Login = React.lazy(routeModules.Login);
export const ForgotPassword = React.lazy(routeModules.ForgotPassword);
export const ResetPassword = React.lazy(routeModules.ResetPassword);
export const ChangePassword = React.lazy(routeModules.ChangePassword);
export const AuthConfirm = React.lazy(routeModules.AuthConfirm);
export const SettingsHub = React.lazy(routeModules.SettingsHub);
export const OrganizationSettings = React.lazy(routeModules.OrganizationSettings);
export const TeamManagement = React.lazy(routeModules.TeamManagement);
export const NotificationPreferences = React.lazy(routeModules.NotificationPreferences);
export const UserPreferences = React.lazy(routeModules.UserPreferences);
export const ApiKeys = React.lazy(routeModules.ApiKeys);
export const Integrations = React.lazy(routeModules.Integrations);

if (typeof window !== 'undefined') {
  const ric = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1));

  ric(
    () => {
      prefetchRoute('Dashboard');
      prefetchRoute('Bulletins');
      prefetchRoute('Training');
      prefetchRoute('QuickLinks');
      prefetchRoute('Forms');
      prefetchRoute('SOPLibrary');
      prefetchRoute('Tickets');
      prefetchRoute('VideoLibrary');
    },
    { timeout: 3000 },
  );

  ric(
    () => {
      const alreadyQueued = new Set([
        'Dashboard', 'Bulletins', 'Training', 'QuickLinks',
        'Forms', 'SOPLibrary', 'Tickets', 'VideoLibrary',
      ]);
      (Object.keys(routeModules) as (keyof typeof routeModules)[]).forEach((name) => {
        if (!alreadyQueued.has(name)) prefetchRoute(name);
      });
    },
    { timeout: 8000 },
  );
}
