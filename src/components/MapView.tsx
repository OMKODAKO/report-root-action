import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { ReportRow } from "@/lib/api/reports.functions";
import { Link } from "@tanstack/react-router";

function categoryIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -26],
  });
}

function pinIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:50%;background:#22C55E;border:4px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function Recenter({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, Math.max(map.getZoom(), 13));
  }, [center, map]);
  return null;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

type Props = {
  reports?: ReportRow[];
  height?: string;
  pickable?: boolean;
  pickedPosition?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
  center?: [number, number] | null;
};

export function MapView({ reports = [], height = "70vh", pickable, pickedPosition, onPick, center }: Props) {
  const fallback: [number, number] = center ?? [20, 0];
  return (
    <div className="overflow-hidden rounded-xl border" style={{ height }}>
      <MapContainer center={fallback} zoom={center ? 13 : 2} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center ?? null} />
        {pickable && onPick && <ClickHandler onPick={onPick} />}
        {pickable && pickedPosition && (
          <Marker position={[pickedPosition.lat, pickedPosition.lng]} icon={pinIcon()} />
        )}
        {reports.map((r) => {
          const cat = CATEGORIES[r.category];
          return (
            <Marker key={r.id} position={[r.latitude, r.longitude]} icon={categoryIcon(cat.color)}>
              <Popup>
                <div className="w-56">
                  <img src={r.image_url} className="mb-2 aspect-video w-full rounded object-cover" alt="" />
                  <div className="text-xs font-medium" style={{ color: cat.color }}>{cat.label}</div>
                  <p className="mt-1 line-clamp-2 text-sm">{r.description}</p>
                  <Link to="/report/$id" params={{ id: r.id }} className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                    View report →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
