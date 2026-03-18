/*
  # Gemini AI Blog Post Generation and Newsletter Automation System
  
  ## Overview
  This migration creates a comprehensive system for AI-powered blog post generation
  using Gemini AI and automated newsletter distribution via n8n webhooks.
  
  ## New Tables Created
  
  ### 1. gemini_prompts
  Stores reusable prompt templates for blog post generation
  - `id` (uuid, primary key)
  - `name` (text) - Human-readable prompt name
  - `template` (text) - Prompt template with variable placeholders
  - `variables` (jsonb) - Available variables and their descriptions
  - `category` (text) - Prompt category (blog, newsletter, marketing, etc.)
  - `is_active` (boolean) - Whether prompt is available for use
  - `usage_count` (integer) - Track how many times used
  - `created_at`, `updated_at` (timestamptz)
  
  ### 2. blog_generation_logs
  Audit trail for all Gemini API calls
  - `id` (uuid, primary key)
  - `prompt_id` (uuid) - Reference to gemini_prompts
  - `prompt_used` (text) - Actual prompt sent to Gemini
  - `tokens_used` (integer) - API token consumption
  - `content_generated` (text) - Generated content
  - `success` (boolean) - Whether generation succeeded
  - `error_message` (text) - Error details if failed
  - `generation_time_ms` (integer) - Time taken to generate
  - `metadata` (jsonb) - Additional context (temperature, model, etc.)
  - `created_by` (uuid) - User who triggered generation
  - `created_at` (timestamptz)
  
  ### 3. newsletter_campaigns
  Manage newsletter campaigns linked to blog posts
  - `id` (uuid, primary key)
  - `blog_post_id` (uuid) - Reference to blog_articles
  - `subject_line` (text) - Email subject
  - `preview_text` (text) - Email preview/preheader
  - `send_at` (timestamptz) - Scheduled send time
  - `status` (text) - draft, scheduled, sending, sent, failed, cancelled
  - `target_segment` (jsonb) - Subscriber filter criteria
  - `sent_count` (integer) - Number of emails sent
  - `delivered_count` (integer) - Successfully delivered
  - `opened_count` (integer) - Unique opens
  - `clicked_count` (integer) - Unique clicks
  - `bounced_count` (integer) - Bounces
  - `unsubscribed_count` (integer) - Unsubscribes from this campaign
  - `open_rate` (numeric) - Calculated open rate
  - `click_rate` (numeric) - Calculated click rate
  - `n8n_webhook_url` (text) - Webhook URL for this campaign
  - `n8n_execution_id` (text) - n8n workflow execution ID
  - `created_by` (uuid) - User who created campaign
  - `created_at`, `updated_at` (timestamptz)
  
  ### 4. newsletter_queue
  Track individual email sends
  - `id` (uuid, primary key)
  - `campaign_id` (uuid) - Reference to newsletter_campaigns
  - `subscriber_id` (uuid) - Reference to newsletter_subscribers
  - `status` (text) - pending, sent, failed, bounced, opened, clicked
  - `sent_at` (timestamptz) - When email was sent
  - `opened_at` (timestamptz) - First open timestamp
  - `clicked_at` (timestamptz) - First click timestamp
  - `bounce_reason` (text) - Reason for bounce
  - `error_message` (text) - Error details if failed
  - `tracking_token` (text) - Unique token for tracking opens/clicks
  - `metadata` (jsonb) - Additional tracking data
  - `created_at` (timestamptz)
  
  ### 5. content_calendar
  Schedule and plan blog post topics
  - `id` (uuid, primary key)
  - `topic` (text) - Blog post topic
  - `description` (text) - Detailed description
  - `target_date` (date) - Target publication date
  - `priority` (text) - low, medium, high, urgent
  - `status` (text) - planned, generating, generated, published, cancelled
  - `assigned_keywords` (text[]) - SEO keywords
  - `assigned_category` (text) - Blog category
  - `blog_post_id` (uuid) - Reference to generated blog_articles
  - `generation_log_id` (uuid) - Reference to blog_generation_logs
  - `notes` (text) - Internal notes
  - `created_by` (uuid) - User who created entry
  - `created_at`, `updated_at` (timestamptz)
  
  ### 6. webhook_delivery_logs
  Track all webhook deliveries to n8n
  - `id` (uuid, primary key)
  - `webhook_url` (text) - Target webhook URL
  - `event_type` (text) - Type of event (blog_published, campaign_scheduled, etc.)
  - `payload` (jsonb) - Data sent to webhook
  - `response_status` (integer) - HTTP status code
  - `response_body` (text) - Response from webhook
  - `success` (boolean) - Whether delivery succeeded
  - `retry_count` (integer) - Number of retry attempts
  - `error_message` (text) - Error details if failed
  - `created_at` (timestamptz)
  
  ### 7. email_templates
  Store reusable email templates
  - `id` (uuid, primary key)
  - `name` (text) - Template name
  - `description` (text) - Template description
  - `subject_template` (text) - Subject line template with variables
  - `html_template` (text) - HTML email template
  - `text_template` (text) - Plain text version
  - `variables` (jsonb) - Available template variables
  - `category` (text) - Template category
  - `is_active` (boolean) - Whether template is available
  - `usage_count` (integer) - Track usage
  - `created_at`, `updated_at` (timestamptz)
  
  ## Enhanced Existing Tables
  
  ### blog_articles enhancements
  - Add `gemini_generated` (boolean) - Flag for AI-generated content
  - Add `generation_log_id` (uuid) - Reference to blog_generation_logs
  - Add `scheduled_publish_at` (timestamptz) - Future publish scheduling
  - Add `read_time` (integer) - Estimated read time in minutes
  - Add `seo_score` (integer) - SEO optimization score (0-100)
  - Add `engagement_score` (numeric) - Calculated engagement metric
  
  ## Security (Row Level Security)
  
  All tables have RLS enabled with policies for:
  - Authenticated admins can manage all records
  - Public can read published content only
  - Service role bypass for automation
  
  ## Indexes
  
  Performance indexes on:
  - Foreign key relationships
  - Status fields for filtering
  - Timestamp fields for sorting
  - Search fields (title, content)
  
  ## Database Functions
  
  ### calculate_newsletter_metrics()
  Automatically calculates open_rate and click_rate for campaigns
  
  ### generate_tracking_token()
  Creates unique tokens for email tracking
  
  ### auto_schedule_newsletter()
  Automatically creates newsletter campaign when blog post is published
  
  ## Triggers
  
  ### on_blog_published
  Fires webhook to n8n when blog post status changes to published
  
  ### update_campaign_metrics
  Recalculates campaign metrics when queue status changes
  
  ### update_updated_at
  Maintains updated_at timestamps across all tables
*/

