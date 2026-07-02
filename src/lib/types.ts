export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  householdId: string;
  createdAt: number;
};

export type Household = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
};

export type LocationKind = "fridge" | "freezer" | "pantry" | "custom";

export type Location = {
  id: string;
  name: string;
  kind: LocationKind;
  createdAt: number;
};

export type Unit =
  | "db"
  | "g"
  | "dkg"
  | "kg"
  | "ml"
  | "dl"
  | "l"
  | "csomag"
  | "csipet"
  | "ek"
  | "kk";

export type Ingredient = {
  name: string;
  qty: number;
  unit: Unit;
};

export type RecipeCategory = "leves" | "foetel" | "sutemeny";

export const RECIPE_CATEGORIES: RecipeCategory[] = [
  "leves",
  "foetel",
  "sutemeny",
];

export const RECIPE_CATEGORY_LABEL: Record<RecipeCategory, string> = {
  leves: "Leves",
  foetel: "Főétel",
  sutemeny: "Sütemény",
};

export type Event = {
  id: string;
  name: string;
  archived: boolean;
  createdAt: number;
};

export type Recipe = {
  id: string;
  name: string;
  servings: number;
  category?: RecipeCategory | null;
  eventId?: string | null;
  caloriesPerServing?: number | null;
  proteinPerServing?: number | null;
  imageUrl?: string | null;
  ingredients: Ingredient[];
  instructions: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
};

export type PantryItem = {
  id: string;
  name: string;
  qty: number;
  unit: Unit;
  locationId: string;
  expiresAt: number | null;
  boughtAt: number;
  price: number | null;
  note: string;
};

export type ShoppingListItem = {
  name: string;
  qty: number;
  unit: Unit;
  have: number;
  need: number;
  checked: boolean;
};

export type ShoppingList = {
  id: string;
  name: string;
  recipeIds: string[];
  items: ShoppingListItem[];
  createdAt: number;
  completedAt: number | null;
};

export type PurchaseLine = {
  name: string;
  qty: number;
  unit: Unit;
  unitPrice: number;
  total: number;
  addToPantry: boolean;
  locationId: string | null;
  expiresAt: number | null;
};

export type Purchase = {
  id: string;
  store: string;
  purchasedAt: number;
  total: number;
  source: "text" | "pdf" | "photo" | "manual";
  raw: string;
  lines: PurchaseLine[];
  createdAt: number;
};

export type CatalogCategory =
  | "zoldseg"
  | "gyumolcs"
  | "hus"
  | "hal"
  | "tejtermek"
  | "tojas"
  | "pekaru"
  | "teszta"
  | "huvelyes"
  | "gabona"
  | "olaj"
  | "fuszer"
  | "konzerv"
  | "melyhutott"
  | "ital"
  | "edesseg"
  | "kave_tea"
  | "egyeb";

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  "zoldseg",
  "gyumolcs",
  "hus",
  "hal",
  "tejtermek",
  "tojas",
  "pekaru",
  "teszta",
  "huvelyes",
  "gabona",
  "olaj",
  "fuszer",
  "konzerv",
  "melyhutott",
  "ital",
  "edesseg",
  "kave_tea",
  "egyeb",
];

export const CATALOG_CATEGORY_LABEL: Record<CatalogCategory, string> = {
  zoldseg: "Zöldség",
  gyumolcs: "Gyümölcs",
  hus: "Hús",
  hal: "Hal",
  tejtermek: "Tejtermék",
  tojas: "Tojás",
  pekaru: "Pékáru",
  teszta: "Tésztaféle",
  huvelyes: "Hüvelyes",
  gabona: "Gabona / Liszt",
  olaj: "Olaj / Zsír",
  fuszer: "Fűszer",
  konzerv: "Konzerv",
  melyhutott: "Mélyhűtött",
  ital: "Ital",
  edesseg: "Édesség",
  kave_tea: "Kávé / Tea",
  egyeb: "Egyéb",
};

export type CatalogItem = {
  id: string;
  name: string;
  category: CatalogCategory;
  defaultUnit: Unit;
  defaultQty?: number | null;
  barcode?: string | null;
  brand?: string | null;
  kcal100?: number | null;
  protein100?: number | null;
  fat100?: number | null;
  carbs100?: number | null;
  imageUrl?: string | null;
  createdAt: number;
  updatedAt: number;
};

export type CookedMeal = {
  id: string;
  recipeId: string | null;
  recipeName: string;
  photo: string | null;          // base64 data URL (client-compressed)
  cookedAt: number;              // ms since epoch
  rating: number;                // 1..5
  notes: string;
  ingredientCost: number | null; // Ft, or null if unknown
  createdAt: number;
};
