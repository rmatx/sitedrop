-- Migration 2: Add user_id and lock down RLS to authenticated owners

ALTER TABLE deployments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "anon_select_deployments" ON deployments;
DROP POLICY IF EXISTS "anon_insert_deployments" ON deployments;
DROP POLICY IF EXISTS "anon_update_deployments" ON deployments;
DROP POLICY IF EXISTS "anon_delete_deployments" ON deployments;

CREATE POLICY "select_own_deployments" ON deployments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_deployments" ON deployments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_deployments" ON deployments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_deployments" ON deployments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone upload sites" ON storage.objects;
DROP POLICY IF EXISTS "Anyone delete sites" ON storage.objects;

CREATE POLICY "auth_upload_sites" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'sites');

CREATE POLICY "owner_delete_sites" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'sites' AND auth.uid() = owner);
