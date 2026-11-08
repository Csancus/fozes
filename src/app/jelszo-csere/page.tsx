import Link from "next/link";
import { Lock, ArrowRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { peekResetToken } from "@/lib/password-reset";
import { resetPassword } from "./actions";

// Story 2.4 – jelszó-visszaállító oldal (belépés nélkül, tokennel).
export default async function PasswordResetPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; err?: string }>;
}) {
  const sp = await searchParams;
  const valid = sp.t ? Boolean(await peekResetToken(sp.t)) : false;

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-10 bg-[var(--color-background)]">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl brand-gradient flex items-center justify-center shadow-lg">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Új jelszó</h1>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm p-6">
          {sp.err && (
            <div className="mb-4 rounded-xl bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 px-3.5 py-2.5 text-sm">
              {sp.err}
            </div>
          )}

          {valid ? (
            <form action={resetPassword} className="space-y-4">
              <input type="hidden" name="t" value={sp.t} />
              <Field label="Új jelszó" required hint={`Legalább ${MIN_PASSWORD_LENGTH} karakter`}>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
                  <Input name="password" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className="pl-10" />
                </div>
              </Field>
              <Field label="Új jelszó még egyszer" required>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
                  <Input name="password2" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className="pl-10" />
                </div>
              </Field>
              <Button type="submit" size="lg" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
                Jelszó mentése
              </Button>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Mentés után minden eszközön kijelentkezel, és az új jelszóval kell belépned.
              </p>
            </form>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Ez a link lejárt vagy már felhasználták. A link 1 óráig érvényes és csak egyszer használható.{" "}
              <Link href="/belepes?mode=forgot" className="text-[var(--color-primary)] font-medium hover:underline">
                Kérj újat
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
