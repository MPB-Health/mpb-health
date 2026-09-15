-- Restore featured image for Advisor Bulletin: August 14, 2025
UPDATE advisor_content
SET featured_image_url = 'https://advisor.mpb.health/wp-content/uploads/2025/08/Untitled-design.png'
WHERE slug = 'advisor-bulletin-august-14-2025' AND content_type = 'bulletin';
-- Also catch it by title in case slug differs
UPDATE advisor_content
SET featured_image_url = 'https://advisor.mpb.health/wp-content/uploads/2025/08/Untitled-design.png'
WHERE title LIKE '%August 14%' AND content_type = 'bulletin' AND (featured_image_url IS NULL OR featured_image_url = '');
