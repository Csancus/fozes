"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { catColor } from "@/lib/expense-visuals";
import { KIND_VISUAL } from "@/lib/saved-visuals";
import { SAVED_KIND_LABEL } from "@/lib/types";
import type { SavedItem, SavedKind } from "@/lib/types";
import { cn } from "@/lib/cn";
import {
  Link2,
  Paperclip,
  Check,
  MapPin,
  Gift,
  Lock,
  CheckSquare,
  Square,
  X,
  EyeOff,
  Eye,
  Loader2,
} from "lucide-react";

type Entry = SavedItem & { surpriseForName?: string | null };
type KindFilter = "all" | SavedKind;

type UnlockState = { ok: boolean; error?: string } | undefined;

export function SavedListClient({
  items,
  lockedCount,
  hasSurprisePw,
  members,
  unlockAction,
  setSurpriseBatchAction,
}: {
  items: Entry[];
  lockedCount: number;
  hasSurprisePw: boolean;
  members: { id: string; name: string }[];
  unlockAction: (prev: UnlockState, fd: FormData) => Promise<UnlockState>;
  setSurpriseBatchAction: (fd: FormData) => void | Promise<void>;
}) {
  const [done, setDone] = useState(false);
  const [kind, setKind] = useState<KindFilter>("all");

  // Kijelölés-mód a tömeges elrejtéshez
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  // Feloldás modál
  const [showUnlock, setShowUnlock] = useState(false);

  const pool = useMemo(() => items.filter((i) => i.done === done), [items, done]);

  const kindsInPool = useMemo(() => {
    const set = new Set<SavedKind>();
    pool.forEach((i) => set.add(i.kind));
    return set;
  }, [pool]);

  const shown = useMemo(
    () => (kind === "all" ? pool : pool.filter((i) => i.kind === kind)),
    [pool, kind]
  );

  const todoCount = items.filter((i) => !i.done).length;
  const doneCount = items.length - todoCount;

  function toggleSelect(id: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelect() {
    setSelectMode(false);
    setSelected(new Set());
  }

  function applySurprise(userId: string | null) {
    if (selected.size === 0) return;
    const fd = new FormData();
    fd.set("ids", JSON.stringify([...selected]));
    fd.set("surpriseFor", userId ?? "");
    startTransition(async () => {
      await setSurpriseBatchAction(fd);
      exitSelect();
    });
  }

  return (
    <div>
      {/* Rejtett meglepetések (nekem szánva) */}
      {lockedCount > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowUnlock(true)}
            className="w-full flex items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4 text-left hover:border-[var(--color-primary)]/40 transition"
          >
            <div className="w-11 h-11 rounded-xl bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-muted-foreground)] shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[15px] flex items-center gap-1.5">
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
        </div>
      )}

      {/* Todo / Kész + kijelölés */}
      <div className="mt-6 flex items-center gap-2">
        <div className="flex-1 grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--color-muted)]">
          <Tab active={!done} onClick={() => setDone(false)}>
            Felfedezni ({todoCount})
          </Tab>
          <Tab active={done} onClick={() => setDone(true)}>
            Kész ({doneCount})
          </Tab>
        </div>
        {members.length > 0 && items.length > 0 && (
          <button
            type="button"
            onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
            className={cn(
              "h-9 px-3 rounded-xl text-[13px] font-medium border transition whitespace-nowrap",
              selectMode
                ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-transparent"
                : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            )}
          >
            {selectMode ? "Mégse" : "Kijelölés"}
          </button>
        )}
      </div>

      {/* Típus szűrő */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <FilterChip active={kind === "all"} onClick={() => setKind("all")}>
          Mind ({pool.length})
        </FilterChip>
        {(Object.keys(KIND_VISUAL) as SavedKind[])
          .filter((k) => kindsInPool.has(k))
          .map((k) => (
            <FilterChip key={k} active={kind === k} onClick={() => setKind(k)}>
              {SAVED_KIND_LABEL[k]}
            </FilterChip>
          ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-center text-sm text-[var(--color-muted-foreground)]">
          {done ? "Még semmi sincs kipipálva." : "Nincs itt semmi. Adj hozzá egyet!"}
        </p>
      ) : (
        <div
          className={cn(
            "mt-5 grid gap-3 sm:grid-cols-2",
            selectMode && "pb-28"
          )}
        >
          {shown.map((item) => (
            <SavedCard
              key={item.id}
              item={item}
              selectMode={selectMode}
              selected={selected.has(item.id)}
              onToggle={() => toggleSelect(item.id)}
            />
          ))}
        </div>
      )}

      {/* Kijelölés akció-sáv */}
      {selectMode && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-md">
          <div className="max-w-md md:max-w-4xl mx-auto px-5 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">
                {selected.size} kijelölve
              </span>
              <div className="flex-1" />
              <SurpriseControls
                members={members}
                disabled={selected.size === 0 || pending}
                pending={pending}
                onHide={(uid) => applySurprise(uid)}
                onShow={() => applySurprise(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Feloldás modál */}
      {showUnlock && (
        <UnlockModal
          hasSurprisePw={hasSurprisePw}
          unlockAction={unlockAction}
          onClose={() => setShowUnlock(false)}
        />
      )}
    </div>
  );
}

function SurpriseControls({
  members,
  disabled,
  pending,
  onHide,
  onShow,
}: {
  members: { id: string; name: string }[];
  disabled: boolean;
  pending: boolean;
  onHide: (userId: string) => void;
  onShow: () => void;
}) {
  const [target, setTarget] = useState(members[0]?.id ?? "");
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onShow}
        disabled={disabled}
        className="h-9 px-3 rounded-xl text-[13px] font-medium border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] disabled:opacity-40 inline-flex items-center gap-1.5"
        title="A kijelöltek újra mindenki számára láthatók"
      >
        <Eye className="w-4 h-4" /> Látható
      </button>
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="h-9 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
      >
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} elől
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => target && onHide(target)}
        disabled={disabled || !target}
        className="h-9 px-3 rounded-xl text-[13px] font-medium bg-[var(--color-primary)] text-white hover:brightness-110 disabled:opacity-40 inline-flex items-center gap-1.5"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
        Elrejtés
      </button>
    </div>
  );
}

