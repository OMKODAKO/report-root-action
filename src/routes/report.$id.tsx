import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getReport } from "@/lib/api/reports.functions";
import { CATEGORIES, STATUS_META, formatDate } from "@/lib/categories";
import { MapView } from "@/components/MapView";

export const Route = createFileRoute("/report/$id")({
  head: () => ({ meta: [{ title: "Report — Take Care" }] }),
  component: ReportDetail,
  errorComponent: ({ error }) => <div className="p-8 text-center text-destructive">{error.message}</div>,
});

function ReportDetail() {
  const { id } = Route.useParams();
  const fetchReport = useServerFn(getReport);
  const { data: report, isLoading } = useQuery({
    queryKey: ["report", id],
    queryFn: () => fetchReport({ data: { id } }),
  });

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!report) return (
    <div className="p-10 text-center">
      <p>Report not found.</p>
      <Link to="/feed" className="mt-4 inline-block text-primary hover:underline">Back to feed</Link>
    </div>
  );

  const cat = CATEGORIES[report.category];
  const Icon = cat.icon;
  const status = STATUS_META[report.status];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/feed" className="text-sm text-muted-foreground hover:text-foreground">← Back to feed</Link>
      <div className="mt-4 overflow-hidden rounded-xl border bg-card">
        <img src={report.image_url} alt="" className="w-full" />
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium" style={{ backgroundColor: `${cat.color}1A`, color: cat.color }}>
              <Icon className="h-4 w-4" /> {cat.label}
            </span>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${status.bg} ${status.text}`}>{status.label}</span>
            <span className="ml-auto text-sm text-muted-foreground">{formatDate(report.created_at)}</span>
          </div>
          <p className="whitespace-pre-wrap text-base">{report.description}</p>
          <div className="text-sm text-muted-foreground">
            Reported by <span className="font-medium text-foreground">{report.author_name ?? "Anonymous"}</span> · {report.likes_count} like{report.likes_count !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="border-t">
          <MapView reports={[report]} height="320px" center={[report.latitude, report.longitude]} />
        </div>
      </div>
    </div>
  );
}
