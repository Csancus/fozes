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

  priceHistory: (hh: string, itemNameSlug: string) =>
    `hh:${hh}:price:${itemNameSlug}`,

  meals: (hh: string) => `hh:${hh}:meals`,
  meal: (hh: string, id: string) => `hh:${hh}:meal:${id}`,
  recipeMeals: (hh: string, recipeId: string) =>
    `hh:${hh}:recipe:${recipeId}:meals`,
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
