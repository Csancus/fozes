"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { catColor } from "@/lib/expense-visuals";
import { checklistStats, richTextToPlain } from "@/lib/richtext";
import type { Note } from "@/lib/types";
import { SurpriseUnlockModal } from "@/components/ui/SurpriseUnlockModal";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { ReminderWatcher } from "./ReminderWatcher";
import {
  toggleNoteCheckAction,
  toggleNotePinAction,
  setReminderDoneAction,
  snoozeReminderAction,
  deleteNoteFromListAction,
  unlockSurpriseAction,
} from "./actions";
import {
  Bell,
  Check,
  Gift,
  ListChecks,
  Lock,
  Pin,
  Search,
  Timer,
} from "lucide-react";

export type NoteEntry = Note & {
  ownerName: string | null;
  surpriseForName: string | null;
  reminderLabel: string | null;
  reminderDue: boolean;
};

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function NotesListClient({
  notes,
  allMembers,
  myId,
  lockedCount,
  hasSurprisePw,
}: {
  notes: NoteEntry[];
  allMembers: { id: string; name: string }[];
  myId: string;
  lockedCount: number;
  hasSurprisePw: boolean;
}) {
  const [q, setQ] = useState("");
  const [owner, setOwner] = useState<string>("all");
  const [tag, setTag] = useState<string>("all");
  const [showUnlock, setShowUnlock] = useState(false);

  const ownerTabs = useMemo(() => {
    const tabs = [{ id: "all", name: "Mind" }];
    if (allMembers.length > 1) {
      tabs.push({ id: myId, name: "Enyém" });
      allMembers
        .filter((m) => m.id !== myId)
        .forEach((m) => tabs.push({ id: m.id, name: m.name }));
      tabs.push({ id: "shared", name: "Közös" });
    }
    return tabs;
  }, [allMembers, myId]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return [...set].sort((a, b) => a.localeCompare(b, "hu"));
  }, [notes]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return notes.filter((n) => {
      if (owner === "shared" && n.ownerId !== null) return false;
      if (owner !== "all" && owner !== "shared" && n.ownerId !== owner) return false;
      if (tag !== "all" && !n.tags.includes(tag)) return false;
      if (!needle) return true;
      const hay = `${n.title} ${richTextToPlain(n.body)} ${n.tags.join(" ")}`;
      return hay.toLowerCase().includes(needle);
    });
  }, [notes, owner, tag, q]);

  const pinned = shown.filter((n) => n.pinned);
  const rest = shown.filter((n) => !n.pinned);

  const dueReminders = notes.filter((n) => n.reminderDue);
  const upcoming = notes.filter(
    (n) => n.reminderAt !== null && !n.reminderDone && !n.reminderDue
  );

  return (
    <div>
      <ReminderWatcher
        reminders={upcoming.map((n) => ({
          id: n.id,
          at: n.reminderAt as number,
          title: n.title || richTextToPlain(n.body).slice(0, 60) || "Jegyzet",
        }))}
      />

      {/* Nekem szánt, elrejtett jegyzetek */}
      {lockedCount > 0 && (
        <button
          type="button"
          onClick={() => setShowUnlock(true)}
          className="mt-4 w-full flex items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4 text-left hover:border-[var(--color-primary)]/40 transition"
        >
          <div className="w-11 h-11 rounded-xl bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-muted-foreground)] shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[15px]">
              Meglepetés{" "}
              <span className="text-[var(--color-muted-foreground)] font-normal">
                ({lockedCount})
              </span>
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Valamit elrejtettek előled. Koppints a feloldáshoz.
            </p>
          </div>
          <Lock className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
        </button>
      )}

      {/* Esedékes emlékeztetők */}
      {dueReminders.length > 0 && (
        <section className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <Bell className="w-4 h-4" />
            Esedékes emlékeztető ({dueReminders.length})
          </p>
          <ul className="mt-3 space-y-2">
            {dueReminders.map((n) => (
              <ReminderRow key={n.id} note={n} />
            ))}
          </ul>
        </section>
      )}

      {/* Kereső */}
      <div className="mt-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Keresés a jegyzetek között…"
          className="h-11 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
        />
      </div>

      {/* Kié */}
      {ownerTabs.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {ownerTabs.map((o) => (
            <Chip key={o.id} active={owner === o.id} onClick={() => setOwner(o.id)}>
              {o.name}
            </Chip>
          ))}
        </div>
      )}

      {/* Címkék */}
      {tags.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <Chip active={tag === "all"} onClick={() => setTag("all")}>
            Minden címke
          </Chip>
          {tags.map((t) => (
            <Chip key={t} active={tag === t} onClick={() => setTag(t)}>
              #{t}
            </Chip>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Nincs találat.
        </p>
      ) : (
        <>
          {pinned.length > 0 && (
            <>
              <SectionLabel icon={Pin}>Rögzített</SectionLabel>
              <NoteGrid notes={pinned} myId={myId} />
              {rest.length > 0 && <SectionLabel>Többi</SectionLabel>}
            </>
          )}
          <NoteGrid notes={rest} myId={myId} />
        </>
      )}

      {showUnlock && (
        <SurpriseUnlockModal
          hasSurprisePw={hasSurprisePw}
          unlockAction={unlockSurpriseAction}
          onClose={() => setShowUnlock(false)}
        />
      )}
    </div>
  );
}

function NoteGrid({ notes, myId }: { notes: NoteEntry[]; myId: string }) {
  if (notes.length === 0) return null;
  return (
    <div className="mt-3 columns-1 sm:columns-2 lg:columns-3 gap-3">
      {notes.map((n) => (
        <div key={n.id} className="mb-3 break-inside-avoid">
          <NoteCard note={n} myId={myId} />
        </div>
      ))}
    </div>
  );
}

