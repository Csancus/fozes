"use client";

import { useState } from "react";
import { Input, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Card } from "@/components/ui/Card";
import {
  CAT_COLORS,
  COLOR_KEYS,
  ICON_KEYS,
  catColor,
  catIcon,
  payIcon,
  nearestColorToken,
} from "@/lib/expense-visuals";
import { PAYMENT_KIND_LABEL } from "@/lib/types";
import type { PaymentKind } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Plus, Pencil, X, Check, FolderKanban, Store, List, LayoutGrid, Layers, Palette } from "lucide-react";

export type Variant = "category" | "payment" | "person" | "project" | "merchant" | "group";

export type EntityItem = {
  id: string;
  name: string;
  color: string;
  icon?: string;
  kind?: PaymentKind;
  last4?: string | null;
  categoryId?: string | null;
};

export type CategoryLite = {
  id: string;
  name: string;
  color: string;
  icon?: string;
};

const KINDS: PaymentKind[] = ["card", "transfer", "cash"];

const DEFAULT_COLOR: Record<Variant, string> = {
  category: "emerald",
  payment: "indigo",
  person: "rose",
  project: "violet",
  merchant: "zinc",
  group: "violet",
};

const ADD_LABEL: Record<Variant, string> = {
  category: "Kategória hozzáadása",
  payment: "Fizetési mód hozzáadása",
  person: "Személy hozzáadása",
  project: "Projekt hozzáadása",
  merchant: "Bolt / kinek hozzáadása",
  group: "Csoport hozzáadása",
};

