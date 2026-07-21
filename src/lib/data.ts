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
  PaymentMethod,
  Person,
  Project,
  ExpenseGroup,
  Merchant,
  RecurringExpense,
  IncomeCategory,
  ExpenseKind,
  ExpenseNature,
  SavedItem,
  SavedType,
  Trip,
  TripDay,
  User,
} from "./types";
import bcrypt from "bcryptjs";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_SAVED_TYPES,
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

// ============ INCOME CATEGORIES (bevétel-kategóriák) ============

export async function listIncomeCategories(
  hh: string
): Promise<IncomeCategory[]> {
  const ids = await redis.smembers(key.incomeCategories(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<IncomeCategory>(key.incomeCategory(hh, id)))
  );
  return items
    .filter((c): c is IncomeCategory => !!c)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getIncomeCategory(hh: string, id: string) {
  return redis.get<IncomeCategory>(key.incomeCategory(hh, id));
}

export async function createIncomeCategory(
  hh: string,
  input: Pick<IncomeCategory, "name" | "color" | "icon">
): Promise<IncomeCategory> {
  const cat: IncomeCategory = {
    id: newId(),
    name: input.name.trim(),
    color: input.color,
    icon: input.icon,
    createdAt: Date.now(),
  };
  await redis.set(key.incomeCategory(hh, cat.id), cat);
  await redis.sadd(key.incomeCategories(hh), cat.id);
  return cat;
}

export async function updateIncomeCategory(
  hh: string,
  id: string,
  patch: Partial<Pick<IncomeCategory, "name" | "color" | "icon">>
) {
  const cur = await getIncomeCategory(hh, id);
  if (!cur) return null;
  const next = { ...cur, ...patch };
  await redis.set(key.incomeCategory(hh, id), next);
  return next;
}

export async function deleteIncomeCategory(hh: string, id: string) {
  await redis.del(key.incomeCategory(hh, id));
  await redis.srem(key.incomeCategories(hh), id);
}

export async function ensureDefaultIncomeCategories(
  hh: string
): Promise<IncomeCategory[]> {
  const existing = await listIncomeCategories(hh);
  if (existing.length > 0) return existing;
  for (const c of DEFAULT_INCOME_CATEGORIES) {
    await createIncomeCategory(hh, c);
  }
  return listIncomeCategories(hh);
}

// ============ MERCHANT → CATEGORY MEMORY ============

// ============ MERCHANTS (boltok / kinek) ============

export async function listMerchants(hh: string): Promise<Merchant[]> {
  const ids = await redis.smembers(key.merchants(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<Merchant>(key.merchant(hh, id)))
  );
  return items
    .filter((m): m is Merchant => !!m)
    .sort((a, b) => a.name.localeCompare(b.name, "hu"));
}

export async function getMerchant(hh: string, id: string) {
  return redis.get<Merchant>(key.merchant(hh, id));
}

export async function createMerchant(
  hh: string,
  input: { name: string; categoryId: string | null }
): Promise<Merchant> {
  const m: Merchant = {
    id: newId(),
    name: input.name.trim(),
    categoryId: input.categoryId,
    createdAt: Date.now(),
  };
  await redis.set(key.merchant(hh, m.id), m);
  await redis.sadd(key.merchants(hh), m.id);
  return m;
}

export async function updateMerchant(
  hh: string,
  id: string,
  patch: Partial<Pick<Merchant, "name" | "categoryId">>
) {
  const cur = await getMerchant(hh, id);
  if (!cur) return null;
  const next: Merchant = {
    ...cur,
    ...patch,
    name: (patch.name ?? cur.name).trim(),
  };
  await redis.set(key.merchant(hh, id), next);
  return next;
}

export async function deleteMerchant(hh: string, id: string) {
  await redis.del(key.merchant(hh, id));
  await redis.srem(key.merchants(hh), id);
}

// Kiadás mentésekor: ha a bolt még nincs a listában, felvesszük; ha még nincs
// alap-kategóriája és most kaptunk egyet, beállítjuk (első hozzárendelés nyer).
export async function ensureMerchant(
  hh: string,
  name: string,
  categoryId: string | null
): Promise<void> {
  const s = slug(name);
  if (!s) return;
  const list = await listMerchants(hh);
  const found = list.find((m) => slug(m.name) === s);
  if (found) {
    if (!found.categoryId && categoryId) {
      await updateMerchant(hh, found.id, { categoryId });
    }
    return;
  }
  await createMerchant(hh, { name: name.trim(), categoryId });
}

// Egyszeri feltöltés a korábbi kiadásokból + a régi slug→kategória hash-ből.
// Idempotens: ha már van merchant-lista, nem csinál semmit (onnantól a saveExpense tartja karban).
export async function ensureMerchantsFromHistory(hh: string): Promise<void> {
  const existing = await redis.smembers(key.merchants(hh));
  if (existing.length > 0) return;
  const [expenses, oldMap] = await Promise.all([
    listExpenses(hh),
    redis.hgetall<Record<string, string>>(key.expenseMerchants(hh)),
  ]);
  const map = oldMap ?? {};
  const seen = new Map<string, { name: string; categoryId: string | null }>();
  for (const e of expenses) {
    const s = slug(e.merchant);
    if (!s || seen.has(s)) continue; // listExpenses csökkenő spentAt → legfrissebb név nyer
    seen.set(s, {
      name: e.merchant.trim(),
      categoryId: map[s] ?? e.categoryId ?? null,
    });
  }
  for (const v of seen.values()) {
    await createMerchant(hh, { name: v.name, categoryId: v.categoryId });
  }
}

// A form/táblázat auto-kitöltéséhez: slug(bolt) → categoryId, a szerkeszthető listából.
export async function getMerchantMap(
  hh: string
): Promise<Record<string, string>> {
  const list = await listMerchants(hh);
  const map: Record<string, string> = {};
  for (const m of list) {
    if (m.categoryId) map[slug(m.name)] = m.categoryId;
  }
  return map;
}

// ============ PAYMENT METHODS ============

export async function listPaymentMethods(
  hh: string
): Promise<PaymentMethod[]> {
  const ids = await redis.smembers(key.paymentMethods(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<PaymentMethod>(key.paymentMethod(hh, id)))
  );
  return items
    .filter((p): p is PaymentMethod => !!p)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getPaymentMethod(hh: string, id: string) {
  return redis.get<PaymentMethod>(key.paymentMethod(hh, id));
}

export async function createPaymentMethod(
  hh: string,
  input: Pick<PaymentMethod, "name" | "kind" | "color" | "last4">
): Promise<PaymentMethod> {
  const pm: PaymentMethod = {
    id: newId(),
    name: input.name.trim(),
    kind: input.kind,
    color: input.color,
    last4: input.last4?.trim() || null,
    createdAt: Date.now(),
  };
  await redis.set(key.paymentMethod(hh, pm.id), pm);
  await redis.sadd(key.paymentMethods(hh), pm.id);
  return pm;
}

export async function updatePaymentMethod(
  hh: string,
  id: string,
  patch: Partial<Pick<PaymentMethod, "name" | "kind" | "color" | "last4">>
) {
  const cur = await getPaymentMethod(hh, id);
  if (!cur) return null;
  const next = { ...cur, ...patch };
  await redis.set(key.paymentMethod(hh, id), next);
  return next;
}

export async function deletePaymentMethod(hh: string, id: string) {
  await redis.del(key.paymentMethod(hh, id));
  await redis.srem(key.paymentMethods(hh), id);
}

export async function ensureDefaultPaymentMethods(
  hh: string
): Promise<PaymentMethod[]> {
  const existing = await listPaymentMethods(hh);
  if (existing.length > 0) return existing;
  for (const p of DEFAULT_PAYMENT_METHODS) {
    await createPaymentMethod(hh, p);
  }
  return listPaymentMethods(hh);
}

// ============ PERSONS (ki költötte) ============

export async function listPersons(hh: string): Promise<Person[]> {
  const ids = await redis.smembers(key.persons(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<Person>(key.person(hh, id)))
  );
  return items
    .filter((p): p is Person => !!p)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getPerson(hh: string, id: string) {
  return redis.get<Person>(key.person(hh, id));
}

export async function createPerson(
  hh: string,
  input: Pick<Person, "name" | "color">
): Promise<Person> {
  const p: Person = {
    id: newId(),
    name: input.name.trim(),
    color: input.color,
    createdAt: Date.now(),
  };
  await redis.set(key.person(hh, p.id), p);
  await redis.sadd(key.persons(hh), p.id);
  return p;
}

export async function updatePerson(
  hh: string,
  id: string,
  patch: Partial<Pick<Person, "name" | "color">>
) {
  const cur = await getPerson(hh, id);
  if (!cur) return null;
  const next = { ...cur, ...patch };
  await redis.set(key.person(hh, id), next);
  return next;
}

export async function deletePerson(hh: string, id: string) {
  await redis.del(key.person(hh, id));
  await redis.srem(key.persons(hh), id);
}

// ============ PROJECTS (kiadás-projektek) ============

export async function listProjects(hh: string): Promise<Project[]> {
  const ids = await redis.smembers(key.projects(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<Project>(key.project(hh, id)))
  );
  return items
    .filter((p): p is Project => !!p)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getProject(hh: string, id: string) {
  return redis.get<Project>(key.project(hh, id));
}

export async function createProject(
  hh: string,
  input: Pick<Project, "name" | "color">
): Promise<Project> {
  const p: Project = {
    id: newId(),
    name: input.name.trim(),
    color: input.color,
    createdAt: Date.now(),
  };
  await redis.set(key.project(hh, p.id), p);
  await redis.sadd(key.projects(hh), p.id);
  return p;
}

export async function updateProject(
  hh: string,
  id: string,
  patch: Partial<Pick<Project, "name" | "color">>
) {
  const cur = await getProject(hh, id);
  if (!cur) return null;
  const next = { ...cur, ...patch };
  await redis.set(key.project(hh, id), next);
  return next;
}

export async function deleteProject(hh: string, id: string) {
  await redis.del(key.project(hh, id));
  await redis.srem(key.projects(hh), id);
}

// ============ CSOPORTOK (kiadás + bevétel együtt) ============

export async function listGroups(hh: string): Promise<ExpenseGroup[]> {
  const ids = await redis.smembers(key.groups(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<ExpenseGroup>(key.group(hh, id)))
  );
  return items
    .filter((g): g is ExpenseGroup => !!g)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getGroup(hh: string, id: string) {
  return redis.get<ExpenseGroup>(key.group(hh, id));
}

export async function createGroup(
  hh: string,
  input: Pick<ExpenseGroup, "name" | "color">
): Promise<ExpenseGroup> {
  const g: ExpenseGroup = {
    id: newId(),
    name: input.name.trim(),
    color: input.color,
    createdAt: Date.now(),
  };
  await redis.set(key.group(hh, g.id), g);
  await redis.sadd(key.groups(hh), g.id);
  return g;
}

export async function updateGroup(
  hh: string,
  id: string,
  patch: Partial<Pick<ExpenseGroup, "name" | "color">>
) {
  const cur = await getGroup(hh, id);
  if (!cur) return null;
  const next = { ...cur, ...patch };
  await redis.set(key.group(hh, id), next);
  return next;
}

export async function deleteGroup(hh: string, id: string) {
  await redis.del(key.group(hh, id));
  await redis.srem(key.groups(hh), id);
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
    .map((e) => ({
      ...e,
      // Régi rekordokban nincs kind/nature/review/groupId → alapértelmezés.
      kind: e.kind ?? "expense",
      nature: e.nature ?? "avg",
      review: e.review ?? false,
      groupId: e.groupId ?? null,
    }))
    .sort((a, b) => b.spentAt - a.spentAt || b.createdAt - a.createdAt);
}

export async function getExpense(hh: string, id: string) {
  const e = await redis.get<Expense>(key.expense(hh, id));
  if (!e) return null;
  return {
    ...e,
    kind: e.kind ?? "expense",
    nature: e.nature ?? "avg",
    review: e.review ?? false,
    groupId: e.groupId ?? null,
  };
}

export async function saveExpense(
  hh: string,
  input: Omit<
    Expense,
    "id" | "createdAt" | "kind" | "nature" | "review" | "groupId"
  > & {
    id?: string;
    kind?: ExpenseKind;
    nature?: ExpenseNature;
    review?: boolean;
    groupId?: string | null;
  }
): Promise<Expense> {
  const id = input.id ?? newId();
  const existing = input.id ? await getExpense(hh, input.id) : null;
  const kind: ExpenseKind = input.kind ?? existing?.kind ?? "expense";
  const e: Expense = {
    id,
    kind,
    amount: input.amount,
    merchant: input.merchant.trim(),
    categoryId: input.categoryId,
    paymentMethodId: input.paymentMethodId ?? null,
    personId: input.personId ?? null,
    projectId: input.projectId ?? null,
    groupId: input.groupId ?? existing?.groupId ?? null,
    nature: input.nature ?? existing?.nature ?? "avg",
    review: input.review ?? existing?.review ?? false,
    note: input.note.trim(),
    spentAt: input.spentAt,
    createdAt: existing?.createdAt ?? Date.now(),
  };
  await redis.set(key.expense(hh, id), e);
  await redis.sadd(key.expenses(hh), id);
  // Csak kiadásnál tanulunk boltot/kategóriát (a bevétel forrása ne kerüljön a bolt-listába).
  if (e.kind === "expense" && e.merchant) {
    await ensureMerchant(hh, e.merchant, e.categoryId);
  }
  return e;
}

export async function deleteExpense(hh: string, id: string) {
  await redis.del(key.expense(hh, id));
  await redis.srem(key.expenses(hh), id);
}

// Gyors felülvizsgálat-jelölés váltása (Teendők oldalról).
export async function setExpenseReview(hh: string, id: string, review: boolean) {
  const e = await getExpense(hh, id);
  if (!e) return null;
  const next: Expense = { ...e, review };
  await redis.set(key.expense(hh, id), next);
  return next;
}

// ============ ISMÉTLŐDŐ KÖLTSÉGEK (recurring) ============

export async function listRecurrings(hh: string): Promise<RecurringExpense[]> {
  const ids = await redis.smembers(key.recurrings(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<RecurringExpense>(key.recurring(hh, id)))
  );
  return items
    .filter((r): r is RecurringExpense => !!r)
    .map((r) => ({
      ...r,
      kind: r.kind ?? "expense",
      nature: r.nature ?? "avg",
      groupId: r.groupId ?? null,
    }))
    .sort((a, b) => a.dayOfMonth - b.dayOfMonth || a.createdAt - b.createdAt);
}

export async function getRecurring(hh: string, id: string) {
  const r = await redis.get<RecurringExpense>(key.recurring(hh, id));
  if (!r) return null;
  return { ...r, kind: r.kind ?? "expense", nature: r.nature ?? "avg", groupId: r.groupId ?? null };
}

export async function createRecurring(
  hh: string,
  input: Omit<
    RecurringExpense,
    "id" | "createdAt" | "kind" | "nature" | "groupId"
  > & {
    kind?: ExpenseKind;
    nature?: ExpenseNature;
    groupId?: string | null;
  }
): Promise<RecurringExpense> {
  const kind: ExpenseKind = input.kind ?? "expense";
  const r: RecurringExpense = {
    id: newId(),
    kind,
    amount: input.amount,
    merchant: input.merchant.trim(),
    categoryId: input.categoryId,
    paymentMethodId: input.paymentMethodId ?? null,
    personId: input.personId ?? null,
    projectId: input.projectId ?? null,
    groupId: input.groupId ?? null,
    nature: input.nature ?? "avg",
    note: input.note.trim(),
    dayOfMonth: Math.min(31, Math.max(1, Math.round(input.dayOfMonth) || 1)),
    active: input.active,
    lastRunPeriod: input.lastRunPeriod,
    createdAt: Date.now(),
  };
  await redis.set(key.recurring(hh, r.id), r);
  await redis.sadd(key.recurrings(hh), r.id);
  if (kind === "expense" && r.merchant) {
    await ensureMerchant(hh, r.merchant, r.categoryId);
  }
  return r;
}

export async function updateRecurring(
  hh: string,
  id: string,
  patch: Partial<Omit<RecurringExpense, "id" | "createdAt">>
) {
  const cur = await getRecurring(hh, id);
  if (!cur) return null;
  const next: RecurringExpense = { ...cur, ...patch };
  if (patch.dayOfMonth !== undefined) {
    next.dayOfMonth = Math.min(31, Math.max(1, Math.round(patch.dayOfMonth) || 1));
  }
  if (patch.merchant !== undefined) next.merchant = patch.merchant.trim();
  await redis.set(key.recurring(hh, id), next);
  return next;
}

export async function deleteRecurring(hh: string, id: string) {
  await redis.del(key.recurring(hh, id));
  await redis.srem(key.recurrings(hh), id);
}

function periodStr(y: number, mIndex0: number): string {
  return `${y}-${String(mIndex0 + 1).padStart(2, "0")}`;
}

// Lejárt ismétlődő szabályokból legenerálja a hiányzó havi tételeket (a kihagyott
// hónapokat is bepótolja). Idempotens: lastRunPeriod jelzi, meddig futott.
export async function runDueRecurring(hh: string): Promise<number> {
  const rules = await listRecurrings(hh);
  if (rules.length === 0) return 0;
  const now = new Date();
  const nowMs = now.getTime();
  const curY = now.getFullYear();
  const curM = now.getMonth(); // 0-alapú
  let created = 0;

  for (const rule of rules) {
    if (!rule.active) continue;

    // Kezdő hónap: a lastRunPeriod utáni hónap, vagy a létrehozás hónapja.
    let y: number;
    let m: number;
    if (rule.lastRunPeriod) {
      const [ly, lm] = rule.lastRunPeriod.split("-").map(Number); // lm 1-alapú
      if (lm >= 12) {
        y = ly + 1;
        m = 0;
      } else {
        y = ly;
        m = lm; // 1-alapú lm → következő hónap 0-alapú indexe
      }
    } else {
      const c = new Date(rule.createdAt);
      y = c.getFullYear();
      m = c.getMonth();
    }

    let last = rule.lastRunPeriod;
    while (y < curY || (y === curY && m <= curM)) {
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const day = Math.min(rule.dayOfMonth, daysInMonth);
      const due = new Date(y, m, day, 12, 0, 0);
      if (due.getTime() > nowMs) break; // jövőbeli esedékesség → itt megállunk

      await saveExpense(hh, {
        kind: rule.kind ?? "expense",
        amount: rule.amount,
        merchant: rule.merchant,
        categoryId: rule.categoryId,
        paymentMethodId: rule.paymentMethodId,
        personId: rule.personId,
        projectId: rule.projectId,
        groupId: rule.groupId ?? null,
        nature: rule.nature ?? "avg",
        note: rule.note,
        spentAt: due.getTime(),
      });
      created++;
      last = periodStr(y, m);

      if (m >= 11) {
        m = 0;
        y += 1;
      } else {
        m += 1;
      }
    }

    if (last && last !== rule.lastRunPeriod) {
      await updateRecurring(hh, rule.id, { lastRunPeriod: last });
    }
  }

  return created;
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

// ---- Bakancslista-típusok (bővíthető, saját ikonnal/színnel) ----

export async function listSavedTypes(hh: string): Promise<SavedType[]> {
  const ids = await redis.smembers(key.savedTypes(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<SavedType>(key.savedType(hh, id)))
  );
  return items
    .filter((t): t is SavedType => !!t)
    .sort((a, b) => a.createdAt - b.createdAt);
}

// Beépített típusok seedelése (egyszeri, idempotens). A beépített id-k a régi
// SavedKind értékek, így a meglévő tételek illeszkednek.
export async function ensureDefaultSavedTypes(hh: string): Promise<SavedType[]> {
  const existing = await listSavedTypes(hh);
  if (existing.length > 0) return existing;
  const base = Date.now();
  await Promise.all(
    DEFAULT_SAVED_TYPES.map((t, i) => {
      const type: SavedType = { ...t, createdAt: base + i };
      return Promise.all([
        redis.set(key.savedType(hh, type.id), type),
        redis.sadd(key.savedTypes(hh), type.id),
      ]);
    })
  );
  return listSavedTypes(hh);
}

export async function createSavedType(
  hh: string,
  input: { name: string; icon: string; color: string }
): Promise<SavedType> {
  const type: SavedType = {
    id: newId(),
    name: input.name.trim() || "Új típus",
    icon: input.icon || "bookmark",
    color: input.color || "zinc",
    createdAt: Date.now(),
  };
  await redis.set(key.savedType(hh, type.id), type);
  await redis.sadd(key.savedTypes(hh), type.id);
  return type;
}

// ---- Meglepetés (rejtett tételek egy háztartás-tag elől) ----

export async function listHouseholdMembers(
  hh: string
): Promise<{ id: string; name: string }[]> {
  const ids = await redis.smembers(key.householdMembers(hh));
  if (ids.length === 0) return [];
  const users = await Promise.all(ids.map((id) => redis.get<User>(key.user(id))));
  return users
    .filter((u): u is User => !!u)
    .map((u) => ({ id: u.id, name: u.name }));
}

export async function hasSurprisePassword(hh: string): Promise<boolean> {
  return Boolean(await redis.get<string>(key.surprisePassword(hh)));
}

export async function setSurprisePassword(hh: string, plain: string) {
  const pw = plain.trim();
  if (!pw) {
    await redis.del(key.surprisePassword(hh));
    return;
  }
  await redis.set(key.surprisePassword(hh), await bcrypt.hash(pw, 10));
}

export async function verifySurprisePassword(
  hh: string,
  plain: string
): Promise<boolean> {
  const hash = await redis.get<string>(key.surprisePassword(hh));
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

// Több tétel egyszerre elrejtése/láthatóvá tétele egy tag elől (userId | null).
export async function setSurpriseForItems(
  hh: string,
  ids: string[],
  userId: string | null
) {
  const now = Date.now();
  for (const id of ids) {
    const item = await getSavedItem(hh, id);
    if (!item) continue;
    await redis.set(key.savedItem(hh, id), {
      ...item,
      surpriseFor: userId,
      updatedAt: now,
    });
  }
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

// ============ UTAZÁSOK (Trips) ============

export async function listTrips(hh: string): Promise<Trip[]> {
  const ids = await redis.smembers(key.trips(hh));
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map((id) => redis.get<Trip>(key.trip(hh, id)))
  );
  return items
    .filter((t): t is Trip => !!t)
    .sort((a, b) => b.year - a.year || b.createdAt - a.createdAt);
}

export async function getTrip(hh: string, id: string) {
  return redis.get<Trip>(key.trip(hh, id));
}

export async function saveTrip(
  hh: string,
  input: Omit<Trip, "id" | "createdAt" | "updatedAt" | "days"> & {
    id?: string;
    days?: TripDay[];
  }
): Promise<Trip> {
  const now = Date.now();
  const id = input.id ?? newId();
  const existing = input.id ? await getTrip(hh, input.id) : null;
  const trip: Trip = {
    id,
    name: input.name.trim() || "Utazás",
    year: input.year,
    destination: input.destination ?? "",
    startDate: input.startDate ?? "",
    endDate: input.endDate ?? "",
    note: input.note ?? "",
    imageUrl: input.imageUrl ?? null,
    days: input.days ?? existing?.days ?? [],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await redis.set(key.trip(hh, id), trip);
  await redis.sadd(key.trips(hh), id);
  return trip;
}

// Csak a nap-terv frissítése (a tervezőből).
export async function saveTripDays(hh: string, id: string, days: TripDay[]) {
  const trip = await getTrip(hh, id);
  if (!trip) return null;
  const next: Trip = { ...trip, days, updatedAt: Date.now() };
  await redis.set(key.trip(hh, id), next);
  return next;
}

export async function deleteTrip(hh: string, id: string) {
  await redis.del(key.trip(hh, id));
  await redis.srem(key.trips(hh), id);
}
