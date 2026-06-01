import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/api/reports.functions";
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
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: () => fetchDash(),
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
        <Stat label="Saved" value={data.savedReports.length} />
        <Stat label="Resolved" value={data.myReports.filter((r) => r.status === "resolved").length} />
        <Stat label="Open" value={data.myReports.filter((r) => r.status === "open").length} />
      </div>

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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 text-center">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
