import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListReports,
  adminListUsers,
  adminUpdateStatus,
  adminDeleteReport,
  checkIsAdmin,
  type ReportStatus,
} from "@/lib/api/reports.functions";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORIES, STATUS_META, formatDate } from "@/lib/categories";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Take Care" }] }),
  component: Admin,
});

function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const checkAdmin = useServerFn(checkIsAdmin);
  const fetchReports = useServerFn(adminListReports);
  const fetchUsers = useServerFn(adminListUsers);
  const updateStatus = useServerFn(adminUpdateStatus);
  const deleteReport = useServerFn(adminDeleteReport);

  const adminQ = useQuery({ queryKey: ["isAdmin", user?.id], queryFn: () => checkAdmin(), enabled: !!user });
  const reportsQ = useQuery({ queryKey: ["admin", "reports"], queryFn: () => fetchReports(), enabled: !!adminQ.data?.isAdmin });
  const usersQ = useQuery({ queryKey: ["admin", "users"], queryFn: () => fetchUsers(), enabled: !!adminQ.data?.isAdmin });

  const [tab, setTab] = useState<"reports" | "users" | "stats">("reports");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | ReportStatus>("all");

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);

  if (loading || !user || adminQ.isLoading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!adminQ.data?.isAdmin) return (
    <div className="p-10 text-center">
      <h1 className="text-xl font-semibold">Admin access required</h1>
      <Link to="/" className="mt-4 inline-block text-primary hover:underline">Go home</Link>
    </div>
  );

  const reports = reportsQ.data ?? [];
  const filtered = reports.filter((r) =>
    (filter === "all" || r.status === filter) &&
    (!search || r.description.toLowerCase().includes(search.toLowerCase()) || r.author_name?.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === "open").length,
    inProgress: reports.filter((r) => r.status === "in_progress").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    byCategory: Object.keys(CATEGORIES).map((k) => ({
      key: k,
      count: reports.filter((r) => r.category === k).length,
    })),
  };

  const onStatus = async (id: string, status: ReportStatus) => {
    try {
      await updateStatus({ data: { id, status } });
      toast.success("Status updated");
      qc.invalidateQueries();
    } catch (e: any) { toast.error(e.message); }
  };
  const onDelete = async (id: string) => {
    if (!confirm("Delete this report permanently?")) return;
    try {
      await deleteReport({ data: { id } });
      toast.success("Deleted");
      qc.invalidateQueries();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold">Admin Panel</h1>
      <div className="mt-6 flex gap-2 border-b">
        {(["reports", "users", "stats"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "reports" && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <input placeholder="Search description or author…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] rounded-md border bg-background px-3 py-2 text-sm" />
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Photo</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Author</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const status = STATUS_META[r.status];
                  return (
                    <tr key={r.id} className="border-t">
                      <td className="p-3"><img src={r.image_url} className="h-12 w-16 rounded object-cover" alt="" /></td>
                      <td className="p-3 max-w-xs"><Link to="/report/$id" params={{ id: r.id }} className="line-clamp-2 hover:underline">{r.description}</Link></td>
                      <td className="p-3">{CATEGORIES[r.category].label}</td>
                      <td className="p-3">
                        <select value={r.status} onChange={(e) => onStatus(r.id, e.target.value as ReportStatus)}
                          className={`rounded-full px-2 py-1 text-xs ${status.bg} ${status.text} border-0`}>
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>
                      <td className="p-3">{r.author_name ?? "—"}</td>
                      <td className="p-3 whitespace-nowrap">{formatDate(r.created_at)}</td>
                      <td className="p-3">
                        <button onClick={() => onDelete(r.id)} className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No reports.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Roles</th>
                <th className="p-3">Reports</th>
                <th className="p-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(usersQ.data ?? []).map((u: any) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3">{u.roles.join(", ") || "user"}</td>
                  <td className="p-3">{u.report_count}</td>
                  <td className="p-3 whitespace-nowrap">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "stats" && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total reports" value={stats.total} />
            <StatCard label="Open" value={stats.open} />
            <StatCard label="In progress" value={stats.inProgress} />
            <StatCard label="Resolved" value={stats.resolved} />
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-sm font-semibold">Reports by category</h3>
            <div className="mt-4 space-y-2">
              {stats.byCategory.map((c) => {
                const meta = CATEGORIES[c.key as keyof typeof CATEGORIES];
                const pct = stats.total ? Math.round((c.count / stats.total) * 100) : 0;
                return (
                  <div key={c.key}>
                    <div className="flex justify-between text-xs"><span>{meta.label}</span><span>{c.count} ({pct}%)</span></div>
                    <div className="mt-1 h-2 overflow-hidden rounded bg-muted">
                      <div className="h-full" style={{ width: `${pct}%`, background: meta.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
