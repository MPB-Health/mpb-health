// ============================================================================
// Licensing Service — Module access, feature flags, and white-label config
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type {
  ProductModule,
  OrgModuleLicense,
  OrgModuleLicenseWithModule,
  FeatureFlag,
  OrgFeatureOverride,
  OrgLicenseSummary,
  ActivateModuleInput,
  SetFeatureOverrideInput,
  ModuleSlug,
  WhiteLabelConfig,
  UpdateWhiteLabelInput,
} from './types';

export class LicensingService {
  // =========================================================================
  // MODULES
  // =========================================================================

  async getAvailableModules(options: { includePrivate?: boolean } = {}): Promise<ProductModule[]> {
    let query = supabase
      .from('product_modules')
      .select('id, slug, name, description, category, is_standalone, included_in_core, addon_price_monthly, addon_price_yearly, setup_fee, stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly, icon, color, sort_order, is_active, is_public, requires_modules, created_at, updated_at')
      .eq('is_active', true)
      .order('sort_order');

    if (!options.includePrivate) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[LicensingService] Failed to get modules:', error);
      throw error;
    }
    return (data || []) as any;
  }

  async getModule(slugOrId: string): Promise<ProductModule | null> {
    const { data, error } = await supabase
      .from('product_modules')
      .select('id, slug, name, description, category, is_standalone, included_in_core, addon_price_monthly, addon_price_yearly, setup_fee, stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly, icon, color, sort_order, is_active, is_public, requires_modules, created_at, updated_at')
      .or(`id.eq.${slugOrId},slug.eq.${slugOrId}`)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[LicensingService] Failed to get module:', error);
      throw error;
    }
    return data as any;
  }

  async getAddonModules(): Promise<ProductModule[]> {
    const { data, error } = await supabase
      .from('product_modules')
      .select('id, slug, name, description, category, is_standalone, included_in_core, addon_price_monthly, addon_price_yearly, setup_fee, stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly, icon, color, sort_order, is_active, is_public, requires_modules, created_at, updated_at')
      .eq('is_active', true)
      .eq('is_public', true)
      .in('category', ['addon', 'standalone'])
      .order('sort_order');

    if (error) {
      console.error('[LicensingService] Failed to get addon modules:', error);
      throw error;
    }
    return (data || []) as any;
  }

  // =========================================================================
  // ORG MODULE LICENSES
  // =========================================================================

  async getOrgLicenses(orgId: string): Promise<OrgModuleLicenseWithModule[]> {
    const { data, error } = await supabase
      .from('org_module_licenses')
      .select('id, org_id, module_id, status, license_source, trial_start, trial_end, stripe_subscription_item_id, activated_at, expires_at, canceled_at, custom_limits, notes, granted_by, created_at, updated_at, module:product_modules(id, slug, name, description, category, is_standalone, included_in_core, addon_price_monthly, addon_price_yearly, setup_fee, stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly, icon, color, sort_order, is_active, is_public, requires_modules, created_at, updated_at)')
      .eq('org_id', orgId)
      .in('status', ['active', 'trialing']);

    if (error) {
      console.error('[LicensingService] Failed to get org licenses:', error);
      throw error;
    }
    return (data || []) as any;
  }

  async orgHasModule(orgId: string, moduleSlug: ModuleSlug): Promise<boolean> {
    const { data, error } = await supabase.rpc('org_has_module', {
      p_org_id: orgId,
      p_module_slug: moduleSlug,
    });

    if (error) {
      console.error('[LicensingService] Failed to check module access:', error);
      return false;
    }
    return data ?? false;
  }

  async activateModule(input: ActivateModuleInput): Promise<string> {
    const { data, error } = await supabase.rpc('activate_module_for_org', {
      p_org_id: input.org_id,
      p_module_slug: input.module_slug,
      p_license_source: input.license_source || 'addon',
      p_trial_days: input.trial_days ?? null,
    });

    if (error) {
      console.error('[LicensingService] Failed to activate module:', error);
      throw error;
    }
    return data as any;
  }

  async deactivateModule(orgId: string, moduleSlug: ModuleSlug): Promise<void> {
    const module = await this.getModule(moduleSlug);
    if (!module) throw new Error(`Module ${moduleSlug} not found`);

    const { error } = await supabase
      .from('org_module_licenses')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('org_id', orgId)
      .eq('module_id', module.id);

    if (error) {
      console.error('[LicensingService] Failed to deactivate module:', error);
      throw error;
    }
  }

  async activateCoreModules(orgId: string): Promise<void> {
    const coreModules = await supabase
      .from('product_modules')
      .select('slug')
      .eq('included_in_core', true)
      .eq('is_active', true);

    if (coreModules.error) throw coreModules.error;

    await Promise.all(
      (coreModules.data || []).map(m =>
        this.activateModule({
          org_id: orgId,
          module_slug: m.slug as ModuleSlug,
          license_source: 'core_included',
        })
      )
    );
  }

  // =========================================================================
  // FEATURE FLAGS
  // =========================================================================

  async getFeatureFlags(moduleSlug?: string): Promise<FeatureFlag[]> {
    let query = supabase.from('feature_flags').select('id, slug, name, description, module_id, enabled_by_default, min_plan_tier, category, is_beta, created_at, updated_at').order('slug');

    if (moduleSlug) {
      const module = await this.getModule(moduleSlug);
      if (module) {
        query = query.eq('module_id', module.id);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error('[LicensingService] Failed to get feature flags:', error);
      throw error;
    }
    return (data || []) as any;
  }

  async orgHasFeature(orgId: string, featureSlug: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('org_has_feature', {
      p_org_id: orgId,
      p_feature_slug: featureSlug,
    });

    if (error) {
      console.error('[LicensingService] Failed to check feature:', error);
      return false;
    }
    return data ?? false;
  }

  async setFeatureOverride(input: SetFeatureOverrideInput): Promise<void> {
    const flag = await supabase
      .from('feature_flags')
      .select('id')
      .eq('slug', input.feature_slug)
      .single();

    if (flag.error) throw flag.error;

    const { error } = await supabase
      .from('org_feature_overrides')
      .upsert({
        org_id: input.org_id,
        feature_id: flag.data.id,
        enabled: input.enabled,
        reason: input.reason || null,
      }, { onConflict: 'org_id,feature_id' });

    if (error) {
      console.error('[LicensingService] Failed to set feature override:', error);
      throw error;
    }
  }

  async removeFeatureOverride(orgId: string, featureSlug: string): Promise<void> {
    const flag = await supabase
      .from('feature_flags')
      .select('id')
      .eq('slug', featureSlug)
      .single();

    if (flag.error) throw flag.error;

    const { error } = await supabase
      .from('org_feature_overrides')
      .delete()
      .eq('org_id', orgId)
      .eq('feature_id', flag.data.id);

    if (error) {
      console.error('[LicensingService] Failed to remove feature override:', error);
      throw error;
    }
  }

  // =========================================================================
  // LICENSE SUMMARY
  // =========================================================================

  async getOrgLicenseSummary(orgId: string): Promise<OrgLicenseSummary> {
    const [modulesResult, featuresResult] = await Promise.all([
      supabase.rpc('get_org_modules', { p_org_id: orgId }),
      supabase.rpc('get_org_features', { p_org_id: orgId }),
    ]);

    if (modulesResult.error) throw modulesResult.error;
    if (featuresResult.error) throw featuresResult.error;

    return {
      org_id: orgId,
      modules: modulesResult.data || [],
      features: featuresResult.data || [],
    };
  }

  // =========================================================================
  // WHITE-LABEL CONFIGURATION
  // =========================================================================

  async getWhiteLabelConfig(orgId: string): Promise<WhiteLabelConfig | null> {
    const { data, error } = await supabase
      .from('white_label_configs')
      .select('id, org_id, company_name, logo_url, logo_dark_url, favicon_url, app_icon_url, splash_screen_url, primary_color, secondary_color, accent_color, background_color, text_color, header_color, sidebar_color, font_family, heading_font_family, custom_domain, domain_verified, domain_verified_at, ssl_certificate_status, mobile_app_name, mobile_bundle_id_ios, mobile_bundle_id_android, app_store_url, play_store_url, mobile_build_status, last_build_at, show_powered_by, custom_login_page, custom_email_templates, custom_sms_sender_id, meta_title, meta_description, og_image_url, support_email, support_phone, support_url, terms_url, privacy_url, is_active, created_at, updated_at')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[LicensingService] Failed to get white-label config:', error);
      throw error;
    }
    return data as any;
  }

  async upsertWhiteLabelConfig(orgId: string, input: UpdateWhiteLabelInput): Promise<WhiteLabelConfig> {
    const hasModule = await this.orgHasModule(orgId, 'white-label-mobile');
    if (!hasModule) {
      throw new Error('Organization does not have the White-Label Mobile module');
    }

    const { data, error } = await supabase
      .from('white_label_configs')
      .upsert({
        org_id: orgId,
        company_name: input.company_name || 'My App',
        ...input,
      }, { onConflict: 'org_id' })
      .select('id, org_id, company_name, logo_url, logo_dark_url, favicon_url, app_icon_url, splash_screen_url, primary_color, secondary_color, accent_color, background_color, text_color, header_color, sidebar_color, font_family, heading_font_family, custom_domain, domain_verified, domain_verified_at, ssl_certificate_status, mobile_app_name, mobile_bundle_id_ios, mobile_bundle_id_android, app_store_url, play_store_url, mobile_build_status, last_build_at, show_powered_by, custom_login_page, custom_email_templates, custom_sms_sender_id, meta_title, meta_description, og_image_url, support_email, support_phone, support_url, terms_url, privacy_url, is_active, created_at, updated_at')
      .single();

    if (error) {
      console.error('[LicensingService] Failed to upsert white-label config:', error);
      throw error;
    }
    return data as any;
  }

  async requestMobileBuild(orgId: string): Promise<void> {
    const config = await this.getWhiteLabelConfig(orgId);
    if (!config) throw new Error('White-label config not found');
    if (!config.mobile_app_name || !config.app_icon_url) {
      throw new Error('Mobile app name and icon are required before requesting a build');
    }

    const { error } = await supabase
      .from('white_label_configs')
      .update({ mobile_build_status: 'queued' })
      .eq('org_id', orgId);

    if (error) {
      console.error('[LicensingService] Failed to request mobile build:', error);
      throw error;
    }
  }
}

export const licensingService = new LicensingService();
