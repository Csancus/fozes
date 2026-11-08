import { login, register, requestPasswordReset } from "./actions";
import { currentUser, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { getInvite } from "@/lib/invites";
import { isMailConfigured } from "@/lib/mail";
import { redirect } from "next/navigation";
import { ChefHat, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; err?: string; ok?: string; inv?: string }>;
}) {
  const me = await currentUser();
  if (me) redirect("/");
  const sp = await searchParams;
  const isRegister = sp.mode === "reg";
  const isForgot = sp.mode === "forgot";
  const invite = sp.inv ? await getInvite(sp.inv) : null;
  const invQ = sp.inv ? `inv=${encodeURIComponent(sp.inv)}` : "";
  const mailOn = isMailConfigured();

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
              <TabLink active={!isRegister} href={`/belepes${invQ ? `?${invQ}` : ""}`}>
                Belépés
              </TabLink>
              <TabLink active={isRegister} href={`/belepes?mode=reg${invQ ? `&${invQ}` : ""}`}>
                Regisztráció
              </TabLink>
            </div>

            {sp.inv && isRegister && (
              <div
                className={
                  "mb-4 rounded-xl px-3.5 py-2.5 text-xs " +
                  (invite
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20")
                }
              >
                {invite
                  ? "Meghívóval csatlakozol egy meglévő háztartáshoz."
                  : "Ez a meghívó lejárt vagy már felhasználták. Kérj újat attól, aki meghívott – vagy regisztrálj saját háztartással."}
              </div>
            )}

            {sp.ok && (
              <div className="mb-4 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 px-3.5 py-2.5 text-sm">
                {sp.ok}
              </div>
            )}

            {sp.err && (
              <div className="mb-4 rounded-xl bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 px-3.5 py-2.5 text-sm">
                {sp.err}
              </div>
            )}

            {isForgot ? (
              mailOn ? (
                <form action={requestPasswordReset} className="space-y-4">
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Add meg a fiókod email-címét, és küldünk egy linket, amivel 1 órán belül új jelszót állíthatsz be.
                  </p>
                  <Field label="Email" required>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
                      <Input name="email" type="email" required autoComplete="email" placeholder="pl. te@email.hu" className="pl-10" />
                    </div>
                  </Field>
                  <Button type="submit" size="lg" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Link küldése
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Kérd meg a háztartásod tulajdonosát, hogy a <b>Család</b> oldalon generáljon neked egy
                  jelszó-visszaállító linket. A link 1 óráig érvényes, és csak egyszer használható.
                </p>
              )
            ) : (
            <form action={isRegister ? register : login} className="space-y-4">
              {isRegister && (
                <>
                  <Field label="Név" required>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
                      <Input name="name" required maxLength={60} placeholder="Kis Ferenc" className="pl-10" />
                    </div>
                  </Field>
                  <input type="hidden" name="inv" value={invite ? sp.inv : ""} />
                  {/* Csapda botoknak: ember nem látja, nem tölti ki. */}
                  <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                    <label>
                      Weboldal
                      <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                    </label>
                  </div>
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
              <Field
                label="Jelszó"
                required
                hint={isRegister ? `Legalább ${MIN_PASSWORD_LENGTH} karakter` : undefined}
              >
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
                  <Input
                    name="password"
                    type="password"
                    required
                    minLength={isRegister ? MIN_PASSWORD_LENGTH : undefined}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    className="pl-10"
                  />
                </div>
              </Field>
              <Button type="submit" size="lg" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
                {isRegister ? "Fiók létrehozása" : "Belépés"}
              </Button>
              {!isRegister && (
                <p className="text-center text-xs">
                  <Link href="/belepes?mode=forgot" className="text-[var(--color-muted-foreground)] hover:underline">
                    Elfelejtetted a jelszavad?
                  </Link>
                </p>
              )}
            </form>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-[var(--color-muted-foreground)]">
            {isRegister || isForgot ? (
              <>
                Van már fiókod?{" "}
                <Link href="/belepes" className="text-[var(--color-primary)] font-medium hover:underline">
                  Belépés
                </Link>
              </>
            ) : (
              <>
                Új itt?{" "}
                <Link href={`/belepes?mode=reg${invQ ? `&${invQ}` : ""}`} className="text-[var(--color-primary)] font-medium hover:underline">
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
