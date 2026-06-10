import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getCommunity = createServerFn({ method: "GET" }).handler(async () => {
  const now = new Date().toISOString();
  const [challenge, events, discussions, leaderboard, badges, eventsCount] = await Promise.all([
    supabaseAdmin
      .from("challenges")
      .select("*")
      .eq("active", true)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("events")
      .select("*")
      .gte("event_date", now)
      .order("event_date", { ascending: true })
      .limit(20),
    supabaseAdmin
      .from("discussions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("user_points")
      .select("*")
      .order("total_points", { ascending: false })
      .limit(10),
    supabaseAdmin.from("badges").select("*").order("created_at"),
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }),
  ]);

  const userIds = new Set<string>();
  (discussions.data ?? []).forEach((d: any) => userIds.add(d.user_id));
  (leaderboard.data ?? []).forEach((d: any) => userIds.add(d.user_id));

  const [profiles, commentCounts, likeCounts, partCounts, challengeParts, userBadges] = await Promise.all([
    userIds.size
      ? supabaseAdmin.from("profiles").select("id,name,profile_image").in("id", [...userIds])
      : Promise.resolve({ data: [] as any[] }),
    supabaseAdmin.from("discussion_comments").select("discussion_id"),
    supabaseAdmin.from("discussion_likes").select("discussion_id"),
    supabaseAdmin.from("event_participants").select("event_id"),
    challenge.data
      ? supabaseAdmin
          .from("challenge_participants")
          .select("id", { count: "exact", head: true })
          .eq("challenge_id", challenge.data.id)
      : Promise.resolve({ count: 0 } as any),
    leaderboard.data?.length
      ? supabaseAdmin.from("user_badges").select("user_id,badge_id").in("user_id", leaderboard.data.map((l: any) => l.user_id))
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const nameMap = new Map((profiles.data ?? []).map((p: any) => [p.id, p]));
  const cMap = new Map<string, number>();
  for (const c of commentCounts.data ?? []) cMap.set(c.discussion_id, (cMap.get(c.discussion_id) ?? 0) + 1);
  const lMap = new Map<string, number>();
  for (const l of likeCounts.data ?? []) lMap.set(l.discussion_id, (lMap.get(l.discussion_id) ?? 0) + 1);
  const pMap = new Map<string, number>();
  for (const p of partCounts.data ?? []) pMap.set(p.event_id, (pMap.get(p.event_id) ?? 0) + 1);

  const badgeMap = new Map((badges.data ?? []).map((b: any) => [b.id, b]));
  const userBadgeMap = new Map<string, any[]>();
  for (const ub of userBadges.data ?? []) {
    const arr = userBadgeMap.get(ub.user_id) ?? [];
    const b = badgeMap.get(ub.badge_id);
    if (b) arr.push(b);
    userBadgeMap.set(ub.user_id, arr);
  }

  return {
    challenge: challenge.data
      ? { ...challenge.data, participants: (challengeParts as any).count ?? 0 }
      : null,
    events: (events.data ?? []).map((e: any) => ({ ...e, participants: pMap.get(e.id) ?? 0 })),
    eventsCount: eventsCount.count ?? 0,
    discussions: (discussions.data ?? []).map((d: any) => ({
      ...d,
      author: nameMap.get(d.user_id) ?? null,
      comments: cMap.get(d.id) ?? 0,
      likes: lMap.get(d.id) ?? 0,
    })),
    leaderboard: (leaderboard.data ?? []).map((l: any, i: number) => ({
      rank: i + 1,
      user_id: l.user_id,
      total_points: l.total_points,
      profile: nameMap.get(l.user_id) ?? null,
      badges: userBadgeMap.get(l.user_id) ?? [],
    })),
    badges: badges.data ?? [],
  };
});

export const getImpactStats = createServerFn({ method: "GET" }).handler(async () => {
  const [reports, users, resolved, members, events] = await Promise.all([
    supabaseAdmin.from("reports").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("status", "resolved"),
    supabaseAdmin.from("user_points").select("user_id", { count: "exact", head: true }).gt("total_points", 0),
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }),
  ]);
  return {
    totalReports: reports.count ?? 0,
    totalUsers: users.count ?? 0,
    resolvedReports: resolved.count ?? 0,
    activeMembers: members.count ?? 0,
    eventsOrganized: events.count ?? 0,
  };
});

