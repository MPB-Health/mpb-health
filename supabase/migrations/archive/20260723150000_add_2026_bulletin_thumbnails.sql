-- Set featured images (card thumbnails) for the April–July 2026 advisor
-- bulletins, hosted in the public blog-images storage bucket.
-- Prereq: the five image files must be uploaded to blog-images/ first.
-- Matches by slug, with a title fallback in case a bulletin exists under a
-- different slug (e.g. created via the admin CMS).

-- Advisor Bulletin: July 2026
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/blog-images/advisor-bulletin-july-2026.png'
WHERE content_type = 'bulletin'
  AND (slug = 'advisor-bulletin-july-2026' OR title ILIKE '%july%2026%');

-- Advisor Bulletin: June 24, 2026
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/blog-images/advisor-bulletin-june-24-2026.png'
WHERE content_type = 'bulletin'
  AND (slug = 'advisor-bulletin-june-24-2026' OR title ILIKE '%june 24%2026%');

-- Advisor Bulletin: May 26, 2026
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/blog-images/advisor-bulletin-may-26-2026.png'
WHERE content_type = 'bulletin'
  AND (slug = 'advisor-bulletin-may-26-2026' OR title ILIKE '%may 26%2026%');

-- Advisor Bulletin: May 13, 2026
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/blog-images/advisor-bulletin-may-13-2026.jpg'
WHERE content_type = 'bulletin'
  AND (slug = 'advisor-bulletin-may-13-2026' OR title ILIKE '%may 13%2026%');

-- Advisor Bulletin: April 29, 2026
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/blog-images/advisor-bulletin-april-29-2026.png'
WHERE content_type = 'bulletin'
  AND (slug = 'advisor-bulletin-april-29-2026' OR title ILIKE '%april 29%2026%');
