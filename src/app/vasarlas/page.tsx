import { requireUser } from "@/lib/auth";
import { listPurchases } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";

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
  photo: "Fotó",
  manual: "Kézi",
};

export default async function VasarlasPage() {
  const me = await requireUser();
  const purchases = await listPurchases(me.householdId);

  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-24">
      <PageHeader title="Vásárlások" />

      <div className="mt-4">
        <Link
          href="/vasarlas/uj"
          className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 px-3 py-2 text-sm font-medium"
        >
          + Új vásárlás
        </Link>
      </div>

      {purchases.length === 0 && (
        <p className="mt-8 text-center text-sm text-zinc-500">
          Még nincs vásárlás rögzítve. Illessz be egy blokkot vagy tölts fel PDF-et!
        </p>
      )}

      <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {purchases.map((p) => (
          <li key={p.id}>
            <Link
              href={`/vasarlas/${p.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{p.store}</div>
                <div className="text-xs text-zinc-500 mt-0.5 flex gap-2 items-center">
                  <span>{fmtDate(p.purchasedAt)}</span>
                  <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    {SOURCE_LABEL[p.source] ?? p.source}
                  </span>
                  <span>{p.lines.length} tétel</span>
                </div>
              </div>
              <div className="text-right shrink-0 pl-3">
                <div className="font-semibold">{fmtFt(p.total)}</div>
                <div className="text-xs text-zinc-400">›</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
