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
