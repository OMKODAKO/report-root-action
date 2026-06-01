import { Link } from "@tanstack/react-router";
import { Heart, Bookmark, MapPin } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CATEGORIES, STATUS_META, formatDate } from "@/lib/categories";
import { toggleLike, toggleSave, type ReportRow } from "@/lib/api/reports.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type Props = {
  report: ReportRow;
  initialLiked?: boolean;
  initialSaved?: boolean;
};

export function ReportCard({ report, initialLiked = false, initialSaved = false }: Props) {
  const { user } = useAuth();
  const likeFn = useServerFn(toggleLike);
  const saveFn = useServerFn(toggleSave);
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(initialSaved);
  const [likes, setLikes] = useState(report.likes_count);
  const cat = CATEGORIES[report.category];
  const Icon = cat.icon;
  const status = STATUS_META[report.status];

  const onLike = async () => {
    if (!user) return toast.error("Sign in to like reports");
    const prev = liked;
    setLiked(!prev);
    setLikes((n) => n + (prev ? -1 : 1));
    try { await likeFn({ data: { report_id: report.id } }); }
    catch { setLiked(prev); setLikes((n) => n + (prev ? 1 : -1)); }
  };
  const onSave = async () => {
    if (!user) return toast.error("Sign in to save reports");
    const prev = saved;
    setSaved(!prev);
    try { await saveFn({ data: { report_id: report.id } }); }
    catch { setSaved(prev); }
  };

  return (
    <article className="overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md">
      <Link to="/report/$id" params={{ id: report.id }} className="block">
        <img
          src={report.image_url}
          alt={report.description.slice(0, 80)}
          className="aspect-video w-full object-cover"
          loading="lazy"
        />
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: `${cat.color}1A`, color: cat.color }}
          >
            <Icon className="h-3.5 w-3.5" />
            {cat.label}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-foreground">{report.description}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{report.author_name ?? "Anonymous"}</span>
          <span>·</span>
          <span>{formatDate(report.created_at)}</span>
          <span className="ml-auto inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {report.latitude.toFixed(3)}, {report.longitude.toFixed(3)}
          </span>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onLike}
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm transition ${liked ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {likes}
          </button>
          <button
            onClick={onSave}
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm transition ${saved ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
          >
            <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
            {saved ? "Saved" : "Save"}
          </button>
          <Link
            to="/report/$id"
            params={{ id: report.id }}
            className="ml-auto text-sm font-medium text-primary hover:underline"
          >
            View →
          </Link>
        </div>
      </div>
    </article>
  );
}
