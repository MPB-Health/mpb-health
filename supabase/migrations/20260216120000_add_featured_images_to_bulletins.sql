-- Add featured images to the 4 bulletin articles that were missing them

-- Advisor Bulletin: December 24, 2025
UPDATE advisor_content
SET featured_image_url = 'https://advisor.mpb.health/wp-content/uploads/2025/12/Christmas-posts-2.png'
WHERE slug = 'advisor-bulletin-december-24-2025' AND content_type = 'bulletin';
-- Advisor Bulletin: December 10, 2025
UPDATE advisor_content
SET featured_image_url = 'https://advisor.mpb.health/wp-content/uploads/2025/12/Blue-Snowflake-Christmas-Instagram-Post-1.png'
WHERE slug = 'advisor-bulletin-december-10-2025' AND content_type = 'bulletin';
-- Advisor Bulletin: November 26, 2025
UPDATE advisor_content
SET featured_image_url = 'https://advisor.mpb.health/wp-content/uploads/2025/11/Copy-of-newsletter-blog-images-6.png'
WHERE slug = 'advisor-bulletin-november-26-2025' AND content_type = 'bulletin';
-- Advisor Bulletin: November 12, 2025
UPDATE advisor_content
SET featured_image_url = 'https://advisor.mpb.health/wp-content/uploads/2025/11/Copy-of-Clitents-Ghosting-you.jpg'
WHERE slug = 'advisor-bulletin-november-12-2025' AND content_type = 'bulletin';
