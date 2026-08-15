"use client";

import { useMemo, useState } from "react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Plus, X, CopyPlus } from "lucide-react";
import type { Project, TaskList } from "@/lib/types";

type Row = {
  key: string;
  title: string;
  description: string;
  ownerId: string;
  dueDate: string;
  projectId: string;
};

let counter = 0;
function emptyRow(): Row {
  counter += 1;
  return {
    key: `r${counter}`,
    title: "",
    description: "",
    ownerId: "",
    dueDate: "",
    projectId: "",
  };
}

const ctrl =
  "h-9 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-[var(--color-primary)]";

export function BatchTaskEntry({
  action,
  members,
  projects,
  lists = [],
  defaultListId = "",
}: {
  action: (fd: FormData) => void | Promise<void>;
  members: { id: string; name: string }[];
  projects: Project[];
  lists?: TaskList[];
  defaultListId?: string;
}) {
  // A táblázat minden sora ugyanabba a listába kerül (ha van választva).
  const [listId, setListId] = useState(defaultListId);
  const [rows, setRows] = useState<Row[]>([
    emptyRow(),
    emptyRow(),
    emptyRow(),
    emptyRow(),
    emptyRow(),
  ]);

  function update(key: string, patch: Partial<Row>) {
    setRows((cur) => cur.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRow(key: string) {
    setRows((cur) => (cur.length > 1 ? cur.filter((r) => r.key !== key) : cur));
  }

  function addRow() {
    setRows((cur) => [...cur, emptyRow()]);
  }

  function addRowLikeLast() {
    setRows((cur) => {
      const last = cur[cur.length - 1];
      const r = emptyRow();
      if (last) {
        r.ownerId = last.ownerId;
        r.dueDate = last.dueDate;
        r.projectId = last.projectId;
      }
      return [...cur, r];
    });
  }

  const valid = useMemo(() => rows.filter((r) => r.title.trim()), [rows]);

  const payload = JSON.stringify(
    valid.map((r) => ({
      title: r.title,
      description: r.description,
      ownerId: r.ownerId,
      dueDate: r.dueDate,
      projectId: r.projectId,
      listId,
    }))
  );

  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="rows" value={payload} />

      {lists.length > 0 && (
        <label className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">Melyik listába?</span>
          <select
            value={listId}
            onChange={(e) => setListId(e.target.value)}
            className="h-9 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          >
            <option value="">— Nincs (önálló teendők) —</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-[var(--color-muted-foreground)]">
            minden sorra érvényes
          </span>
        </label>
      )}

      <div className="overflow-x-auto -mx-5 px-5">
        <table
          className="w-full border-separate border-spacing-x-1.5 border-spacing-y-1.5"
          style={{ minWidth: "760px" }}
        >
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
              <th className="font-semibold px-1">Mit kell megcsinálni?</th>
              <th className="font-semibold px-1 w-40">Határidő</th>
              {members.length > 0 && (
                <th className="font-semibold px-1 w-36">Kié?</th>
              )}
              {projects.length > 0 && (
                <th className="font-semibold px-1 w-40">Projekt</th>
              )}
              <th className="font-semibold px-1 w-48">Megjegyzés</th>
              <th className="w-7" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="align-top">
                <td>
                  <input
                    value={r.title}
                    onChange={(e) => update(r.key, { title: e.target.value })}
                    placeholder="pl. Autó műszaki vizsga"
                    className={ctrl}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    min="1970-01-01"
                    max="2099-12-31"
                    value={r.dueDate}
                    onChange={(e) => update(r.key, { dueDate: e.target.value })}
                    className={ctrl}
                  />
                </td>
                {members.length > 0 && (
                  <td>
                    <select
                      value={r.ownerId}
                      onChange={(e) => update(r.key, { ownerId: e.target.value })}
                      className={ctrl}
                    >
                      <option value="">Bárki</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </td>
                )}
                {projects.length > 0 && (
                  <td>
                    <select
                      value={r.projectId}
                      onChange={(e) => update(r.key, { projectId: e.target.value })}
                      className={ctrl}
                    >
                      <option value="">— Nincs —</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                )}
                <td>
                  <input
                    value={r.description}
                    onChange={(e) => update(r.key, { description: e.target.value })}
                    placeholder="Megjegyzés"
                    className={ctrl}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => removeRow(r.key)}
                    className="w-8 h-9 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-500/10"
                    aria-label="Sor törlése"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:brightness-110"
        >
          <Plus className="w-4 h-4" /> Új sor
        </button>
        <button
          type="button"
          onClick={addRowLikeLast}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          title="Új sor az előző sor adataival"
        >
          <CopyPlus className="w-4 h-4" /> Sor az előző adataival
        </button>
      </div>

      <div className="mt-6 sticky bottom-0 -mx-5 px-5 py-3 bg-[var(--color-background)]/95 backdrop-blur-md border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-[var(--color-muted-foreground)]">
            {valid.length} teendő
          </div>
          <SubmitButton disabled={valid.length === 0}>
            {valid.length} teendő mentése
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
