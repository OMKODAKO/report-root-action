import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Category = z.enum([
  "garbage",
  "damaged_building",
  "road_damage",
  "graffiti",
  "restoration_needed",
  "environmental_hazard",
]);

const Status = z.enum(["open", "in_progress", "resolved"]);

export type ReportCategory = z.infer<typeof Category>;
export type ReportStatus = z.infer<typeof Status>;

export type ReportRow = {
  id: string;
  user_id: string;
  image_url: string;
  description: string;
  category: ReportCategory;
  latitude: number;
  longitude: number;
  status: ReportStatus;
  created_at: string;
  author_name: string | null;
  likes_count: number;
};

async function enrichReports(rows: any[]): Promise<ReportRow[]> {
  if (!rows.length) return [];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const reportIds = rows.map((r) => r.id);

  const [{ data: profiles }, { data: likes }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id,name").in("id", userIds),
    supabaseAdmin.from("likes").select("report_id").in("report_id", reportIds),
  ]);

  const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.name]));
  const counts = new Map<string, number>();
  for (const l of likes ?? []) {
    counts.set(l.report_id, (counts.get(l.report_id) ?? 0) + 1);
  }

  return rows.map((r) => ({
    ...r,
    author_name: nameMap.get(r.user_id) ?? null,
    likes_count: counts.get(r.id) ?? 0,
  }));
}

export const listReports = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return await enrichReports(data ?? []);
});

export const getReport = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("reports")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const [enriched] = await enrichReports([row]);
    return enriched;
  });

export const getStats = createServerFn({ method: "GET" }).handler(async () => {
  const [reports, users, open, resolved] = await Promise.all([
    supabaseAdmin.from("reports").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("status", "resolved"),
  ]);
  return {
    totalReports: reports.count ?? 0,
    totalUsers: users.count ?? 0,
    openReports: open.count ?? 0,
    resolvedReports: resolved.count ?? 0,
  };
});

export const createReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      image_url: z.string().url(),
      description: z.string().min(3).max(2000),
      category: Category,
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("reports")
      .insert({ ...data, user_id: userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ report_id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", userId)
      .eq("report_id", data.report_id)
      .maybeSingle();
    if (existing) {
      await supabase.from("likes").delete().eq("id", existing.id);
      return { liked: false };
    }
    await supabase.from("likes").insert({ user_id: userId, report_id: data.report_id });
    return { liked: true };
  });

export const toggleSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ report_id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("saved_reports")
      .select("id")
      .eq("user_id", userId)
      .eq("report_id", data.report_id)
      .maybeSingle();
    if (existing) {
      await supabase.from("saved_reports").delete().eq("id", existing.id);
      return { saved: false };
    }
    await supabase.from("saved_reports").insert({ user_id: userId, report_id: data.report_id });
    return { saved: true };
  });

export const getMyInteractions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [likes, saves] = await Promise.all([
      supabase.from("likes").select("report_id").eq("user_id", userId),
      supabase.from("saved_reports").select("report_id").eq("user_id", userId),
    ]);
    return {
      likedIds: (likes.data ?? []).map((l: any) => l.report_id),
      savedIds: (saves.data ?? []).map((s: any) => s.report_id),
    };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profile, my, savedRel] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("reports").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("saved_reports").select("report_id").eq("user_id", userId),
    ]);
    const savedIds = (savedRel.data ?? []).map((s: any) => s.report_id);
    let saved: any[] = [];
    if (savedIds.length) {
      const { data } = await supabase.from("reports").select("*").in("id", savedIds);
      saved = data ?? [];
    }
    const [myEnriched, savedEnriched] = await Promise.all([
      enrichReports(my.data ?? []),
      enrichReports(saved),
    ]);
    return {
      profile: profile.data,
      myReports: myEnriched,
      savedReports: savedEnriched,
      isAdmin: await isAdmin(userId),
    };
  });

async function isAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(data);
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({ isAdmin: await isAdmin(context.userId) }));

export const adminListReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Forbidden");
    const { data } = await supabaseAdmin
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    return await enrichReports(data ?? []);
  });

export const adminUpdateStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), status: Status }))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Forbidden");
    const { error } = await supabaseAdmin
      .from("reports")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("reports").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Forbidden");
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: counts } = await supabaseAdmin.from("reports").select("user_id");
    const countMap = new Map<string, number>();
    for (const r of counts ?? []) {
      countMap.set(r.user_id, (countMap.get(r.user_id) ?? 0) + 1);
    }
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const roleMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    }
    return (profiles ?? []).map((p: any) => ({
      ...p,
      report_count: countMap.get(p.id) ?? 0,
      roles: roleMap.get(p.id) ?? [],
    }));
  });

export const submitDonation = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1).max(100),
      email: z.string().email().max(255),
      amount: z.number().positive().max(1000000),
      message: z.string().max(2000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("donations").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const uploadReportImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      data_url: z.string().startsWith("data:image/"),
      filename: z.string().min(1).max(120).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const match = /^data:(image\/[\w+.-]+);base64,(.+)$/.exec(data.data_url);
    if (!match) throw new Error("Invalid image data");
    const contentType = match[1];
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > 8 * 1024 * 1024) throw new Error("Image too large (max 8MB)");
    const ext = contentType.split("/")[1].split("+")[0];
    const path = `${context.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from("reports")
      .upload(path, buffer, { contentType, upsert: false });
    if (error) throw new Error(error.message);
    const { data: pub } = supabaseAdmin.storage.from("reports").getPublicUrl(path);
    return { url: pub.publicUrl };
  });
