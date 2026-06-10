
REVOKE EXECUTE ON FUNCTION public.add_points(uuid, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tr_report_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tr_discussion_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tr_event_points() FROM PUBLIC, anon, authenticated;
