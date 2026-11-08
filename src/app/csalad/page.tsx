import { requireUser } from "@/lib/auth";
import { redis, key } from "@/lib/redis";
import type { User, Household } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { hasSurprisePassword } from "@/lib/data";
import { InvitesPanel } from "./InvitesPanel";
import { MemberActions } from "./MemberActions";
import { listInvites } from "@/lib/invites";
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
  const [memberIds, hh, hasSurprisePw] = await Promise.all([
    redis.smembers(key.householdMembers(me.householdId)),
    redis.get<Household>(key.household(me.householdId)),
    hasSurprisePassword(me.householdId),
  ]);
  const isOwner = hh?.ownerId === me.userId;
  const invites = isOwner ? await listInvites(me.householdId) : [];
  const members = (
    await Promise.all(memberIds.map((id) => redis.get<User>(key.user(id))))
  ).filter((u): u is User => !!u);


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
                    {hh?.ownerId === m.id && <Badge>Tulajdonos</Badge>}
                    {m.id === me.userId && <Badge tone="primary">Te</Badge>}
                  </div>
                  {isOwner && (
                    <MemberActions memberId={m.id} memberName={m.name} isSelf={m.id === me.userId} />
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Meghívó">
          <p className="text-sm text-[var(--color-muted-foreground)] mb-3 px-1">
            {isOwner
              ? "A meghívó link 7 napig érvényes és egyszer használható: aki regisztrál vele, teljes hozzáférést kap a közös adatokhoz. Ha rossz kézbe került, vond vissza."
              : "Meghívót a háztartás tulajdonosa tud küldeni."}
          </p>
          {isOwner && (
            <Card>
              <div className="p-4">
                <InvitesPanel
                  householdName={hh?.name ?? "háztartás"}
                  invites={invites.map((i) => ({ token: i.token, createdAt: i.createdAt, expiresAt: i.expiresAt }))}
                />
              </div>
            </Card>
          )}
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
