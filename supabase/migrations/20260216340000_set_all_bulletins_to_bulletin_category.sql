-- Set all bulletin articles to the "Bulletin" category
-- This removes the need for multiple categories (Announcements, Important Messages, etc.)

UPDATE advisor_content
SET category_id = (SELECT id FROM advisor_content_categories WHERE slug = 'bulletin' LIMIT 1)
WHERE content_type = 'bulletin'
  AND category_id != (SELECT id FROM advisor_content_categories WHERE slug = 'bulletin' LIMIT 1);
