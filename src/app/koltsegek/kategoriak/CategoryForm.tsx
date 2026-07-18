"use client";

import { useState } from "react";
import { Input, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  CAT_COLORS,
  COLOR_KEYS,
  ICON_KEYS,
  catColor,
  catIcon,
} from "@/lib/expense-visuals";
import { cn } from "@/lib/cn";
import { Plus } from "lucide-react";

export function CategoryForm({
  action,
}: {
  action: (fd: FormData) => void | Promise<void>;
}) {
  const [color, setColor] = useState("emerald");
  const [icon, setIcon] = useState("tag");

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="icon" value={icon} />

      <Field label="Név" required>
        <Input name="name" required placeholder="pl. Ajándék" />
      </Field>

      <div>
        <span className="block text-sm font-medium mb-2">Szín</span>
        <div className="flex flex-wrap gap-2">
          {COLOR_KEYS.map((c) => {
            const col = CAT_COLORS[c];
            return (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                aria-label={c}
                className={cn(
                  "w-8 h-8 rounded-full transition",
                  col.dot,
                  color === c
                    ? "ring-2 ring-offset-2 ring-offset-[var(--color-card)] " + col.ring
                    : "opacity-70 hover:opacity-100"
                )}
              />
            );
          })}
        </div>
      </div>

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

      <Button
        type="submit"
        size="lg"
        fullWidth
        leftIcon={<Plus className="w-4 h-4" />}
      >
        Kategória hozzáadása
      </Button>
    </form>
  );
}
