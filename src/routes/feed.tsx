import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listReports } from "@/lib/api/reports.functions";
import { ReportCard } from "@/components/ReportCard";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";

const q = queryOptions({ queryKey: ["reports"], queryFn: () => listReports() });

export const Route = createFileRoute("/feed")({
  head: () => ({ meta: [{ title: "Community Feed — Take Care" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: Feed,
  errorComponent: ({ error }) => <div className="p-8 text-center text-destructive">{error.message}</div>,
});

function Feed() {
  const { data: reports } = useSuspenseQuery(q);
  const [filter, setFilter] = useState<CategoryKey | "all">("all");
  const filtered = filter === "all" ? reports : reports.filter((r) => r.category === filter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">Community Feed</h1>
      <p className="mt-1 text-muted-foreground">Recent reports from your community.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All</FilterButton>
        {(Object.entries(CATEGORIES) as [CategoryKey, typeof CATEGORIES[CategoryKey]][]).map(([k, v]) => (
          <FilterButton key={k} active={filter === k} onClick={() => setFilter(k)}>{v.label}</FilterButton>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-xl border bg-card p-10 text-center text-muted-foreground">
          No reports to show.
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => <ReportCard key={r.id} report={r} />)}
        </div>
      )}
    </div>
  );
}

function FilterButton({ active, ...props }: { active: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
    />
  );
}
