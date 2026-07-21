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

// Csoport: kiadás ÉS bevétel is bekerülhet, együtt nézve (kioltják-e egymást).
export type ExpenseGroup = {
  id: string;
  name: string;
  color: string; // szín token (expense-visuals)
  createdAt: number;
};

// Bolt / kinek (pl. Lidl, Shell, Spotify) — kezelt lista, megjegyzi az alap-kategóriát.
// A dropdown ebből épül, és Beállításokban szerkeszthető.
export type Merchant = {
  id: string;
  name: string;
  categoryId: string | null; // alapértelmezett kategória, amit kiválasztáskor auto-kitölt
  createdAt: number;
};

// Kiadás vagy bevétel — közös tétel-modell egy kapcsolóval.
export type ExpenseKind = "expense" | "income";
// Egy kiadás jellege: havi átlagos (rendszeres) vagy eseti projekt (nagy egyszeri).
export type ExpenseNature = "avg" | "project";

export const EXPENSE_NATURE_LABEL: Record<ExpenseNature, string> = {
  avg: "Havi átlagos",
  project: "Eseti projekt",
};

// Bevétel-kategória (pl. Fizetés, Bónusz) — külön a kiadás-kategóriáktól.
export type IncomeCategory = {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
};

export const DEFAULT_INCOME_CATEGORIES: Omit<
  IncomeCategory,
  "id" | "createdAt"
>[] = [
  { name: "Fizetés", color: "emerald", icon: "savings" },
  { name: "Bónusz / Prémium", color: "amber", icon: "gift" },
  { name: "Vállalkozás", color: "indigo", icon: "tool" },
  { name: "Ajándék", color: "pink", icon: "gift" },
  { name: "Kamat / Hozam", color: "cyan", icon: "savings" },
  { name: "Egyéb", color: "zinc", icon: "tag" },
];

// Ismétlődő (havi) tétel-szabály. A hónap megadott napján automatikusan
// létrejön belőle egy valódi Expense (megnyitáskori pótlással, cron nélkül).
export type RecurringExpense = {
  id: string;
  kind: ExpenseKind;
  amount: number;
  merchant: string;
  categoryId: string | null;
  paymentMethodId: string | null;
  personId: string | null;
  projectId: string | null;
  groupId: string | null;
  nature: ExpenseNature;
  note: string;
  dayOfMonth: number; // 1–31, generáláskor a hónap hosszához igazítva
  active: boolean;
  lastRunPeriod: string | null; // "yyyy-mm" — utoljára legenerált hónap
  createdAt: number;
};

export type Expense = {
  id: string;
  kind: ExpenseKind;              // kiadás vagy bevétel
  amount: number;                 // Ft (mindig pozitív, az irányt a kind adja)
  merchant: string;               // kiadásnál bolt/kinek, bevételnél forrás
  categoryId: string | null;      // ExpenseCategory.id (kiadás) v. IncomeCategory.id (bevétel)
  paymentMethodId: string | null; // PaymentMethod.id
  personId: string | null;        // Person.id — ki költötte / kinek jött
  projectId: string | null;       // Project.id — melyik projekthez
  groupId: string | null;         // ExpenseGroup.id — csoport (kiadás+bevétel együtt)
  nature: ExpenseNature;          // havi átlagos / eseti projekt (kiadásnál értelmezett)
  review: boolean;                // felülvizsgálat: ellenőrizni kell → Teendők
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

// Bakancslista-típus (kezelt, bővíthető lista). A beépített típusok id-je a régi
// SavedKind érték, így a meglévő tételek kind mezője változtatás nélkül illeszkedik.
export type SavedType = {
  id: string;
  name: string;
  icon: string;  // kulcs a saved-visuals SAVED_ICONS-ban
  color: string; // szín token (expense-visuals CAT_COLORS)
  createdAt: number;
};

export const DEFAULT_SAVED_TYPES: Omit<SavedType, "createdAt">[] = [
  { id: "etterem", name: "Étterem", icon: "utensils", color: "orange" },
  { id: "utazas", name: "Utazás", icon: "plane", color: "sky" },
  { id: "helyszin", name: "Helyszín", icon: "pin", color: "emerald" },
  { id: "konyv", name: "Könyv", icon: "book", color: "amber" },
  { id: "cikk", name: "Cikk", icon: "news", color: "violet" },
  { id: "video", name: "Videó", icon: "play", color: "rose" },
  { id: "film", name: "Film / sorozat", icon: "film", color: "indigo" },
  { id: "egyeb", name: "Egyéb", icon: "bookmark", color: "zinc" },
];

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
  kind: string; // SavedType id (beépített SavedKind vagy egyedi típus id-je)
  note: string;
  location: string;         // place / address / "hol" text
  imageUrl: string | null;  // small inline cover (client-compressed)
  links: SavedLink[];       // video / maps / article / any URL
  files: SavedFileMeta[];   // PDF / audio / any — blobs stored in separate keys
  tags: string[];
  done: boolean;            // visited / read / watched
  doneAt: number | null;
  surpriseFor: string | null; // userId who must NOT see it (grey "Meglepetés" + password)
  createdAt: number;
  updatedAt: number;
};

// ============ UTAZÁSOK (Trips) ============

// Egy sor a nap tervében (egy tevékenység / szakasz), a Google Sheets-minta oszlopai.
export type TripPlanItem = {
  id: string;
  start: string;         // indulás ideje, pl. "7:00"
  place: string;         // Város / Látnivaló
  type: string;          // Type: kocsi / Túra / Felvonó…
  travelTime: string;    // Travel time
  duration: string;      // Duration
  arrival: string;       // Arrival (érkezés)
  note: string;          // Note/Link szöveg
  link: string;          // opcionális URL (map/komoot/menetrend…)
  accommodation: string; // Szállás
  bikeDist: string;      // Biciki táv
  kayak: string;         // Kaják
  gear: string;          // Felszereltség
};

// Egy nap a tervben: fejléc (dátum + aggregált idők) + tételek.
export type TripDay = {
  id: string;
  date: string;        // dátum-címke, pl. "ápr. 30. Cs"
  title: string;       // nap címe, pl. "Budapest-Velika Planina"
  start: string;
  travelTime: string;
  duration: string;
  arrival: string;
  items: TripPlanItem[];
};

export type Trip = {
  id: string;
  name: string;         // pl. "Ausztria 2026"
  year: number;         // csoportosítás éve
  destination: string;  // úti cél (opcionális)
  startDate: string;    // kezdő dátum-címke (opcionális)
  endDate: string;      // záró dátum-címke (opcionális)
  note: string;
  imageUrl: string | null;
  days: TripDay[];
  createdAt: number;
  updatedAt: number;
};

// A tervező oszlopai (fejléc-címkék + mezőnevek) — a UI ebből épül.
export const TRIP_PLAN_COLUMNS: { key: keyof TripPlanItem; label: string }[] = [
  { key: "start", label: "Start" },
  { key: "place", label: "Város / Látnivaló" },
  { key: "type", label: "Típus" },
  { key: "travelTime", label: "Menetidő" },
  { key: "duration", label: "Időtartam" },
  { key: "arrival", label: "Érkezés" },
  { key: "note", label: "Megjegyzés" },
  { key: "link", label: "Link" },
  { key: "accommodation", label: "Szállás" },
  { key: "bikeDist", label: "Bicikli táv" },
  { key: "kayak", label: "Kaják" },
  { key: "gear", label: "Felszereltség" },
];
