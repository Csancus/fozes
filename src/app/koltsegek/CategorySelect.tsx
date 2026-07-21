"use client";

import { useCategoryCreator } from "./useCategoryCreator";
import type { ExpenseCategory } from "@/lib/types";

const NEW = "__new_category__";

// Kategória-legördülő „+ Új kategória…" opcióval: szép modállal hoz létre újat,
// a szülő listájába teszi és kiválasztja. A createFn cserélhető (pl. bevétel-kategória).
export function CategorySelect({
  categories,
  value,
  onChange,
  onCreated,
  createFn,
  className,
  placeholder = "—",
}: {
  categories: ExpenseCategory[];
  value: string;
  onChange: (id: string) => void;
  onCreated: (cat: ExpenseCategory) => void;
  createFn?: (name: string) => Promise<ExpenseCategory | null>;
  className?: string;
  placeholder?: string;
}) {
  const { open, modal } = useCategoryCreator(createFn);

  async function handle(v: string) {
    if (v !== NEW) {
      onChange(v);
      return;
    }
    const cat = await open();
    if (cat) {
      onCreated(cat);
      onChange(cat.id);
    }
  }

  return (
    <>
      {modal}
      <select
        value={value}
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
    </>
  );
}
