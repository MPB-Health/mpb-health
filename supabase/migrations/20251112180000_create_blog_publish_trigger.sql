/*
  # Blog Post Publishing Automation Trigger

  ## Overview
  This migration creates a database trigger that automatically fires webhooks
  when a blog post is published. It handles both Netlify rebuild and newsletter
  distribution in parallel.

  ## New Functions

  ### 1. trigger_blog_published_webhooks()
  Fires when blog_articles.is_published changes to true
  - Extracts blog post data
  - Triggers Netlify rebuild webhook
  - Triggers n8n newsletter workflow
  - Logs webhook deliveries
  - Handles errors gracefully

  ## Triggers

  ### 1. on_blog_published
  Fires AFTER UPDATE on blog_articles
  - Only when is_published changes from false to true
  - Calls trigger_blog_published_webhooks function
  - Executes asynchronously to avoid blocking

  ## Environment Variables Required
  - VITE_NETLIFY_BUILD_HOOK_URL: Netlify build hook URL
  - VITE_N8N_WEBHOOK_URL_NEWSLETTER: n8n newsletter webhook URL

  ## Security
  - Function uses SECURITY DEFINER to bypass RLS for webhook calls
  - Only accessible through trigger mechanism
  - Logs all webhook attempts for audit trail
*/

-- ============================================================================
-- DROP EXISTING TRIGGER AND FUNCTION IF THEY EXIST
-- ============================================================================

DROP TRIGGER IF EXISTS on_blog_published ON blog_articles;
DROP FUNCTION IF EXISTS trigger_blog_published_webhooks();

-- ============================================================================
-- CREATE WEBHOOK TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_blog_published_webhooks()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_netlify_url text;
  v_n8n_url text;
  v_blog_data jsonb;
  v_base_url text;
BEGIN
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
    v_base_url := COALESCE(current_setting('app.settings.base_url', true), 'https://mpbhealth.com');
    v_netlify_url := current_setting('app.settings.netlify_build_hook_url', true);
    v_n8n_url := current_setting('app.settings.n8n_newsletter_webhook_url', true);

    v_blog_data := jsonb_build_object(
      'id', NEW.id,
      'title', NEW.title,
      'slug', NEW.slug,
      'excerpt', NEW.excerpt,
      'author', NEW.author,
      'published_date', NEW.published_date,
      'featured_image_url', NEW.featured_image_url,
      'category', NEW.category,
      'full_url', v_base_url || '/blog/' || NEW.slug
    );

    BEGIN
      IF v_netlify_url IS NOT NULL AND v_netlify_url != '' THEN
        PERFORM net.http_post(
          url := v_netlify_url,
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
            'trigger', 'blog_published',
            'blog_post', v_blog_data,
            'timestamp', NOW()
          )
        );

        INSERT INTO webhook_delivery_logs (
          webhook_url,
          event_type,
          payload,
          success,
          response_status,
          created_at
        ) VALUES (
          v_netlify_url,
          'netlify_rebuild',
          v_blog_data,
          true,
          200,
          NOW()
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO webhook_delivery_logs (
        webhook_url,
        event_type,
        payload,
        success,
        error_message,
        created_at
      ) VALUES (
        v_netlify_url,
        'netlify_rebuild',
        v_blog_data,
        false,
        SQLERRM,
        NOW()
      );
    END;

    BEGIN
      IF v_n8n_url IS NOT NULL AND v_n8n_url != '' THEN
        PERFORM net.http_post(
          url := v_n8n_url,
          headers := '{"Content-Type": "application/json", "X-Event-Type": "blog_published", "X-Source": "mpb-health-supabase"}'::jsonb,
          body := jsonb_build_object(
            'event', 'blog_published',
            'timestamp', NOW(),
            'data', v_blog_data
          )
        );

        INSERT INTO webhook_delivery_logs (
          webhook_url,
          event_type,
          payload,
          success,
          response_status,
          created_at
        ) VALUES (
          v_n8n_url,
          'blog_published',
          v_blog_data,
          true,
          200,
          NOW()
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO webhook_delivery_logs (
        webhook_url,
        event_type,
        payload,
        success,
        error_message,
        created_at
      ) VALUES (
        v_n8n_url,
        'blog_published',
        v_blog_data,
        false,
        SQLERRM,
        NOW()
      );
    END;

  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

CREATE TRIGGER on_blog_published
  AFTER UPDATE ON blog_articles
  FOR EACH ROW
  WHEN (NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL))
  EXECUTE FUNCTION trigger_blog_published_webhooks();

-- ============================================================================
-- CREATE HELPER FUNCTION TO SET CONFIG VALUES
-- ============================================================================

CREATE OR REPLACE FUNCTION set_webhook_config(
  p_netlify_url text DEFAULT NULL,
  p_n8n_url text DEFAULT NULL,
  p_base_url text DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_netlify_url IS NOT NULL THEN
    PERFORM set_config('app.settings.netlify_build_hook_url', p_netlify_url, false);
  END IF;

  IF p_n8n_url IS NOT NULL THEN
    PERFORM set_config('app.settings.n8n_newsletter_webhook_url', p_n8n_url, false);
  END IF;

  IF p_base_url IS NOT NULL THEN
    PERFORM set_config('app.settings.base_url', p_base_url, false);
  END IF;
END;
$$;

-- ============================================================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION set_webhook_config TO authenticated;
GRANT EXECUTE ON FUNCTION set_webhook_config TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION trigger_blog_published_webhooks() IS 'Automatically triggers webhooks when a blog post is published';
COMMENT ON FUNCTION set_webhook_config(text, text, text) IS 'Helper function to configure webhook URLs for blog publishing automation';
COMMENT ON TRIGGER on_blog_published ON blog_articles IS 'Fires webhooks when blog post is published';
