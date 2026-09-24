-- Update "No Sell States Chart" PDF link in advisor-bulletin-october-15-2025
-- Replace old WordPress URL with Supabase Storage URL
UPDATE advisor_content
SET content = REPLACE(
  content,
  'https://advisor.mpb.health/wp-content/uploads/2025/09/No-Sell-States-Chart-9.pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/No-Sell-States.pdf'
)
WHERE content_type = 'bulletin'
  AND content LIKE '%No-Sell-States-Chart-9.pdf%';
