import { requireUser } from "@/lib/auth";
import { listGoals, listProjects, listTaskTags } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { CollapsiblePanel } from "@/components/ui/CollapsiblePanel";
import { EntityManager } from "@/components/ui/EntityManager";
import {
  createGoalAction,
  updateGoalAction,
  deleteGoalAction,
  renameTaskTagAction,
  deleteTaskTagAction,
} from "../teendok/actions";
import { TagManager } from "./TagManager";
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
} from "@/app/koltsegek/actions";

export default async function GlobalisBeallitasokPage() {
  const me = await requireUser();
  const [goals, projects, tags] = await Promise.all([
    listGoals(me.householdId),
    listProjects(me.householdId),
    listTaskTags(me.householdId),
  ]);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Célok és projektek"
        subtitle="Megosztott elemek — minden modulban elérhetők"
        back="/"
      />

      <div className="mt-6 space-y-3">
        <CollapsiblePanel title="Célok" count={goals.length} defaultOpen>
          <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">
            Nagyobb életcél, amihez projektek tartozhatnak (pl. Vagyonépítés,
            Egészség).
          </p>
          <EntityManager
            variant="goal"
            items={goals}
            createAction={createGoalAction}
            updateAction={updateGoalAction}
            deleteAction={deleteGoalAction}
          />
        </CollapsiblePanel>

        <CollapsiblePanel title="Projektek" count={projects.length} defaultOpen>
          <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">
            Egy projekt jelölhető csak Költségekhez, csak Teendőkhöz, vagy
            mindkét helyhez tartozónak — és opcionálisan egy célhoz is
            köthető.
          </p>
          <EntityManager
            variant="project"
            items={projects}
            goals={goals}
            createAction={createProjectAction}
            updateAction={updateProjectAction}
            deleteAction={deleteProjectAction}
          />
        </CollapsiblePanel>

        <CollapsiblePanel title="Címkék" count={tags.length}>
          <TagManager
            tags={tags}
            renameAction={renameTaskTagAction}
            deleteAction={deleteTaskTagAction}
          />
        </CollapsiblePanel>
      </div>
    </main>
  );
}
