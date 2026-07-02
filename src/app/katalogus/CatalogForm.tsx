"use client";

import { useState } from "react";
import { Input, Textarea, Select, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Save, Camera, ScanBarcode, Loader2 } from "lucide-react";
import {
  CATALOG_CATEGORIES,
  CATALOG_CATEGORY_LABEL,
  type CatalogCategory,
  type CatalogItem,
  type Unit,
} from "@/lib/types";
import { UNITS } from "@/lib/units";
import { BarcodeScanner } from "./BarcodeScanner";
import { saveCatalogAction } from "./actions";

type OffLookup = {
  found: boolean;
  name?: string;
  brand?: string | null;
  quantity?: string | null;
  image?: string | null;
  kcal100?: number | null;
  protein100?: number | null;
  fat100?: number | null;
  carbs100?: number | null;
  categoriesTags?: string[];
};

// Best-effort mapping from Open Food Facts category tags to our categories.
function guessCategory(tags: string[]): CatalogCategory | null {
  const j = tags.join(" ").toLowerCase();
  if (/dairies|milk|cheese|yogurt|butter|cream/.test(j)) return "tejtermek";
  if (/egg/.test(j)) return "tojas";
  if (/meat|beef|pork|poultry|sausage|ham/.test(j)) return "hus";
  if (/fish|seafood/.test(j)) return "hal";
  if (/vegetable/.test(j)) return "zoldseg";
  if (/fruit/.test(j)) return "gyumolcs";
  if (/breads|bakery/.test(j)) return "pekaru";
  if (/pastas|noodles/.test(j)) return "teszta";
  if (/legumes|beans|lentils/.test(j)) return "huvelyes";
  if (/cereals|flours|rice|grain/.test(j)) return "gabona";
  if (/oil|fat/.test(j)) return "olaj";
  if (/spice|herb|condiment|salt/.test(j)) return "fuszer";
  if (/canned|preserved/.test(j)) return "konzerv";
  if (/frozen/.test(j)) return "melyhutott";
  if (/beverage|drink|water|juice|soda/.test(j)) return "ital";
  if (/sweet|chocolate|candy|cookie|biscuit/.test(j)) return "edesseg";
  if (/coffee|tea/.test(j)) return "kave_tea";
  return null;
}

function parseQuantity(q: string | null | undefined): {
  qty: number | null;
  unit: Unit | null;
} {
  if (!q) return { qty: null, unit: null };
  const m = q.match(/^\s*(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|db)/i);
  if (!m) return { qty: null, unit: null };
  const qty = Number(m[1].replace(",", "."));
  const u = m[2].toLowerCase();
  const unit = (["g", "kg", "ml", "l", "db"] as Unit[]).find((x) => x === u);
  return {
    qty: Number.isFinite(qty) ? qty : null,
    unit: unit ?? null,
  };
}

