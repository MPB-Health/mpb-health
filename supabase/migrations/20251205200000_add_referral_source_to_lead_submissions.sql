/*
  # Add Referral Source Field to Lead Submissions

  1. Changes
    - Add `referral_source` column to `lead_submissions` table
    - This tracks how users heard about MPB Health

  2. Options stored:
    - search_engine
    - word_of_mouth
    - social_media
    - referral_program
    - blog_or_article
    - print_media
    - event_or_tradeshow
    - other
*/

ALTER TABLE lead_submissions ADD COLUMN IF NOT EXISTS referral_source text;

-- Add an index for analytics queries
CREATE INDEX IF NOT EXISTS idx_lead_submissions_referral_source ON lead_submissions(referral_source);

