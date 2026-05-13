-- Add is_featured column to advisor_content table for bulletin slider functionality
ALTER TABLE advisor_content
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
-- Create index for featured bulletins query performance
CREATE INDEX IF NOT EXISTS idx_advisor_content_featured
ON advisor_content(is_featured) WHERE is_featured = true AND content_type = 'bulletin';
