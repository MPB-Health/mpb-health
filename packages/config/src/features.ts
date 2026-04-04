// Feature flags for enabling/disabling features across apps
export interface FeatureFlags {
  enableAnalytics: boolean;
  enableNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  enableAIInsights: boolean;
  enableDarkMode: boolean;
  enableBetaFeatures: boolean;
}

export const featureFlags: FeatureFlags = {
  enableAnalytics: true,
  enableNotifications: true,
  enableEmailNotifications: true,
  enableSMSNotifications: false,
  enableAIInsights: true,
  enableDarkMode: true,
  enableBetaFeatures: false,
};

export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return featureFlags[feature] ?? false;
}
