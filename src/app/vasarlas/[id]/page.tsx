import { requireUser } from "@/lib/auth";
import { getPurchase } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { notFound } from "next/navigation";
import { deletePurchaseAction } from "../actions";
import { fmt } from "@/lib/units";
import { Pencil, Trash2, Sprout } from "lucide-react";

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

const SOURCE_TONE: Record<string, "neutral" | "primary" | "muted"> = {
  text: "neutral",
  pdf: "primary",
  photo: "primary",
  manual: "muted",
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
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md mx-auto">
      <PageHeader
        title={p.store}
        subtitle={fmtDate(p.purchasedAt)}
        back="/vasarlas"
        action={
          <Button
            href={`/vasarlas/${p.id}/szerkesztes`}
            variant="secondary"
            size="sm"
            leftIcon={<Pencil className="w-3.5 h-3.5" />}
          >
            Szerkesztés
          </Button>
        }
      />

      <div className="mt-5 animate-fade-up space-y-6">
        <Card>
          <CardBody className="flex items-center justify-between">
            <Badge tone={SOURCE_TONE[p.source] ?? "neutral"}>
              {SOURCE_LABEL[p.source] ?? p.source}
            </Badge>
            <div className="text-right">
              <div className="text-xs text-[var(--color-muted-foreground)]">Összesen</div>
              <div className="text-2xl font-bold tabular-nums font-mono">{fmtFt(p.total)}</div>
            </div>
          </CardBody>
        </Card>

        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em]">
              Tételek
            </h2>
            <span className="text-[11px] text-[var(--color-muted-foreground)]">
              {p.lines.length} db
            </span>
          </div>

          {p.lines.length === 0 ? (
            <Card>
              <CardBody className="text-center text-sm text-[var(--color-muted-foreground)]">
                Nem sikerült tételt beolvasni. Nyisd meg szerkesztésre és add hozzá kézzel.
              </CardBody>
            </Card>
          ) : (
            <ul className="space-y-2">
              {p.lines.map((l, i) => (
                <li key={i}>
                  <Card>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[15px] truncate">{l.name}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                          {fmt(l.qty, l.unit)}
                          {l.unitPrice > 0 && (
                            <>
                              {" "}
                              · {fmtFt(l.unitPrice)}/{l.unit}
                            </>
                          )}
                          {l.addToPantry && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[var(--color-success)]">
                              <Sprout className="w-3 h-3" /> spájzba
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right shrink-0 font-semibold tabular-nums font-mono text-[14px]">
                        {fmtFt(l.total)}
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        {p.raw && (
          <details className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
            <summary className="cursor-pointer px-5 py-3 text-sm text-[var(--color-muted-foreground)]">
              Nyers szöveg
            </summary>
            <pre className="px-5 pb-4 text-xs font-mono whitespace-pre-wrap text-[var(--color-foreground)]/80">
              {p.raw}
            </pre>
          </details>
        )}

        <form action={deletePurchaseAction} className="pt-2">
          <input type="hidden" name="id" value={p.id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            fullWidth
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="text-[var(--color-danger)] hover:bg-red-500/10"
          >
            Vásárlás törlése
          </Button>
        </form>
      </div>
    </main>
  );
}
