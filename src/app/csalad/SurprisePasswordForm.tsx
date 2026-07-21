"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { setSurprisePasswordAction } from "@/app/bakancslista/actions";
import { Gift, Check } from "lucide-react";

export function SurprisePasswordForm({ hasPw }: { hasPw: boolean }) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (fd) => {
        await setSurprisePasswordAction(fd);
        setValue("");
        setSaved(true);
      }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 text-sm">
        <Gift className="w-4 h-4 text-[var(--color-primary)]" />
        <span className="font-medium">
          {hasPw ? "Jelszó beállítva" : "Nincs még jelszó"}
        </span>
        {hasPw && <Check className="w-4 h-4 text-emerald-600" />}
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        Ezzel a közös jelszóval tudja bárki feloldani a neki szánt, elrejtett
        bakancslista-tételeket. Üresen hagyva és mentve törlöd a jelszót.
      </p>
      <input
        type="password"
        name="password"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        placeholder={hasPw ? "Új jelszó (a régi lecserélése)" : "Meglepetés-jelszó"}
        className="h-11 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
      />
      <SubmitButton size="md">
        {saved ? "Mentve" : hasPw ? "Jelszó frissítése" : "Jelszó mentése"}
      </SubmitButton>
    </form>
  );
}
