"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { catColor } from "@/lib/expense-visuals";
import { KIND_VISUAL } from "@/lib/saved-visuals";
import { SAVED_KIND_LABEL } from "@/lib/types";
import type { SavedItem, SavedKind } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Link2, Paperclip, Check, MapPin } from "lucide-react";

type KindFilter = "all" | SavedKind;

export function SavedListClient({ items }: { items: SavedItem[] }) {
  const [done, setDone] = useState(false);
  const [kind, setKind] = useState<KindFilter>("all");

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

  return (
    <div>
      {/* Todo / Kész */}
      <div className="mt-6 grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--color-muted)]">
        <Tab active={!done} onClick={() => setDone(false)}>
          Felfedezni ({todoCount})
        </Tab>
        <Tab active={done} onClick={() => setDone(true)}>
          Kész ({doneCount})
        </Tab>
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
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {shown.map((item) => (
            <SavedCard key={item.id} item={item} />
          ))}
        </div>
      )}
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

function SavedCard({ item }: { item: SavedItem }) {
  const vis = KIND_VISUAL[item.kind];
  const col = catColor(vis.color);
  const Icon = vis.icon;
  const attachments = item.links.length + item.files.length;

  return (
    <Link
      href={`/bakancslista/${item.id}`}
      className={cn(
        "group flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden transition hover:border-[var(--color-primary)]/40 hover:shadow-md active:scale-[0.99]",
        item.done && "opacity-70"
      )}
    >
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
    </Link>
  );
}
