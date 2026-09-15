-- Remove "Rewards in Motion" section from advisor-bulletin-september-24-2025
-- This section was missed by the earlier bulk removal migration (20260216220000)

-- Remove the <hr> + Rewards in Motion heading + everything after it
UPDATE advisor_content
SET content = TRIM(regexp_replace(
  content,
  '\s*<hr[^>]*/?>?\s*<h3[^>]*>\s*Rewards in Motion\s*</h3>[\s\S]*',
  ''
))
WHERE slug = 'advisor-bulletin-september-24-2025'
  AND content_type = 'bulletin'
  AND content LIKE '%Rewards in Motion%';
