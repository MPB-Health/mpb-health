-- Advisor Videos table for CMS-managed video library
CREATE TABLE IF NOT EXISTS public.advisor_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  vimeo_id TEXT NOT NULL,
  vimeo_hash TEXT,
  thumbnail_url TEXT,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advisor_videos ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read videos" ON public.advisor_videos
  FOR SELECT TO authenticated USING (true);

-- Allow admins to manage (using role check)
CREATE POLICY "Admins can manage videos" ON public.advisor_videos
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

-- Seed with existing hardcoded videos
INSERT INTO public.advisor_videos (title, vimeo_id, vimeo_hash, thumbnail_url, order_index) VALUES
  ('Zion Healthshare Contest', '1121281554', NULL, 'https://vumbnail.com/1121281554.jpg', 0),
  ('What is Medical Cost Sharing?', '867328836', NULL, 'https://advisor.mpb.health/wp-content/uploads/2025/02/Cream-Neutral-Minimalist-New-Business-Pitch-Deck-Presentation1.jpg', 1),
  ('MPB Health - Accessible, Flexible y Eficaz', '999576729', NULL, 'https://advisor.mpb.health/wp-content/uploads/2025/02/Cream-Neutral-Minimalist-New-Business-Pitch-Deck-Presentation3-1.jpg', 2),
  ('MPB.Health Membership Overview', '560882524', NULL, 'https://advisor.mpb.health/wp-content/uploads/2025/02/Cream-Neutral-Minimalist-New-Business-Pitch-Deck-Presentation6.jpg', 3),
  ('Premium Care', '951207884', NULL, 'https://advisor.mpb.health/wp-content/uploads/2025/02/Cream-Neutral-Minimalist-New-Business-Pitch-Deck-Presentation2.jpg', 4),
  ('Premium HSA', '952446997', NULL, 'https://advisor.mpb.health/wp-content/uploads/2025/02/Cream-Neutral-Minimalist-New-Business-Pitch-Deck-Presentation5.jpg', 5),
  ('App Video', '889549950', NULL, 'https://advisor.mpb.health/wp-content/uploads/2025/02/Cream-Neutral-Minimalist-New-Business-Pitch-Deck-Presentation4.jpg', 6),
  ('Advisor Landing Page Training', '1098270274', '8a7898b305', 'https://advisor.mpb.health/wp-content/uploads/2025/07/videos-overlay.jpg', 7);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_advisor_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER advisor_videos_updated_at
  BEFORE UPDATE ON public.advisor_videos
  FOR EACH ROW EXECUTE FUNCTION update_advisor_videos_updated_at();
