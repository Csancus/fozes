import { cn } from "@/lib/cn";
import { STATUS_VISUAL } from "@/lib/task-visuals";
import { SHARED_OWNER, TASK_STATUS_LABEL } from "@/lib/types";
import type { TaskActivity, TaskStatus } from "@/lib/types";
import {
  Plus,
  Check,
  RotateCcw,
  CalendarDays,
  User as UserIcon,
  ListTodo,
  Pencil,
  Repeat,
  History,
} from "lucide-react";

const DOW = ["vas", "hét", "kedd", "sze", "csüt", "pén", "szo"];

function fmtDate(d: string | null | undefined): string {
  if (!d) return "nincs";
  const [y, m, day] = d.split("-").map(Number);
  return `${m}. ${day}. (${DOW[new Date(y, m - 1, day).getDay()]})`;
}

// „3 perce", „2 napja" — a naplónál ez olvashatóbb, mint az abszolút idő.
function ago(at: number, now: number): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return "most";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} perce`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} órája`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d} napja`;
  const mo = Math.round(d / 30);
  return mo < 12 ? `${mo} hónapja` : `${Math.round(mo / 12)} éve`;
}

function statusLabel(v: string | null | undefined): string {
  if (!v) return "—";
  return TASK_STATUS_LABEL[v as TaskStatus] ?? v;
}

export function TaskHistory({
  activity,
  memberNames,
}: {
  activity: TaskActivity[];
  memberNames: Map<string, string>;
}) {
  if (activity.length === 0) return null;
  const now = Date.now();

  const ownerLabel = (v: string | null | undefined) => {
    if (!v) return "senki";
    if (v === SHARED_OWNER) return "Közös";
    return memberNames.get(v) ?? "ismeretlen";
  };

  const describe = (a: TaskActivity): { icon: typeof Plus; text: string; tone?: string } => {
    switch (a.kind) {
      case "created":
        return { icon: Plus, text: "létrehozta" };
      case "spawn":
        return {
          icon: Repeat,
          text: a.from ? `ismétlődésből jött (előző: ${fmtDate(a.from)})` : "ismétlődésből jött",
        };
      case "status": {
        const vis = STATUS_VISUAL[(a.to as TaskStatus) ?? "todo"];
        return {
          icon: vis?.icon ?? Pencil,
          text: `státusz: ${statusLabel(a.from)} → ${statusLabel(a.to)}`,
          tone: vis?.text,
        };
      }
      case "due":
        return {
          icon: CalendarDays,
          text: `határidő: ${fmtDate(a.from)} → ${fmtDate(a.to)}`,
        };
      case "done":
        return { icon: Check, text: "készre állította", tone: "text-emerald-600 dark:text-emerald-400" };
      case "reopen":
        return { icon: RotateCcw, text: "visszarakta a teendők közé" };
      case "assign":
        return {
          icon: UserIcon,
          text: `felelős: ${ownerLabel(a.from)} → ${ownerLabel(a.to)}`,
        };
      case "list":
        return { icon: ListTodo, text: a.to ? "listába tette" : "kivette a listából" };
      default:
        return { icon: Pencil, text: "szerkesztette" };
    }
  };

  return (
    <section className="mt-8">
      <h2 className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">
        <History className="w-3.5 h-3.5" /> Előzmények
      </h2>
      <ol className="space-y-1.5">
        {activity.map((a) => {
          const { icon: Icon, text, tone } = describe(a);
          return (
            <li key={a.id} className="flex items-start gap-2 px-1 text-[12px]">
              <Icon className={cn("mt-0.5 w-3.5 h-3.5 shrink-0 text-[var(--color-muted-foreground)]", tone)} />
              <span className="flex-1 min-w-0">
                <span className="font-medium">{a.byName || "valaki"}</span>{" "}
                <span className="text-[var(--color-muted-foreground)]">{text}</span>
              </span>
              <span className="shrink-0 text-[var(--color-muted-foreground)] tabular-nums">
                {ago(a.at, now)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
