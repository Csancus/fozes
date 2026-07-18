"use client";

import { useState } from "react";
import { Input, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CAT_COLORS, COLOR_KEYS } from "@/lib/expense-visuals";
import { cn } from "@/lib/cn";
import { Plus } from "lucide-react";

export function PersonForm({
  action,
}: {
  action: (fd: FormData) => void | Promise<void>;
}) {
  const [color, setColor] = useState("rose");

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="color" value={color} />

      <Field label="Név" required>
        <Input name="name" required placeholder="pl. Anikó, Csanád" />
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

      <Button
        type="submit"
        size="lg"
        fullWidth
        leftIcon={<Plus className="w-4 h-4" />}
      >
        Személy hozzáadása
      </Button>
    </form>
  );
}
