-- Remove the "Rewards in Motion" section from ALL bulletin articles
-- This section appears at the end of articles, usually preceded by an <hr> tag

-- Pass 1: Remove <hr> + Rewards in Motion heading + everything after (formatted articles with inline styles)
UPDATE advisor_content
SET content = TRIM(regexp_replace(
  content,
  '\s*<hr[^>]*/?>\s*<h3[^>]*>\s*(<strong>)?Rewards in Motion(</strong>)?\s*</h3>[\s\S]*',
  ''
))
WHERE content_type = 'bulletin' AND content LIKE '%Rewards in Motion%';

-- Pass 2: Fallback for articles without <hr> before the section (raw WordPress HTML)
UPDATE advisor_content
SET content = TRIM(regexp_replace(
  content,
  '\s*<h3[^>]*>\s*(<strong>)?Rewards in Motion(</strong>)?\s*</h3>[\s\S]*',
  ''
))
WHERE content_type = 'bulletin' AND content LIKE '%Rewards in Motion%';

-- Pass 3: Also handle cases where "Rewards in Motion" appears inside an <h2> or <h4> tag
UPDATE advisor_content
SET content = TRIM(regexp_replace(
  content,
  '\s*<h[2-4][^>]*>\s*(<strong>)?Rewards in Motion(</strong>)?\s*</h[2-4]>[\s\S]*',
  ''
))
WHERE content_type = 'bulletin' AND content LIKE '%Rewards in Motion%';

-- Pass 4: Clean up any trailing empty <p>, <table>, or whitespace tags left behind
UPDATE advisor_content
SET content = TRIM(regexp_replace(
  content,
  '(\s*<p[^>]*>\s*(<span>)?\s*(</span>)?\s*</p>\s*)+$',
  ''
))
WHERE content_type = 'bulletin';
