-- Move bulletin featured images from WordPress to Supabase Storage
-- Images must be uploaded to advisor-documents/bulletin-images/ before running this migration

-- Advisor Bulletin: December 24, 2025
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/Christmas-posts-2.png'
WHERE slug = 'advisor-bulletin-december-24-2025' AND content_type = 'bulletin';

-- Advisor Bulletin: December 10, 2025
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/Blue-Snowflake-Christmas-Instagram-Post-1.png'
WHERE slug = 'advisor-bulletin-december-10-2025' AND content_type = 'bulletin';

-- Advisor Bulletin: November 26, 2025
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/Copy-of-newsletter-blog-images-6.png'
WHERE slug = 'advisor-bulletin-november-26-2025' AND content_type = 'bulletin';

-- Advisor Bulletin: November 12, 2025
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/Copy-of-Clitents-Ghosting-you.jpg'
WHERE slug = 'advisor-bulletin-november-12-2025' AND content_type = 'bulletin';

-- Advisor Bulletin: August 14, 2025
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/Untitled-design.png'
WHERE slug = 'advisor-bulletin-august-14-2025' AND content_type = 'bulletin';

-- Also catch by title in case slug differs
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/Untitled-design.png'
WHERE title LIKE '%August 14%' AND content_type = 'bulletin'
  AND featured_image_url LIKE '%wp-content%';
