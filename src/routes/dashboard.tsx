import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/api/reports.functions";
import { getMyCommunity } from "@/lib/api/community.functions";
import { ReportCard } from "@/components/ReportCard";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Take Care" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchDash = useServerFn(getDashboard);
  const fetchMine = useServerFn(getMyCommunity);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: () => fetchDash(),
    enabled: !!user,
  });
  const { data: mine } = useQuery({
    queryKey: ["myCommunity", user?.id],
    queryFn: () => fetchMine(),
    enabled: !!user,
  });

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);
  if (loading || !user) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (isLoading || !data) return <div className="p-10 text-center text-muted-foreground">Loading dashboard…</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{data.profile?.name ?? "Welcome"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{data.profile?.email}</p>
        </div>
        <div className="flex gap-2">
          {data.isAdmin && (
            <Link to="/admin" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Admin Panel</Link>
          )}
          <Link to="/report/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">+ New report</Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Reports" value={data.myReports.length} />
        <Stat label="Points" value={mine?.totalPoints ?? 0} />
        <Stat label="Rank" value={mine?.rank ? `#${mine.rank}` : "—"} />
        <Stat label="Resolved" value={data.myReports.filter((r) => r.status === "resolved").length} />
      </div>

      {mine && (
        <section className="mt-8 rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">My badges</h2>
          {mine.badges.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Earn points by reporting, joining discussions, and attending events to unlock badges.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-3">
              {mine.badges.map((b: any) => (
                <div key={b.id} className="rounded-lg border bg-background px-3 py-2 text-sm flex items-center gap-2">
                  <span className="text-xl">{b.icon}</span>
                  <span className="font-medium">{b.name}</span>
                </div>
              ))}
            </div>
          )}
          {mine.totalPoints > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress to next badge</span>
                <span>{mine.totalPoints} pts</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, (mine.totalPoints / 500) * 100)}%` }} />
              </div>
            </div>
          )}
        </section>
      )}

      {mine && (mine.joinedEvents.length > 0 || mine.joinedChallenges.length > 0) && (
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold">Joined events</h2>
            {mine.joinedEvents.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No events joined yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {mine.joinedEvents.map((e: any) => (
                  <li key={e.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                    <span className="font-medium">{e.title}</span>
                    <span className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold">Challenge history</h2>
            {mine.joinedChallenges.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No challenges joined yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {mine.joinedChallenges.map((c: any) => (
                  <li key={c.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                    <span className="font-medium">{c.title}</span>
                    <span className="text-xs text-muted-foreground">{new Date(c.start_date).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold">My reports</h2>
        {data.myReports.length === 0 ? (
          <div className="mt-4 rounded-xl border bg-card p-8 text-center text-muted-foreground">
            You haven't submitted any reports yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.myReports.map((r) => <ReportCard key={r.id} report={r} />)}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Saved reports</h2>
        {data.savedReports.length === 0 ? (
          <div className="mt-4 rounded-xl border bg-card p-8 text-center text-muted-foreground">
            No saved reports yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.savedReports.map((r) => <ReportCard key={r.id} report={r} initialSaved />)}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string | number; value: number | string }) {
  return (
    <div className="rounded-xl border bg-card p-4 text-center">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
