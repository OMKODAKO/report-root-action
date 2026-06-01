import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listReports } from "@/lib/api/reports.functions";
import { MapView } from "@/components/MapView";
import { CATEGORIES } from "@/lib/categories";

const q = queryOptions({ queryKey: ["reports"], queryFn: () => listReports() });

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "Map — Take Care" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: MapPage,
  errorComponent: ({ error }) => <div className="p-8 text-center text-destructive">{error.message}</div>,
});

function MapPage() {
  const { data: reports } = useSuspenseQuery(q);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Community Map</h1>
          <p className="text-sm text-muted-foreground">{reports.length} report{reports.length !== 1 ? "s" : ""} pinned</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.values(CATEGORIES).map((c) => (
            <span key={c.label} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} /> {c.label}
            </span>
          ))}
        </div>
      </div>
      <MapView reports={reports} height="75vh" />
    </div>
  );
}
