
-- Restrict has_role / handle_new_user execute
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Narrow storage SELECT to non-listing (objects are still reachable via public URL)
DROP POLICY IF EXISTS "reports_bucket_public_read" ON storage.objects;
CREATE POLICY "reports_bucket_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'reports' AND auth.role() = 'authenticated');
-- Public access to images uses the public bucket URL (no list privilege needed)

-- Tighten donations insert with basic validation
DROP POLICY IF EXISTS "donations_insert_any" ON public.donations;
CREATE POLICY "donations_insert_validated" ON public.donations FOR INSERT
  WITH CHECK (
    length(name) BETWEEN 1 AND 100
    AND length(email) BETWEEN 3 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND amount > 0 AND amount <= 1000000
  );
