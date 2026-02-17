-- Fix Sept 09 bulletin: make meeting links plain text instead of clickable

-- Replace the full 2nd Tuesday anchor tag with plain text
UPDATE advisor_content
SET content = regexp_replace(
  content,
  '<(strong[^>]*)>2nd Tuesday Meeting</strong>\s*–\s*<a[^>]*>Click on the link</a>',
  '<strong style="color: #111827;">2nd Tuesday Meeting</strong>'
)
WHERE slug = 'advisor-bulletin-september-09-2025'
  AND content_type = 'bulletin'
  AND content LIKE '%2nd Tuesday Meeting%';

-- Replace the full 4th Tuesday anchor tag with plain text
UPDATE advisor_content
SET content = regexp_replace(
  content,
  '<(strong[^>]*)>4th Tuesday Meeting</strong>\s*–\s*<a[^>]*>Click on the link</a>',
  '<strong style="color: #111827;">4th Tuesday Meeting</strong>'
)
WHERE slug = 'advisor-bulletin-september-09-2025'
  AND content_type = 'bulletin'
  AND content LIKE '%4th Tuesday Meeting%';

-- Fallback: if previous migration already changed them to linked meeting names, strip the <a> wrapper
UPDATE advisor_content
SET content = regexp_replace(
  content,
  '<a[^>]*><strong[^>]*>2nd Tuesday Meeting</strong></a>',
  '<strong style="color: #111827;">2nd Tuesday Meeting</strong>'
)
WHERE slug = 'advisor-bulletin-september-09-2025'
  AND content_type = 'bulletin'
  AND content LIKE '%2nd Tuesday Meeting%';

UPDATE advisor_content
SET content = regexp_replace(
  content,
  '<a[^>]*><strong[^>]*>4th Tuesday Meeting</strong></a>',
  '<strong style="color: #111827;">4th Tuesday Meeting</strong>'
)
WHERE slug = 'advisor-bulletin-september-09-2025'
  AND content_type = 'bulletin'
  AND content LIKE '%4th Tuesday Meeting%';
