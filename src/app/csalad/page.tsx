import { requireUser } from "@/lib/auth";
import { redis, key } from "@/lib/redis";
import type { User } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function CsaladPage() {
  const me = await requireUser();
  const memberIds = await redis.smembers(key.householdMembers(me.householdId));
  const members = (
    await Promise.all(memberIds.map((id) => redis.get<User>(key.user(id))))
  ).filter((u): u is User => !!u);

  const invitePath = `/belepes?mode=reg&hh=${me.householdId}`;

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Család" back="/" />

      <div className="mt-5 space-y-8 animate-fade-up">
        <Section title="Tagok">
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.id}>
                <Card>
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-semibold shadow-sm shrink-0">
                      {initialsOf(m.name) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] truncate">{m.name}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                        {m.email}
                      </p>
                    </div>
                    {m.id === me.userId && <Badge tone="primary">Te</Badge>}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Meghívó link">
          <p className="text-sm text-[var(--color-muted-foreground)] mb-3 px-1">
            Küldd el ezt a linket, akinek hozzáférést adnál a közös háztartáshoz. A regisztráció
            után rögtön ehhez a háztartáshoz csatlakozik.
          </p>
          <Card>
            <div className="p-4">
              <div className="font-mono text-xs text-[var(--color-foreground)] break-all bg-[var(--color-muted)] rounded-lg px-3 py-2.5">
                {invitePath}
              </div>
              <p className="text-[11px] text-[var(--color-muted-foreground)] mt-3">
                A böngésző címsorában látható domain elé illeszd — pl.{" "}
                <span className="font-mono">https://fozes.vercel.app{invitePath}</span>
              </p>
            </div>
          </Card>
        </Section>
      </div>
    </main>
  );
}