function NoteCard({ note, myId }: { note: NoteEntry; myId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const col = catColor(note.color);
  const stats = checklistStats(note.body);
  const href = `/jegyzetek/${note.id}`;

  function open(e: React.MouseEvent | React.KeyboardEvent) {
    const el = e.target as HTMLElement;
    if (el.closest("a,button,input,select,li[data-checked]")) return;
    router.push(href);
  }

  function toggleCheck(index: number) {
    const fd = new FormData();
    fd.set("id", note.id);
    fd.set("index", String(index));
    startTransition(async () => {
      await toggleNoteCheckAction(fd);
    });
  }

  function togglePin() {
    const fd = new FormData();
    fd.set("id", note.id);
    startTransition(async () => {
      await toggleNotePinAction(fd);
    });
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter") open(e);
      }}
      className={cn(
        "group relative w-full text-left rounded-2xl border border-[var(--color-border)] p-4 shadow-sm transition hover:shadow-md hover:border-[var(--color-primary)]/40 cursor-pointer",
        col.soft
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {note.title && (
            <p className="font-semibold text-[15px] leading-snug break-words">
              {note.title}
            </p>
          )}
          {stats.total > 0 && (
            <p className={cn("mt-0.5 text-[11px] font-medium flex items-center gap-1", col.text)}>
              <ListChecks className="w-3.5 h-3.5" />
              {stats.done}/{stats.total} kész
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={togglePin}
          aria-label={note.pinned ? "Rögzítés feloldása" : "Rögzítés"}
          className={cn(
            "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition",
            note.pinned
              ? "text-[var(--color-primary)]"
              : "text-[var(--color-muted-foreground)] opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-[var(--color-muted)]"
          )}
        >
          <Pin className={cn("w-4 h-4", note.pinned && "fill-current")} />
        </button>
        <ConfirmDeleteButton
          id={note.id}
          title={note.title || "Jegyzet"}
          deleteAction={deleteNoteFromListAction}
          variant="icon"
        />
      </div>

      {note.body && (
        <div className="mt-2 max-h-64 overflow-hidden">
          <NoteBody html={note.body} onToggle={toggleCheck} />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {note.reminderLabel && !note.reminderDone && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              note.reminderDue
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
            )}
          >
            <Bell className="w-3 h-3" />
            {note.reminderLabel}
          </span>
        )}
        {note.tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-[11px] text-[var(--color-muted-foreground)]"
          >
            #{t}
          </span>
        ))}
        {note.surpriseForName && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-primary)]">
            <Gift className="w-3 h-3" /> Meglepetés · {note.surpriseForName} elől
          </span>
        )}
        {note.ownerName && note.ownerId !== myId && (
          <span
            className="ml-auto w-6 h-6 rounded-full brand-gradient text-white text-[10px] font-semibold flex items-center justify-center"
            title={note.ownerName}
          >
            {initials(note.ownerName)}
          </span>
        )}
      </div>
    </div>
  );
}

// Olvasó nézet: a mentett HTML-t rendereljük, és a pipálható sorokra
// kattintva azonnal (optimista DOM-váltással) billen a pipa.
function NoteBody({
  html,
  onToggle,
}: {
  html: string;
  onToggle: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = html;
  }, [html]);

  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    const li = (e.target as HTMLElement).closest?.("li[data-checked]") as
      | HTMLElement
      | null;
    if (!li || !ref.current?.contains(li)) return;
    e.preventDefault();
    e.stopPropagation();
    const all = Array.from(
      ref.current.querySelectorAll("li[data-checked]")
    ) as HTMLElement[];
    const index = all.indexOf(li);
    if (index < 0) return;
    li.setAttribute(
      "data-checked",
      li.getAttribute("data-checked") === "true" ? "false" : "true"
    );
    onToggle(index);
  }

  return (
    <div
      ref={ref}
      onClick={onClick}
      className="rich-text text-sm text-[var(--color-foreground)]/90"
    />
  );
}

function ReminderRow({ note }: { note: NoteEntry }) {
  const [, startTransition] = useTransition();

  function done() {
    const fd = new FormData();
    fd.set("id", note.id);
    fd.set("done", "1");
    startTransition(async () => {
      await setReminderDoneAction(fd);
    });
  }

  function snooze(minutes: number) {
    const fd = new FormData();
    fd.set("id", note.id);
    fd.set("minutes", String(minutes));
    startTransition(async () => {
      await snoozeReminderAction(fd);
    });
  }

  return (
    <li className="flex items-center gap-2 rounded-xl bg-[var(--color-card)] p-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {note.title || richTextToPlain(note.body).slice(0, 60) || "Jegyzet"}
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {note.reminderLabel}
        </p>
      </div>
      <button
        type="button"
        onClick={() => snooze(60)}
        className="h-8 px-2.5 rounded-lg text-[12px] font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] inline-flex items-center gap-1"
        title="Emlékeztess 1 óra múlva"
      >
        <Timer className="w-3.5 h-3.5" /> 1 óra
      </button>
      <button
        type="button"
        onClick={done}
        className="h-8 px-2.5 rounded-lg text-[12px] font-medium bg-[var(--color-primary)] text-white hover:brightness-110 inline-flex items-center gap-1"
      >
        <Check className="w-3.5 h-3.5" /> Kész
      </button>
    </li>
  );
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </p>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 h-8 px-3 rounded-full text-[13px] font-medium border transition",
        active
          ? "bg-[var(--color-primary-soft)] border-[var(--color-primary)]/30 text-[var(--color-primary)]"
          : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
      )}
    >
      {children}
    </button>
  );
}
