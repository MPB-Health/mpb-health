// ============================================================================
// Tenant Admin Service — super-admin org + portal provisioning
// ============================================================================

import { supabase } from '@mpbhealth/database';

export interface AdminOrganization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

export type PortalSlug = 'admin' | 'advisor' | 'concierge' | 'staff_hub' | 'crm' | 'member';

export interface OrgPortalAccessRow {
  id: string;
  org_id: string;
  portal_slug: PortalSlug;
  enabled: boolean;
  custom_domain: string | null;
  settings: Record<string, unknown>;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  subscription_tier?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  slug?: string;
  logo_url?: string | null;
  subscription_tier?: string;
  subscription_status?: string;
}

const PORTAL_SLUGS: PortalSlug[] = ['admin', 'advisor', 'concierge', 'staff_hub', 'crm', 'member'];

export class TenantAdminService {
  async listOrganizations(): Promise<AdminOrganization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug, logo_url, subscription_tier, subscription_status, created_at, updated_at')
      .order('name');

    if (error) throw error;
    return (data ?? []) as AdminOrganization[];
  }

  async getOrganization(orgId: string): Promise<AdminOrganization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug, logo_url, subscription_tier, subscription_status, created_at, updated_at')
      .eq('id', orgId)
      .maybeSingle();

    if (error) throw error;
    return data as AdminOrganization | null;
  }

  async createOrganization(input: CreateOrganizationInput): Promise<AdminOrganization> {
    const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: input.name.trim(),
        slug,
        subscription_tier: input.subscription_tier ?? 'professional',
        subscription_status: 'active',
      })
      .select('id, name, slug, logo_url, subscription_tier, subscription_status, created_at, updated_at')
      .single();

    if (error) throw error;

    // Default portal rows — disabled until admin enables
    for (const portal_slug of PORTAL_SLUGS) {
      await supabase.from('org_portal_access').upsert(
        {
          org_id: data.id,
          portal_slug,
          enabled: portal_slug === 'advisor',
          custom_domain: null,
        },
        { onConflict: 'org_id,portal_slug' },
      );
    }

    return data as AdminOrganization;
  }

  async updateOrganization(orgId: string, patch: UpdateOrganizationInput): Promise<AdminOrganization> {
    const { data, error } = await supabase
      .from('organizations')
      .update(patch)
      .eq('id', orgId)
      .select('id, name, slug, logo_url, subscription_tier, subscription_status, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as AdminOrganization;
  }

  async listPortalAccess(orgId: string): Promise<OrgPortalAccessRow[]> {
    const { data, error } = await supabase
      .from('org_portal_access')
      .select('id, org_id, portal_slug, enabled, custom_domain, settings')
      .eq('org_id', orgId)
      .order('portal_slug');

    if (error) throw error;
    return (data ?? []) as OrgPortalAccessRow[];
  }

  async upsertPortalAccess(input: {
    org_id: string;
    portal_slug: PortalSlug;
    enabled: boolean;
    custom_domain?: string | null;
  }): Promise<OrgPortalAccessRow> {
    const { data, error } = await supabase
      .from('org_portal_access')
      .upsert(
        {
          org_id: input.org_id,
          portal_slug: input.portal_slug,
          enabled: input.enabled,
          custom_domain: input.custom_domain?.trim() || null,
        },
        { onConflict: 'org_id,portal_slug' },
      )
      .select('id, org_id, portal_slug, enabled, custom_domain, settings')
      .single();

    if (error) throw error;
    return data as OrgPortalAccessRow;
  }

  getPortalSlugs(): PortalSlug[] {
    return [...PORTAL_SLUGS];
  }
}

export const tenantAdminService = new TenantAdminService();
