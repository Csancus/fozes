"use client";

import { useState } from "react";
import { createCategoryInline } from "./actions";
import type { ExpenseCategory } from "@/lib/types";

const NEW = "__new_category__";

// Kategória-legördülő, aminek van egy „+ Új kategória…" opciója: helyben létrehoz
// egy kategóriát (window.prompt névvel), a szülő listájába teszi és kiválasztja.
export function CategorySelect({
  categories,
  value,
  onChange,
  onCreated,
  className,
  placeholder = "—",
}: {
  categories: ExpenseCategory[];
  value: string;
  onChange: (id: string) => void;
  onCreated: (cat: ExpenseCategory) => void;
  className?: string;
  placeholder?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handle(v: string) {
    if (v !== NEW) {
      onChange(v);
      return;
    }
    const name = window.prompt("Új kategória neve:");
    if (!name || !name.trim()) return; // megszakítva → marad a régi érték
    setBusy(true);
    try {
      const cat = await createCategoryInline(name.trim());
      if (cat) {
        onCreated(cat);
        onChange(cat.id);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      value={value}
      disabled={busy}
      onChange={(e) => handle(e.target.value)}
      className={className}
    >
      <option value="">{placeholder}</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
      <option value={NEW}>+ Új kategória…</option>
    </select>
  );
}
