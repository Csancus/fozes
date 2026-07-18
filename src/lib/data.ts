import { redis, key, newId, slug } from "./redis";
import type {
  Location,
  Recipe,
  PantryItem,
  ShoppingList,
  Purchase,
  CookedMeal,
  CatalogItem,
  Expense,
  ExpenseCategory,
  SavedItem,
} from "./types";
import { DEFAULT_EXPENSE_CATEGORIES } from "./types";

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

export async function listRecipes(
  hh: string,
  opts?: { includeArchived?: boolean }
): Promise<Recipe[]> {
  const ids = await redis.smembers(key.recipes(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<Recipe>(key.recipe(hh, id)))
  );
  const includeArchived = opts?.includeArchived ?? false;
  return items
    .filter((r): r is Recipe => !!r)
    .filter((r) => (includeArchived ? true : (r.archivedAt ?? null) == null))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getRecipe(hh: string, id: string) {
  return redis.get<Recipe>(key.recipe(hh, id));
}

export async function saveRecipe(
  hh: string,
  input: Omit<Recipe, "id" | "createdAt" | "updatedAt" | "archivedAt"> & {
    id?: string;
    archivedAt?: number | null;
  }
) {
  const now = Date.now();
  const id = input.id ?? newId();
  const existing = input.id ? await getRecipe(hh, input.id) : null;
  const r: Recipe = {
    id,
    name: input.name.trim(),
    servings: input.servings,
    category: input.category ?? null,
    eventId: input.eventId ?? null,
    caloriesPerServing: input.caloriesPerServing ?? null,
    proteinPerServing: input.proteinPerServing ?? null,
    imageUrl: input.imageUrl ?? null,
    ingredients: input.ingredients,
    instructions: input.instructions,
    tags: input.tags,
    cost: input.cost ?? null,
    difficulty: input.difficulty ?? null,
    archivedAt:
      input.archivedAt !== undefined
        ? input.archivedAt
        : existing?.archivedAt ?? null,
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

export async function archiveRecipe(hh: string, id: string) {
  const cur = await getRecipe(hh, id);
  if (!cur) return null;
  const next: Recipe = { ...cur, archivedAt: Date.now(), updatedAt: Date.now() };
  await redis.set(key.recipe(hh, id), next);
  return next;
}

export async function unarchiveRecipe(hh: string, id: string) {
  const cur = await getRecipe(hh, id);
  if (!cur) return null;
  const next: Recipe = { ...cur, archivedAt: null, updatedAt: Date.now() };
  await redis.set(key.recipe(hh, id), next);
  return next;
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

// ============ COOKED MEALS ============

export async function listCookedMeals(hh: string): Promise<CookedMeal[]> {
  const ids = await redis.smembers(key.meals(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<CookedMeal>(key.meal(hh, id)))
  );
  return items
    .filter((m): m is CookedMeal => !!m)
    .sort((a, b) => b.cookedAt - a.cookedAt);
}

export async function getCookedMeal(hh: string, id: string) {
  return redis.get<CookedMeal>(key.meal(hh, id));
}

export async function saveCookedMeal(hh: string, meal: CookedMeal) {
  await redis.set(key.meal(hh, meal.id), meal);
  await redis.sadd(key.meals(hh), meal.id);
  if (meal.recipeId) {
    await redis.sadd(key.recipeMeals(hh, meal.recipeId), meal.id);
  }
  return meal;
}

export async function deleteCookedMeal(hh: string, id: string) {
  const meal = await getCookedMeal(hh, id);
  await redis.del(key.meal(hh, id));
  await redis.srem(key.meals(hh), id);
  if (meal?.recipeId) {
    await redis.srem(key.recipeMeals(hh, meal.recipeId), id);
  }
}

export async function listCookedMealsForRecipe(
  hh: string,
  recipeId: string
): Promise<CookedMeal[]> {
  const ids = await redis.smembers(key.recipeMeals(hh, recipeId));
  if (!ids.length) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<CookedMeal>(key.meal(hh, id)))
  );
  return items
    .filter((m): m is CookedMeal => !!m)
    .sort((a, b) => b.cookedAt - a.cookedAt);
}

// ============ CATALOG ============

export async function listCatalog(hh: string): Promise<CatalogItem[]> {
  const ids = await redis.smembers(key.catalog(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<CatalogItem>(key.catalogItem(hh, id)))
  );
  return items
    .filter((c): c is CatalogItem => !!c)
    .sort((a, b) => a.name.localeCompare(b.name, "hu"));
}

export async function getCatalogItem(hh: string, id: string) {
  return redis.get<CatalogItem>(key.catalogItem(hh, id));
}

export async function getCatalogItemByBarcode(hh: string, barcode: string) {
  const id = await redis.get<string>(key.catalogBarcode(hh, barcode));
  if (!id) return null;
  return getCatalogItem(hh, id);
}

export async function saveCatalogItem(
  hh: string,
  input: Omit<CatalogItem, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<CatalogItem> {
  const now = Date.now();
  const id = input.id ?? newId();
  const existing = input.id ? await getCatalogItem(hh, input.id) : null;

  if (existing?.barcode && existing.barcode !== input.barcode) {
    await redis.del(key.catalogBarcode(hh, existing.barcode));
  }

  const item: CatalogItem = {
    id,
    name: input.name.trim(),
    category: input.category,
    defaultUnit: input.defaultUnit,
    defaultQty: input.defaultQty ?? null,
    barcode: input.barcode?.trim() || null,
    brand: input.brand?.trim() || null,
    kcal100: input.kcal100 ?? null,
    protein100: input.protein100 ?? null,
    fat100: input.fat100 ?? null,
    carbs100: input.carbs100 ?? null,
    imageUrl: input.imageUrl ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await redis.set(key.catalogItem(hh, id), item);
  await redis.sadd(key.catalog(hh), id);
  if (item.barcode) {
    await redis.set(key.catalogBarcode(hh, item.barcode), id);
  }
  return item;
}

export async function deleteCatalogItem(hh: string, id: string) {
  const item = await getCatalogItem(hh, id);
  await redis.del(key.catalogItem(hh, id));
  await redis.srem(key.catalog(hh), id);
  if (item?.barcode) {
    await redis.del(key.catalogBarcode(hh, item.barcode));
  }
}

// ============ EXPENSE CATEGORIES ============

export async function listExpenseCategories(
  hh: string
): Promise<ExpenseCategory[]> {
  const ids = await redis.smembers(key.expenseCategories(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<ExpenseCategory>(key.expenseCategory(hh, id)))
  );
  return items
    .filter((c): c is ExpenseCategory => !!c)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getExpenseCategory(hh: string, id: string) {
  return redis.get<ExpenseCategory>(key.expenseCategory(hh, id));
}

export async function createExpenseCategory(
  hh: string,
  input: Pick<ExpenseCategory, "name" | "color" | "icon">
): Promise<ExpenseCategory> {
  const cat: ExpenseCategory = {
    id: newId(),
    name: input.name.trim(),
    color: input.color,
    icon: input.icon,
    createdAt: Date.now(),
  };
  await redis.set(key.expenseCategory(hh, cat.id), cat);
  await redis.sadd(key.expenseCategories(hh), cat.id);
  return cat;
}

export async function updateExpenseCategory(
  hh: string,
  id: string,
  patch: Partial<Pick<ExpenseCategory, "name" | "color" | "icon">>
) {
  const cur = await getExpenseCategory(hh, id);
  if (!cur) return null;
  const next = { ...cur, ...patch };
  await redis.set(key.expenseCategory(hh, id), next);
  return next;
}

export async function deleteExpenseCategory(hh: string, id: string) {
  await redis.del(key.expenseCategory(hh, id));
  await redis.srem(key.expenseCategories(hh), id);
}

export async function ensureDefaultExpenseCategories(
  hh: string
): Promise<ExpenseCategory[]> {
  const existing = await listExpenseCategories(hh);
  if (existing.length > 0) return existing;
  for (const c of DEFAULT_EXPENSE_CATEGORIES) {
    await createExpenseCategory(hh, c);
  }
  return listExpenseCategories(hh);
}

// ============ MERCHANT → CATEGORY MEMORY ============

export async function getMerchantMap(
  hh: string
): Promise<Record<string, string>> {
  const map = await redis.hgetall<Record<string, string>>(
    key.expenseMerchants(hh)
  );
  return map ?? {};
}

export async function rememberMerchantCategory(
  hh: string,
  merchant: string,
  categoryId: string
) {
  const s = slug(merchant);
  if (!s) return;
  await redis.hset(key.expenseMerchants(hh), { [s]: categoryId });
}

// ============ EXPENSES ============

export async function listExpenses(hh: string): Promise<Expense[]> {
  const ids = await redis.smembers(key.expenses(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<Expense>(key.expense(hh, id)))
  );
  return items
    .filter((e): e is Expense => !!e)
    .sort((a, b) => b.spentAt - a.spentAt || b.createdAt - a.createdAt);
}

export async function getExpense(hh: string, id: string) {
  return redis.get<Expense>(key.expense(hh, id));
}

export async function saveExpense(
  hh: string,
  input: Omit<Expense, "id" | "createdAt"> & { id?: string }
): Promise<Expense> {
  const id = input.id ?? newId();
  const existing = input.id ? await getExpense(hh, input.id) : null;
  const e: Expense = {
    id,
    amount: input.amount,
    merchant: input.merchant.trim(),
    categoryId: input.categoryId,
    note: input.note.trim(),
    spentAt: input.spentAt,
    createdAt: existing?.createdAt ?? Date.now(),
  };
  await redis.set(key.expense(hh, id), e);
  await redis.sadd(key.expenses(hh), id);
  // Tanulás: jegyezzük meg a bolt → kategória párosítást.
  if (e.merchant && e.categoryId) {
    await rememberMerchantCategory(hh, e.merchant, e.categoryId);
  }
  return e;
}

export async function deleteExpense(hh: string, id: string) {
  await redis.del(key.expense(hh, id));
  await redis.srem(key.expenses(hh), id);
}

// ============ SAVED ITEMS (Bakancslista) ============

export async function listSavedItems(hh: string): Promise<SavedItem[]> {
  const ids = await redis.smembers(key.savedItems(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<SavedItem>(key.savedItem(hh, id)))
  );
  return items
    .filter((s): s is SavedItem => !!s)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getSavedItem(hh: string, id: string) {
  return redis.get<SavedItem>(key.savedItem(hh, id));
}

export async function saveSavedItem(hh: string, item: SavedItem) {
  await redis.set(key.savedItem(hh, item.id), item);
  await redis.sadd(key.savedItems(hh), item.id);
  return item;
}

export async function deleteSavedItem(hh: string, id: string) {
  const item = await getSavedItem(hh, id);
  if (item) {
    await Promise.all(
      item.files.map((f) => redis.del(key.savedFile(hh, id, f.id)))
    );
  }
  await redis.del(key.savedItem(hh, id));
  await redis.srem(key.savedItems(hh), id);
}

// Bakancslista fájl-blobok (PDF / hang / kép) külön kulcson, hogy a lista könnyű maradjon.
export async function getSavedFile(hh: string, itemId: string, fileId: string) {
  return redis.get<string>(key.savedFile(hh, itemId, fileId));
}

export async function setSavedFile(
  hh: string,
  itemId: string,
  fileId: string,
  dataUrl: string
) {
  await redis.set(key.savedFile(hh, itemId, fileId), dataUrl);
}

export async function deleteSavedFile(
  hh: string,
  itemId: string,
  fileId: string
) {
  await redis.del(key.savedFile(hh, itemId, fileId));
}
