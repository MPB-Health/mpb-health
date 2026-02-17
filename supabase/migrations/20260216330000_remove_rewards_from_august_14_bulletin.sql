-- Remove "Rewards in Motion" section from advisor-bulletin-august-14-2025
UPDATE advisor_content
SET content = TRIM(regexp_replace(
  content,
  '\s*<hr[^>]*/?>?\s*<h3[^>]*>\s*Rewards in Motion\s*</h3>[\s\S]*',
  ''
))
WHERE slug = 'advisor-bulletin-august-14-2025'
  AND content_type = 'bulletin'
  AND content LIKE '%Rewards in Motion%';

-- Fallback: match by title pattern in case slug differs
UPDATE advisor_content
SET content = TRIM(regexp_replace(
  content,
  '\s*<hr[^>]*/?>?\s*<h3[^>]*>\s*Rewards in Motion\s*</h3>[\s\S]*',
  ''
))
WHERE content_type = 'bulletin'
  AND title LIKE '%August 14%'
  AND content LIKE '%Rewards in Motion%';
