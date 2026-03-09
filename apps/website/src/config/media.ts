/**
 * Media URLs Configuration
 *
 * Centralized configuration for video embeds and media content.
 * Ensures consistency across homepage hero and feature detail pages.
 */

export interface MediaUrls {
  heroVideoUrl: string;
  heroVideoThumbnail?: string;
}

export const MEDIA_URLS: MediaUrls = {
  /**
   * Main "How It Works" video shown on homepage hero
   * Also used in Virtual Urgent Care feature detail
   * Format: Vimeo embed URL with privacy settings
   * Updated: November 2025 - New video with hash parameter
   */
  heroVideoUrl: 'https://player.vimeo.com/video/1135808114?h=c0bfafd29e',

  /** Optional: Custom thumbnail for video player (omit to use Vimeo default) */
  heroVideoThumbnail: undefined,
};
