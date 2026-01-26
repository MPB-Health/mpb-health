import { supabase } from './supabase';

// ============================================================================
// Types
// ============================================================================

export interface MediaSettings {
  video_homepage_hero: string;
  video_explainer: string;
  video_individuals_modal: string;
  video_business_modal: string;
  video_welcome_overview: string;
  video_medical_sharing: string;
  video_background_mp4: string;
  video_thumbnail_default: string;
}

export type MediaSettingKey = keyof MediaSettings;

// ============================================================================
// Default Values (fallbacks if DB is unavailable)
// ============================================================================

const DEFAULT_MEDIA_SETTINGS: MediaSettings = {
  video_homepage_hero: 'https://player.vimeo.com/video/1135808114?h=c0bfafd29e',
  video_explainer: 'https://player.vimeo.com/video/1120296253?h=fl&badge=0&autopause=0&player_id=0&app_id=58479',
  video_individuals_modal: 'https://player.vimeo.com/video/1115561411?h=531f004487',
  video_business_modal: 'https://player.vimeo.com/video/1115561411?h=531f004487',
  video_welcome_overview: 'https://player.vimeo.com/video/1115561411?h=531f004487',
  video_medical_sharing: 'https://player.vimeo.com/video/1135808114?h=c0bfafd29e',
  video_background_mp4: '/assets/young-parents-happy-mother.mp4',
  video_thumbnail_default: '',
};

// ============================================================================
// Cache
// ============================================================================

let cachedSettings: MediaSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// URL Parsing Utilities
// ============================================================================

/**
 * Detects the video platform from a URL
 */
export function detectVideoPlatform(url: string): 'vimeo' | 'youtube' | 'wistia' | 'other' {
  if (!url) return 'other';
  
  if (url.includes('vimeo.com') || url.includes('player.vimeo.com')) {
    return 'vimeo';
  }
  if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('youtube-nocookie.com')) {
    return 'youtube';
  }
  if (url.includes('wistia.com') || url.includes('wistia.net')) {
    return 'wistia';
  }
  return 'other';
}

/**
 * Extracts video ID from various URL formats
 */
