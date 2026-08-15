"use client";

import { useState } from "react";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn } from "@/lib/cn";
import { CAT_COLORS, COLOR_KEYS } from "@/lib/expense-visuals";
import type { Project, TaskList, Trip } from "@/lib/types";
import { FolderKanban, Plane, Sparkles, Minus } from "lucide-react";

type ParentMode = "none" | "project" | "trip" | "new";

// Egy teendő-lista létrehozása/szerkesztése: név, szín, és hogy MIHEZ tartozik
// (meglévő projekt / utazás / most létrehozott teendő-projekt).
export function TaskListForm({
  action,
  initial,
  projects,
  trips,
  defaultProjectId,
  defaultTripId,
  submitLabel,
}: {
  action: (fd: FormData) => void | Promise<void>;
  initial?: TaskList | null;
  projects: Project[];
  trips: Trip[];
  defaultProjectId?: string;
  defaultTripId?: string;
  submitLabel?: string;
}) {
  const startProject = initial?.projectId ?? defaultProjectId ?? "";
  const startTrip = initial?.tripId ?? defaultTripId ?? "";

  const [mode, setMode] = useState<ParentMode>(
    startTrip ? "trip" : startProject ? "project" : "none"
  );
  const [projectId, setProjectId] = useState(startProject);
  const [tripId, setTripId] = useState(startTrip);
  const [color, setColor] = useState(initial?.color ?? "sky");

  const parentValue =
    mode === "project" && projectId
      ? `project:${projectId}`
      : mode === "trip" && tripId
        ? `trip:${tripId}`
        : mode === "new"
          ? "new"
          : "";

  const modes: { id: ParentMode; label: string; icon: typeof FolderKanban }[] = [
    { id: "none", label: "Önálló", icon: Minus },
    { id: "project", label: "Projekt", icon: FolderKanban },
    { id: "trip", label: "Utazás", icon: Plane },
    { id: "new", label: "Új projekt", icon: Sparkles },
  ];

  return (
    <form action={action} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="parent" value={parentValue} />
      <input type="hidden" name="color" value={color} />

      <Field label="A lista neve" required>
        <Input
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          placeholder="pl. Csomagolás, Intéznivalók"
          autoFocus={!initial}
        />
      </Field>

      {/* Mihez tartozik */}
      <div>
        <span className="block text-sm font-medium mb-2">Mihez tartozik?</span>
        <div className="grid grid-cols-4 gap-2">
          {modes.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            const disabled =
              (m.id === "project" && projects.length === 0) ||
              (m.id === "trip" && trips.length === 0);
            return (
              <button
                key={m.id}
                type="button"
                disabled={disabled}
                onClick={() => setMode(m.id)}
                className={cn(
                  "h-16 rounded-xl border flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
                  active
                    ? "border-transparent bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]",
                  disabled && "opacity-40 pointer-events-none"
                )}
              >
                <Icon className="w-4 h-4" />
                {m.label}
              </button>
            );
          })}
        </div>

        {mode === "project" && (
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-3 w-full h-11 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          >
            <option value="">— Válassz projektet —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        {mode === "trip" && (
          <select
            value={tripId}
            onChange={(e) => setTripId(e.target.value)}
            className="mt-3 w-full h-11 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          >
            <option value="">— Válassz utazást —</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.year} · {t.name}
              </option>
            ))}
          </select>
        )}

        {mode === "new" && (
          <div className="mt-3">
            <Input
              name="newProjectName"
              placeholder="Az új teendő-projekt neve (pl. Lakásfelújítás)"
            />
            <p className="mt-1.5 text-xs text-[var(--color-muted-foreground)]">
              Új projekt jön létre „csak Teendők" hatókörrel — a Célok és
              projektek oldalon később átállítható.
            </p>
          </div>
        )}
      </div>

      {/* Szín */}
      <div>
        <span className="block text-sm font-medium mb-2">Szín</span>
        <div className="flex flex-wrap items-center gap-2">
          {COLOR_KEYS.map((c) => {
            const col = CAT_COLORS[c];
            return (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setColor(c)}
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

      <Field label="Leírás" hint="nem kötelező">
        <Textarea
          name="description"
          defaultValue={initial?.description ?? ""}
          placeholder="Mire való ez a lista?"
          className="min-h-20"
        />
      </Field>

      {!initial && (
        <Field label="Teendők" hint="soronként egy — később is bővíthető">
          <Textarea
            name="items"
            placeholder={"útlevél\nbiztosítás\ntöltő\nfényképezőgép"}
            className="min-h-32"
          />
        </Field>
      )}

      <SubmitButton size="lg" fullWidth>
        {submitLabel ?? (initial ? "Mentés" : "Lista létrehozása")}
      </SubmitButton>
    </form>
  );
}
