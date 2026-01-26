/*
  # Add Media Settings to System Settings

  ## Overview
  Adds video URL and media settings to the existing system_settings table.
  These settings can be managed from the admin dashboard to update videos across the site.

  ## Settings Added (category: 'media')
  - video_homepage_hero - Homepage "How It Works" video
  - video_explainer - Explainer section video
  - video_individuals_modal - Individuals/Families popup video
  - video_business_modal - Business/Organizations popup video
  - video_welcome_overview - Welcome page overview video
  - video_medical_sharing - Medical cost sharing info video
  - video_background_mp4 - Background video file path
*/

-- Insert media settings
INSERT INTO system_settings (key, value, category, description, is_sensitive) VALUES
  -- Video Embed URLs
  (
    'video_homepage_hero',
    'https://player.vimeo.com/video/1135808114?h=c0bfafd29e',
    'media',
    'Homepage Hero "How It Works" video embed URL (Vimeo, YouTube, or any embed URL)',
    false
  ),
  (
    'video_explainer',
    'https://player.vimeo.com/video/1120296253?h=fl&badge=0&autopause=0&player_id=0&app_id=58479',
    'media',
    'Main Explainer Video section embed URL',
    false
  ),
  (
    'video_individuals_modal',
    'https://player.vimeo.com/video/1115561411?h=531f004487',
    'media',
    'Individuals & Families page modal video embed URL',
    false
  ),
  (
    'video_business_modal',
    'https://player.vimeo.com/video/1115561411?h=531f004487',
    'media',
    'Businesses & Organizations page modal video embed URL',
    false
  ),
  (
    'video_welcome_overview',
    'https://player.vimeo.com/video/1115561411?h=531f004487',
    'media',
    'Welcome page overview video embed URL',
    false
  ),
  (
    'video_medical_sharing',
    'https://player.vimeo.com/video/1135808114?h=c0bfafd29e',
    'media',
    'Medical Cost Sharing info section video embed URL',
    false
  ),
  -- Background Video
  (
    'video_background_mp4',
    '/assets/young-parents-happy-mother.mp4',
    'media',
    'Background video file path (MP4 format)',
    false
  ),
  -- Thumbnail Images
  (
    'video_thumbnail_default',
    '',
    'media',
    'Default video thumbnail image URL (optional)',
    false
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