export function extractVideoId(url: string): string | null {
  if (!url) return null;

  const platform = detectVideoPlatform(url);

  try {
    switch (platform) {
      case 'vimeo': {
        // Match patterns like:
        // https://vimeo.com/123456789
        // https://player.vimeo.com/video/123456789?h=abc123
        const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        return vimeoMatch ? vimeoMatch[1] : null;
      }
      case 'youtube': {
        // Match patterns like:
        // https://www.youtube.com/watch?v=VIDEO_ID
        // https://youtu.be/VIDEO_ID
        // https://www.youtube.com/embed/VIDEO_ID
        const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        return youtubeMatch ? youtubeMatch[1] : null;
      }
      case 'wistia': {
        // Match patterns like:
        // https://fast.wistia.net/embed/iframe/VIDEO_ID
        const wistiaMatch = url.match(/wistia\.(?:com|net)\/(?:embed\/iframe\/|medias\/)([a-zA-Z0-9]+)/);
        return wistiaMatch ? wistiaMatch[1] : null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Converts a video URL to an embed-ready URL
 */
export function toEmbedUrl(url: string, options: { autoplay?: boolean } = {}): string {
  if (!url) return '';

  const platform = detectVideoPlatform(url);
  const videoId = extractVideoId(url);

  // If it's already an embed URL or we can't parse it, return as-is with optional autoplay
  if (!videoId) {
    if (options.autoplay && !url.includes('autoplay')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}autoplay=1`;
    }
    return url;
  }

  switch (platform) {
    case 'vimeo': {
      // Extract hash parameter if present
      const hashMatch = url.match(/[?&]h=([a-zA-Z0-9]+)/);
      const hashParam = hashMatch ? `?h=${hashMatch[1]}` : '';
      const autoplayParam = options.autoplay ? (hashParam ? '&autoplay=1' : '?autoplay=1') : '';
      return `https://player.vimeo.com/video/${videoId}${hashParam}${autoplayParam}`;
    }
    case 'youtube': {
      const autoplayParam = options.autoplay ? '?autoplay=1' : '';
      return `https://www.youtube-nocookie.com/embed/${videoId}${autoplayParam}`;
    }
    case 'wistia': {
      const autoplayParam = options.autoplay ? '?autoPlay=true' : '';
      return `https://fast.wistia.net/embed/iframe/${videoId}${autoplayParam}`;
    }
    default:
      return url;
  }
}

/**
 * Validates if a URL is a valid video embed URL
 */
export function isValidVideoUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for common video platforms
  const platform = detectVideoPlatform(url);
  if (platform !== 'other') {
    return extractVideoId(url) !== null;
  }
  
  // Allow any URL that looks like an embed
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Service Class
// ============================================================================

class SiteMediaService {
  /**
   * Fetches all media settings from the database
   */
  async fetchMediaSettings(): Promise<MediaSettings> {
    // Check cache first
    if (cachedSettings && Date.now() - cacheTimestamp < CACHE_DURATION_MS) {
      return cachedSettings;
    }

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .eq('category', 'media');

      if (error) {
        console.error('Error fetching media settings:', error);
        return DEFAULT_MEDIA_SETTINGS;
      }

      // Build settings object from database rows
      const settings: MediaSettings = { ...DEFAULT_MEDIA_SETTINGS };
      
      for (const row of data || []) {
        if (row.key in settings) {
          (settings as any)[row.key] = row.value || (DEFAULT_MEDIA_SETTINGS as any)[row.key];
        }
      }

      // Update cache
      cachedSettings = settings;
      cacheTimestamp = Date.now();

      return settings;
    } catch (error) {
      console.error('Error in fetchMediaSettings:', error);
      return DEFAULT_MEDIA_SETTINGS;
    }
  }

  /**
   * Gets a specific media setting
   */
  async getMediaSetting(key: MediaSettingKey): Promise<string> {
    const settings = await this.fetchMediaSettings();
    return settings[key] || DEFAULT_MEDIA_SETTINGS[key];
  }

  /**
   * Gets a video URL ready for embedding with optional autoplay
   */
  async getVideoUrl(key: MediaSettingKey, options: { autoplay?: boolean } = {}): Promise<string> {
    const rawUrl = await this.getMediaSetting(key);
    return toEmbedUrl(rawUrl, options);
  }

  /**
   * Clears the cache to force a fresh fetch
   */
  clearCache(): void {
    cachedSettings = null;
    cacheTimestamp = 0;
  }

  /**
   * Gets all media settings (for admin display)
   */
  async getAllSettings(): Promise<MediaSettings> {
    return this.fetchMediaSettings();
  }

  /**
   * Updates a media setting in the database
   */
  async updateSetting(key: MediaSettingKey, value: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ value })
        .eq('key', key);

      if (error) {
        return { success: false, error: error.message };
      }

      // Clear cache so next fetch gets fresh data
      this.clearCache();
      
      return { success: true };
    } catch (error) {
      console.error('Error updating media setting:', error);
      return { success: false, error: 'Failed to update setting' };
    }
  }
}

// Export singleton instance
export const siteMediaService = new SiteMediaService();

// ============================================================================
// React Hook for easy component usage
// ============================================================================

import { useState, useEffect } from 'react';

export function useMediaSetting(key: MediaSettingKey, options: { autoplay?: boolean } = {}): {
  url: string;
  loading: boolean;
  error: string | null;
} {
  const [url, setUrl] = useState<string>(DEFAULT_MEDIA_SETTINGS[key] || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchUrl = async () => {
      try {
        const fetchedUrl = await siteMediaService.getVideoUrl(key, options);
        if (mounted) {
          setUrl(fetchedUrl);
          setLoading(false);
        }
      } catch (_err) {
        if (mounted) {
          setError('Failed to load video URL');
          setLoading(false);
        }
      }
    };

    fetchUrl();

    return () => {
      mounted = false;
    };
  }, [key, options.autoplay]);

  return { url, loading, error };
}

export function useAllMediaSettings(): {
  settings: MediaSettings;
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [settings, setSettings] = useState<MediaSettings>(DEFAULT_MEDIA_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const fetchedSettings = await siteMediaService.fetchMediaSettings();
      setSettings(fetchedSettings);
      setError(null);
    } catch (_err) {
      setError('Failed to load media settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const refresh = () => {
    siteMediaService.clearCache();
    fetchSettings();
  };

  return { settings, loading, error, refresh };
}

