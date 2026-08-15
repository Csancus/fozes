import type { LucideIcon } from "lucide-react";
import { Circle, CirclePlay, TriangleAlert, CircleCheck } from "lucide-react";
import type { TaskStatus } from "./types";

// A teendő-státuszok vizuálja (chipek, kanban oszlopfejek).
export const STATUS_VISUAL: Record<
  TaskStatus,
  { label: string; icon: LucideIcon; dot: string; soft: string; text: string }
> = {
  todo: {
    label: "Teendő",
    icon: Circle,
    dot: "bg-zinc-400",
    soft: "bg-[var(--color-muted)]",
    text: "text-[var(--color-muted-foreground)]",
  },
  doing: {
    label: "Folyamatban",
    icon: CirclePlay,
    dot: "bg-sky-500",
    soft: "bg-sky-500/12",
    text: "text-sky-600 dark:text-sky-400",
  },
  blocked: {
    label: "Elakadt",
    icon: TriangleAlert,
    dot: "bg-amber-500",
    soft: "bg-amber-500/12",
    text: "text-amber-600 dark:text-amber-400",
  },
  done: {
    label: "Kész",
    icon: CircleCheck,
    dot: "bg-emerald-500",
    soft: "bg-emerald-500/12",
    text: "text-emerald-600 dark:text-emerald-400",
  },
};
