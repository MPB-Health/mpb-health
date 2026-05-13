-- Update Maternity Flyer PDF links to Supabase Storage across all bulletins

-- 1. Zion Maternity Flyer
UPDATE advisor_content
SET content = REPLACE(
  content,
  'https://advisor.mpb.health/wp-content/uploads/2025/09/Maternity-Flyer-Zion-10.pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Maternity-Flyer-Zion-10.pdf'
)
WHERE content_type = 'bulletin'
  AND content LIKE '%Maternity-Flyer-Zion-10.pdf%';
-- 2. Sedera Maternity Flyer
UPDATE advisor_content
SET content = REPLACE(
  content,
  'https://advisor.mpb.health/wp-content/uploads/2025/09/Maternity-Flyer-Sedera-6.pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Maternity-Flyer-Sedera-6.pdf'
)
WHERE content_type = 'bulletin'
  AND content LIKE '%Maternity-Flyer-Sedera-6.pdf%';
