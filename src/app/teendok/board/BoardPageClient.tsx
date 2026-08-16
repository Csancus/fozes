"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { Task, Project, TaskList } from "@/lib/types";
import { TaskBoard } from "../TaskBoard";
import { StatusListView } from "./StatusListView";
import { LayoutGrid, List as ListIcon } from "lucide-react";

type Entry = Task & { ownerName: string | null };

// A Board oldal nézetváltója: kanban (húzható oszlopok) vagy státusz szerinti
// lista — mindkettő az összes teendőt mutatja, listától/projekttől függetlenül.
export function BoardPageClient({
  tasks,
  projects = [],
  lists = [],
  toggleDoneAction,
  deleteAction,
  statusAction,
  dueDateAction,
}: {
  tasks: Entry[];
  projects?: Project[];
  lists?: TaskList[];
  toggleDoneAction: (fd: FormData) => void | Promise<void>;
  deleteAction: (fd: FormData) => void | Promise<void>;
  statusAction: (fd: FormData) => void | Promise<void>;
  dueDateAction: (fd: FormData) => void | Promise<void>;
}) {
  const [view, setView] = useState<"board" | "list">("board");

  useEffect(() => {
    const saved = localStorage.getItem("teendok-board-page-view");
    if (saved === "board" || saved === "list") setView(saved);
  }, []);
  function pickView(v: "board" | "list") {
    setView(v);
    localStorage.setItem("teendok-board-page-view", v);
  }

  return (
    <div>
      <div className="mt-4 flex justify-end">
        <div className="shrink-0 flex rounded-xl border border-[var(--color-border)] p-0.5">
          {([
            { id: "board", icon: LayoutGrid, label: "Tábla nézet" },
            { id: "list", icon: ListIcon, label: "Lista nézet" },
          ] as const).map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                type="button"
                aria-label={v.label}
                title={v.label}
                onClick={() => pickView(v.id)}
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition",
                  view === v.id
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      {view === "board" ? (
        <TaskBoard tasks={tasks} statusAction={statusAction} dueDateAction={dueDateAction} />
      ) : (
        <StatusListView
          tasks={tasks}
          projects={projects}
          lists={lists}
          toggleDoneAction={toggleDoneAction}
          deleteAction={deleteAction}
          statusAction={statusAction}
          dueDateAction={dueDateAction}
        />
      )}
    </div>
  );
}
