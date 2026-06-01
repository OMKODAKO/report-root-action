
-- Fix 1: Restrict profiles SELECT to owner only (emails were publicly readable).
-- All app-side public reads of profile name go through supabaseAdmin in server functions,
-- so locking RLS to the owner does not break public report author display.
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Fix 2: Enforce path-based ownership on uploads to the 'reports' storage bucket.
-- Files must be uploaded under a top-level folder matching the user's id.
DROP POLICY IF EXISTS reports_bucket_auth_insert ON storage.objects;
CREATE POLICY reports_bucket_auth_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
