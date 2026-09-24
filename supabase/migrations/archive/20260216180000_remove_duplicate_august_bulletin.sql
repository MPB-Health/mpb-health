-- Remove duplicate "Advisor Bulletin: August 26, 2025" article (the one without a featured image)
DELETE FROM advisor_content
WHERE content_type = 'bulletin'
  AND (
    slug = 'advisor-bulletin-august-26-2025'
    OR slug = 'advisor-bulletin-august-2nd-half-2025'
  )
  AND (featured_image_url IS NULL OR featured_image_url = '');