const NAME_PLACEHOLDER: Record<Variant, string> = {
  category: "pl. Ajándék",
  payment: "pl. OTP Mastercard",
  person: "pl. Anikó, Csanád",
  project: "pl. Autóvásárlás, Olaszország-út",
  merchant: "pl. Lidl, Shell, Spotify",
  group: "pl. Nyaralás elszámolás, Közös kassza",
};

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {COLOR_KEYS.map((c) => {
        const col = CAT_COLORS[c];
        return (
          <button
            type="button"
            key={c}
            onClick={() => onChange(c)}
            aria-label={c}
            className={cn(
              "w-8 h-8 rounded-full transition",
              col.dot,
              value === c
                ? "ring-2 ring-offset-2 ring-offset-[var(--color-card)] " + col.ring
                : "opacity-70 hover:opacity-100"
            )}
          />
        );
      })}
      {/* RGB színválasztó — a paletta legközelebbi színére állít */}
      <label
        className="w-8 h-8 rounded-full border border-dashed border-[var(--color-border)] flex items-center justify-center cursor-pointer relative overflow-hidden"
        title="Egyéni szín (RGB)"
        style={{
          background:
            "conic-gradient(#ef4444,#f59e0b,#eab308,#22c55e,#06b6d4,#3b82f6,#8b5cf6,#ec4899,#ef4444)",
        }}
      >
        <Palette className="w-4 h-4 text-white drop-shadow" />
        <input
          type="color"
          onChange={(e) => onChange(nearestColorToken(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Egyéni szín (RGB)"
        />
      </label>
    </div>
  );
}

// Közös mezők create-hez és edit-hez. Hidden inputokkal submitál a szülő formba.
function Fields({
  variant,
  initial,
  categories = [],
}: {
  variant: Variant;
  initial?: EntityItem;
  categories?: CategoryLite[];
}) {
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR[variant]);
  const [icon, setIcon] = useState(initial?.icon ?? "tag");
  const [kind, setKind] = useState<PaymentKind>(initial?.kind ?? "card");

  return (
    <div className="space-y-4">
      {variant !== "merchant" && (
        <input type="hidden" name="color" value={color} />
      )}
      {variant === "category" && <input type="hidden" name="icon" value={icon} />}
      {variant === "payment" && <input type="hidden" name="kind" value={kind} />}

      {variant === "payment" && (
        <div>
          <span className="block text-sm font-medium mb-2">Típus</span>
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => {
              const Icon = payIcon(k);
              const active = kind === k;
              return (
                <button
                  type="button"
                  key={k}
                  onClick={() => setKind(k)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-3 h-9 text-[13px] font-medium border transition",
                    active
                      ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-transparent ring-2 ring-[var(--color-primary)]/40"
                      : "border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {PAYMENT_KIND_LABEL[k]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Field label="Név" required>
        <Input
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          placeholder={NAME_PLACEHOLDER[variant]}
        />
      </Field>

      {variant === "merchant" && (
        <Field
          label="Alap-kategória"
          hint="Ezt tölti ki automatikusan, amikor ezt a boltot választod"
        >
          <select
            name="categoryId"
            defaultValue={initial?.categoryId ?? ""}
            className="h-11 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-[var(--color-primary)]"
          >
            <option value="">— Nincs —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {variant === "payment" && kind === "card" && (
        <Field label="Utolsó 4 számjegy" hint="Nem kötelező">
          <Input
            name="last4"
            inputMode="numeric"
            maxLength={4}
            defaultValue={initial?.last4 ?? ""}
            placeholder="1234"
          />
        </Field>
      )}

      {variant !== "merchant" && (
        <div>
          <span className="block text-sm font-medium mb-2">Szín</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      )}

      {variant === "category" && (
        <div>
          <span className="block text-sm font-medium mb-2">Ikon</span>
          <div className="flex flex-wrap gap-2">
            {ICON_KEYS.map((ic) => {
              const Icon = catIcon(ic);
              const active = icon === ic;
              const col = catColor(color);
              return (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIcon(ic)}
                  aria-label={ic}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center border transition",
                    active
                      ? cn(col.soft, col.text, "border-transparent")
                      : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                  )}
                >
                  <Icon className="w-4.5 h-4.5" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Visual({
  variant,
  item,
  cat,
}: {
  variant: Variant;
  item: EntityItem;
  cat?: CategoryLite | null;
}) {
  if (variant === "person") {
    const col = catColor(item.color);
    return (
      <span className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0", col.dot)}>
        {item.name.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  if (variant === "merchant") {
    const col = catColor(cat?.color ?? "zinc");
    return (
      <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", col.soft, col.text)}>
        <Store className="w-5 h-5" />
      </span>
    );
  }
  const col = catColor(item.color);
  const Icon =
    variant === "category"
      ? catIcon(item.icon ?? "tag")
      : variant === "payment"
      ? payIcon(item.kind ?? "card")
      : variant === "group"
      ? Layers
      : FolderKanban;
  return (
    <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", col.soft, col.text)}>
      <Icon className="w-5 h-5" />
    </span>
  );
}

export function EntityManager({
  variant,
  items,
  createAction,
  updateAction,
  deleteAction,
  categories = [],
}: {
  variant: Variant;
  items: EntityItem[];
  createAction: (fd: FormData) => void | Promise<void>;
  updateAction: (fd: FormData) => void | Promise<void>;
  deleteAction: (fd: FormData) => void | Promise<void>;
  categories?: CategoryLite[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "board">("list");
  const [confirmDel, setConfirmDel] = useState<EntityItem | null>(null);
  const catById = new Map(categories.map((c) => [c.id, c]));

  function subtitle(item: EntityItem): string | null {
    if (variant === "payment" && item.kind) return PAYMENT_KIND_LABEL[item.kind];
    if (variant === "merchant")
      return item.categoryId
        ? catById.get(item.categoryId)?.name ?? "Ismeretlen kategória"
        : "Nincs alap-kategória";
    return null;
  }

  function EditCard({ item }: { item: EntityItem }) {
    return (
      <Card className="p-5">
        <form action={updateAction} className="space-y-4">
          <input type="hidden" name="id" value={item.id} />
          <Fields variant={variant} initial={item} categories={categories} />
          <div className="flex gap-2">
            <SubmitButton fullWidth leftIcon={<Check className="w-4 h-4" />}>
              Mentés
            </SubmitButton>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingId(null)}
            >
              Mégse
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <div>
      {/* Nézetváltó */}
      <div className="flex justify-end mb-2">
        <div className="inline-flex rounded-lg border border-[var(--color-border)] p-0.5">
          <ViewBtn active={view === "list"} onClick={() => setView("list")} label="Lista">
            <List className="w-4 h-4" />
          </ViewBtn>
          <ViewBtn active={view === "board"} onClick={() => setView("board")} label="Board">
            <LayoutGrid className="w-4 h-4" />
          </ViewBtn>
        </div>
      </div>

      {view === "list" ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              {editingId === item.id ? (
                <EditCard item={item} />
              ) : (
                <Card className="p-3">
                  <div className="flex items-center gap-3">
                    <Visual
                      variant={variant}
                      item={item}
                      cat={item.categoryId ? catById.get(item.categoryId) : null}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {item.name}
                        {variant === "payment" && item.last4 && (
                          <span className="text-[var(--color-muted-foreground)] tabular-nums"> ··{item.last4}</span>
                        )}
                      </p>
                      {subtitle(item) && (
                        <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                          {subtitle(item)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingId(item.id)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
                      aria-label="Szerkesztés"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      aria-label="Törlés"
                      onClick={() => setConfirmDel(item)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.map((item) =>
            editingId === item.id ? (
              <div key={item.id} className="col-span-full">
                <EditCard item={item} />
              </div>
            ) : (
              <Card key={item.id} className="p-3 flex flex-col items-center text-center gap-1.5">
                <Visual
                  variant={variant}
                  item={item}
                  cat={item.categoryId ? catById.get(item.categoryId) : null}
                />
                <p className="font-medium text-sm truncate w-full">
                  {item.name}
                  {variant === "payment" && item.last4 && (
                    <span className="text-[var(--color-muted-foreground)] tabular-nums"> ··{item.last4}</span>
                  )}
                </p>
                {subtitle(item) && (
                  <p className="text-[11px] text-[var(--color-muted-foreground)] truncate w-full -mt-1">
                    {subtitle(item)}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-0.5">
                  <button
                    type="button"
                    onClick={() => setEditingId(item.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
                    aria-label="Szerkesztés"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDel(item)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-500/10 transition"
                    aria-label="Törlés"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            )
          )}
        </div>
      )}

      <Card className="mt-3 p-5">
        <form action={createAction} className="space-y-4">
          <Fields variant={variant} categories={categories} />
          <SubmitButton
            size="lg"
            fullWidth
            leftIcon={<Plus className="w-4 h-4" />}
            pendingText="Hozzáadás…"
          >
            {ADD_LABEL[variant]}
          </SubmitButton>
        </form>
      </Card>

      {confirmDel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmDel(null)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold text-[15px] flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/10 text-red-600">
                <X className="w-4.5 h-4.5" />
              </span>
              Biztosan törlöd?
            </h2>
            <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
              <span className="font-medium text-[var(--color-foreground)]">{confirmDel.name}</span>{" "}
              véglegesen törlődik. A hozzá rendelt tételek megmaradnak, csak a besorolásuk ürül.
            </p>
            <div className="mt-5 flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={() => setConfirmDel(null)}>
                Mégse
              </Button>
              <form action={deleteAction} onSubmit={() => setConfirmDel(null)}>
                <input type="hidden" name="id" value={confirmDel.id} />
                <Button type="submit" variant="danger" leftIcon={<X className="w-4 h-4" />}>
                  Törlés
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ViewBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "w-8 h-8 rounded-md flex items-center justify-center transition",
        active
          ? "bg-[var(--color-primary)] text-white"
          : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
      )}
    >
      {children}
    </button>
  );
}
