"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Search } from "lucide-react";
import { BodyPortal } from "./BodyPortal";
import { cn } from "@/lib/cn";
import { CAT_HEX } from "@/lib/expense-visuals";

export type DropdownOption = {
  value: string;
  label: string;
  /** szín token (expense-visuals) → kis színes pötty az opció előtt */
  color?: string;
};

/**
 * Story 10.10 – saját legördülő a natív <select> helyett: világos és sötét módban is az app
 * stílusát követi (a natív lista sötétben szürke rendszer-menü), sok opciónál kereshető,
 * billentyűzettel is kezelhető, és opcionálisan „+ Új …” sort is ad (kategória, projekt).
 */
export function Dropdown({
  value,
  options,
  onChange,
  placeholder = "—",
  emptyOption = true,
  createLabel,
  onCreate,
  disabled,
  className,
  ariaLabel,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  /** van-e üres („—”) választás */
  emptyOption?: boolean;
  createLabel?: string;
  onCreate?: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number; width: number; up: boolean; maxH: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const searchable = options.length > 7;
  const items = useMemo(() => {
    const all: DropdownOption[] = emptyOption ? [{ value: "", label: placeholder }, ...options] : options;
    const q = query.trim().toLocaleLowerCase("hu");
    return q ? all.filter((o) => o.value && o.label.toLocaleLowerCase("hu").includes(q)) : all;
  }, [options, emptyOption, placeholder, query]);
  // a „+ Új …” sor a lista végén, billentyűzettel is elérhető
  const total = items.length + (onCreate ? 1 : 0);

  const selected = options.find((o) => o.value === value);

  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom - 8;
    const above = r.top - 8;
    const up = below < 220 && above > below;
    const width = Math.max(r.width, 180);
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    setPos({ left, top: up ? r.top - 4 : r.bottom + 4, width, up, maxH: Math.min(320, up ? above : below) });
  }, []);

  const openPanel = () => {
    if (disabled) return;
    setQuery("");
    const i = (emptyOption ? [{ value: "" }, ...options] : options).findIndex((o) => o.value === value);
    setActive(Math.max(0, i));
    place();
    setOpen(true);
  };

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const choose = (i: number) => {
    if (i < items.length) {
      onChange(items[i].value);
      close();
    } else if (onCreate) {
      close();
      onCreate();
    }
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      close(false);
    };
    // az oldal görgetésekor a panel a gombbal együtt menjen (a lista saját görgetése nem számít)
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      place();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", place);
    };
  }, [open, close, place]);

  // az aktív sor maradjon látható
  useLayoutEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openPanel();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(total - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" || (e.key === " " && e.target === triggerRef.current)) {
      // szóköz a gombon is választ (különben a natív kattintás csak bezárná)
      e.preventDefault();
      if (total) choose(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      close(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openPanel())}
        onKeyDown={onKey}
        className={cn(
          "flex items-center gap-1.5 text-left disabled:opacity-60 disabled:cursor-not-allowed",
          className
        )}
      >
        {selected?.color && <Dot color={selected.color} />}
        <span className={cn("flex-1 min-w-0 truncate", !selected && "text-[var(--color-muted-foreground)]")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
      </button>
      {open && pos && (
        <BodyPortal>
          <div
            ref={panelRef}
            onKeyDown={onKey}
            style={{
              left: pos.left,
              width: pos.width,
              ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }),
              // tömör háttér: a kártyaszín lehet áttetsző (csempe stílus), alatta az oldal háttere
              backgroundColor: "var(--color-background)",
              backgroundImage: "linear-gradient(var(--color-card), var(--color-card))",
            }}
            className="fixed z-[60] flex flex-col rounded-xl border border-[var(--color-border)] text-[var(--color-foreground)] shadow-2xl overflow-hidden"
          >
            {searchable && (
              <div className="flex items-center gap-2 px-2.5 h-9 border-b border-[var(--color-border)]">
                <Search className="w-3.5 h-3.5 opacity-50 shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    // gépelés közben az első találat legyen aktív (újranyitáskor a kiválasztott marad)
                    setActive(0);
                  }}
                  aria-controls={listId}
                  aria-activedescendant={`${listId}-${active}`}
                  placeholder="Keresés…"
                  className="flex-1 min-w-0 bg-transparent text-[13px] focus:outline-none"
                />
              </div>
            )}
            <div
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              style={{ maxHeight: pos.maxH - (searchable ? 36 : 0) }}
              className="overflow-y-auto overscroll-contain p-1"
            >
              {items.map((o, i) => {
                const isSel = o.value === value;
                return (
                  <button
                    key={o.value || "__empty"}
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    id={`${listId}-${i}`}
                    data-idx={i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(i)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 min-h-8 py-1 rounded-lg text-left text-[13px] transition-colors",
                      i === active && "bg-[var(--color-muted)]",
                      isSel && "font-semibold text-[var(--color-primary)]",
                      !o.value && !isSel && "text-[var(--color-muted-foreground)]"
                    )}
                  >
                    {o.color ? <Dot color={o.color} /> : <span className="w-2 shrink-0" />}
                    <span className="flex-1 min-w-0 truncate">{o.label}</span>
                    {isSel && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
              {items.length === 0 && (
                <p className="px-2.5 py-2 text-[13px] text-[var(--color-muted-foreground)]">Nincs találat</p>
              )}
              {onCreate && <div className="my-1 h-px bg-[var(--color-border)]" />}
              {onCreate && (
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  id={`${listId}-${items.length}`}
                  data-idx={items.length}
                  onMouseEnter={() => setActive(items.length)}
                  onClick={() => choose(items.length)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 min-h-8 py-1 rounded-lg text-left text-[13px] font-medium text-[var(--color-primary)] transition-colors",
                    active === items.length && "bg-[var(--color-primary-soft)]"
                  )}
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  {createLabel ?? "Új…"}
                </button>
              )}
            </div>
          </div>
        </BodyPortal>
      )}
    </>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0"
      style={{ background: CAT_HEX[color] ?? CAT_HEX.zinc ?? "#a1a1aa" }}
    />
  );
}
