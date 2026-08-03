export type OrgRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';
export type AppStatus = 'available' | 'coming_soon' | 'retired';
export type LicenseStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | string;

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at?: string | null;
}

export interface AppCatalogItem {
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  status: AppStatus;
  base_url: string | null;
  icon: string | null;
  sort_order: number | null;
}

export interface OrgAppLicense {
  id: string;
  org_id: string;
  app_slug: string;
  plan_id: string | null;
  status: LicenseStatus;
  seats: number | null;
  trial_ends_at: string | null;
  provisioned_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  price_cents: number | null;
}

export interface OrgInvitation {
  id: string;
  org_id: string;
  email: string;
  role: OrgRole;
  token: string;
  status: InvitationStatus;
  invited_by: string | null;
  expires_at: string | null;
  created_at: string | null;
}

export interface OrgMembership {
  org_id: string;
  user_id: string;
  role: OrgRole;
  status: string;
}

export function isEntitledNow(license: Pick<OrgAppLicense, 'status' | 'trial_ends_at'>): boolean {
  if (license.status !== 'active' && license.status !== 'trialing') return false;
  if (!license.trial_ends_at) return true;
  return new Date(license.trial_ends_at).getTime() > Date.now();
}

export function buildSsoLaunchUrl(baseUrl: string, ticket: string): string {
  const path = (import.meta.env.VITE_SSO_PATH || '/sso').trim() || '/sso';
  const root = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${root}${normalizedPath}`);
  url.searchParams.set('ticket', ticket);
  return url.toString();
}
