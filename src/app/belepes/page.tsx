import { login, register } from "./actions";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; err?: string; hh?: string }>;
}) {
  const me = await currentUser();
  if (me) redirect("/");
  const sp = await searchParams;
  const isRegister = sp.mode === "reg";

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-16 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {isRegister ? "Regisztráció" : "Belépés"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {isRegister ? "Új felhasználó" : "Főzés"}
        </p>

        {sp.err && (
          <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 px-3 py-2 text-sm">
            {decodeURIComponent(sp.err)}
          </div>
        )}

        <form
          action={isRegister ? register : login}
          className="mt-5 space-y-3"
        >
          {isRegister && (
            <>
              <Field name="name" label="Név" type="text" required />
              <input type="hidden" name="hh" value={sp.hh ?? ""} />
            </>
          )}
          <Field name="email" label="Email" type="email" required />
          <Field name="password" label="Jelszó" type="password" required minLength={6} />
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 py-2.5 font-medium hover:opacity-90 transition"
          >
            {isRegister ? "Regisztráció" : "Belépés"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-zinc-500">
          {isRegister ? (
            <a href="/belepes" className="underline">Van már fiókod? Belépés</a>
          ) : (
            <a href="/belepes?mode=reg" className="underline">Nincs fiókod? Regisztráció</a>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({
  name,
  label,
  type,
  required,
  minLength,
}: {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={type === "password" ? "current-password" : type}
        className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
      />
    </label>
  );
}
