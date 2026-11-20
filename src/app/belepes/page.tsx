import { login, register, requestPasswordReset } from "./actions";
import { currentUser, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { getInvite } from "@/lib/invites";
import { isMailConfigured } from "@/lib/mail";
import { createCaptcha } from "@/lib/captcha";
import { redirect } from "next/navigation";
import {
  Compass,
  Mail,
  User,
  ArrowLeft,
  ChefHat,
  Wallet,
  ListChecks,
  Plane,
  CircleAlert,
  CircleCheck,
  Users,
  ShieldCheck,
} from "lucide-react";
import { Input, Field } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import Link from "next/link";

const MODULES = [
  { icon: ChefHat, label: "Főzés" },
  { icon: Wallet, label: "Költségek" },
  { icon: ListChecks, label: "Teendők" },
  { icon: Plane, label: "Utazások" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; err?: string; ok?: string; inv?: string; email?: string }>;
}) {
  const me = await currentUser();
  if (me) redirect("/");
  const sp = await searchParams;
  const isRegister = sp.mode === "reg";
  const isForgot = sp.mode === "forgot";
  const invite = sp.inv ? await getInvite(sp.inv) : null;
  const invQ = sp.inv ? `inv=${encodeURIComponent(sp.inv)}` : "";
  const mailOn = isMailConfigured();
  // Minden oldalbetöltés új, aláírt feladatot kap (Story 2.7).
  const captcha = createCaptcha();
  const loginHref = `/belepes${invQ ? `?${invQ}` : ""}`;
  const regHref = `/belepes?mode=reg${invQ ? `&${invQ}` : ""}`;

  const title = isForgot ? "Elfelejtett jelszó" : isRegister ? "Fiók létrehozása" : "Üdv újra!";
  const subtitle = isForgot
    ? "Segítünk visszajutni a fiókodba."
    : isRegister
      ? invite
        ? "Egy perc, és csatlakozol a háztartáshoz."
        : "Egy perc, és indulhatsz."
      : "Lépj be a folytatáshoz.";

  return (
    <main className="relative min-h-dvh flex items-center justify-center overflow-hidden px-4 pt-4 pb-4 sm:py-10 bg-[var(--color-background)]">
      {/* Világos / sötét váltás már belépés előtt is (Story 8.2) */}
      <div
        className="absolute right-4 z-10"
        style={{ top: "max(1rem, env(safe-area-inset-top))" }}
      >
        <ModeSwitcher className="w-9 h-9 shadow-sm backdrop-blur-md" />
      </div>

      <div aria-hidden data-plain-only className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 -right-32 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-25"
          style={{ background: "var(--color-gradient-from)" }}
        />
        <div
          className="absolute -bottom-40 -left-32 w-[24rem] h-[24rem] rounded-full blur-3xl opacity-20"
          style={{ background: "var(--color-gradient-to)" }}
        />
      </div>

      <div className="relative w-full max-w-[400px] animate-fade-up">
        {/* Márka */}
        {/* Mobilon tömör, egysoros márka, hogy az egész űrlap a gombbal együtt kiférjen (Story 8.3 AC8). */}
        <div className="flex flex-row sm:flex-col items-center justify-center gap-2.5 sm:gap-0 text-center mb-4 sm:mb-7">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl brand-gradient flex items-center justify-center shadow-lg">
            <Compass className="w-5 h-5 sm:w-7 sm:h-7 text-white" strokeWidth={2} />
          </div>
          <p className="sm:mt-3 text-base font-semibold tracking-tight">Élet Portál</p>
          <div className="mt-3 hidden sm:flex flex-wrap items-center justify-center gap-1.5">
            {MODULES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/60 px-2.5 py-1 text-[11px] text-[var(--color-muted-foreground)]"
              >
                <Icon className="w-3 h-3" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl shadow-black/10 p-4 sm:p-7">
          {isForgot ? (
            <Link
              href={loginHref}
              className="inline-flex items-center gap-1.5 -ml-1 mb-4 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition"
            >
              <ArrowLeft className="w-4 h-4" /> Vissza a belépéshez
            </Link>
          ) : (
            <div role="tablist" className="grid grid-cols-2 gap-1 mb-3 sm:mb-6 p-1 bg-[var(--color-muted)] rounded-xl">
              <TabLink active={!isRegister} href={loginHref}>
                Belépés
              </TabLink>
              <TabLink active={isRegister} href={regHref}>
                Regisztráció
              </TabLink>
            </div>
          )}

          <div className="mb-3 sm:mb-5">
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 hidden sm:block text-sm text-[var(--color-muted-foreground)]">{subtitle}</p>
          </div>

          {sp.inv && isRegister && (
            <Notice tone={invite ? "info" : "warn"}>
              {invite
                ? "Meghívóval csatlakozol egy meglévő háztartáshoz."
                : "Ez a meghívó lejárt vagy már felhasználták. Kérj újat attól, aki meghívott, vagy regisztrálj saját háztartással."}
            </Notice>
          )}
          {sp.ok && <Notice tone="ok">{sp.ok}</Notice>}
          {sp.err && <Notice tone="err">{sp.err}</Notice>}

          {isForgot ? (
            mailOn ? (
              <form action={requestPasswordReset} className="space-y-4">
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Add meg a fiókod email-címét. Küldünk egy linket, amivel 1 órán belül új jelszót állíthatsz be.
                </p>
                <EmailField defaultValue={sp.email} autoFocus={!sp.email} />
                <CaptchaField a={captcha.a} b={captcha.b} token={captcha.token} autoFocus={Boolean(sp.email)} />
                <SubmitButton size="lg" fullWidth pendingText="Küldés…">Link küldése</SubmitButton>
              </form>
            ) : (
              <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                Kérd meg a háztartásod tulajdonosát, hogy a <b className="text-[var(--color-foreground)]">Család</b> oldalon
                generáljon neked egy jelszó-visszaállító linket. A link 1 óráig érvényes, és csak egyszer használható.
              </p>
            )
          ) : (
            <form action={isRegister ? register : login} className="space-y-3 sm:space-y-4">
              {isRegister && (
                <>
                  <Field label="Név" required>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)] pointer-events-none" />
                      <Input
                        name="name"
                        required
                        maxLength={60}
                        autoComplete="name"
                        autoFocus
                        placeholder="Kis Ferenc"
                        className="pl-10"
                      />
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

              <EmailField defaultValue={sp.email} autoFocus={!isRegister && !sp.email} />

              <div>
                <Field label="Jelszó" required>
                  <PasswordInput
                    name="password"
                    required
                    minLength={isRegister ? MIN_PASSWORD_LENGTH : undefined}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    autoFocus={!isRegister && Boolean(sp.email)}
                    placeholder={isRegister ? `Legalább ${MIN_PASSWORD_LENGTH} karakter` : "A jelszavad"}
                  />
                </Field>
                {!isRegister && (
                  <div className="mt-1.5 text-right">
                    <Link
                      href="/belepes?mode=forgot"
                      className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                    >
                      Elfelejtetted a jelszavad?
                    </Link>
                  </div>
                )}
              </div>

              <CaptchaField a={captcha.a} b={captcha.b} token={captcha.token} />

              <div className="sm:pt-1">
                <SubmitButton size="lg" fullWidth pendingText={isRegister ? "Fiók létrehozása…" : "Belépés…"}>
                  {isRegister ? "Fiók létrehozása" : "Belépés"}
                </SubmitButton>
              </div>
            </form>
          )}
        </div>

        {isRegister && !invite && (
          <p className="mt-5 hidden sm:flex items-start justify-center gap-1.5 text-center text-xs text-[var(--color-muted-foreground)]">
            <Users className="w-3.5 h-3.5 mt-px shrink-0" />
            Regisztrációkor saját háztartást kapsz, ahova később a családot is meghívhatod.
          </p>
        )}
      </div>
    </main>
  );
}

function EmailField({ defaultValue, autoFocus }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <Field label="Email" required>
      <div className="relative">
        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)] pointer-events-none" />
        <Input
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          autoFocus={autoFocus}
          defaultValue={defaultValue}
          placeholder="pl. te@email.hu"
          className="pl-10"
        />
      </div>
    </Field>
  );
}