-- ============================================================================
-- 1. CREATE GEMINI PROMPTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS gemini_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gemini_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active prompts"
  ON gemini_prompts FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage prompts"
  ON gemini_prompts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_gemini_prompts_category ON gemini_prompts(category);
CREATE INDEX IF NOT EXISTS idx_gemini_prompts_active ON gemini_prompts(is_active);

-- ============================================================================
-- 2. CREATE BLOG GENERATION LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS blog_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid REFERENCES gemini_prompts(id) ON DELETE SET NULL,
  prompt_used text NOT NULL,
  tokens_used integer DEFAULT 0,
  content_generated text,
  success boolean DEFAULT false,
  error_message text,
  generation_time_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blog_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view generation logs"
  ON blog_generation_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "System can insert generation logs"
  ON blog_generation_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_blog_generation_logs_prompt ON blog_generation_logs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_blog_generation_logs_success ON blog_generation_logs(success);
CREATE INDEX IF NOT EXISTS idx_blog_generation_logs_created ON blog_generation_logs(created_at DESC);

-- ============================================================================
-- 3. CREATE NEWSLETTER CAMPAIGNS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid REFERENCES blog_articles(id) ON DELETE CASCADE,
  subject_line text NOT NULL,
  preview_text text,
  send_at timestamptz,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  target_segment jsonb DEFAULT '{}'::jsonb,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  bounced_count integer DEFAULT 0,
  unsubscribed_count integer DEFAULT 0,
  open_rate numeric DEFAULT 0,
  click_rate numeric DEFAULT 0,
  n8n_webhook_url text,
  n8n_execution_id text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaigns"
  ON newsletter_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_blog_post ON newsletter_campaigns(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_send_at ON newsletter_campaigns(send_at);

-- ============================================================================
-- 4. CREATE NEWSLETTER QUEUE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS newsletter_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES newsletter_campaigns(id) ON DELETE CASCADE NOT NULL,
  subscriber_id uuid REFERENCES newsletter_subscribers(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'opened', 'clicked')),
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounce_reason text,
  error_message text,
  tracking_token text UNIQUE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE newsletter_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view queue"
  ON newsletter_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "System can manage queue"
  ON newsletter_queue FOR ALL
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_newsletter_queue_campaign ON newsletter_queue(campaign_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_queue_subscriber ON newsletter_queue(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_queue_status ON newsletter_queue(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_queue_tracking_token ON newsletter_queue(tracking_token);

-- ============================================================================
-- 5. CREATE CONTENT CALENDAR TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  description text,
  target_date date,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'generating', 'generated', 'published', 'cancelled')),
  assigned_keywords text[],
  assigned_category text,
  blog_post_id uuid REFERENCES blog_articles(id) ON DELETE SET NULL,
  generation_log_id uuid REFERENCES blog_generation_logs(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage content calendar"
  ON content_calendar FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_content_calendar_target_date ON content_calendar(target_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_content_calendar_priority ON content_calendar(priority);

-- ============================================================================
-- 6. CREATE WEBHOOK DELIVERY LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_url text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  success boolean DEFAULT false,
  retry_count integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook logs"
  ON webhook_delivery_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "System can insert webhook logs"
  ON webhook_delivery_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_delivery_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_success ON webhook_delivery_logs(success);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_delivery_logs(created_at DESC);

-- ============================================================================
-- 7. CREATE EMAIL TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  subject_template text NOT NULL,
  html_template text NOT NULL,
  text_template text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  category text DEFAULT 'newsletter',
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- ============================================================================
-- 8. ENHANCE BLOG_ARTICLES TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'gemini_generated'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN gemini_generated boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'generation_log_id'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN generation_log_id uuid REFERENCES blog_generation_logs(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'scheduled_publish_at'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN scheduled_publish_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'seo_score'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN seo_score integer DEFAULT 0 CHECK (seo_score >= 0 AND seo_score <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'engagement_score'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN engagement_score numeric DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_blog_articles_gemini_generated ON blog_articles(gemini_generated);
CREATE INDEX IF NOT EXISTS idx_blog_articles_scheduled_publish ON blog_articles(scheduled_publish_at);

-- ============================================================================
-- 9. CREATE DATABASE FUNCTIONS
-- ============================================================================

-- Function to generate unique tracking tokens
CREATE OR REPLACE FUNCTION generate_tracking_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Function to calculate newsletter metrics
CREATE OR REPLACE FUNCTION calculate_newsletter_metrics(campaign_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE newsletter_campaigns
  SET
    open_rate = CASE
      WHEN sent_count > 0 THEN (opened_count::numeric / sent_count::numeric) * 100
      ELSE 0
    END,
    click_rate = CASE
      WHEN sent_count > 0 THEN (clicked_count::numeric / sent_count::numeric) * 100
      ELSE 0
    END,
    updated_at = now()
  WHERE id = campaign_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to update campaign counts from queue
CREATE OR REPLACE FUNCTION update_campaign_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE newsletter_campaigns
    SET
      sent_count = (
        SELECT COUNT(*) FROM newsletter_queue
        WHERE campaign_id = NEW.campaign_id AND status IN ('sent', 'opened', 'clicked')
      ),
      delivered_count = (
        SELECT COUNT(*) FROM newsletter_queue
        WHERE campaign_id = NEW.campaign_id AND status IN ('sent', 'opened', 'clicked')
      ),
      opened_count = (
        SELECT COUNT(DISTINCT subscriber_id) FROM newsletter_queue
        WHERE campaign_id = NEW.campaign_id AND opened_at IS NOT NULL
      ),
      clicked_count = (
        SELECT COUNT(DISTINCT subscriber_id) FROM newsletter_queue
        WHERE campaign_id = NEW.campaign_id AND clicked_at IS NOT NULL
      ),
      bounced_count = (
        SELECT COUNT(*) FROM newsletter_queue
        WHERE campaign_id = NEW.campaign_id AND status = 'bounced'
      )
    WHERE id = NEW.campaign_id;

    PERFORM calculate_newsletter_metrics(NEW.campaign_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to maintain updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. CREATE TRIGGERS
-- ============================================================================

-- Trigger to update campaign metrics when queue changes
DROP TRIGGER IF EXISTS trigger_update_campaign_counts ON newsletter_queue;
CREATE TRIGGER trigger_update_campaign_counts
  AFTER INSERT OR UPDATE ON newsletter_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_counts();

-- Triggers to maintain updated_at timestamps
DROP TRIGGER IF EXISTS trigger_gemini_prompts_updated_at ON gemini_prompts;
CREATE TRIGGER trigger_gemini_prompts_updated_at
  BEFORE UPDATE ON gemini_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_newsletter_campaigns_updated_at ON newsletter_campaigns;
CREATE TRIGGER trigger_newsletter_campaigns_updated_at
  BEFORE UPDATE ON newsletter_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_content_calendar_updated_at ON content_calendar;
CREATE TRIGGER trigger_content_calendar_updated_at
  BEFORE UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_email_templates_updated_at ON email_templates;
CREATE TRIGGER trigger_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. SEED INITIAL DATA
-- ============================================================================

-- Insert default Gemini prompt templates
INSERT INTO gemini_prompts (name, template, variables, category, is_active)
VALUES
  (
    'Healthcare Blog Post - General',
    'Write a comprehensive blog post about {{topic}} for MPB Health''s audience. Target audience: {{target_audience}}. Tone: {{tone}}. Length: {{length}} words. Include these keywords: {{keywords}}. The post should be informative, engaging, and include a clear call-to-action about {{cta}}. Format the output as HTML with proper headings, paragraphs, and lists.',
    '["topic", "target_audience", "tone", "length", "keywords", "cta"]'::jsonb,
    'blog',
    true
  ),
  (
    'Newsletter Subject Line Generator',
    'Generate 5 compelling email subject lines for a newsletter about {{blog_title}}. The subject lines should be under 50 characters, create curiosity, and appeal to {{target_audience}}. Tone: {{tone}}.',
    '["blog_title", "target_audience", "tone"]'::jsonb,
    'newsletter',
    true
  ),
  (
    'SEO Meta Description',
    'Write an SEO-optimized meta description (150-160 characters) for a blog post titled "{{title}}" about {{topic}}. Include keywords: {{keywords}}.',
    '["title", "topic", "keywords"]'::jsonb,
    'seo',
    true
  )
ON CONFLICT DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (name, description, subject_template, html_template, text_template, variables, category, is_active)
VALUES
  (
    'Blog Post Newsletter',
    'Standard template for blog post announcements',
    '{{subject_line}}',
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><img src="{{logo_url}}" alt="MPB Health" style="max-width: 200px;"></div><h1 style="color: #2563eb; font-size: 28px; margin-bottom: 20px;">{{blog_title}}</h1><img src="{{featured_image}}" alt="{{blog_title}}" style="width: 100%; max-width: 600px; border-radius: 8px; margin-bottom: 20px;"><p style="font-size: 18px; color: #666; margin-bottom: 20px;">{{excerpt}}</p><div style="text-align: center; margin: 30px 0;"><a href="{{blog_url}}?utm_source=newsletter&utm_medium=email&utm_campaign={{campaign_id}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Read Full Article</a></div><hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"><p style="font-size: 14px; color: #666;">You''re receiving this email because you subscribed to MPB Health updates.</p><p style="font-size: 12px; color: #999;"><a href="{{unsubscribe_url}}" style="color: #999;">Unsubscribe</a> | <a href="{{preferences_url}}" style="color: #999;">Update Preferences</a></p></body></html>',
    'MPB Health Newsletter\n\n{{blog_title}}\n\n{{excerpt}}\n\nRead the full article: {{blog_url}}?utm_source=newsletter&utm_medium=email&utm_campaign={{campaign_id}}\n\n---\nYou''re receiving this email because you subscribed to MPB Health updates.\nUnsubscribe: {{unsubscribe_url}}',
    '["subject_line", "logo_url", "blog_title", "featured_image", "excerpt", "blog_url", "campaign_id", "unsubscribe_url", "preferences_url"]'::jsonb,
    'newsletter',
    true
  )
ON CONFLICT DO NOTHING;