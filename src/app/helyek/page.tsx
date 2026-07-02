import { requireUser } from "@/lib/auth";
import { listLocations, ensureDefaultLocations } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { createLocationAction, deleteLocationAction } from "./actions";

const KIND_LABEL: Record<string, string> = {
  fridge: "Hűtő",
  freezer: "Fagyasztó",
  pantry: "Tartós",
  custom: "Szekrény",
};

export default async function HelyekPage() {
  const me = await requireUser();
  await ensureDefaultLocations(me.householdId);
  const locations = await listLocations(me.householdId);

  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <PageHeader title="Tárolási helyek" back="/spajz" />

      <section className="mt-6">
        <ul className="space-y-2">
          {locations.map((l) => (
            <li key={l.id} className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3">
              <div>
                <div className="font-medium">{l.name}</div>
                <div className="text-xs text-zinc-500">{KIND_LABEL[l.kind]}</div>
              </div>
              <form action={deleteLocationAction}>
                <input type="hidden" name="id" value={l.id} />
                <button className="text-xs text-red-600 hover:underline">Törlés</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h2 className="font-semibold mb-3">Új hely</h2>
        <form action={createLocationAction} className="space-y-3">
          <input
            name="name"
            required
            placeholder="Név (pl. Konyhaszekrény bal felső)"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
          />
          <select
            name="kind"
            defaultValue="custom"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2"
          >
            <option value="fridge">Hűtő</option>
            <option value="freezer">Fagyasztó</option>
            <option value="pantry">Tartós</option>
            <option value="custom">Szekrény / egyéb</option>
          </select>
          <button className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 py-2.5 font-medium">
            Hozzáadás
          </button>
        </form>
      </section>
    </main>
  );
}