function CaptchaField({
  a,
  b,
  token,
  autoFocus,
}: {
  a: number;
  b: number;
  token: string;
  autoFocus?: boolean;
}) {
  return (
    <Field label="Biztonsági kérdés" required>
      <input type="hidden" name="captchaToken" value={token} />
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[var(--color-muted)] px-3.5 text-[15px] font-semibold tabular-nums"
        >
          <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
          {a} + {b} =
        </span>
        <Input
          name="captcha"
          required
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={3}
          autoComplete="off"
          autoFocus={autoFocus}
          aria-label={`Mennyi ${a} meg ${b}?`}
          placeholder="?"
          className="text-center font-semibold tabular-nums"
        />
      </div>
    </Field>
  );
}

function Notice({ tone, children }: { tone: "info" | "warn" | "ok" | "err"; children: React.ReactNode }) {
  const styles = {
    info: "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-transparent",
    warn: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20",
    ok: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20",
    err: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  }[tone];
  const Icon = tone === "ok" ? CircleCheck : CircleAlert;
  return (
    <div
      role={tone === "err" ? "alert" : "status"}
      className={"mb-4 flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm " + styles}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function TabLink({ active, href, children }: { active: boolean; href: string; children: string }) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={
        "text-center text-sm font-medium py-2 rounded-lg transition " +
        (active
          ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm"
          : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]")
      }
    >
      {children}
    </Link>
  );
}
