-- Remove unwanted bulletin articles

-- 1. Remove "Advisor Bulletin: August 14, 2025" with slug "august-14-2025"
DELETE FROM advisor_content
WHERE content_type = 'bulletin'
  AND slug = 'august-14-2025';

-- 2. Remove article with slug "january-28th-2025"
DELETE FROM advisor_content
WHERE content_type = 'bulletin'
  AND slug = 'january-28th-2025';
