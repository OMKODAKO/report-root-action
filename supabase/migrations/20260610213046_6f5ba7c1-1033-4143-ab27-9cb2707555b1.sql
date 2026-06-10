
-- Challenges
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenges TO anon, authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY challenges_select_all ON public.challenges FOR SELECT USING (true);
CREATE POLICY challenges_admin_all ON public.challenges FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TABLE public.challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);
GRANT SELECT ON public.challenge_participants TO anon, authenticated;
GRANT INSERT, DELETE ON public.challenge_participants TO authenticated;
GRANT ALL ON public.challenge_participants TO service_role;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY cp_select_all ON public.challenge_participants FOR SELECT USING (true);
CREATE POLICY cp_insert_own ON public.challenge_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY cp_delete_own ON public.challenge_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Discussions
CREATE TABLE public.discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.discussions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.discussions TO authenticated;
GRANT ALL ON public.discussions TO service_role;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY d_select_all ON public.discussions FOR SELECT USING (true);
CREATE POLICY d_insert_own ON public.discussions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY d_update_own ON public.discussions FOR UPDATE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY d_delete_own ON public.discussions FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

CREATE TABLE public.discussion_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.discussion_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.discussion_comments TO authenticated;
GRANT ALL ON public.discussion_comments TO service_role;
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY dc_select_all ON public.discussion_comments FOR SELECT USING (true);
CREATE POLICY dc_insert_own ON public.discussion_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY dc_update_own ON public.discussion_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY dc_delete_own ON public.discussion_comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

CREATE TABLE public.discussion_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(discussion_id, user_id)
);
GRANT SELECT ON public.discussion_likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.discussion_likes TO authenticated;
GRANT ALL ON public.discussion_likes TO service_role;
ALTER TABLE public.discussion_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY dl_select_all ON public.discussion_likes FOR SELECT USING (true);
CREATE POLICY dl_insert_own ON public.discussion_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY dl_delete_own ON public.discussion_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  event_date timestamptz NOT NULL,
  location text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY ev_select_all ON public.events FOR SELECT USING (true);
CREATE POLICY ev_admin_all ON public.events FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TABLE public.event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
GRANT SELECT ON public.event_participants TO anon, authenticated;
GRANT INSERT, DELETE ON public.event_participants TO authenticated;
GRANT ALL ON public.event_participants TO service_role;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY ep_select_all ON public.event_participants FOR SELECT USING (true);
CREATE POLICY ep_insert_own ON public.event_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ep_delete_own ON public.event_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Badges
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🏅',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY b_select_all ON public.badges FOR SELECT USING (true);

CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
GRANT SELECT ON public.user_badges TO anon, authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY ub_select_all ON public.user_badges FOR SELECT USING (true);

-- User points
CREATE TABLE public.user_points (
  user_id uuid PRIMARY KEY,
  total_points integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_points TO anon, authenticated;
GRANT ALL ON public.user_points TO service_role;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY up_select_all ON public.user_points FOR SELECT USING (true);

-- Donations message column
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS message text;

-- Points functions and triggers
CREATE OR REPLACE FUNCTION public.add_points(_user_id uuid, _points int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_points (user_id, total_points, updated_at)
  VALUES (_user_id, _points, now())
  ON CONFLICT (user_id) DO UPDATE SET total_points = public.user_points.total_points + EXCLUDED.total_points, updated_at = now();

  -- Award badges based on thresholds
  INSERT INTO public.user_badges (user_id, badge_id)
  SELECT _user_id, b.id FROM public.badges b
  WHERE (
    (b.slug = 'eco_guardian' AND (SELECT total_points FROM public.user_points WHERE user_id = _user_id) >= 10)
    OR (b.slug = 'city_helper' AND (SELECT total_points FROM public.user_points WHERE user_id = _user_id) >= 50)
    OR (b.slug = 'restoration_hero' AND (SELECT total_points FROM public.user_points WHERE user_id = _user_id) >= 150)
    OR (b.slug = 'community_leader' AND (SELECT total_points FROM public.user_points WHERE user_id = _user_id) >= 300)
    OR (b.slug = 'top_contributor' AND (SELECT total_points FROM public.user_points WHERE user_id = _user_id) >= 500)
  )
  ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.tr_report_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.add_points(NEW.user_id, 10);
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'in_progress' THEN PERFORM public.add_points(NEW.user_id, 20);
    ELSIF NEW.status = 'resolved' THEN PERFORM public.add_points(NEW.user_id, 50);
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER report_points AFTER INSERT OR UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.tr_report_points();

CREATE OR REPLACE FUNCTION public.tr_discussion_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.add_points(NEW.user_id, 5); RETURN NEW; END $$;
CREATE TRIGGER disc_points AFTER INSERT ON public.discussions FOR EACH ROW EXECUTE FUNCTION public.tr_discussion_points();
CREATE TRIGGER comment_points AFTER INSERT ON public.discussion_comments FOR EACH ROW EXECUTE FUNCTION public.tr_discussion_points();

CREATE OR REPLACE FUNCTION public.tr_event_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.add_points(NEW.user_id, 15); RETURN NEW; END $$;
CREATE TRIGGER event_points AFTER INSERT ON public.event_participants FOR EACH ROW EXECUTE FUNCTION public.tr_event_points();

-- Seed badges
INSERT INTO public.badges (slug, name, description, icon) VALUES
  ('eco_guardian', 'Eco Guardian', 'Earned 10 contribution points', '🌱'),
  ('city_helper', 'City Helper', 'Earned 50 contribution points', '🏙️'),
  ('restoration_hero', 'Restoration Hero', 'Earned 150 contribution points', '🏛️'),
  ('community_leader', 'Community Leader', 'Earned 300 contribution points', '🤝'),
  ('top_contributor', 'Top Contributor', 'Earned 500 contribution points', '🏆')
ON CONFLICT (slug) DO NOTHING;

-- Seed an active monthly challenge
INSERT INTO public.challenges (title, description, start_date, end_date, active)
VALUES ('Clean City Month', 'Report and help resolve garbage and litter issues in your neighborhood throughout the month.', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month' - interval '1 second', true);

-- Seed sample events
INSERT INTO public.events (title, description, event_date, location) VALUES
  ('Community Park Cleanup', 'Join neighbors to clean up the central park. Gloves and bags provided.', now() + interval '7 days', 'Central Park'),
  ('Tree Planting Day', 'Help plant 100 trees along the riverside walkway.', now() + interval '14 days', 'Riverside Walkway'),
  ('Historic Square Restoration', 'Volunteer to restore benches and signage in the old town square.', now() + interval '21 days', 'Old Town Square');
