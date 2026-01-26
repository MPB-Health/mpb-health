/**
 * Mobile App Download URLs Configuration
 *
 * Centralized configuration for app store download links.
 * Used in AppDownloadSection and anywhere app download buttons appear.
 *
 * Set to null if app is not yet available on a platform.
 */

export interface AppStoreUrls {
  appStore: string | null;
  googlePlay: string | null;
}

export const APP_STORE_URLS: AppStoreUrls = {
  /**
   * Apple App Store URL
   * Set to null if iOS app is not available
   */
  appStore: 'https://apps.apple.com/us/app/mpb-health/id6747984750',

  /**
   * Google Play Store URL
   * Set to null if Android app is not available
   */
  googlePlay: 'https://play.google.com/store/apps/details?id=com.mpb.health&utm_source=na_Med',
};

/**
 * Check if app is available on a specific platform
 */
export const isAppAvailable = (platform: 'appStore' | 'googlePlay'): boolean => {
  return APP_STORE_URLS[platform] !== null && APP_STORE_URLS[platform] !== '';
};
