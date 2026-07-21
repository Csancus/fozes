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
};

export const COLOR_KEYS = Object.keys(CAT_COLORS);

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
