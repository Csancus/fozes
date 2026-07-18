import {
  UtensilsCrossed,
  Plane,
  MapPin,
  BookMarked,
  Newspaper,
  PlayCircle,
  Clapperboard,
  Bookmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SavedKind } from "./types";

export const KIND_VISUAL: Record<
  SavedKind,
  { icon: LucideIcon; color: string }
> = {
  etterem: { icon: UtensilsCrossed, color: "orange" },
  utazas: { icon: Plane, color: "sky" },
  helyszin: { icon: MapPin, color: "emerald" },
  konyv: { icon: BookMarked, color: "amber" },
  cikk: { icon: Newspaper, color: "violet" },
  video: { icon: PlayCircle, color: "rose" },
  film: { icon: Clapperboard, color: "indigo" },
  egyeb: { icon: Bookmark, color: "zinc" },
};

export function linkKind(url: string): "maps" | "youtube" | "generic" {
  const u = url.toLowerCase();
  if (u.includes("google.") && (u.includes("/maps") || u.includes("maps.app")))
    return "maps";
  if (u.includes("maps.app.goo.gl") || u.includes("goo.gl/maps")) return "maps";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  return "generic";
}
