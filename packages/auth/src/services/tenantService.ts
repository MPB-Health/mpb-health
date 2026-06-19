// ============================================================================
// Tenant Service — hostname → org resolution and portal access
// ============================================================================

import { supabase } from '@mpbhealth/database';
import { DEFAULT_ORG_ID, DEFAULT_ORG_ID_ALT } from './orgService';

export type PortalSlug = 'admin' | 'advisor' | 'concierge' | 'staff_hub' | 'crm' | 'member';

/**
 * Hostnames that use /{tenantSlug}/… URL prefixes per portal.
 * Advisor AOS: aos.aryxcloud.com — Concierge ARYX: concierge.aryxcloud.com
 */
const PATH_TENANT_PLATFORM_HOSTS: Partial<Record<PortalSlug, ReadonlySet<string>>> = {
  advisor: new Set(['aos.aryxcloud.com']),
  concierge: new Set(['concierge.aryxcloud.com']),
};

/** First path segments that are never tenant slugs on AOS hosts. */
const RESERVED_PATH_SEGMENTS = new Set([
  'login',
  'landing',
  'forgot-password',
  'reset-password',
  'change-password',
  'auth',
  'api',
  'assets',
  'favicon.ico',
]);

const TENANT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface OrgPortalAccess {
  id: string;
  org_id: string;
  portal_slug: PortalSlug;
  enabled: boolean;
  custom_domain: string | null;
  settings: Record<string, unknown>;
}

export interface ResolvedTenant {
  orgId: string;
  orgName: string;
  orgSlug: string;
  portalSlug: PortalSlug;
  portalAccess: OrgPortalAccess | null;
}

function pathTenantPlatformEnvEnabled(portalSlug: PortalSlug): boolean {
  if (typeof import.meta === 'undefined') return false;
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  if (portalSlug === 'advisor') {
    const flag = env?.VITE_AOS_PLATFORM?.trim();
    return flag === '1' || flag === 'true';
  }
  if (portalSlug === 'concierge') {
    const flag = env?.VITE_CONCIERGE_PATH_PLATFORM?.trim();
    return flag === '1' || flag === 'true';
  }
  return false;
}

/** True when this portal uses /{tenantSlug}/… on its ARYX platform host. */
export function isPathTenantPlatformHost(
  hostname?: string,
  portalSlug: PortalSlug = 'advisor',
): boolean {
  const host = (hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '')).toLowerCase();
  const hosts = PATH_TENANT_PLATFORM_HOSTS[portalSlug];
  if (hosts?.has(host)) return true;
  if (host === 'localhost' || host === '127.0.0.1') return pathTenantPlatformEnvEnabled(portalSlug);
  return false;
}

/** Advisor AOS only (aos.aryxcloud.com). Never true on advisor.mpb.health. */
export function isAosPlatformHost(hostname?: string): boolean {
  return isPathTenantPlatformHost(hostname, 'advisor');
}

/** Parse /{tenantSlug}/… from the pathname on AOS hosts; null for reserved/global paths. */
export function parsePathTenantSlug(pathname: string): string | null {
  const segment = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  if (!segment || RESERVED_PATH_SEGMENTS.has(segment) || !TENANT_SLUG_PATTERN.test(segment)) {
    return null;
  }
  return segment;
}

/** Prefix an in-app path with /{tenantSlug} on path-tenant platform hosts; no-op on MPB hosts. */
export function prefixTenantPath(
  path: string,
  tenantSlug: string,
  hostname?: string,
  portalSlug: PortalSlug = 'advisor',
): string {
  if (!tenantSlug || !isPathTenantPlatformHost(hostname, portalSlug)) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === `/${tenantSlug}` || normalized.startsWith(`/${tenantSlug}/`)) {
    return normalized;
  }
  return normalized === '/' ? `/${tenantSlug}` : `/${tenantSlug}${normalized}`;
}

/** Dev override via Vite env (e.g. VITE_TENANT_ORG_ID) */
function devOrgOverride(): string | null {
  if (typeof import.meta === 'undefined') return null;
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  const id = env?.VITE_TENANT_ORG_ID?.trim();
  return id || null;
}

/** Map localhost dev ports → portal slug */
const DEV_PORT_PORTAL: Record<string, PortalSlug> = {
  '5175': 'advisor',
  '5176': 'admin',
  '5178': 'staff_hub',
  '5179': 'concierge',
  '5174': 'crm',
};

/**
 * Resolve which portal slug this hostname + port represents.
 */
export function resolvePortalSlugFromHost(hostname: string, port?: string): PortalSlug {
  const host = hostname.toLowerCase();
  if (host.includes('concierge')) return 'concierge';
  if (host.includes('advisor')) return 'advisor';
  if (host.includes('admin')) return 'admin';
  if (host.includes('crm')) return 'crm';
  if (host.includes('portal.') || host.includes('staff')) return 'staff_hub';
  if (port && DEV_PORT_PORTAL[port]) return DEV_PORT_PORTAL[port];
  return 'advisor';
}

