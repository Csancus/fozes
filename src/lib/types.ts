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

export type RecipeCost = "cheap" | "average" | "expensive";
export type RecipeDifficulty = "easy" | "medium" | "hard";

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
  cost?: RecipeCost | null;
  difficulty?: RecipeDifficulty | null;
  archivedAt: number | null;
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

// ============ KÖLTSÉGEK (Expenses) ============

export type ExpenseCategory = {
  id: string;
  name: string;
  color: string; // token: emerald|orange|sky|indigo|rose|violet|pink|cyan|amber|zinc
  icon: string;  // icon key mapped in the UI
  createdAt: number;
};

export const DEFAULT_EXPENSE_CATEGORIES: Omit<
  ExpenseCategory,
  "id" | "createdAt"
>[] = [
  { name: "Élelmiszer", color: "emerald", icon: "basket" },
  { name: "Étterem / Kávé", color: "orange", icon: "utensils" },
  { name: "Közlekedés", color: "sky", icon: "car" },
  { name: "Lakhatás / Rezsi", color: "indigo", icon: "home" },
  { name: "Egészség", color: "rose", icon: "heart" },
  { name: "Szórakozás", color: "violet", icon: "ticket" },
  { name: "Ruházat", color: "pink", icon: "shirt" },
  { name: "Előfizetés", color: "cyan", icon: "repeat" },
  { name: "Egyéb", color: "zinc", icon: "tag" },
];

export type PaymentKind = "card" | "transfer" | "cash";

export const PAYMENT_KIND_LABEL: Record<PaymentKind, string> = {
  card: "Bankkártya",
  transfer: "Utalás",
  cash: "Készpénz",
};

export type PaymentMethod = {
  id: string;
  name: string;
  kind: PaymentKind;
  color: string;          // szín token (expense-visuals)
  last4: string | null;   // kártya utolsó 4 számjegye (opcionális)
  createdAt: number;
};

export const DEFAULT_PAYMENT_METHODS: Omit<
  PaymentMethod,
  "id" | "createdAt"
>[] = [
  { name: "Utalás", kind: "transfer", color: "sky", last4: null },
  { name: "Készpénz", kind: "cash", color: "emerald", last4: null },
];

// Ki költötte (pl. Anikó, Csanád)
export type Person = {
  id: string;
  name: string;
  color: string; // szín token (expense-visuals)
  createdAt: number;
};

// Projekt / cél, amihez költségeket rendelünk (pl. Autóvásárlás, Olaszország-út)
export type Project = {
  id: string;
  name: string;
  color: string; // szín token (expense-visuals)
  createdAt: number;
};

export type Expense = {
  id: string;
  amount: number;                 // Ft
  merchant: string;               // "Lidl", payee / store
  categoryId: string | null;      // ExpenseCategory.id
  paymentMethodId: string | null; // PaymentMethod.id
  personId: string | null;        // Person.id — ki költötte
  projectId: string | null;       // Project.id — melyik projekthez
  note: string;
  spentAt: number;                // ms since epoch (day granularity)
  createdAt: number;
};

// ============ BAKANCSLISTA (Saved items) ============

export type SavedKind =
  | "etterem"
  | "utazas"
  | "helyszin"
  | "konyv"
  | "cikk"
  | "video"
  | "film"
  | "egyeb";

export const SAVED_KINDS: SavedKind[] = [
  "etterem",
  "utazas",
  "helyszin",
  "konyv",
  "cikk",
  "video",
  "film",
  "egyeb",
];

export const SAVED_KIND_LABEL: Record<SavedKind, string> = {
  etterem: "Étterem",
  utazas: "Utazás",
  helyszin: "Helyszín",
  konyv: "Könyv",
  cikk: "Cikk",
  video: "Videó",
  film: "Film / sorozat",
  egyeb: "Egyéb",
};

export type SavedLink = { url: string; label: string };
export type SavedFileMeta = {
  id: string;
  name: string;
  mime: string;
  size: number; // bytes (approx, of the base64-decoded payload)
};

export type SavedItem = {
  id: string;
  title: string;
  kind: SavedKind;
  note: string;
  location: string;         // place / address / "hol" text
  imageUrl: string | null;  // small inline cover (client-compressed)
  links: SavedLink[];       // video / maps / article / any URL
  files: SavedFileMeta[];   // PDF / audio / any — blobs stored in separate keys
  tags: string[];
  done: boolean;            // visited / read / watched
  doneAt: number | null;
  createdAt: number;
  updatedAt: number;
};
