import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    const r = getRedis() as unknown as Record<string | symbol, unknown>;
    const val = r[prop];
    return typeof val === "function" ? val.bind(getRedis()) : val;
  },
});

export const key = {
  userByEmail: (email: string) => `user:email:${email.toLowerCase()}`,
  user: (id: string) => `user:${id}`,
  household: (id: string) => `household:${id}`,
  householdMembers: (id: string) => `household:${id}:members`,

  locations: (hh: string) => `hh:${hh}:locations`,
  location: (hh: string, id: string) => `hh:${hh}:location:${id}`,

  recipes: (hh: string) => `hh:${hh}:recipes`,
  recipe: (hh: string, id: string) => `hh:${hh}:recipe:${id}`,

  pantry: (hh: string) => `hh:${hh}:pantry`,
  pantryItem: (hh: string, id: string) => `hh:${hh}:pantry:${id}`,

  shoppingLists: (hh: string) => `hh:${hh}:shoplists`,
  shoppingList: (hh: string, id: string) => `hh:${hh}:shoplist:${id}`,

  purchases: (hh: string) => `hh:${hh}:purchases`,
  purchase: (hh: string, id: string) => `hh:${hh}:purchase:${id}`,

  events: (hh: string) => `hh:${hh}:events`,
  event: (hh: string, id: string) => `hh:${hh}:event:${id}`,

  catalog: (hh: string) => `hh:${hh}:catalog`,
  catalogItem: (hh: string, id: string) => `hh:${hh}:catalog:${id}`,
  catalogBarcode: (hh: string, barcode: string) =>
    `hh:${hh}:catalog-barcode:${barcode}`,

  priceHistory: (hh: string, itemNameSlug: string) =>
    `hh:${hh}:price:${itemNameSlug}`,

  meals: (hh: string) => `hh:${hh}:meals`,
  meal: (hh: string, id: string) => `hh:${hh}:meal:${id}`,
  recipeMeals: (hh: string, recipeId: string) =>
    `hh:${hh}:recipe:${recipeId}:meals`,

  // Költségek
  expenses: (hh: string) => `hh:${hh}:expenses`,
  expense: (hh: string, id: string) => `hh:${hh}:expense:${id}`,
  expenseCategories: (hh: string) => `hh:${hh}:exp-cats`,
  expenseCategory: (hh: string, id: string) => `hh:${hh}:exp-cat:${id}`,
  incomeCategories: (hh: string) => `hh:${hh}:inc-cats`,
  incomeCategory: (hh: string, id: string) => `hh:${hh}:inc-cat:${id}`,
  expenseMerchants: (hh: string) => `hh:${hh}:exp-merchants`, // (régi) hash: slug -> categoryId
  merchants: (hh: string) => `hh:${hh}:merchants`,
  merchant: (hh: string, id: string) => `hh:${hh}:merchant:${id}`,
  recurrings: (hh: string) => `hh:${hh}:recurrings`,
  recurring: (hh: string, id: string) => `hh:${hh}:recurring:${id}`,
  paymentMethods: (hh: string) => `hh:${hh}:pay-methods`,
  paymentMethod: (hh: string, id: string) => `hh:${hh}:pay-method:${id}`,
  persons: (hh: string) => `hh:${hh}:persons`,
  person: (hh: string, id: string) => `hh:${hh}:person:${id}`,
  projects: (hh: string) => `hh:${hh}:projects`,
  project: (hh: string, id: string) => `hh:${hh}:project:${id}`,
  groups: (hh: string) => `hh:${hh}:groups`,
  group: (hh: string, id: string) => `hh:${hh}:group:${id}`,

  // Bakancslista
  savedItems: (hh: string) => `hh:${hh}:saved`,
  savedItem: (hh: string, id: string) => `hh:${hh}:saved:${id}`,
  savedFile: (hh: string, itemId: string, fileId: string) =>
    `hh:${hh}:saved:${itemId}:file:${fileId}`,
  surprisePassword: (hh: string) => `hh:${hh}:surprise-pw`,

  // Utazások
  trips: (hh: string) => `hh:${hh}:trips`,
  trip: (hh: string, id: string) => `hh:${hh}:trip:${id}`,

  savedTypes: (hh: string) => `hh:${hh}:saved-types`,
  savedType: (hh: string, id: string) => `hh:${hh}:saved-type:${id}`,
};

export function newId(): string {
  return crypto.randomUUID();
}

export function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
