import {
  ShoppingBasket,
  UtensilsCrossed,
  Car,
  Home,
  HeartPulse,
  Ticket,
  Shirt,
  Repeat,
  Tag,
  Gift,
  Baby,
  Dumbbell,
  GraduationCap,
  PawPrint,
  Plane,
  Fuel,
  Smartphone,
  Wrench,
  PiggyBank,
  Coffee,
  CreditCard,
  ArrowLeftRight,
  Coins,
  Wine,
  Pizza,
  ShoppingCart,
  Bus,
  TrainFront,
  Bike,
  Zap,
  Droplets,
  Flame,
  Wifi,
  Tv,
  Gamepad2,
  Music,
  Film,
  BookOpen,
  Stethoscope,
  Pill,
  Scissors,
  Sofa,
  Leaf,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PaymentKind } from "./types";

// Tailwind osztályok statikusan (dinamikus interpoláció nem működne a JIT-tel).
export const CAT_COLORS: Record<
  string,
  { soft: string; text: string; dot: string; ring: string }
> = {
  emerald: {
    soft: "bg-emerald-500/12",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500",
  },
  orange: {
    soft: "bg-orange-500/12",
    text: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
    ring: "ring-orange-500",
  },
  sky: {
    soft: "bg-sky-500/12",
    text: "text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
    ring: "ring-sky-500",
  },
  indigo: {
    soft: "bg-indigo-500/12",
    text: "text-indigo-600 dark:text-indigo-400",
    dot: "bg-indigo-500",
    ring: "ring-indigo-500",
  },
  rose: {
    soft: "bg-rose-500/12",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
    ring: "ring-rose-500",
  },
  violet: {
    soft: "bg-violet-500/12",
    text: "text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
    ring: "ring-violet-500",
  },
  pink: {
    soft: "bg-pink-500/12",
    text: "text-pink-600 dark:text-pink-400",
    dot: "bg-pink-500",
    ring: "ring-pink-500",
  },
  cyan: {
    soft: "bg-cyan-500/12",
    text: "text-cyan-600 dark:text-cyan-400",
    dot: "bg-cyan-500",
    ring: "ring-cyan-500",
  },
  amber: {
    soft: "bg-amber-500/12",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    ring: "ring-amber-500",
  },
  zinc: {
    soft: "bg-zinc-500/12",
    text: "text-zinc-600 dark:text-zinc-400",
    dot: "bg-zinc-500",
    ring: "ring-zinc-500",
  },
  teal: {
    soft: "bg-teal-500/12",
    text: "text-teal-600 dark:text-teal-400",
    dot: "bg-teal-500",
    ring: "ring-teal-500",
  },
  lime: {
    soft: "bg-lime-500/12",
    text: "text-lime-600 dark:text-lime-400",
    dot: "bg-lime-500",
    ring: "ring-lime-500",
  },
  red: {
    soft: "bg-red-500/12",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    ring: "ring-red-500",
  },
  blue: {
    soft: "bg-blue-500/12",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
    ring: "ring-blue-500",
  },
  green: {
    soft: "bg-green-500/12",
    text: "text-green-600 dark:text-green-400",
    dot: "bg-green-500",
    ring: "ring-green-500",
  },
  yellow: {
    soft: "bg-yellow-500/12",
    text: "text-yellow-600 dark:text-yellow-400",
    dot: "bg-yellow-500",
    ring: "ring-yellow-500",
  },
  fuchsia: {
    soft: "bg-fuchsia-500/12",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    dot: "bg-fuchsia-500",
    ring: "ring-fuchsia-500",
  },
  purple: {
    soft: "bg-purple-500/12",
    text: "text-purple-600 dark:text-purple-400",
    dot: "bg-purple-500",
    ring: "ring-purple-500",
  },
  slate: {
    soft: "bg-slate-500/12",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-500",
    ring: "ring-slate-500",
  },
  stone: {
    soft: "bg-stone-500/12",
    text: "text-stone-600 dark:text-stone-400",
    dot: "bg-stone-500",
    ring: "ring-stone-500",
  },
};

export const COLOR_KEYS = Object.keys(CAT_COLORS);

// Szín-tokenek hex értékei (RGB-választó „legközelebbi" számításához + chartokhoz).
export const CAT_HEX: Record<string, string> = {
  emerald: "#10b981",
  orange: "#f97316",
  sky: "#0ea5e9",
  indigo: "#6366f1",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  pink: "#ec4899",
  cyan: "#06b6d4",
  amber: "#f59e0b",
  zinc: "#71717a",
  teal: "#14b8a6",
  lime: "#84cc16",
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  fuchsia: "#d946ef",
  purple: "#a855f7",
  slate: "#64748b",
  stone: "#78716c",
};

// Adott hex-hez a paletta legközelebbi token-je (egyszerű RGB távolság).
export function nearestColorToken(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "zinc";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  let best = "zinc";
  let bestD = Infinity;
  for (const [token, h] of Object.entries(CAT_HEX)) {
    const v = parseInt(h.slice(1), 16);
    const dr = ((v >> 16) & 255) - r;
    const dg = ((v >> 8) & 255) - g;
    const db = (v & 255) - b;
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) {
      bestD = d;
      best = token;
    }
  }
  return best;
}

export const CAT_ICONS: Record<string, LucideIcon> = {
  basket: ShoppingBasket,
  utensils: UtensilsCrossed,
  coffee: Coffee,
  car: Car,
  fuel: Fuel,
  home: Home,
  heart: HeartPulse,
  ticket: Ticket,
  shirt: Shirt,
  repeat: Repeat,
  phone: Smartphone,
  gift: Gift,
  baby: Baby,
  gym: Dumbbell,
  school: GraduationCap,
  pet: PawPrint,
  travel: Plane,
  tool: Wrench,
  savings: PiggyBank,
  wine: Wine,
  pizza: Pizza,
  cart: ShoppingCart,
  bus: Bus,
  train: TrainFront,
  bike: Bike,
  power: Zap,
  water: Droplets,
  gas: Flame,
  wifi: Wifi,
  tv: Tv,
  game: Gamepad2,
  music: Music,
  film: Film,
  book: BookOpen,
  doctor: Stethoscope,
  pill: Pill,
  haircut: Scissors,
  furniture: Sofa,
  garden: Leaf,
  tag: Tag,
};

export const ICON_KEYS = Object.keys(CAT_ICONS);

export function catColor(color: string) {
  return CAT_COLORS[color] ?? CAT_COLORS.zinc;
}

export function catIcon(icon: string): LucideIcon {
  return CAT_ICONS[icon] ?? Tag;
}

export const PAY_ICONS: Record<PaymentKind, LucideIcon> = {
  card: CreditCard,
  transfer: ArrowLeftRight,
  cash: Coins,
};

export function payIcon(kind: PaymentKind): LucideIcon {
  return PAY_ICONS[kind] ?? CreditCard;
}
