CREATE TABLE IF NOT EXISTS grouplogos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grouplogos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view group logos"
  ON grouplogos
  FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('GroupLogo', 'GroupLogo', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read GroupLogo bucket"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'GroupLogo');;
