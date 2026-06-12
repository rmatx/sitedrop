-- Migration 1: Create deployments table and storage bucket

CREATE TABLE IF NOT EXISTS deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  files_count integer NOT NULL DEFAULT 0,
  total_size bigint NOT NULL DEFAULT 0,
  has_index_html boolean NOT NULL DEFAULT false,
  file_paths text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_deployments" ON deployments;
CREATE POLICY "anon_select_deployments" ON deployments
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_deployments" ON deployments;
CREATE POLICY "anon_insert_deployments" ON deployments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_deployments" ON deployments;
CREATE POLICY "anon_update_deployments" ON deployments
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_deployments" ON deployments;
CREATE POLICY "anon_delete_deployments" ON deployments
  FOR DELETE TO anon, authenticated USING (true);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('sites', 'sites', true, 52428800, null)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read sites" ON storage.objects;
CREATE POLICY "Public read sites" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'sites');

DROP POLICY IF EXISTS "Anyone upload sites" ON storage.objects;
CREATE POLICY "Anyone upload sites" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'sites');

DROP POLICY IF EXISTS "Anyone delete sites" ON storage.objects;
CREATE POLICY "Anyone delete sites" ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'sites');
