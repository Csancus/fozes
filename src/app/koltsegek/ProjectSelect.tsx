"use client";

import { useProjectCreator } from "./useCategoryCreator";
import type { Project } from "@/lib/types";

const NEW = "__new_project__";

// Story 10.9 – projekt-legördülő „+ Új projekt…" opcióval (mint a CategorySelect).
export function ProjectSelect({
  projects,
  value,
  onChange,
  onCreated,
  disabled,
  className,
}: {
  projects: Project[];
  value: string;
  onChange: (id: string) => void;
  onCreated: (p: Project) => void;
  disabled?: boolean;
  className?: string;
}) {
  const { open, modal } = useProjectCreator();

  async function handle(v: string) {
    if (v !== NEW) {
      onChange(v);
      return;
    }
    const p = await open();
    if (p) {
      onCreated(p);
      onChange(p.id);
    }
  }

  return (
    <>
      {modal}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => handle(e.target.value)}
        className={className}
      >
        <option value="">—</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
        <option value={NEW}>+ Új projekt…</option>
      </select>
    </>
  );
}
