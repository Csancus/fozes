import { redis, key, newId } from "./redis";
import type {
  Location,
  Recipe,
  PantryItem,
  ShoppingList,
  Purchase,
} from "./types";

// ============ LOCATIONS ============

export async function listLocations(hh: string): Promise<Location[]> {
  const ids = await redis.smembers(key.locations(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<Location>(key.location(hh, id)))
  );
  return items
    .filter((l): l is Location => !!l)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getLocation(hh: string, id: string) {
  return redis.get<Location>(key.location(hh, id));
}

export async function createLocation(
  hh: string,
  input: Pick<Location, "name" | "kind">
) {
  const loc: Location = {
    id: newId(),
    name: input.name.trim(),
    kind: input.kind,
    createdAt: Date.now(),
  };
  await redis.set(key.location(hh, loc.id), loc);
  await redis.sadd(key.locations(hh), loc.id);
  return loc;
}

export async function updateLocation(
  hh: string,
  id: string,
  patch: Partial<Pick<Location, "name" | "kind">>
) {
  const cur = await getLocation(hh, id);
  if (!cur) return null;
  const next = { ...cur, ...patch };
  await redis.set(key.location(hh, id), next);
  return next;
}

export async function deleteLocation(hh: string, id: string) {
  await redis.del(key.location(hh, id));
  await redis.srem(key.locations(hh), id);
}

export async function ensureDefaultLocations(hh: string) {
  const existing = await listLocations(hh);
  if (existing.length > 0) return existing;
  await createLocation(hh, { name: "Hűtő", kind: "fridge" });
  await createLocation(hh, { name: "Fagyasztó", kind: "freezer" });
  await createLocation(hh, { name: "Tartós szekrény", kind: "pantry" });
  return listLocations(hh);
}

// ============ RECIPES ============

export async function listRecipes(hh: string): Promise<Recipe[]> {
  const ids = await redis.smembers(key.recipes(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<Recipe>(key.recipe(hh, id)))
  );
  return items
    .filter((r): r is Recipe => !!r)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getRecipe(hh: string, id: string) {
  return redis.get<Recipe>(key.recipe(hh, id));
}

export async function saveRecipe(
  hh: string,
  input: Omit<Recipe, "id" | "createdAt" | "updatedAt"> & { id?: string }
) {
  const now = Date.now();
  const id = input.id ?? newId();
  const existing = input.id ? await getRecipe(hh, input.id) : null;
  const r: Recipe = {
    id,
    name: input.name.trim(),
    servings: input.servings,
    caloriesPerServing: input.caloriesPerServing ?? null,
    proteinPerServing: input.proteinPerServing ?? null,
    ingredients: input.ingredients,
    instructions: input.instructions,
    tags: input.tags,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await redis.set(key.recipe(hh, id), r);
  await redis.sadd(key.recipes(hh), id);
  return r;
}

export async function deleteRecipe(hh: string, id: string) {
  await redis.del(key.recipe(hh, id));
  await redis.srem(key.recipes(hh), id);
}

// ============ PANTRY ============

export async function listPantry(hh: string): Promise<PantryItem[]> {
  const ids = await redis.smembers(key.pantry(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<PantryItem>(key.pantryItem(hh, id)))
  );
  return items
    .filter((p): p is PantryItem => !!p)
    .sort((a, b) => {
      if (a.expiresAt && b.expiresAt) return a.expiresAt - b.expiresAt;
      if (a.expiresAt) return -1;
      if (b.expiresAt) return 1;
      return a.name.localeCompare(b.name, "hu");
    });
}

export async function getPantryItem(hh: string, id: string) {
  return redis.get<PantryItem>(key.pantryItem(hh, id));
}

export async function savePantryItem(
  hh: string,
  input: Omit<PantryItem, "id" | "boughtAt"> & { id?: string; boughtAt?: number }
) {
  const id = input.id ?? newId();
  const existing = input.id ? await getPantryItem(hh, input.id) : null;
  const item: PantryItem = {
    id,
    name: input.name.trim(),
    qty: input.qty,
    unit: input.unit,
    locationId: input.locationId,
    expiresAt: input.expiresAt,
    boughtAt: existing?.boughtAt ?? input.boughtAt ?? Date.now(),
    price: input.price,
    note: input.note,
  };
  await redis.set(key.pantryItem(hh, id), item);
  await redis.sadd(key.pantry(hh), id);
  return item;
}

export async function deletePantryItem(hh: string, id: string) {
  await redis.del(key.pantryItem(hh, id));
  await redis.srem(key.pantry(hh), id);
}

// ============ SHOPPING LISTS ============

export async function listShoppingLists(hh: string): Promise<ShoppingList[]> {
  const ids = await redis.smembers(key.shoppingLists(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<ShoppingList>(key.shoppingList(hh, id)))
  );
  return items
    .filter((s): s is ShoppingList => !!s)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getShoppingList(hh: string, id: string) {
  return redis.get<ShoppingList>(key.shoppingList(hh, id));
}

export async function saveShoppingList(hh: string, list: ShoppingList) {
  await redis.set(key.shoppingList(hh, list.id), list);
  await redis.sadd(key.shoppingLists(hh), list.id);
  return list;
}

export async function deleteShoppingList(hh: string, id: string) {
  await redis.del(key.shoppingList(hh, id));
  await redis.srem(key.shoppingLists(hh), id);
}

// ============ PURCHASES ============

export async function listPurchases(hh: string): Promise<Purchase[]> {
  const ids = await redis.smembers(key.purchases(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<Purchase>(key.purchase(hh, id)))
  );
  return items
    .filter((p): p is Purchase => !!p)
    .sort((a, b) => b.purchasedAt - a.purchasedAt);
}

export async function getPurchase(hh: string, id: string) {
  return redis.get<Purchase>(key.purchase(hh, id));
}

export async function savePurchase(hh: string, p: Purchase) {
  await redis.set(key.purchase(hh, p.id), p);
  await redis.sadd(key.purchases(hh), p.id);
  return p;
}

export async function deletePurchase(hh: string, id: string) {
  await redis.del(key.purchase(hh, id));
  await redis.srem(key.purchases(hh), id);
}
