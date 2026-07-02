import { requireUser } from "@/lib/auth";
import { redis, key } from "@/lib/redis";
import type { User } from "@/lib/types";

export default async function CsaladPage() {
  const me = await requireUser();
  const memberIds = await redis.smembers(key.householdMembers(me.householdId));
  const members = (
    await Promise.all(memberIds.map((id) => redis.get<User>(key.user(id))))
  ).filter((u): u is User => !!u);

  const inviteUrl = `/belepes?mode=reg&hh=${me.householdId}`;

  return (
    <main className="min-h-dvh px-5 py-8 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <a href="/" className="text-sm text-zinc-500 underline">← Vissza</a>
      <h1 className="mt-2 text-2xl font-bold">Család</h1>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Tagok</h2>
        <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          {members.map((m) => (
            <li key={m.id} className="px-4 py-3 flex justify-between">
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-zinc-500">{m.email}</div>
              </div>
              {m.id === me.userId && <span className="text-xs text-zinc-500">te</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Meghívó link</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Küldd el ezt a linket akinek hozzáférést adnál a közös háztartáshoz.
          A regisztráció után rögtön ehhez a háztartáshoz csatlakozik.
        </p>
        <div className="mt-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm break-all">
          {inviteUrl}
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          (A böngésző címsorában látható domain elé illeszd — pl. https://fozes.vercel.app{inviteUrl})
        </p>
      </section>
    </main>
  );
}
