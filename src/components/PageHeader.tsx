export function PageHeader({ title, back = "/" }: { title: string; back?: string }) {
  return (
    <header className="flex items-center gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
      <a href={back} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 text-lg">←</a>
      <h1 className="text-xl font-bold">{title}</h1>
    </header>
  );
}
