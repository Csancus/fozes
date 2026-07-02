export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight">Főzés</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Receptek, spájz és bevásárlólista egy helyen.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
          <Card title="Receptek" desc="Kedvenc receptjeid" href="/receptek" />
          <Card title="Spájz" desc="Mi van itthon" href="/spajz" />
          <Card title="Bevásárlás" desc="Mit kell venni" href="/bevasarlas" />
          <Card title="Vásárlás" desc="Blokk import + árak" href="/vasarlas" />
        </div>
        <p className="mt-10 text-xs text-zinc-500">
          Bejelentkezés hamarosan.
        </p>
      </div>
    </main>
  );
}

function Card({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <a
      href={href}
      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-left hover:border-zinc-400 dark:hover:border-zinc-600 transition"
    >
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{desc}</div>
    </a>
  );
}
