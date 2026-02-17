-- Clean up advisor-bulletin-august-2nd-half-2025 (also known as august-26-2025-bulletin)
-- Remove: MPB Health App Demo Recording, Submit TKT, Reminders/MGM Grand, Rewards in Motion

-- Remove from "MPB Health App Demo Recording" heading through end of content
-- This covers: Demo Recording, Submit TKT, Vimeo embed, Reminders, MGM Grand, Rewards in Motion
UPDATE advisor_content
SET content = TRIM(regexp_replace(
  content,
  '\s*<h2[^>]*>\s*MPB Health App Demo Recording\s*</h2>[\s\S]*',
  ''
))
WHERE content_type = 'bulletin'
  AND (slug = 'advisor-bulletin-august-2nd-half-2025' OR slug LIKE '%august-26-2025%')
  AND content LIKE '%MPB Health App Demo Recording%';
