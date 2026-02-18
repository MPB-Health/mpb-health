-- Move ALL bulletin featured images from WordPress to Supabase Storage
-- Images uploaded to advisor-documents/bulletin-images/

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

-- Advisor Bulletin: October 28, 2025
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/Copy-of-Clitents-Ghosting-you-oct.jpg'
WHERE slug = 'advisor-bulletin-october-28-2025' AND content_type = 'bulletin';

-- Advisor Bulletin: October 15, 2025
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/bonus4.png'
WHERE slug = 'advisor-bulletin-october-15-2025' AND content_type = 'bulletin';

-- Note to Advisors: 2026 Rates & e123 Update in Progress
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/update-word-png-element-transparent-background-scaled.jpg'
WHERE slug = 'note-to-advisors-2026-rates-e123-update-in-progress' AND content_type = 'bulletin';

-- Important Update Regarding Price Increase 2026
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/update-word-png-element-transparent-background-scaled.jpg'
WHERE slug = 'important-update-regarding-price-increase-2026' AND content_type = 'bulletin';

-- Important Update Regarding Sedera Plans in Florida
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/florida-update.jpg'
WHERE slug = 'important-update-regarding-sedera-plans-in-florida' AND content_type = 'bulletin';

-- Advisor Bulletin: September 24, 2025
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/Open-Enrollment-is-almost-here-Las-Vegas-is-calling.png'
WHERE slug = 'advisor-bulletin-september-24-2025' AND content_type = 'bulletin';

-- Advisor Bulletin: September 09, 2025
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/1bafcd5d-3632-9de5-9799-74f4773e4209.png'
WHERE slug = 'advisor-bulletin-september-09-2025' AND content_type = 'bulletin';

-- Advisor Bulletin: August 26, 2025
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/416331789_11640594.jpg'
WHERE slug = 'august-26-2025-bulletin' AND content_type = 'bulletin';

-- Advisor Bulletin: August 14, 2025
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/Untitled-design.png'
WHERE slug = 'advisor-bulletin-august-14-2025' AND content_type = 'bulletin';

-- Catch any remaining WordPress URLs by pattern
UPDATE advisor_content
SET featured_image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/Untitled-design.png'
WHERE title LIKE '%August 14%' AND content_type = 'bulletin'
  AND featured_image_url LIKE '%wp-content%';