/** Resolve org by URL slug on AOS (/{tenantSlug}/…). */
async function resolveTenantByOrgSlug(
  orgSlug: string,
  portalSlug: PortalSlug,
): Promise<ResolvedTenant | null> {
  const slug = orgSlug.trim().toLowerCase();
  if (!slug) return null;

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (orgError) {
    console.error('[TenantService] organizations slug lookup failed:', orgError);
    return null;
  }
  if (!org) return null;

  const { data: access, error: accessError } = await supabase
    .from('org_portal_access')
    .select('id, org_id, portal_slug, enabled, custom_domain, settings')
    .eq('org_id', org.id)
    .eq('portal_slug', portalSlug)
    .eq('enabled', true)
    .maybeSingle();

  if (accessError) {
    console.error('[TenantService] org_portal_access lookup failed:', accessError);
  }

  return {
    orgId: org.id,
    orgName: org.name,
    orgSlug: org.slug,
    portalSlug,
    portalAccess: (access as OrgPortalAccess | null) ?? null,
  };
}

/**
 * Unified tenant resolution: AOS path slug on ARYX hosts, hostname mapping elsewhere (MPB default).
 */
export async function resolveTenantForPortal(input: {
  hostname: string;
  portalSlug: PortalSlug;
  pathTenantSlug?: string | null;
}): Promise<ResolvedTenant | null> {
  const { hostname, portalSlug, pathTenantSlug } = input;

  if (isPathTenantPlatformHost(hostname, portalSlug)) {
    if (!pathTenantSlug) return null;
    return resolveTenantByOrgSlug(pathTenantSlug, portalSlug);
  }

  return resolveTenantFromHostname(hostname, portalSlug);
}

/**
 * Look up org by custom domain + portal slug from org_portal_access.
 */
export async function resolveTenantFromHostname(
  hostname: string,
  portalSlug: PortalSlug,
): Promise<ResolvedTenant | null> {
  const override = devOrgOverride();
  if (override) {
    const org = await fetchOrgById(override);
    if (!org) return null;
    return {
      orgId: org.id,
      orgName: org.name,
      orgSlug: org.slug,
      portalSlug,
      portalAccess: null,
    };
  }

  const host = hostname.toLowerCase().replace(/^www\./, '');

  const { data: accessRows, error } = await supabase
    .from('org_portal_access')
    .select('id, org_id, portal_slug, enabled, custom_domain, settings')
    .eq('portal_slug', portalSlug)
    .eq('enabled', true);

  if (error) {
    console.error('[TenantService] org_portal_access lookup failed:', error);
    return fallbackTenant(portalSlug);
  }

  const match = (accessRows ?? []).find((row) => {
    const domain = (row.custom_domain as string | null)?.toLowerCase().replace(/^www\./, '');
    return domain === host;
  });

  if (match) {
    return buildResolvedTenant(match as OrgPortalAccess, portalSlug);
  }

  return fallbackTenant(portalSlug);
}

/** Default MPB tenant when hostname is not mapped (backward compatible). */
async function fallbackTenant(portalSlug: PortalSlug): Promise<ResolvedTenant | null> {
  const { data } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', 'mpb-health')
    .maybeSingle();
  const org =
    data ??
    (await fetchOrgById(DEFAULT_ORG_ID_ALT)) ??
    (await fetchOrgById(DEFAULT_ORG_ID));
  if (!org) return null;
  return {
    orgId: org.id,
    orgName: org.name,
    orgSlug: org.slug,
    portalSlug,
    portalAccess: null,
  };
}

async function buildResolvedTenant(
  access: OrgPortalAccess,
  portalSlug: PortalSlug,
): Promise<ResolvedTenant> {
  const org = await fetchOrgById(access.org_id);
  return {
    orgId: access.org_id,
    orgName: org?.name ?? 'Organization',
    orgSlug: org?.slug ?? 'mpb-health',
    portalSlug,
    portalAccess: access,
  };
}

async function fetchOrgById(orgId: string): Promise<{ id: string; name: string; slug: string } | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('id', orgId)
    .maybeSingle();

  if (error) {
    console.error('[TenantService] organizations lookup failed:', error);
    return null;
  }
  return data;
}

/** List all portal access rows for an org (admin). */
export async function listOrgPortalAccess(orgId: string): Promise<OrgPortalAccess[]> {
  const { data, error } = await supabase
    .from('org_portal_access')
    .select('id, org_id, portal_slug, enabled, custom_domain, settings')
    .eq('org_id', orgId)
    .order('portal_slug');

  if (error) throw error;
  return (data ?? []) as OrgPortalAccess[];
}

/** Upsert portal access for an org (admin). */
export async function upsertOrgPortalAccess(input: {
  org_id: string;
  portal_slug: PortalSlug;
  enabled: boolean;
  custom_domain?: string | null;
  settings?: Record<string, unknown>;
}): Promise<OrgPortalAccess> {
  const { data, error } = await supabase
    .from('org_portal_access')
    .upsert(
      {
        org_id: input.org_id,
        portal_slug: input.portal_slug,
        enabled: input.enabled,
        custom_domain: input.custom_domain?.trim() || null,
        settings: input.settings ?? {},
      },
      { onConflict: 'org_id,portal_slug' },
    )
    .select('id, org_id, portal_slug, enabled, custom_domain, settings')
    .single();

  if (error) throw error;
  return data as OrgPortalAccess;
}

export const tenantService = {
  resolvePortalSlugFromHost,
  resolveTenantFromHostname,
  resolveTenantForPortal,
  isAosPlatformHost,
  isPathTenantPlatformHost,
  parsePathTenantSlug,
  prefixTenantPath,
  listOrgPortalAccess,
  upsertOrgPortalAccess,
  DEFAULT_ORG_ID,
};
