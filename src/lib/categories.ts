import { LucideIcon, Trash2, Building2, Construction, SprayCan, Hammer, AlertTriangle } from "lucide-react";

export type CategoryKey =
  | "garbage"
  | "damaged_building"
  | "road_damage"
  | "graffiti"
  | "restoration_needed"
  | "environmental_hazard";

export const CATEGORIES: Record<CategoryKey, { label: string; icon: LucideIcon; color: string }> = {
  garbage: { label: "Garbage", icon: Trash2, color: "#16a34a" },
  damaged_building: { label: "Damaged Building", icon: Building2, color: "#dc2626" },
  road_damage: { label: "Road Damage", icon: Construction, color: "#f97316" },
  graffiti: { label: "Graffiti", icon: SprayCan, color: "#a855f7" },
  restoration_needed: { label: "Restoration Needed", icon: Hammer, color: "#0ea5e9" },
  environmental_hazard: { label: "Environmental Hazard", icon: AlertTriangle, color: "#eab308" },
};

export const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  open: { label: "Open", bg: "bg-orange-100", text: "text-orange-700" },
  in_progress: { label: "In Progress", bg: "bg-blue-100", text: "text-blue-700" },
  resolved: { label: "Resolved", bg: "bg-green-100", text: "text-green-700" },
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