function UnlockModal({
  hasSurprisePw,
  unlockAction,
  onClose,
}: {
  hasSurprisePw: boolean;
  unlockAction: (prev: UnlockState, fd: FormData) => Promise<UnlockState>;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<UnlockState, FormData>(
    unlockAction,
    undefined
  );

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[var(--color-card)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold">Meglepetés feloldása</h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Add meg a közös Meglepetés-jelszót.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            aria-label="Bezárás"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {hasSurprisePw ? (
          <form action={formAction} className="mt-4 space-y-3">
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              type="password"
              name="password"
              autoFocus
              placeholder="Jelszó"
              className="h-11 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            />
            {state?.error && (
              <p className="text-xs text-red-600">{state.error}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="h-11 w-full rounded-xl bg-[var(--color-primary)] text-white font-medium inline-flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              Feloldás
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
            Még nincs Meglepetés-jelszó beállítva. A háztartás egyik tagja tudja
            beállítani a Család oldalon.
          </p>
        )}
      </div>
    </div>
  );
}

function Tab({
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
        "h-9 rounded-lg text-sm font-medium transition",
        active
          ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm"
          : "text-[var(--color-muted-foreground)]"
      )}
    >
      {children}
    </button>
  );
}

function FilterChip({
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
        "shrink-0 h-8 px-3 rounded-full text-[13px] font-medium border transition whitespace-nowrap",
        active
          ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-transparent"
          : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
      )}
    >
      {children}
    </button>
  );
}

function SavedCard({
  item,
  selectMode,
  selected,
  onToggle,
}: {
  item: Entry;
  selectMode: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const vis = KIND_VISUAL[item.kind];
  const col = catColor(vis.color);
  const Icon = vis.icon;
  const attachments = item.links.length + item.files.length;

  const inner = (
    <>
      <div className="relative h-28 bg-[var(--color-muted)]">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={cn("w-full h-full flex items-center justify-center", col.soft)}>
            <Icon className={cn("w-8 h-8", col.text)} />
          </div>
        )}
        <span
          className={cn(
            "absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
            col.soft,
            col.text,
            "backdrop-blur"
          )}
        >
          <Icon className="w-3 h-3" />
          {SAVED_KIND_LABEL[item.kind]}
        </span>
        {item.done && (
          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </span>
        )}
        {selectMode && (
          <span
            className={cn(
              "absolute bottom-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center shadow-sm",
              selected
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-card)]/90 text-[var(--color-muted-foreground)]"
            )}
          >
            {selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </span>
        )}
      </div>
      <div className="p-3 flex-1">
        <p className="font-semibold text-[15px] leading-tight line-clamp-2">
          {item.title}
        </p>
        {item.location && (
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)] flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" /> {item.location}
          </p>
        )}
        {item.surpriseForName && (
          <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-primary)]">
            <Gift className="w-3 h-3" /> Meglepetés · {item.surpriseForName} elől
          </p>
        )}
        {(attachments > 0 || item.tags.length > 0) && (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--color-muted-foreground)]">
            {item.links.length > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Link2 className="w-3 h-3" /> {item.links.length}
              </span>
            )}
            {item.files.length > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Paperclip className="w-3 h-3" /> {item.files.length}
              </span>
            )}
            {item.tags.length > 0 && (
              <span className="truncate">#{item.tags.slice(0, 2).join(" #")}</span>
            )}
          </div>
        )}
      </div>
    </>
  );

  const cardCls = cn(
    "group flex flex-col rounded-2xl border bg-[var(--color-card)] shadow-sm overflow-hidden transition active:scale-[0.99]",
    selected
      ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30"
      : "border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:shadow-md",
    item.done && "opacity-70"
  );

  if (selectMode) {
    return (
      <button type="button" onClick={onToggle} className={cn(cardCls, "text-left")}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={`/bakancslista/${item.id}`} className={cardCls}>
      {inner}
    </Link>
  );
}
