-- Insert and format Advisor Bulletin: August 2nd Half, 2025

INSERT INTO advisor_content (title, slug, excerpt, content, content_type, category_id, published_date, is_published, is_featured, view_count, metadata)
VALUES (
  'Advisor Bulletin: August 2nd Half, 2025',
  'advisor-bulletin-august-2nd-half-2025',
  'August 2nd Half — "Perseverance is not a long race; it is many short races one after the other." Updates on Sedera Summus partnership, MPB Health App enhancements, App Demo recording, MGM Grand contest, and rewards.',
  '
<h1 style="font-size: 32px; font-weight: 700; color: #000000; margin: 0 0 24px 0; line-height: 1.3;">August 2nd Half</h1>

<div style="border: 2px solid #cbd5e1; border-radius: 12px; padding: 20px 24px; margin: 0 0 32px 0; background-color: #f8fafc;">
  <p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0;"><em>"Perseverance is not a long race; it is many short races one after the other."</em><br>— <em>Walter Elliot</em></p>
</div>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">As August comes to a close, it''s a reminder that consistency is what drives meaningful progress. The everyday actions you take — the conversations, follow-ups, and support — continue to build something impactful over time.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">We''re proud of what we''ve achieved together so far this year, and even more excited for what''s ahead. The difference you make in the lives of our members and their families is real — and deeply valued.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Let''s keep showing up, delivering value, and pushing forward – one step at a time.</p>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 24px 0;">Here''s to a strong finish to a month — and even greater things to come.</p>

<h3 style="text-align: center; font-size: 22px; font-weight: 700; color: #000000; margin: 40px 0 24px 0; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">Updates</h3>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">Sedera</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">Sedera – Summus – Second Opinion Benefits: Sedera now has a partnership with Summus for second opinions, and your membership includes this benefit. You will be able to access this benefit on your MPB Health App in the next version update of the app. You can also set up a consultation with them by following the steps below:</p>

<ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Visit <a href="https://info.summusglobal.com/sedera" target="_blank" style="color: #2563eb; text-decoration: underline;">www.summusglobal.com/sedera</a></li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Click "Activate" in the top right-hand corner.</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Enter your first name, last name, and date of birth in the format YYYY-MM-DD.</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Set your password and enter your preferred email address.</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">Click submit and you''re in!</li>
  <li style="font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 6px;">You can also call them directly at <a href="tel:917-565-8540" style="color: #2563eb; text-decoration: underline;">917-565-8540</a></li>
</ul>

<h2 style="font-size: 24px; font-weight: 700; color: #000000; margin: 32px 0 16px 0; line-height: 1.3;">MPB Health App: Healthcare Bluebook Code</h2>

<p style="font-size: 16px; line-height: 1.7; color: #334155; margin: 0 0 12px 0;">An enhancement is in progress to insert the Healthcare Bluebook access code, in order for members to login automatically.</p>

',
  'bulletin',
  (SELECT id FROM advisor_content_categories WHERE slug = 'bulletin' LIMIT 1),
  '2025-08-12T12:00:00Z',
  true,
  false,
  0,
  '{}'
) ON CONFLICT (slug) DO UPDATE SET
  content = EXCLUDED.content,
  excerpt = EXCLUDED.excerpt,
  title = EXCLUDED.title;

-- Also update if the article already exists under a different slug
-- (e.g. advisor-bulletin-august-26-2025 or any other slug)
UPDATE advisor_content
SET content = (SELECT content FROM advisor_content WHERE slug = 'advisor-bulletin-august-2nd-half-2025' AND content_type = 'bulletin'),
    excerpt = 'August 2nd Half — "Perseverance is not a long race; it is many short races one after the other." Updates on Sedera Summus partnership, MPB Health App enhancements, App Demo recording, MGM Grand contest, and rewards.'
WHERE content_type = 'bulletin'
  AND content LIKE '%August 2nd Half%'
  AND content LIKE '%et_pb_%'
  AND slug != 'advisor-bulletin-august-2nd-half-2025';

-- Also handle the case where title matches but content is raw WordPress HTML
UPDATE advisor_content
SET content = (SELECT content FROM advisor_content WHERE slug = 'advisor-bulletin-august-2nd-half-2025' AND content_type = 'bulletin'),
    excerpt = 'August 2nd Half — "Perseverance is not a long race; it is many short races one after the other." Updates on Sedera Summus partnership, MPB Health App enhancements, App Demo recording, MGM Grand contest, and rewards.'
WHERE content_type = 'bulletin'
  AND title LIKE '%August 26%'
  AND content LIKE '%Preseverance%';
