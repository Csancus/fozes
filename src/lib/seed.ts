import {
  saveRecipe,
  savePantryItem,
  savePurchase,
  saveShoppingList,
  ensureDefaultLocations,
} from "@/lib/data";
import { redis, key, newId, slug } from "@/lib/redis";
import type { Purchase, ShoppingList } from "@/lib/types";

const DAY = 86_400_000;

export async function seedExampleData(hh: string): Promise<void> {
  const locations = await ensureDefaultLocations(hh);
  const fridge =
    locations.find((l) => l.kind === "fridge")?.id ?? locations[0].id;
  const pantry =
    locations.find((l) => l.kind === "pantry")?.id ?? locations[0].id;

  await saveRecipe(hh, {
    name: "Babgulyás [példa]",
    servings: 4,
    category: "leves",
    caloriesPerServing: 480,
    proteinPerServing: 28,
    ingredients: [
      { name: "tarka bab", qty: 300, unit: "g" },
      { name: "füstölt sertéscsülök", qty: 500, unit: "g" },
      { name: "vöröshagyma", qty: 2, unit: "db" },
      { name: "paprika", qty: 3, unit: "db" },
      { name: "paradicsom", qty: 2, unit: "db" },
      { name: "sárgarépa", qty: 2, unit: "db" },
      { name: "burgonya", qty: 2, unit: "db" },
      { name: "pirospaprika", qty: 1, unit: "ek" },
      { name: "babérlevél", qty: 1, unit: "db" },
      { name: "só", qty: 1, unit: "csipet" },
    ],
    instructions:
      "1. Bab beáztatás előző este.\n2. Csülök feltét vízzel, forralás.\n3. Hagyma pirítás, paprika hozzáadás.\n4. Bab + zöldségek + fűszerek → 60 perc főzés.\n5. Krumpli utolsó 20 percben.",
    tags: ["leves", "hagyományos", "példa"],
  });

  await saveRecipe(hh, {
    name: "Almás pite [példa]",
    servings: 8,
    category: "sutemeny",
    caloriesPerServing: 320,
    proteinPerServing: 4,
    ingredients: [
      { name: "liszt", qty: 500, unit: "g" },
      { name: "vaj", qty: 250, unit: "g" },
      { name: "cukor", qty: 100, unit: "g" },
      { name: "tojás", qty: 2, unit: "db" },
      { name: "citrom", qty: 1, unit: "db" },
      { name: "alma", qty: 1, unit: "kg" },
      { name: "fahéj", qty: 1, unit: "kk" },
      { name: "só", qty: 1, unit: "csipet" },
    ],
    instructions:
      "1. Tészta: liszt+vaj+cukor+tojás → hűtő 30 perc.\n2. Alma reszelés, cukor+fahéj+citromlé.\n3. Rétegezés: tészta - alma - tészta.\n4. Sütés 180°C 40 perc.",
    tags: ["desszert", "sütemény", "példa"],
  });

  const now = Date.now();

  await savePantryItem(hh, {
    name: "tarka bab",
    qty: 200,
    unit: "g",
    locationId: pantry,
    expiresAt: now + 180 * DAY,
    boughtAt: now - 7 * DAY,
    price: 480,
    note: "példa",
  });
  await savePantryItem(hh, {
    name: "vöröshagyma",
    qty: 3,
    unit: "db",
    locationId: pantry,
    expiresAt: now + 21 * DAY,
    boughtAt: now - 4 * DAY,
    price: 250,
    note: "példa",
  });
  await savePantryItem(hh, {
    name: "liszt",
    qty: 800,
    unit: "g",
    locationId: pantry,
    expiresAt: now + 120 * DAY,
    boughtAt: now - 14 * DAY,
    price: 320,
    note: "példa",
  });
  await savePantryItem(hh, {
    name: "alma",
    qty: 5,
    unit: "db",
    locationId: fridge,
    expiresAt: now + 10 * DAY,
    boughtAt: now - 2 * DAY,
    price: 690,
    note: "példa",
  });
  await savePantryItem(hh, {
    name: "vaj",
    qty: 250,
    unit: "g",
    locationId: fridge,
    expiresAt: now + 30 * DAY,
    boughtAt: now - 3 * DAY,
    price: 890,
    note: "példa",
  });

  const purchaseId = newId();
  const purchasedAt = now - 3 * DAY;
  const purchase: Purchase = {
    id: purchaseId,
    store: "Lidl [példa]",
    purchasedAt,
    source: "manual",
    raw: "Példa blokk — kézzel bevitt tételek.",
    total: 3630,
    lines: [
      {
        name: "tarka bab",
        qty: 500,
        unit: "g",
        unitPrice: 960,
        total: 480,
        addToPantry: false,
        locationId: null,
        expiresAt: null,
      },
      {
        name: "vöröshagyma",
        qty: 1,
        unit: "kg",
        unitPrice: 250,
        total: 250,
        addToPantry: false,
        locationId: null,
        expiresAt: null,
      },
      {
        name: "alma",
        qty: 1,
        unit: "kg",
        unitPrice: 690,
        total: 690,
        addToPantry: false,
        locationId: null,
        expiresAt: null,
      },
      {
        name: "vaj",
        qty: 1,
        unit: "csomag",
        unitPrice: 890,
        total: 890,
        addToPantry: false,
        locationId: null,
        expiresAt: null,
      },
      {
        name: "cukor",
        qty: 1,
        unit: "kg",
        unitPrice: 420,
        total: 420,
        addToPantry: false,
        locationId: null,
        expiresAt: null,
      },
      {
        name: "liszt",
        qty: 1,
        unit: "kg",
        unitPrice: 320,
        total: 320,
        addToPantry: false,
        locationId: null,
        expiresAt: null,
      },
      {
        name: "tojás",
        qty: 10,
        unit: "db",
        unitPrice: 58,
        total: 580,
        addToPantry: false,
        locationId: null,
        expiresAt: null,
      },
    ],
    createdAt: now,
  };
  await savePurchase(hh, purchase);

  // Feed price history from purchase lines
  for (const line of purchase.lines) {
    const entry = {
      price: line.unitPrice,
      qty: line.qty,
      unit: line.unit,
      ts: purchasedAt,
    };
    const histKey = key.priceHistory(hh, slug(line.name));
    await redis.lpush(histKey, JSON.stringify(entry));
    await redis.ltrim(histKey, 0, 49);
  }

  const listId = newId();
  const list: ShoppingList = {
    id: listId,
    name: "Hétvégi bevásárlás [példa]",
    recipeIds: [],
    items: [
      {
        name: "tarka bab",
        qty: 300,
        unit: "g",
        have: 200,
        need: 100,
        checked: false,
      },
      {
        name: "paprika",
        qty: 3,
        unit: "db",
        have: 0,
        need: 3,
        checked: false,
      },
      {
        name: "paradicsom",
        qty: 2,
        unit: "db",
        have: 0,
        need: 2,
        checked: true,
      },
      {
        name: "burgonya",
        qty: 2,
        unit: "db",
        have: 0,
        need: 2,
        checked: false,
      },
      {
        name: "citrom",
        qty: 1,
        unit: "db",
        have: 0,
        need: 1,
        checked: false,
      },
    ],
    createdAt: now,
    completedAt: null,
  };
  await saveShoppingList(hh, list);
}
