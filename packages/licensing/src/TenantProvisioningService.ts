// ============================================================================
// Tenant Provisioning Service — Onboarding workflow for new SaaS customers
// ============================================================================

import { supabase } from '@mpbhealth/database';
import { licensingService } from './LicensingService';
import type { ModuleSlug, LicenseSource } from './types';

export interface ProvisionTenantInput {
  company_name: string;
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  plan_slug: string;
  billing_cycle: 'monthly' | 'yearly';
  addon_modules?: ModuleSlug[];
  trial_days?: number;
  discount_percent?: number;
  white_label?: {
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
  };
}

export interface ProvisioningResult {
  org_id: string;
  admin_user_id: string;
  subscription_id: string;
  activated_modules: string[];
  login_url: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  order: number;
}

export class TenantProvisioningService {
  /**
   * Full tenant provisioning: creates org, admin user, subscription, and modules
   */
  async provisionTenant(input: ProvisionTenantInput): Promise<ProvisioningResult> {
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('slug', input.plan_slug)
      .single();

    if (planError || !plan) {
      throw new Error(`Plan '${input.plan_slug}' not found`);
    }

    // 1. Create the organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: input.company_name,
        slug: input.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      })
      .select('id, name, slug, logo_url, brand_config, settings, subscription_tier, subscription_status, max_users, max_contacts, max_sequences, created_at, updated_at')
      .single();

    if (orgError) {
      console.error('[Provisioning] Failed to create org:', orgError);
      throw orgError;
    }

    // 2. Create admin user via edge function
    const { data: userResult, error: userError } = await supabase.functions.invoke('create-user', {
      body: {
        email: input.admin_email,
        first_name: input.admin_first_name,
        last_name: input.admin_last_name,
        org_id: org.id,
        role: 'owner',
      },
    });

    if (userError) {
      console.error('[Provisioning] Failed to create admin user:', userError);
      throw userError;
    }

    const adminUserId = userResult?.user_id || userResult?.id || '';

    // 3. Create subscription
    const now = new Date();
    const periodEnd = new Date(now);
    if (input.billing_cycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    let status: 'active' | 'trialing' = 'active';
    let trialStart = null;
    let trialEnd = null;

    if (input.trial_days && input.trial_days > 0) {
      status = 'trialing';
      trialStart = now.toISOString();
      trialEnd = new Date(now.getTime() + input.trial_days * 86400000).toISOString();
    }

    const { data: sub, error: subError } = await supabase
      .from('organization_subscriptions')
      .insert({
        org_id: org.id,
        plan_id: plan.id,
        billing_cycle: input.billing_cycle,
        status,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_start: trialStart,
        trial_end: trialEnd,
        discount_percent: input.discount_percent || 0,
      })
      .select('id, org_id, plan_id, billing_cycle, status, current_period_start, current_period_end, trial_start, trial_end, discount_percent, stripe_customer_id, canceled_at, created_at, updated_at')
      .single();

    if (subError) {
      console.error('[Provisioning] Failed to create subscription:', subError);
      throw subError;
    }

    // 4. Activate core modules
    await licensingService.activateCoreModules(org.id);
    const activatedModules: string[] = ['crm', 'admin-command-center', 'advisor-portal'];

    // 5. Activate requested add-on modules
    if (input.addon_modules) {
      for (const moduleSlug of input.addon_modules) {
        await licensingService.activateModule({
          org_id: org.id,
          module_slug: moduleSlug,
          license_source: 'addon',
          trial_days: input.trial_days,
        });
        activatedModules.push(moduleSlug);
      }
    }

    // 6. Set up white-label config if requested
    if (input.white_label) {
      const hasWhiteLabel = input.addon_modules?.includes('white-label-mobile');
      if (hasWhiteLabel) {
        await supabase.from('white_label_configs').insert({
          org_id: org.id,
          company_name: input.company_name,
          primary_color: input.white_label.primary_color || '#1a5c5c',
          secondary_color: input.white_label.secondary_color || '#2d8f6b',
          logo_url: input.white_label.logo_url || null,
        });
      }
    }

    // 7. Log provisioning event
    await supabase.from('billing_events').insert({
      org_id: org.id,
      subscription_id: sub.id,
      event_type: 'tenant.provisioned',
      description: `New tenant provisioned: ${input.company_name}`,
      data: {
        plan: input.plan_slug,
        billing_cycle: input.billing_cycle,
        addons: input.addon_modules || [],
        trial_days: input.trial_days,
      },
    });

    return {
      org_id: org.id,
      admin_user_id: adminUserId,
      subscription_id: sub.id,
      activated_modules: activatedModules,
      login_url: `https://crm.mpb.health/login?org=${org.id}`,
    };
  }

  /**
   * Get onboarding steps for a new tenant
   */
  async getOnboardingSteps(orgId: string): Promise<OnboardingStep[]> {
    const [orgResult, subResult, modulesResult, membersResult] = await Promise.all([
      supabase.from('organizations').select('id, name, slug, logo_url, brand_config, settings, subscription_tier, subscription_status, max_users, max_contacts, max_sequences, created_at, updated_at').eq('id', orgId).single(),
      supabase.from('organization_subscriptions').select('id, org_id, plan_id, billing_cycle, status, current_period_start, current_period_end, trial_start, trial_end, discount_percent, stripe_customer_id, canceled_at, created_at, updated_at').eq('org_id', orgId).single(),
      supabase.rpc('get_org_modules', { p_org_id: orgId }),
      supabase.from('org_memberships').select('id').eq('org_id', orgId),
    ]);

    const org = orgResult.data;
    const sub = subResult.data;
    const modules = modulesResult.data || [];
    const memberCount = membersResult.data?.length || 0;

    return [
      {
        id: 'create_org',
        title: 'Organization Created',
        description: 'Your organization has been set up',
        completed: !!org,
        required: true,
        order: 1,
      },
      {
        id: 'select_plan',
        title: 'Subscription Plan Selected',
        description: 'Choose a plan that fits your needs',
        completed: !!sub,
        required: true,
        order: 2,
      },
      {
        id: 'payment_method',
        title: 'Payment Method Added',
        description: 'Add a credit card or bank account',
        completed: sub?.stripe_customer_id != null,
        required: sub?.status !== 'trialing',
        order: 3,
      },
      {
        id: 'invite_team',
        title: 'Invite Team Members',
        description: 'Add your team to the platform',
        completed: memberCount > 1,
        required: false,
        order: 4,
      },
      {
        id: 'configure_crm',
        title: 'Configure CRM',
        description: 'Set up your sales pipeline and import contacts',
        completed: false,
        required: false,
        order: 5,
      },
      {
        id: 'add_modules',
        title: 'Explore Add-on Modules',
        description: 'Enhance your platform with EMS, ITSTS, Orbit, and more',
        completed: modules.length > 3,
        required: false,
        order: 6,
      },
    ];
  }

  /**
   * Deprovision a tenant (soft delete — marks everything as canceled)
   */
  async deprovisionTenant(orgId: string, reason?: string): Promise<void> {
    const now = new Date().toISOString();

    // Cancel subscription
    await supabase
      .from('organization_subscriptions')
      .update({ status: 'canceled', canceled_at: now })
      .eq('org_id', orgId);

    // Deactivate all module licenses
    await supabase
      .from('org_module_licenses')
      .update({ status: 'canceled', canceled_at: now })
      .eq('org_id', orgId);

    // Log event
    await supabase.from('billing_events').insert({
      org_id: orgId,
      event_type: 'tenant.deprovisioned',
      description: `Tenant deprovisioned${reason ? ': ' + reason : ''}`,
      data: { reason },
    });
  }
}

export const tenantProvisioningService = new TenantProvisioningService();