export const getDiscussion = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const [{ data: d }, { data: comments }] = await Promise.all([
      supabaseAdmin.from("discussions").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin.from("discussion_comments").select("*").eq("discussion_id", data.id).order("created_at"),
    ]);
    if (!d) return null;
    const userIds = [...new Set([d.user_id, ...(comments ?? []).map((c: any) => c.user_id)])];
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id,name").in("id", userIds);
    const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.name]));
    return {
      ...d,
      author_name: nameMap.get(d.user_id) ?? null,
      comments: (comments ?? []).map((c: any) => ({ ...c, author_name: nameMap.get(c.user_id) ?? null })),
    };
  });

export const createDiscussion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ title: z.string().min(3).max(200), content: z.string().min(3).max(5000) }))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("discussions")
      .insert({ ...data, user_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const addComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ discussion_id: z.string().uuid(), content: z.string().min(1).max(2000) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("discussion_comments")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleDiscussionLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ discussion_id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("discussion_likes")
      .select("id")
      .eq("user_id", context.userId)
      .eq("discussion_id", data.discussion_id)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("discussion_likes").delete().eq("id", existing.id);
      return { liked: false };
    }
    await context.supabase
      .from("discussion_likes")
      .insert({ user_id: context.userId, discussion_id: data.discussion_id });
    return { liked: true };
  });

export const joinEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ event_id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("event_participants")
      .select("id")
      .eq("user_id", context.userId)
      .eq("event_id", data.event_id)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("event_participants").delete().eq("id", existing.id);
      return { joined: false };
    }
    await context.supabase
      .from("event_participants")
      .insert({ user_id: context.userId, event_id: data.event_id });
    return { joined: true };
  });

export const joinChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ challenge_id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("challenge_participants")
      .select("id")
      .eq("user_id", context.userId)
      .eq("challenge_id", data.challenge_id)
      .maybeSingle();
    if (existing) return { joined: true };
    await context.supabase
      .from("challenge_participants")
      .insert({ user_id: context.userId, challenge_id: data.challenge_id });
    return { joined: true };
  });

export const getMyCommunity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const [points, badges, events, challenges, rank] = await Promise.all([
      supabaseAdmin.from("user_points").select("total_points").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("user_badges").select("badge_id,awarded_at").eq("user_id", userId),
      supabaseAdmin.from("event_participants").select("event_id").eq("user_id", userId),
      supabaseAdmin.from("challenge_participants").select("challenge_id,created_at").eq("user_id", userId),
      supabaseAdmin.from("user_points").select("user_id,total_points").order("total_points", { ascending: false }),
    ]);
    const total = points.data?.total_points ?? 0;
    const badgeIds = (badges.data ?? []).map((b: any) => b.badge_id);
    const eventIds = (events.data ?? []).map((e: any) => e.event_id);
    const challengeIds = (challenges.data ?? []).map((c: any) => c.challenge_id);
    const [allBadges, joinedEvents, joinedChallenges] = await Promise.all([
      badgeIds.length
        ? supabaseAdmin.from("badges").select("*").in("id", badgeIds)
        : Promise.resolve({ data: [] as any[] }),
      eventIds.length
        ? supabaseAdmin.from("events").select("*").in("id", eventIds)
        : Promise.resolve({ data: [] as any[] }),
      challengeIds.length
        ? supabaseAdmin.from("challenges").select("*").in("id", challengeIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const rankPos = (rank.data ?? []).findIndex((r: any) => r.user_id === userId);
    return {
      totalPoints: total,
      rank: rankPos >= 0 ? rankPos + 1 : null,
      badges: allBadges.data ?? [],
      joinedEvents: joinedEvents.data ?? [],
      joinedChallenges: joinedChallenges.data ?? [],
    };
  });
