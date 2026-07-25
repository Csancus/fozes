import { requireUser } from "@/lib/auth";
import { getTask, getTaskFile, listHouseholdMembers } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  Pencil,
  Trash2,
  Check,
  RotateCcw,
  CalendarDays,
  User as UserIcon,
  FileText,
  Music,
  Download,
} from "lucide-react";
import {
  toggleTaskDoneAction,
  toggleSubtaskAction,
  deleteTaskAction,
} from "../actions";

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

const DOW = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];
function fmtDueLong(due: string): string {
  const [y, m, d] = due.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${y}. ${m}. ${d}. (${DOW[date.getDay()]})`;
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const task = await getTask(me.householdId, id);
  if (!task) notFound();

  const [blobs, members] = await Promise.all([
    Promise.all(
      task.files.map(async (f) => ({
        meta: f,
        dataUrl: await getTaskFile(me.householdId, id, f.id),
      }))
    ),
    listHouseholdMembers(me.householdId),
  ]);
  const ownerName = task.ownerId
    ? members.find((m) => m.id === task.ownerId)?.name ?? null
    : null;

  const subDone = task.subtasks.filter((s) => s.done).length;

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Teendő"
        back="/teendok"
        action={
          <Link
            href={`/teendok/${id}/szerkesztes`}
            aria-label="Szerkesztés"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
          >
            <Pencil className="w-4.5 h-4.5" />
          </Link>
        }
      />

      {task.imageUrl && (
        <div className="mt-5 rounded-2xl overflow-hidden border border-[var(--color-border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={task.imageUrl} alt={task.title} className="w-full max-h-72 object-cover" />
        </div>
      )}

      <h1 className={cn("mt-5 text-xl font-bold leading-tight", task.done && "line-through opacity-70")}>
        {task.title}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        {task.dueDate && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-muted)] px-3 py-1 text-[var(--color-muted-foreground)]">
            <CalendarDays className="w-4 h-4" /> {fmtDueLong(task.dueDate)}
          </span>
        )}
        {ownerName && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-[var(--color-primary)]">
            <UserIcon className="w-4 h-4" /> {ownerName}
          </span>
        )}
      </div>

      {/* Done toggle */}
      <form action={toggleTaskDoneAction} className="mt-4">
        <input type="hidden" name="id" value={task.id} />
        {task.done ? (
          <Button type="submit" variant="secondary" fullWidth leftIcon={<RotateCcw className="w-4 h-4" />}>
            Visszarakás a teendők közé
          </Button>
        ) : (
          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-emerald-600 text-white font-medium inline-flex items-center justify-center gap-2 hover:brightness-110 transition active:scale-[0.98]"
          >
            <Check className="w-4 h-4" /> Kész
          </button>
        )}
      </form>

      {task.description && (
        <p className="mt-5 text-[15px] whitespace-pre-wrap leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Alteendők */}
      {task.subtasks.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-2 px-1">
            Alteendők · {subDone}/{task.subtasks.length}
          </h2>
          <ul className="space-y-2">
            {task.subtasks.map((s) => (
              <li key={s.id}>
                <form action={toggleSubtaskAction}>
                  <input type="hidden" name="id" value={task.id} />
                  <input type="hidden" name="subId" value={s.id} />
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-left hover:border-[var(--color-primary)]/40 transition"
                  >
                    <span
                      className={cn(
                        "w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition",
                        s.done
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-[var(--color-border)] text-transparent"
                      )}
                    >
                      <Check className="w-4 h-4" />
                    </span>
                    <span className={cn("text-sm", s.done && "line-through text-[var(--color-muted-foreground)]")}>
                      {s.title}
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Fájlok */}
      {blobs.length > 0 && (
        <section className="mt-6 space-y-3">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] px-1">
            Fájlok
          </h2>
          {blobs.map(({ meta, dataUrl }) => {
            if (!dataUrl) {
              return (
                <div key={meta.id} className="text-xs text-[var(--color-muted-foreground)] px-1">
                  {meta.name} — nem elérhető
                </div>
              );
            }
            if (meta.mime.startsWith("image/")) {
              return (
                <div key={meta.id} className="rounded-xl overflow-hidden border border-[var(--color-border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={dataUrl} alt={meta.name} className="w-full object-contain" />
                </div>
              );
            }
            if (meta.mime.startsWith("audio/")) {
              return (
                <div key={meta.id} className="rounded-xl border border-[var(--color-border)] p-3">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Music className="w-4 h-4 text-[var(--color-muted-foreground)]" /> {meta.name}
                  </p>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio controls src={dataUrl} className="w-full" />
                </div>
              );
            }
            const Icon = meta.mime === "application/pdf" ? FileText : Download;
            return (
              <a
                key={meta.id}
                href={dataUrl}
                download={meta.name}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 hover:border-[var(--color-primary)]/40 transition"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-muted-foreground)] shrink-0">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{meta.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{fmtSize(meta.size)}</p>
                </div>
                <Download className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
              </a>
            );
          })}
        </section>
      )}

      <form action={deleteTaskAction} className="mt-8">
        <input type="hidden" name="id" value={task.id} />
        <Button
          type="submit"
          variant="ghost"
          fullWidth
          className="text-red-600 hover:text-red-700"
          leftIcon={<Trash2 className="w-4 h-4" />}
        >
          Törlés
        </Button>
      </form>
    </main>
  );
}