export function CatalogForm({ initial }: { initial?: CatalogItem }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<CatalogCategory>(
    initial?.category ?? "egyeb"
  );
  const [defaultUnit, setDefaultUnit] = useState<Unit>(
    initial?.defaultUnit ?? "db"
  );
  const [defaultQty, setDefaultQty] = useState(
    initial?.defaultQty != null ? String(initial.defaultQty) : ""
  );
  const [barcode, setBarcode] = useState(initial?.barcode ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [kcal100, setKcal100] = useState(
    initial?.kcal100 != null ? String(initial.kcal100) : ""
  );
  const [protein100, setProtein100] = useState(
    initial?.protein100 != null ? String(initial.protein100) : ""
  );
  const [fat100, setFat100] = useState(
    initial?.fat100 != null ? String(initial.fat100) : ""
  );
  const [carbs100, setCarbs100] = useState(
    initial?.carbs100 != null ? String(initial.carbs100) : ""
  );
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);

  async function lookup(code: string) {
    setLookupBusy(true);
    setLookupMsg(null);
    try {
      const clean = code.replace(/\D/g, "");
      setBarcode(clean);
      const r = await fetch(`/api/openfoodfacts/${clean}`, { cache: "no-store" });
      const data: OffLookup = await r.json();
      if (!data.found) {
        setLookupMsg("Nincs adat az Openfoodfacts-ben — töltsd ki kézzel.");
        return;
      }
      if (data.name && !name) setName(data.name);
      if (data.brand && !brand) setBrand(data.brand);
      const guessed = guessCategory(data.categoriesTags ?? []);
      if (guessed && category === "egyeb") setCategory(guessed);
      const { qty, unit } = parseQuantity(data.quantity);
      if (qty != null && !defaultQty) setDefaultQty(String(qty));
      if (unit && defaultUnit === "db") setDefaultUnit(unit);
      if (data.image && !imageUrl) setImageUrl(data.image);
      if (data.kcal100 != null && !kcal100)
        setKcal100(String(Math.round(data.kcal100)));
      if (data.protein100 != null && !protein100)
        setProtein100(String(data.protein100));
      if (data.fat100 != null && !fat100) setFat100(String(data.fat100));
      if (data.carbs100 != null && !carbs100)
        setCarbs100(String(data.carbs100));
      setLookupMsg("Adatok betöltve — ellenőrizd és mentsd.");
    } catch {
      setLookupMsg("Hiba a lekérésnél. Töltsd ki kézzel.");
    } finally {
      setLookupBusy(false);
    }
  }

  return (
    <>
      <form action={saveCatalogAction} className="space-y-5">
        {initial && <input type="hidden" name="id" value={initial.id} />}

        <div className="rounded-2xl border border-dashed border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)]/40 p-4 space-y-3">
          <div className="flex items-center gap-2 text-[var(--color-primary)] text-sm font-semibold">
            <ScanBarcode className="w-4 h-4" />
            Vonalkód beolvasása
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ""))}
              placeholder="EAN-13"
              className="flex-1 h-11 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3.5 text-[15px]"
            />
            <Button
              type="button"
              onClick={() => setScannerOpen(true)}
              variant="soft"
              leftIcon={<Camera className="w-4 h-4" />}
            >
              Kamera
            </Button>
            <Button
              type="button"
              onClick={() => lookup(barcode)}
              disabled={barcode.length < 6 || lookupBusy}
              leftIcon={
                lookupBusy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ScanBarcode className="w-4 h-4" />
                )
              }
            >
              Lekérdez
            </Button>
          </div>
          {lookupMsg && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {lookupMsg}
            </p>
          )}
        </div>

        <Field label="Név" required>
          <Input
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="pl. Farm liszt BL55"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Kategória">
            <Select
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as CatalogCategory)}
            >
              {CATALOG_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATALOG_CATEGORY_LABEL[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Márka">
            <Input
              name="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="pl. SPAR"
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Alap egység">
            <Select
              name="defaultUnit"
              value={defaultUnit}
              onChange={(e) => setDefaultUnit(e.target.value as Unit)}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Alap mennyiség">
            <Input
              name="defaultQty"
              type="number"
              step="any"
              value={defaultQty}
              onChange={(e) => setDefaultQty(e.target.value)}
              placeholder="pl. 1000"
            />
          </Field>
          <Field label="Kép URL">
            <Input
              name="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </Field>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <p className="text-sm font-semibold mb-3">
            Tápérték / 100 g (opcionális)
          </p>
          <div className="grid grid-cols-4 gap-3">
            <Field label="Kcal">
              <Input
                name="kcal100"
                type="number"
                step="1"
                value={kcal100}
                onChange={(e) => setKcal100(e.target.value)}
              />
            </Field>
            <Field label="Fehérje g">
              <Input
                name="protein100"
                type="number"
                step="0.1"
                value={protein100}
                onChange={(e) => setProtein100(e.target.value)}
              />
            </Field>
            <Field label="Zsír g">
              <Input
                name="fat100"
                type="number"
                step="0.1"
                value={fat100}
                onChange={(e) => setFat100(e.target.value)}
              />
            </Field>
            <Field label="Szénhidrát g">
              <Input
                name="carbs100"
                type="number"
                step="0.1"
                value={carbs100}
                onChange={(e) => setCarbs100(e.target.value)}
              />
            </Field>
          </div>
        </div>

        {imageUrl && (
          <div className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-muted)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              className="w-full h-40 object-contain bg-white"
            />
          </div>
        )}

        <Textarea name="_desc_ignored" className="hidden" />

        <Button
          type="submit"
          size="lg"
          fullWidth
          leftIcon={<Save className="w-4 h-4" />}
        >
          Mentés
        </Button>
      </form>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(code) => {
          setScannerOpen(false);
          lookup(code);
        }}
      />
    </>
  );
}
