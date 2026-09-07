"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { SHARED_OWNER } from "@/lib/types";
import {
  Plus,
  CalendarDays,
  User as UserIcon,
  Users,
  Loader2,
  Wallet,
  Clock,
  X,
} from "lucide-react";
import { fmtDue, todayStr } from "@/lib/task-due";

function ft(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}
function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// Chip + lenyíló panel (kívülre kattintás / Esc zárja) — a kártyák
// határidő-chipjével egyező megjelenés.
function ChipMenu({
  label,
  icon,
  active,
  children,
  width = "w-56",
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  children: (close: () => void) => React.ReactNode;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[12.5px] font-medium transition",
          active
            ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
            : "border border-dashed border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]"
        )}
      >
        {icon}
        {label}
      </button>
      {open && (
        <div
          className={cn(
            "absolute left-0 top-full z-30 mt-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-2 shadow-lg",
            width
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

// Gyors hozzáadás a lista oldalán: Enter = mentés, Shift+Enter = új sor
// (több sor egyszerre = több teendő). Opcionálisan határidő, felelős és ár.
export function QuickAddTask({
  listId,
  members,
  addAction,
}: {
  listId: string;
  members: { id: string; name: string }[];
  addAction: (fd: FormData) => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [cost, setCost] = useState("");
  const [pending, start] = useTransition();
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // Több sor beillesztve = több teendő; a gomb ezt a darabszámot mutatja.
  const lines = title.split("\n").map((s) => s.trim()).filter(Boolean);
  const multi = lines.length > 1;

  function grow(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }

  function submit() {
    const value = title.trim();
    if (!value || pending) return;
    const fd = new FormData();
    fd.set("listId", listId);
    fd.set("title", value);
    fd.set("dueDate", dueDate);
    fd.set("dueTime", dueDate ? dueTime : "");
    fd.set("ownerId", ownerId);
    fd.set("cost", cost);
    start(async () => {
      await addAction(fd);
      setTitle("");
      setCost("");
      grow(ref.current);
      ref.current?.focus();
    });
  }

  const ownerLabel =
    ownerId === SHARED_OWNER
      ? "Közös"
      : members.find((m) => m.id === ownerId)?.name ?? "Felelős";

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-2 shadow-sm transition focus-within:border-[var(--color-primary)]/45 focus-within:shadow-md">
      <div className="flex items-start gap-2">
        <textarea
          ref={ref}
          rows={1}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            grow(e.currentTarget);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Új teendő… (Enter = mentés)"
          className="flex-1 min-h-10 max-h-44 resize-none bg-transparent px-2 py-2 text-[15px] leading-snug placeholder:text-[var(--color-muted-foreground)] focus:outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!title.trim() || pending}
          aria-label={multi ? `${lines.length} teendő hozzáadása` : "Hozzáadás"}
          className="h-10 shrink-0 min-w-10 px-2.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] inline-flex items-center justify-center gap-1 text-sm font-semibold disabled:opacity-40 transition hover:brightness-110 active:scale-95"
        >
          {pending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Plus className="w-5 h-5" />
              {multi && <span className="tabular-nums">{lines.length}</span>}
            </>
          )}
        </button>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-1.5 px-1 pb-0.5">
        {/* Határidő */}
        <ChipMenu
          label={dueDate ? fmtDue(dueDate, dueTime || null) : "Határidő"}
          icon={<CalendarDays className="w-3.5 h-3.5" />}
          active={!!dueDate}
        >
          {(close) => (
            <div>
              <div className="flex gap-1.5">
                {[
                  { label: "Ma", value: todayStr() },
                  { label: "Holnap", value: todayStr(1) },
                  { label: "+1 hét", value: todayStr(7) },
                ].map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setDueDate(q.value)}
                    className="flex-1 h-8 rounded-lg bg-[var(--color-muted)] text-[12px] font-medium hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)] transition"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
              <input
                type="date"
                min="1970-01-01"
                max="2099-12-31"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-2 w-full h-10 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              />
              {/* Időpont — nem kötelező; nélküle egész napos a teendő. */}
              <label
                className={cn(
                  "mt-2 flex items-center gap-2 rounded-lg border border-[var(--color-input)] px-2.5 h-10",
                  !dueDate && "opacity-50"
                )}
              >
                <Clock className="w-3.5 h-3.5 text-[var(--color-muted-foreground)] shrink-0" />
                <input
                  type="time"
                  step={300}
                  disabled={!dueDate}
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
                {dueTime && (
                  <button
                    type="button"
                    onClick={() => setDueTime("")}
                    aria-label="Időpont törlése"
                    className="text-[var(--color-muted-foreground)] hover:text-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </label>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => {
                    setDueDate("");
                    setDueTime("");
                    close();
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-500/10"
                >
                  <X className="w-3.5 h-3.5" /> Határidő törlése
                </button>
              )}
            </div>
          )}
        </ChipMenu>

        {/* Felelős */}
        {members.length > 0 && (
          <ChipMenu
            label={ownerLabel}
            icon={
              ownerId && ownerId !== SHARED_OWNER ? (
                <span className="w-4 h-4 rounded-full brand-gradient text-white text-[8px] font-semibold flex items-center justify-center">
                  {initials(ownerLabel)}
                </span>
              ) : ownerId === SHARED_OWNER ? (
                <Users className="w-3.5 h-3.5" />
              ) : (
                <UserIcon className="w-3.5 h-3.5" />
              )
            }
            active={!!ownerId}
          >
            {(close) => (
              <div className="space-y-0.5">
                {[
                  { id: "", name: "Nincs felelős" },
                  { id: SHARED_OWNER, name: "Közös" },
                  ...members,
                ].map((m) => (
                  <button
                    key={m.id || "none"}
                    type="button"
                    onClick={() => {
                      setOwnerId(m.id);
                      close();
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition",
                      ownerId === m.id
                        ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-medium"
                        : "hover:bg-[var(--color-muted)]"
                    )}
                  >
                    {m.id === "" ? (
                      <UserIcon className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                    ) : m.id === SHARED_OWNER ? (
                      <Users className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                    ) : (
                      <span className="w-4 h-4 rounded-full brand-gradient text-white text-[8px] font-semibold flex items-center justify-center">
                        {initials(m.name)}
                      </span>
                    )}
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </ChipMenu>
        )}

        {/* Ár */}
        <ChipMenu
          label={cost.trim() ? ft(Number(cost)) : "Ár"}
          icon={<Wallet className="w-3.5 h-3.5" />}
          active={!!cost.trim()}
          width="w-48"
        >
          {(close) => (
            <div>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={100}
                  autoFocus
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      close();
                    }
                  }}
                  placeholder="0"
                  className={cn(
                    "w-full h-10 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] pl-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]",
                    "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  )}
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-muted-foreground)]">
                  Ft
                </span>
              </div>
              {cost.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setCost("");
                    close();
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-500/10"
                >
                  <X className="w-3.5 h-3.5" /> Ár törlése
                </button>
              )}
            </div>
          )}
        </ChipMenu>

        <span className="ml-auto text-[11px] text-[var(--color-muted-foreground)]">
          {multi ? `${lines.length} sor = ${lines.length} teendő` : "Több sor = több teendő"}
        </span>
      </div>
    </div>
  );
}
