import { lazy, Suspense } from "react";
import type { ReportRow } from "@/lib/api/reports.functions";

const InnerMap = lazy(() => import("./MapViewInner").then((m) => ({ default: m.MapView })));

type Props = {
  reports?: ReportRow[];
  height?: string;
  pickable?: boolean;
  pickedPosition?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
  center?: [number, number] | null;
};

export function MapView(props: Props) {
  if (typeof window === "undefined") {
    return <div className="rounded-xl border bg-muted" style={{ height: props.height ?? "70vh" }} />;
  }
  return (
    <Suspense fallback={<div className="rounded-xl border bg-muted" style={{ height: props.height ?? "70vh" }} />}>
      <InnerMap {...props} />
    </Suspense>
  );
}
