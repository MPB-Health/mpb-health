-- Update "Price sheets" and "Comparison sheet" PDF links in note-to-advisors-2026-rates article
-- Replace old WordPress URLs with Supabase Storage URLs

-- 1. Price sheets link
UPDATE advisor_content
SET content = REPLACE(
  content,
  'https://advisor.mpb.health/wp-content/uploads/2025/10/2026-prices-Care-Direct-Secure-HSA-2.pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/2026-prices-Care-Direct-Secure-HSA-2.pdf'
)
WHERE content_type = 'bulletin'
  AND content LIKE '%2026-prices-Care-Direct-Secure-HSA-2.pdf%';

-- 2. Comparison sheet link
UPDATE advisor_content
SET content = REPLACE(
  content,
  'https://advisor.mpb.health/wp-content/uploads/2025/10/2026-prices-Care-Direct-Secure-HSA-Comparison-4.pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/2026-prices-Care-Direct-Secure-HSA-Comparison-4.pdf'
)
WHERE content_type = 'bulletin'
  AND content LIKE '%2026-prices-Care-Direct-Secure-HSA-Comparison-4.pdf%';
