import {
  UtensilsCrossed,
  Plane,
  MapPin,
  BookMarked,
  Newspaper,
  PlayCircle,
  Clapperboard,
  Bookmark,
  Coffee,
  Wine,
  Pizza,
  Music,
  Camera,
  Mountain,
  Tent,
  Palmtree,
  Waves,
  Ship,
  Bike,
  Dumbbell,
  Trophy,
  Gamepad2,
  Palette,
  Ticket,
  Music2,
  Globe,
  Building2,
  Landmark,
  ShoppingBag,
  Gift,
  Heart,
  Star,
  Sparkles,
  PartyPopper,
  Baby,
  PawPrint,
  Leaf,
  Flower2,
  Car,
  Home,
  GraduationCap,
  Briefcase,
  Wrench,
  Tv,
  Headphones,
  Cake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SavedType } from "./types";

// Bakancslista ikonkészlet (kulcs → lucide ikon). Bővíthető; a típusok ebből
// választanak ikont. A kulcsok stabilak (mentve tárolódnak a típusban).
export const SAVED_ICONS: Record<string, LucideIcon> = {
  utensils: UtensilsCrossed,
  coffee: Coffee,
  wine: Wine,
  pizza: Pizza,
  cake: Cake,
  plane: Plane,
  pin: MapPin,
  mountain: Mountain,
  tent: Tent,
  palm: Palmtree,
  waves: Waves,
  ship: Ship,
  globe: Globe,
  building: Building2,
  landmark: Landmark,
  car: Car,
  bike: Bike,
  home: Home,
  book: BookMarked,
  news: Newspaper,
  play: PlayCircle,
  film: Clapperboard,
  tv: Tv,
  music: Music,
  concert: Music2,
  headphones: Headphones,
  camera: Camera,
  palette: Palette,
  ticket: Ticket,
  game: Gamepad2,
  gym: Dumbbell,
  trophy: Trophy,
  shopping: ShoppingBag,
  gift: Gift,
  heart: Heart,
  star: Star,
  sparkles: Sparkles,
  party: PartyPopper,
  baby: Baby,
  pet: PawPrint,
  leaf: Leaf,
  flower: Flower2,
  school: GraduationCap,
  work: Briefcase,
  tool: Wrench,
  bookmark: Bookmark,
};

export const SAVED_ICON_KEYS = Object.keys(SAVED_ICONS);

export function savedIcon(icon: string): LucideIcon {
  return SAVED_ICONS[icon] ?? Bookmark;
}

// Egy típus (vagy hiányzó típus) feloldása vizuálra a típuslistából.
export function resolveType(
  types: SavedType[],
  kind: string
): { name: string; icon: string; color: string } {
  const t = types.find((x) => x.id === kind);
  if (t) return { name: t.name, icon: t.icon, color: t.color };
  return { name: "Egyéb", icon: "bookmark", color: "zinc" };
}

export function linkKind(url: string): "maps" | "youtube" | "generic" {
  const u = url.toLowerCase();
  if (u.includes("google.") && (u.includes("/maps") || u.includes("maps.app")))
    return "maps";
  if (u.includes("maps.app.goo.gl") || u.includes("goo.gl/maps")) return "maps";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  return "generic";
}
