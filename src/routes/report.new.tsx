import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { CameraCapture } from "@/components/CameraCapture";
import { MapView } from "@/components/MapView";
import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import { createReport, uploadReportImage } from "@/lib/api/reports.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Locate } from "lucide-react";

export const Route = createFileRoute("/report/new")({
  head: () => ({ meta: [{ title: "New Report — Take Care" }] }),
  component: NewReport,
});

function NewReport() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const upload = useServerFn(uploadReportImage);
  const create = useServerFn(createReport);

  const [image, setImage] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryKey>("garbage");
  const [description, setDescription] = useState("");
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => toast.error(e.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!image) return toast.error("Add a photo");
    if (!pos) return toast.error("Pick a location");
    if (description.trim().length < 3) return toast.error("Add a description");
    setSubmitting(true);
    try {
      const { url } = await upload({ data: { data_url: image } });
      const { id } = await create({
        data: {
          image_url: url,
          description: description.trim(),
          category,
          latitude: pos.lat,
          longitude: pos.lng,
        },
      });
      qc.invalidateQueries();
      toast.success("Report submitted!");
      navigate({ to: "/report/$id", params: { id } });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Report an issue</h1>
      <p className="mt-1 text-sm text-muted-foreground">Help your community by reporting what you see.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <section className="space-y-2">
          <label className="text-sm font-medium">1. Photo</label>
          <CameraCapture value={image} onChange={setImage} />
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">2. Location</label>
            <button type="button" onClick={detectLocation} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
              <Locate className="h-4 w-4" /> Use my location
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Or click on the map to drop a pin.</p>
          <MapView
            pickable
            onPick={(lat, lng) => setPos({ lat, lng })}
            pickedPosition={pos}
            center={pos ? [pos.lat, pos.lng] : null}
            height="320px"
          />
          {pos && <p className="text-xs text-muted-foreground">📍 {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}</p>}
        </section>

        <section className="space-y-2">
          <label className="text-sm font-medium">3. Category</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.entries(CATEGORIES) as [CategoryKey, typeof CATEGORIES[CategoryKey]][]).map(([k, v]) => {
              const Icon = v.icon;
              const active = category === k;
              return (
                <button key={k} type="button" onClick={() => setCategory(k)}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${active ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>
                  <Icon className="h-4 w-4" style={{ color: v.color }} />
                  {v.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <label className="text-sm font-medium">4. Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required minLength={3} maxLength={2000} rows={4}
            placeholder="Describe what you saw…"
            className="w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
        </section>

        <button disabled={submitting} className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </div>
  );
}
