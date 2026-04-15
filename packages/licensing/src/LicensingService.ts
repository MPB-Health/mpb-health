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
      .select('*')
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
    return data || [];
  }

  async getModule(slugOrId: string): Promise<ProductModule | null> {
    const { data, error } = await supabase
      .from('product_modules')
      .select('*')
      .or(`id.eq.${slugOrId},slug.eq.${slugOrId}`)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[LicensingService] Failed to get module:', error);
      throw error;
    }
    return data;
  }

  async getAddonModules(): Promise<ProductModule[]> {
    const { data, error } = await supabase
      .from('product_modules')
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true)
      .in('category', ['addon', 'standalone'])
      .order('sort_order');

    if (error) {
      console.error('[LicensingService] Failed to get addon modules:', error);
      throw error;
    }
    return data || [];
  }

  // =========================================================================
  // ORG MODULE LICENSES
  // =========================================================================

  async getOrgLicenses(orgId: string): Promise<OrgModuleLicenseWithModule[]> {
    const { data, error } = await supabase
      .from('org_module_licenses')
      .select('*, module:product_modules(*)')
      .eq('org_id', orgId)
      .in('status', ['active', 'trialing']);

    if (error) {
      console.error('[LicensingService] Failed to get org licenses:', error);
      throw error;
    }
    return data || [];
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
    return data;
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
    let query = supabase.from('feature_flags').select('*').order('slug');

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
    return data || [];
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
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[LicensingService] Failed to get white-label config:', error);
      throw error;
    }
    return data;
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
      .select()
      .single();

    if (error) {
      console.error('[LicensingService] Failed to upsert white-label config:', error);
      throw error;
    }
    return data;
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
