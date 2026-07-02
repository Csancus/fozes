import { login, register } from "./actions";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChefHat, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; err?: string; hh?: string }>;
}) {
  const me = await currentUser();
  if (me) redirect("/");
  const sp = await searchParams;
  const isRegister = sp.mode === "reg";
  const joiningHousehold = Boolean(sp.hh);

  return (
    <main className="min-h-dvh flex flex-col bg-[var(--color-background)]">
      <div className="relative flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-40 -right-32 w-96 h-96 rounded-full blur-3xl opacity-25"
            style={{ background: "var(--color-gradient-from)" }}
          />
          <div
            className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-3xl opacity-20"
            style={{ background: "var(--color-gradient-to)" }}
          />
        </div>

        <div className="relative w-full max-w-sm animate-fade-up">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl brand-gradient flex items-center justify-center shadow-lg">
              <ChefHat className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Főzés</h1>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)] text-center">
              Receptek, spájz és bevásárlás egy helyen
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm p-6">
            <div className="flex items-center gap-1 mb-6 p-1 bg-[var(--color-muted)] rounded-xl">
              <TabLink active={!isRegister} href={`/belepes${sp.hh ? `?hh=${sp.hh}` : ""}`}>
                Belépés
              </TabLink>
              <TabLink active={isRegister} href={`/belepes?mode=reg${sp.hh ? `&hh=${sp.hh}` : ""}`}>
                Regisztráció
              </TabLink>
            </div>

            {joiningHousehold && isRegister && (
              <div className="mb-4 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] px-3.5 py-2.5 text-xs">
                Meghívóval csatlakozol egy meglévő háztartáshoz.
              </div>
            )}

            {sp.err && (
              <div className="mb-4 rounded-xl bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 px-3.5 py-2.5 text-sm">
                {decodeURIComponent(sp.err)}
              </div>
            )}

            <form action={isRegister ? register : login} className="space-y-4">
              {isRegister && (
                <>
                  <Field label="Név" required>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
                      <Input name="name" required placeholder="Kis Ferenc" className="pl-10" />
                    </div>
                  </Field>
                  <input type="hidden" name="hh" value={sp.hh ?? ""} />
                </>
              )}
              <Field label="Email" required>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
                  <Input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="pl. te@email.hu"
                    className="pl-10"
                  />
                </div>
              </Field>
              <Field label="Jelszó" required hint={isRegister ? "Minimum 6 karakter" : undefined}>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
                  <Input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    className="pl-10"
                  />
                </div>
              </Field>
              <Button type="submit" size="lg" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
                {isRegister ? "Fiók létrehozása" : "Belépés"}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-[var(--color-muted-foreground)]">
            {isRegister ? (
              <>
                Van már fiókod?{" "}
                <Link href="/belepes" className="text-[var(--color-primary)] font-medium hover:underline">
                  Belépés
                </Link>
              </>
            ) : (
              <>
                Új itt?{" "}
                <Link href={`/belepes?mode=reg${sp.hh ? `&hh=${sp.hh}` : ""}`} className="text-[var(--color-primary)] font-medium hover:underline">
                  Regisztrálj
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}

function TabLink({ active, href, children }: { active: boolean; href: string; children: string }) {
  return (
    <Link
      href={href}
      className={
        "flex-1 text-center text-sm font-medium py-2 rounded-lg transition " +
        (active
          ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm"
          : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]")
      }
    >
      {children}
    </Link>
  );
}
