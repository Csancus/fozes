"use client";

import { useState } from "react";
import { Input, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  CAT_COLORS,
  COLOR_KEYS,
  ICON_KEYS,
  catColor,
  catIcon,
  payIcon,
} from "@/lib/expense-visuals";
import { PAYMENT_KIND_LABEL } from "@/lib/types";
import type { PaymentKind } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Plus, Pencil, X, Check, FolderKanban } from "lucide-react";

export type Variant = "category" | "payment" | "person" | "project";

export type EntityItem = {
  id: string;
  name: string;
  color: string;
  icon?: string;
  kind?: PaymentKind;
  last4?: string | null;
};

const KINDS: PaymentKind[] = ["card", "transfer", "cash"];

const DEFAULT_COLOR: Record<Variant, string> = {
  category: "emerald",
  payment: "indigo",
  person: "rose",
  project: "violet",
};

const ADD_LABEL: Record<Variant, string> = {
  category: "Kategória hozzáadása",
  payment: "Fizetési mód hozzáadása",
  person: "Személy hozzáadása",
  project: "Projekt hozzáadása",
};

const NAME_PLACEHOLDER: Record<Variant, string> = {
  category: "pl. Ajándék",
  payment: "pl. OTP Mastercard",
  person: "pl. Anikó, Csanád",
  project: "pl. Autóvásárlás, Olaszország-út",
};

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
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
    </div>
  );
}

// Közös mezők create-hez és edit-hez. Hidden inputokkal submitál a szülő formba.
function Fields({
  variant,
  initial,
}: {
  variant: Variant;
  initial?: EntityItem;
}) {
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR[variant]);
  const [icon, setIcon] = useState(initial?.icon ?? "tag");
  const [kind, setKind] = useState<PaymentKind>(initial?.kind ?? "card");

  return (
    <div className="space-y-4">
      <input type="hidden" name="color" value={color} />
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

      <div>
        <span className="block text-sm font-medium mb-2">Szín</span>
        <ColorPicker value={color} onChange={setColor} />
      </div>

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

function Visual({ variant, item }: { variant: Variant; item: EntityItem }) {
  const col = catColor(item.color);
  if (variant === "person") {
    return (
      <span className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0", col.dot)}>
        {item.name.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  const Icon =
    variant === "category"
      ? catIcon(item.icon ?? "tag")
      : variant === "payment"
      ? payIcon(item.kind ?? "card")
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
}: {
  variant: Variant;
  items: EntityItem[];
  createAction: (fd: FormData) => void | Promise<void>;
  updateAction: (fd: FormData) => void | Promise<void>;
  deleteAction: (fd: FormData) => void | Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <ul className="space-y-2">
        {items.map((item) =>
          editingId === item.id ? (
            <li key={item.id}>
              <Card className="p-5">
                <form action={updateAction} className="space-y-4">
                  <input type="hidden" name="id" value={item.id} />
                  <Fields variant={variant} initial={item} />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      fullWidth
                      leftIcon={<Check className="w-4 h-4" />}
                    >
                      Mentés
                    </Button>
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
            </li>
          ) : (
            <li key={item.id}>
              <Card className="p-3">
                <div className="flex items-center gap-3">
                  <Visual variant={variant} item={item} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {item.name}
                      {variant === "payment" && item.last4 && (
                        <span className="text-[var(--color-muted-foreground)] tabular-nums"> ··{item.last4}</span>
                      )}
                    </p>
                    {variant === "payment" && item.kind && (
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {PAYMENT_KIND_LABEL[item.kind]}
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
                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" aria-label="Törlés">
                      <X className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </Card>
            </li>
          )
        )}
      </ul>

      <Card className="mt-3 p-5">
        <form action={createAction} className="space-y-4">
          <Fields variant={variant} />
          <Button
            type="submit"
            size="lg"
            fullWidth
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {ADD_LABEL[variant]}
          </Button>
        </form>
      </Card>
    </div>
  );
}
