import { requireUser } from "@/lib/auth";
import { listPurchases } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Receipt, Plus, ChevronRight } from "lucide-react";

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

export default async function VasarlasPage() {
  const me = await requireUser();
  const purchases = await listPurchases(me.householdId);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Vásárlás"
        action={
          <Button href="/vasarlas/uj" variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Új
          </Button>
        }
      />

      {purchases.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nincs rögzített vásárlás"
          description="Vidd fel a blokkot szöveggel, PDF-fel vagy fotóval."
          action={
            <Button href="/vasarlas/uj" leftIcon={<Plus className="w-4 h-4" />}>
              Új vásárlás
            </Button>
          }
        />
      ) : (
        <ul className="mt-5 space-y-2.5 animate-fade-up">
          {purchases.map((p) => (
            <li key={p.id}>
              <LinkCard href={`/vasarlas/${p.id}`} className="flex items-center gap-3.5 p-4">
                <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[15px] truncate">{p.store}</p>
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                    {fmtDate(p.purchasedAt)} · {p.lines.length} tétel
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="font-semibold tabular-nums font-mono text-[14px]">
                    {fmtFt(p.total)}
                  </span>
                  <Badge tone={SOURCE_TONE[p.source] ?? "neutral"}>
                    {SOURCE_LABEL[p.source] ?? p.source}
                  </Badge>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
              </LinkCard>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
