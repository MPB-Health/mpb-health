-- Clean up advisor-bulletin-september-09-2025:
-- 1. Remove MGM Grand Las Vegas Contest / Leaderboard section
-- 2. Remove " – Click on the link" from meeting links

-- Step 1: Remove the MGM Grand section (everything after the last <hr> before it)
UPDATE advisor_content
SET content = TRIM(regexp_replace(
  content,
  '\s*<hr[^>]*/?>?\s*<h2[^>]*>\s*MGM Grand Las Vegas Contest\s*</h2>[\s\S]*',
  ''
))
WHERE slug = 'advisor-bulletin-september-09-2025'
  AND content_type = 'bulletin'
  AND content LIKE '%MGM Grand Las Vegas Contest%';
-- Step 2: Replace "2nd Tuesday Meeting – Click on the link" pattern
UPDATE advisor_content
SET content = REPLACE(
  content,
  '<strong style="color: #111827;">2nd Tuesday Meeting</strong> – <a',
  '<a'
)
WHERE slug = 'advisor-bulletin-september-09-2025'
  AND content_type = 'bulletin';
UPDATE advisor_content
SET content = REPLACE(
  content,
  '<strong style="color: #111827;">4th Tuesday Meeting</strong> – <a',
  '<a'
)
WHERE slug = 'advisor-bulletin-september-09-2025'
  AND content_type = 'bulletin';
-- Update the link text from "Click on the link" to the meeting name
UPDATE advisor_content
SET content = REPLACE(
  content,
  'underline;">Click on the link</a></p>
',
  'underline;"><strong style="color: #2563eb;">2nd Tuesday Meeting</strong></a></p>
'
)
WHERE slug = 'advisor-bulletin-september-09-2025'
  AND content_type = 'bulletin'
  AND content LIKE '%OThlYThjZmUtNzA1YS00NDIy%';
-- For 4th Tuesday (different Teams link ID)
UPDATE advisor_content
SET content = REPLACE(
  content,
  'underline;">Click on the link</a></p>',
  'underline;"><strong style="color: #2563eb;">4th Tuesday Meeting</strong></a></p>'
)
WHERE slug = 'advisor-bulletin-september-09-2025'
  AND content_type = 'bulletin'
  AND content LIKE '%ODY1ZGM0NjEtYWIwNi00YzdmLTg1MjEt%';
