"use client";

import { useMemo, useState } from "react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn } from "@/lib/cn";
import { Plus, X, CopyPlus } from "lucide-react";
import type { SavedType } from "@/lib/types";
import { KindSelect } from "../KindSelect";

type Row = {
  key: string;
  title: string;
  kind: string;
  location: string;
  tags: string;
  note: string;
};

let counter = 0;
function emptyRow(kind: string): Row {
  counter += 1;
  return {
    key: `r${counter}`,
    title: "",
    kind,
    location: "",
    tags: "",
    note: "",
  };
}

const ctrl =
  "h-9 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-[var(--color-primary)]";

export function SavedBatchEntry({
  action,
  types = [],
}: {
  action: (fd: FormData) => void | Promise<void>;
  types?: SavedType[];
}) {
  const [typeList, setTypeList] = useState<SavedType[]>(types);
  const defaultKind = types[0]?.id ?? "etterem";
  const [rows, setRows] = useState<Row[]>(() => [
    emptyRow(defaultKind),
    emptyRow(defaultKind),
    emptyRow(defaultKind),
    emptyRow(defaultKind),
    emptyRow(defaultKind),
  ]);

  function update(key: string, patch: Partial<Row>) {
    setRows((cur) => cur.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function removeRow(key: string) {
    setRows((cur) => (cur.length > 1 ? cur.filter((r) => r.key !== key) : cur));
  }
  function addRow() {
    setRows((cur) => [
      ...cur,
      emptyRow(cur[cur.length - 1]?.kind ?? defaultKind),
    ]);
  }
  function addRowLikeLast() {
    setRows((cur) => {
      const last = cur[cur.length - 1];
      const r = emptyRow(last?.kind ?? defaultKind);
      if (last) {
        r.location = last.location;
        r.tags = last.tags;
      }
      return [...cur, r];
    });
  }
  function onTypeCreated(t: SavedType) {
    setTypeList((cur) => (cur.some((x) => x.id === t.id) ? cur : [...cur, t]));
  }

  const valid = useMemo(() => rows.filter((r) => r.title.trim()), [rows]);

  const payload = JSON.stringify(
    valid.map((r) => ({
      title: r.title,
      kind: r.kind,
      location: r.location,
      tags: r.tags,
      note: r.note,
    }))
  );

  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="rows" value={payload} />

      <div className="overflow-x-auto -mx-5 px-5">
        <table
          className="w-full border-separate border-spacing-x-1.5 border-spacing-y-1.5"
          style={{ minWidth: "820px" }}
        >
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
              <th className="font-semibold w-7" />
              <th className="font-semibold px-1 w-40">Típus</th>
              <th className="font-semibold px-1">Cím / név</th>
              <th className="font-semibold px-1 w-44">Hol</th>
              <th className="font-semibold px-1 w-40">Címkék</th>
              <th className="w-7" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              return (
                <tr key={r.key} className="align-top">
                  <td className="text-xs text-[var(--color-muted-foreground)] tabular-nums pt-2">
                    {i + 1}.
                  </td>
                  <td>
                    <KindSelect
                      types={typeList}
                      value={r.kind}
                      onChange={(id) => update(r.key, { kind: id })}
                      onCreated={onTypeCreated}
                      className={cn(ctrl, "text-left")}
                    />
                  </td>
                  <td>
                    <input
                      value={r.title}
                      onChange={(e) => update(r.key, { title: e.target.value })}
                      placeholder="pl. Rézmál Bisztró, Lofoten túra"
                      className={cn(ctrl, "font-medium")}
                    />
                  </td>
                  <td>
                    <input
                      value={r.location}
                      onChange={(e) =>
                        update(r.key, { location: e.target.value })
                      }
                      placeholder="pl. Budapest"
                      className={ctrl}
                    />
                  </td>
                  <td>
                    <input
                      value={r.tags}
                      onChange={(e) => update(r.key, { tags: e.target.value })}
                      placeholder="hétvége, randi"
                      className={ctrl}
                    />
                  </td>
                  <td className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => removeRow(r.key)}
                      className="h-9 w-7 flex items-center justify-center text-[var(--color-muted-foreground)] hover:text-red-600"
                      aria-label="Sor törlése"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
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
          title="Új sor az előző sor típusával, helyszínével és címkéivel"
        >
          <CopyPlus className="w-4 h-4" /> Sor az előző adataival
        </button>
      </div>

      <p className="mt-4 text-xs text-[var(--color-muted-foreground)]">
        Itt gyorsan felviszed a listát — képet, linket, fájlt és jegyzetet
        utólag egyenként tehetsz hozzá a tétel oldalán.
      </p>

      <div className="mt-4 sticky bottom-0 -mx-5 px-5 py-3 bg-[var(--color-background)]/95 backdrop-blur-md border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-semibold tabular-nums">{valid.length}</span>
            <span className="text-[var(--color-muted-foreground)]"> tétel</span>
          </div>
          <SubmitButton disabled={valid.length === 0}>
            {valid.length} tétel mentése
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
