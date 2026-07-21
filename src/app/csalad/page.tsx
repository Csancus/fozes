import { requireUser } from "@/lib/auth";
import { redis, key } from "@/lib/redis";
import type { User, Household } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { headers } from "next/headers";
import { hasSurprisePassword } from "@/lib/data";
import { InviteLink } from "./InviteLink";
import { SurprisePasswordForm } from "./SurprisePasswordForm";

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
  const [memberIds, hh, h, hasSurprisePw] = await Promise.all([
    redis.smembers(key.householdMembers(me.householdId)),
    redis.get<Household>(key.household(me.householdId)),
    headers(),
    hasSurprisePassword(me.householdId),
  ]);
  const members = (
    await Promise.all(memberIds.map((id) => redis.get<User>(key.user(id))))
  ).filter((u): u is User => !!u);

  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "fozes.vercel.app";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const inviteUrl = `${proto}://${host}/belepes?mode=reg&hh=${me.householdId}`;

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
                    <div className="w-11 h-11 rounded-full brand-gradient text-white flex items-center justify-center font-semibold shadow-sm shrink-0">
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
            Küldd el ezt a linket, akinek hozzáférést adnál a közös
            háztartáshoz. A regisztráció után rögtön ehhez a háztartáshoz
            csatlakozik.
          </p>
          <Card>
            <div className="p-4">
              <InviteLink url={inviteUrl} householdName={hh?.name ?? "háztartás"} />
            </div>
          </Card>
        </Section>

        <Section title="Meglepetés-jelszó">
          <Card>
            <div className="p-4">
              <SurprisePasswordForm hasPw={hasSurprisePw} />
            </div>
          </Card>
        </Section>
      </div>
    </main>
  );
}
