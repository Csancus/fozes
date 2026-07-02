import { NextResponse } from "next/server";

type OffProduct = {
  product_name?: string;
  product_name_hu?: string;
  brands?: string;
  quantity?: string;
  image_front_url?: string;
  image_url?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    fat_100g?: number;
    carbohydrates_100g?: number;
  };
  categories_tags?: string[];
};

type OffResponse = {
  status: number;
  product?: OffProduct;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ barcode: string }> }
) {
  const { barcode: raw } = await params;
  const barcode = raw.replace(/\D/g, "");
  if (!barcode || barcode.length < 6) {
    return NextResponse.json({ found: false, error: "invalid barcode" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: { "User-Agent": "fozes-app/1.0 (contact via github)" },
        next: { revalidate: 60 * 60 * 24 * 7 },
      }
    );
    if (!res.ok) {
      return NextResponse.json(
        { found: false, error: "openfoodfacts error" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as OffResponse;
    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ found: false });
    }
    const p = data.product;
    const name =
      p.product_name_hu?.trim() ||
      p.product_name?.trim() ||
      p.brands?.trim() ||
      "";
    return NextResponse.json({
      found: true,
      name,
      brand: p.brands?.split(",")[0]?.trim() ?? null,
      quantity: p.quantity ?? null,
      image: p.image_front_url ?? p.image_url ?? null,
      kcal100: p.nutriments?.["energy-kcal_100g"] ?? null,
      protein100: p.nutriments?.proteins_100g ?? null,
      fat100: p.nutriments?.fat_100g ?? null,
      carbs100: p.nutriments?.carbohydrates_100g ?? null,
      categoriesTags: p.categories_tags ?? [],
    });
  } catch (e) {
    return NextResponse.json(
      { found: false, error: e instanceof Error ? e.message : "fetch failed" },
      { status: 502 }
    );
  }
}
