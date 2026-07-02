import { requireUser } from "@/lib/auth";
import { getPurchase } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { notFound } from "next/navigation";
import { deletePurchaseAction } from "../actions";
import Link from "next/link";
import { fmt } from "@/lib/units";

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

function fmtFt(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}

const SOURCE_LABEL: Record<string, string> = {
  text: "Szöveg",
  pdf: "PDF",
  manual: "Kézi",
};

export default async function PurchaseViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const p = await getPurchase(me.householdId, id);
  if (!p) notFound();

  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-24">
      <PageHeader title={p.store} back="/vasarlas" />

      <section className="mt-4 flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
        <span>{fmtDate(p.purchasedAt)}</span>
        <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide">
          {SOURCE_LABEL[p.source] ?? p.source}
        </span>
        <span className="ml-auto font-semibold text-zinc-900 dark:text-zinc-50">
          {fmtFt(p.total)}
        </span>
      </section>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/vasarlas/${p.id}/szerkesztes`}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 px-3 py-2 text-sm font-medium"
        >
          Szerkesztés
        </Link>
      </div>

      {p.lines.length === 0 ? (
        <p className="mt-8 text-center text-sm text-zinc-500">
          Nem sikerült tételt beolvasni. Nyisd meg szerkesztésre és add hozzá kézzel.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          {p.lines.map((l, i) => (
            <li key={i} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{l.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {fmt(l.qty, l.unit)}
                  {l.unitPrice > 0 && (
                    <>
                      {" "}× {fmtFt(l.unitPrice)}/{l.unit}
                    </>
                  )}
                  {l.addToPantry && (
                    <span className="ml-2 text-green-600">• spájzba</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-medium">{fmtFt(l.total)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {p.raw && (
        <details className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <summary className="cursor-pointer px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
            Nyers szöveg
          </summary>
          <pre className="px-4 pb-4 text-xs font-mono whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {p.raw}
          </pre>
        </details>
      )}

      <form action={deletePurchaseAction} className="mt-8">
        <input type="hidden" name="id" value={p.id} />
        <button className="text-sm text-red-600 hover:underline">
          Vásárlás törlése
        </button>
      </form>
    </main>
  );
}
