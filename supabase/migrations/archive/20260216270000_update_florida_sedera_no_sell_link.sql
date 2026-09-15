-- Update "NO SELL STATES" link in important-update-regarding-sedera-plans-in-florida
-- Replace old WordPress PNG with Supabase Storage PDF
UPDATE advisor_content
SET content = REPLACE(
  content,
  'https://advisor.mpb.health/wp-content/uploads/2025/02/No-Sell-States-Chart3.png',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/No-Sell-States.pdf'
)
WHERE content_type = 'bulletin'
  AND content LIKE '%No-Sell-States-Chart3.png%';
