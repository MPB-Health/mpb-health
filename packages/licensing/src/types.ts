// ============================================================================
// Module Licensing & Feature Gating Types
// ============================================================================

export type ModuleCategory = 'core' | 'addon' | 'standalone';
export type LicenseStatus = 'active' | 'trialing' | 'suspended' | 'expired' | 'canceled';
export type LicenseSource = 'core_included' | 'addon' | 'standalone' | 'trial' | 'custom';

export type ModuleSlug =
  | 'crm'
  | 'admin-command-center'
  | 'advisor-portal'
  | 'champion-ems'
  | 'itsts'
  | 'orbit'
  | 'white-label-mobile'
  | 'app-admin';

export interface ProductModule {
  id: string;
  slug: ModuleSlug;
  name: string;
  description: string | null;
  category: ModuleCategory;
  is_standalone: boolean;
  included_in_core: boolean;
  addon_price_monthly: number | null;
  addon_price_yearly: number | null;
  setup_fee: number | null;
  stripe_product_id: string | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  is_public: boolean;
  requires_modules: string[];
  created_at: string;
  updated_at: string;
}

export interface OrgModuleLicense {
  id: string;
  org_id: string;
  module_id: string;
  status: LicenseStatus;
  license_source: LicenseSource;
  trial_start: string | null;
  trial_end: string | null;
  stripe_subscription_item_id: string | null;
  activated_at: string;
  expires_at: string | null;
  canceled_at: string | null;
  custom_limits: Record<string, number>;
  notes: string | null;
  granted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrgModuleLicenseWithModule extends OrgModuleLicense {
  module: ProductModule;
}

export interface FeatureFlag {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  module_id: string | null;
  enabled_by_default: boolean;
  min_plan_tier: string | null;
  category: string | null;
  is_beta: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrgFeatureOverride {
  id: string;
  org_id: string;
  feature_id: string;
  enabled: boolean;
  reason: string | null;
  set_by: string | null;
  created_at: string;
  updated_at: string;
}

// Input types
export interface ActivateModuleInput {
  org_id: string;
  module_slug: ModuleSlug;
  license_source?: LicenseSource;
  trial_days?: number;
}

export interface SetFeatureOverrideInput {
  org_id: string;
  feature_slug: string;
  enabled: boolean;
  reason?: string;
}

// Summary types
export interface OrgLicenseSummary {
  org_id: string;
  modules: {
    slug: string;
    name: string;
    category: string;
    license_source: string;
    status: string;
    activated_at: string;
    expires_at: string | null;
  }[];
  features: {
    slug: string;
    name: string;
    category: string;
    source: string;
  }[];
}

// White-label types
export interface WhiteLabelConfig {
  id: string;
  org_id: string;
  company_name: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  app_icon_url: string | null;
  splash_screen_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string | null;
  text_color: string | null;
  header_color: string | null;
  sidebar_color: string | null;
  font_family: string | null;
  heading_font_family: string | null;
  custom_domain: string | null;
  domain_verified: boolean;
  domain_verified_at: string | null;
  ssl_certificate_status: string;
  mobile_app_name: string | null;
  mobile_bundle_id_ios: string | null;
  mobile_bundle_id_android: string | null;
  app_store_url: string | null;
  play_store_url: string | null;
  mobile_build_status: string;
  last_build_at: string | null;
  show_powered_by: boolean;
  custom_login_page: boolean;
  custom_email_templates: boolean;
  custom_sms_sender_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  support_email: string | null;
  support_phone: string | null;
  support_url: string | null;
  terms_url: string | null;
  privacy_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateWhiteLabelInput {
  company_name?: string;
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  app_icon_url?: string;
  splash_screen_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  header_color?: string;
  sidebar_color?: string;
  font_family?: string;
  heading_font_family?: string;
  custom_domain?: string;
  mobile_app_name?: string;
  mobile_bundle_id_ios?: string;
  mobile_bundle_id_android?: string;
  show_powered_by?: boolean;
  custom_login_page?: boolean;
  custom_email_templates?: boolean;
  custom_sms_sender_id?: string;
  meta_title?: string;
  meta_description?: string;
  og_image_url?: string;
  support_email?: string;
  support_phone?: string;
  support_url?: string;
  terms_url?: string;
  privacy_url?: string;
}
