import { requireUser } from "@/lib/auth";
import { listCatalog } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  CATALOG_CATEGORIES,
  CATALOG_CATEGORY_LABEL,
  type CatalogCategory,
  type CatalogItem,
} from "@/lib/types";
import { Package, Plus, ChevronRight, Barcode } from "lucide-react";

export default async function KatalogusPage() {
  const me = await requireUser();
  const items = await listCatalog(me.householdId);

  const byCat = new Map<CatalogCategory, CatalogItem[]>();
  for (const c of CATALOG_CATEGORIES) byCat.set(c, []);
  for (const it of items) byCat.get(it.category)!.push(it);

  return (
    <main className="min-h-dvh px-5 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Katalógus"
        back="/fozes"
        action={
          <Button
            href="/katalogus/uj"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Új tétel
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Üres a katalógus"
          description="Rakd fel a gyakran vásárolt termékeket (liszt, tojás, tej, stb.) — a spájz és a bevásárlólista ebből dolgozik majd. Vonalkód olvasással a legtöbb bolti termék adatai automatikusan behúzódnak."
          action={
            <Button
              href="/katalogus/uj"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Első termék
            </Button>
          }
        />
      ) : (
        <div className="mt-5 space-y-6 animate-fade-up">
          {[...byCat.entries()]
            .filter(([, arr]) => arr.length > 0)
            .map(([cat, arr]) => (
              <section key={cat}>
                <h2 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-muted-foreground)] mb-2 px-1">
                  {CATALOG_CATEGORY_LABEL[cat]} · {arr.length}
                </h2>
                <ul className="space-y-2">
                  {arr.map((it) => (
                    <li key={it.id}>
                      <LinkCard
                        href={`/katalogus/${it.id}`}
                        className="group p-3"
                      >
                        <div className="flex items-center gap-3">
                          {it.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={it.imageUrl}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover bg-white shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-[15px] truncate">
                                {it.name}
                              </p>
                              {it.barcode && (
                                <Barcode className="w-3.5 h-3.5 text-[var(--color-muted-foreground)] shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">
                              {it.brand ? `${it.brand} · ` : ""}
                              {it.defaultQty != null
                                ? `${it.defaultQty} ${it.defaultUnit}`
                                : it.defaultUnit}
                              {it.kcal100 != null
                                ? ` · ${it.kcal100} kcal/100g`
                                : ""}
                            </p>
                            {it.barcode && (
                              <div className="mt-1">
                                <Badge tone="muted">{it.barcode}</Badge>
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition shrink-0" />
                        </div>
                      </LinkCard>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </main>
  );
}
