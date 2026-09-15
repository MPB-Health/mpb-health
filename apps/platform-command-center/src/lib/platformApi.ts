import { accounts } from './accountsClient';
import type {
  AppCatalogItem,
  Organization,
  OrgAppLicense,
  OrgInvitation,
  OrgMembership,
  OrgRole,
} from './types';
import { buildSsoLaunchUrl } from './types';

export async function listOrganizations(): Promise<Organization[]> {
  const { data, error } = await accounts
    .from('organizations')
    .select('id, name, slug, created_at')
    .order('name');
  if (error) throw error;
  return (data ?? []) as Organization[];
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const { data, error } = await accounts
    .from('organizations')
    .select('id, name, slug, created_at')
    .eq('id', orgId)
    .maybeSingle();
  if (error) throw error;
  return data as Organization | null;
}

export async function createOrganization(name: string, slug: string): Promise<string> {
  const { data, error } = await accounts.rpc('create_org', {
    p_name: name.trim(),
    p_slug: slug.trim().toLowerCase(),
  });
  if (error) throw error;
  return String(data);
}

export async function listApps(): Promise<AppCatalogItem[]> {
  const { data, error } = await accounts
    .from('apps')
    .select('slug, name, tagline, description, status, base_url, icon, sort_order')
    .order('sort_order');
  if (error) throw error;
  return (data ?? []) as AppCatalogItem[];
}

const LICENSE_COLUMNS =
  'id, org_id, app_slug, plan_id, status, seats, trial_ends_at, provisioned_at, created_at, updated_at, price_cents';
const INVITATION_COLUMNS =
  'id, org_id, email, role, token, status, invited_by, expires_at, created_at';

export async function listLicenses(orgId?: string): Promise<OrgAppLicense[]> {
  let query = accounts.from('org_app_licenses').select(LICENSE_COLUMNS).order('created_at');
  if (orgId) query = query.eq('org_id', orgId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as OrgAppLicense[];
}

export async function listInvitations(orgId?: string): Promise<OrgInvitation[]> {
  let query = accounts
    .from('org_invitations')
    .select(INVITATION_COLUMNS)
    .order('created_at', { ascending: false });
  if (orgId) query = query.eq('org_id', orgId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as OrgInvitation[];
}

export async function createInvitation(input: {
  orgId: string;
  email: string;
  role: OrgRole;
}): Promise<OrgInvitation> {
  const {
    data: { user },
    error: userError,
  } = await accounts.auth.getUser();
  if (userError || !user) throw userError ?? new Error('Not authenticated');

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await accounts
    .from('org_invitations')
    .insert({
      org_id: input.orgId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      token,
      status: 'pending',
      invited_by: user.id,
      expires_at: expiresAt,
    })
    .select(INVITATION_COLUMNS)
    .single();

  if (error) throw error;
  return data as OrgInvitation;
}

export async function listMemberships(orgId: string): Promise<OrgMembership[]> {
  const { data, error } = await accounts
    .from('org_memberships')
    .select('org_id, user_id, role, status')
    .eq('org_id', orgId);
  if (error) throw error;
  return (data ?? []) as OrgMembership[];
}

export async function checkOrgHasApp(orgId: string, appSlug: string): Promise<boolean> {
  const { data, error } = await accounts.rpc('org_has_app', {
    p_org: orgId,
    p_app: appSlug,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function launchSso(orgId: string, app: AppCatalogItem): Promise<string> {
  if (!app.base_url) {
    throw new Error(`${app.name} has no base_url configured`);
  }

  const { data, error } = await accounts.rpc('create_sso_ticket', {
    p_org: orgId,
    p_app: app.slug,
  });
  if (error) throw error;
  if (!data) throw new Error('SSO ticket was empty');

  return buildSsoLaunchUrl(app.base_url, String(data));
}
