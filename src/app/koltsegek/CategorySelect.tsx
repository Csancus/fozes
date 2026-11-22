"use client";

import { useCategoryCreator } from "./useCategoryCreator";
import { Dropdown } from "@/components/ui/Dropdown";
import type { ExpenseCategory } from "@/lib/types";

// Kategória-legördülő „+ Új kategória…" sorral: szép modállal hoz létre újat,
// a szülő listájába teszi és kiválasztja. A createFn cserélhető (pl. bevétel-kategória).
// Story 10.10: saját legördülő (Dropdown) a natív <select> helyett.
export function CategorySelect({
  categories,
  value,
  onChange,
  onCreated,
  createFn,
  className,
  placeholder = "—",
  disabled,
}: {
  categories: ExpenseCategory[];
  value: string;
  onChange: (id: string) => void;
  onCreated: (cat: ExpenseCategory) => void;
  createFn?: (name: string) => Promise<ExpenseCategory | null>;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const { open, modal } = useCategoryCreator(createFn);

  async function create() {
    const cat = await open();
    if (cat) {
      onCreated(cat);
      onChange(cat.id);
    }
  }

  return (
    <>
      {modal}
      <Dropdown
        value={value}
        options={categories.map((c) => ({ value: c.id, label: c.name, color: c.color }))}
        onChange={onChange}
        placeholder={placeholder}
        createLabel="Új kategória…"
        onCreate={create}
        disabled={disabled}
        ariaLabel="Kategória"
        className={className}
      />
    </>
  );
}
