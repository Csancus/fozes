"use client";

import { useProjectCreator } from "./useCategoryCreator";
import { Dropdown } from "@/components/ui/Dropdown";
import type { Project } from "@/lib/types";

// Story 10.9 – projekt-legördülő „+ Új projekt…" sorral (mint a CategorySelect).
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

  async function create() {
    const p = await open();
    if (p) {
      onCreated(p);
      onChange(p.id);
    }
  }

  return (
    <>
      {modal}
      <Dropdown
        value={value}
        options={projects.map((p) => ({ value: p.id, label: p.name, color: p.color }))}
        onChange={onChange}
        createLabel="Új projekt…"
        onCreate={create}
        disabled={disabled}
        ariaLabel="Projekt"
        className={className}
      />
    </>
  );
}
