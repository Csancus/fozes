"use client";

import { useState } from "react";
import { Input, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CAT_COLORS, COLOR_KEYS, payIcon } from "@/lib/expense-visuals";
import { PAYMENT_KIND_LABEL } from "@/lib/types";
import type { PaymentKind } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Plus } from "lucide-react";

const KINDS: PaymentKind[] = ["card", "transfer", "cash"];

export function PaymentMethodForm({
  action,
}: {
  action: (fd: FormData) => void | Promise<void>;
}) {
  const [kind, setKind] = useState<PaymentKind>("card");
  const [color, setColor] = useState("indigo");

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="color" value={color} />

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

      <Field label="Név" required>
        <Input
          name="name"
          required
          placeholder={
            kind === "card"
              ? "pl. OTP Mastercard"
              : kind === "transfer"
              ? "pl. Utalás"
              : "pl. Készpénz"
          }
        />
      </Field>

      {kind === "card" && (
        <Field label="Utolsó 4 számjegy" hint="Nem kötelező">
          <Input
            name="last4"
            inputMode="numeric"
            maxLength={4}
            placeholder="1234"
          />
        </Field>
      )}

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
        Hozzáadás
      </Button>
    </form>
  );
}
