import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Camera, MapPin, Send } from "lucide-react";
import { listReports, getStats } from "@/lib/api/reports.functions";
import { ReportCard } from "@/components/ReportCard";


const reportsQ = queryOptions({ queryKey: ["reports"], queryFn: () => listReports() });
const statsQ = queryOptions({ queryKey: ["stats"], queryFn: () => getStats() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Take Care — Small Actions. Visible Change." },
      { name: "description", content: "Report environmental and infrastructure issues in your community using photos and location pins." },
    ],
  }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(reportsQ),
    context.queryClient.ensureQueryData(statsQ),
  ]),
  component: Home,
  errorComponent: ({ error }) => <div className="p-8 text-center text-destructive">{error.message}</div>,
});

function Home() {
  const { data: reports } = useSuspenseQuery(reportsQ);
  const { data: stats } = useSuspenseQuery(statsQ);
  const recent = reports.slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>

            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Small Actions.<br />Visible Change.
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              Report environmental and infrastructure issues in your community using photos and location pins.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/report/new" className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">
                Report an issue
              </Link>
              <Link to="/map" className="rounded-md border px-5 py-3 text-sm font-medium hover:bg-muted">
                Explore the map
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Reports" value={stats.totalReports} />
            <Stat label="Members" value={stats.totalUsers} />
            <Stat label="Open" value={stats.openReports} />
            <Stat label="Resolved" value={stats.resolvedReports} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold md:text-3xl">How it works</h2>
        <p className="mt-2 text-center text-muted-foreground">Three simple steps to make a difference.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Step icon={<Camera className="h-6 w-6" />} n={1} title="Take a Photo" desc="Use your camera or upload an image of the issue." />
          <Step icon={<MapPin className="h-6 w-6" />} n={2} title="Select a Location" desc="Use GPS or pick the location on the map." />
          <Step icon={<Send className="h-6 w-6" />} n={3} title="Submit a Report" desc="Add a category and description, then submit." />
        </div>
      </section>

      {/* Recent */}
      <section className="border-t bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold">Recent reports</h2>
            <Link to="/feed" className="text-sm font-medium text-primary hover:underline">View all →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
              No reports yet. <Link to="/report/new" className="text-primary hover:underline">Be the first to report.</Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((r) => <ReportCard key={r.id} report={r} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-6 text-center">
      <div className="text-3xl font-bold text-primary">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function Step({ icon, n, title, desc }: { icon: React.ReactNode; n: number; title: string; desc: string }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="text-xs font-medium text-muted-foreground">Step {n}</div>
      <h3 className="mt-1 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
