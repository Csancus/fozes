# Story 8.4: Mobilbarát átnézés – minden oldal telefonon

**Epic:** 8 (Megjelenés és UX) · **Méret:** M · **Kockázat:** LOW (csak UI: Tailwind-osztályok, layout, CSS)
**Állapot:** kész (2026-11-20)
**Forrás:** user, 2026-11-20 – „indíts egy háttér agentet aki minden screent átnéz mobilon és mobil baráttá teszi ha még nem az”

## Felhasználói történet

**Mint** telefonról használó családtag **szeretném**, ha minden oldal kényelmesen működne kis kijelzőn is, **azért, hogy**
ne kelljen nagyítani, oldalra görgetni vagy vadászni a gombokra.

## Háttér

Az app nagy része eleve mobilra készült (alsó menü, kártyák, `pb-20`), de a teljes átnézés (75 oldal × 3 méret)
néhány ismétlődő hibát talált:

- **Modálok rossz helyen.** Csempe stílusban minden kártya `backdrop-filter`-t kap, és ez a benne lévő `position: fixed`
  modált a kártyához köti. A Teendő-űrlapon az „Új projekt / Új lista” modál így a hosszú kártya közepére került –
  mobilon a képernyőn kívülre, a fejléc alá, a „Létrehozás” gomb nem volt elérhető.
- **Az alsó menü eltakarta a fix / sticky alsó sávokat**: a főzés-nézet „Kész, értékelem” gombja, az útiterv és a
  bakancslista kijelölés-sávja, valamint a gyors táblázatok „X tétel mentése” sávja a menü mögé csúszott.
- **iOS-zoom**: az űrlapmezők 15 px-esek (a `text-sm` mezők 14 px-esek) – iPhone-on a mezőre koppintva Safari ráközelít.
- **Túl kicsi érintési felületek** (< 40 px): feladat-pipa (24 px), board-áthelyező gombok, sor-törlés (28 px széles),
  csillagos értékelés, adag +/-, színpöttyök, mód-kapcsoló, info-gomb, szöveges akció-linkek („Csatolás”, „Alteendő”, „Új sor”).
- **Gombfeliratok tördelése**: 360 px-en a két oszlopos gombsorokban („Gyors táblázat”, „Minden teendő”) a felirat két
  sorba tört, és a 48 px-es gombban szellősen, balra zárva ült.

Vízszintes görgetés (`scrollWidth > innerWidth`) egyik oldalon sem volt; a széles táblázatok (gyors rögzítés,
tételek szerkesztése, útiterv) eleve vízszintesen görgethető konténerben vannak, ez szándékos és jó így.

## Elfogadási kritériumok

1. **AC1** — 360×640, 375×667 és 390×844 méreten egyik oldalon sincs vízszintes görgetés.
2. **AC2** — A modálok (új projekt / lista / kategória / típus, kész-jelölés, meglepetés-feloldás, vonalkód-olvasó,
   törlés-megerősítés, áttekintő részletek) a képernyő közepén / alján jelennek meg, a fejléc és az alsó menü fölött, és ha
   nem férnek ki, görgethetők.
3. **AC3** — A fix és sticky alsó sávok mobilon az alsó menü fölött ülnek, asztali nézetben a képernyő alján.
4. **AC4** — Mobilon minden szöveges mező legalább 16 px-es (nincs iOS-zoom), a nagyobb betűs mezők változatlanok.
5. **AC5** — A kis ikon-gombok és szöveges akciók érintőképernyőn legalább ~40 px-es területen koppinthatók.
6. **AC6** — A csempe stílus (`html[data-style="csempe"]`) és az asztali nézet nem változik.

## Megvalósítás

Közös elemek:

- `src/components/ui/BodyPortal.tsx` (új): a modált a `<body>`-ba teszi (`createPortal`), így a csempe-kártyák
  `backdrop-filter`-e nem köti magához.
- `src/app/globals.css`:
  - mobilon (`max-width: 47.99rem`) minden szöveges `input` / `select` / `textarea` / `contenteditable` 16 px
    (kivéve a `text-base`…`text-5xl` mezőket);
  - `.touch-hit` – érintőképernyőn (`pointer: coarse`) láthatatlan, 10 px-lel nagyobb koppintási terület (`::after`);
  - `--bottom-nav-h` változó: az alsó menü magassága (61 px + iPhone home-sáv), asztali nézetben 0.
- `src/components/BottomNav.tsx`: rögzített 60 px-es menüpont-magasság (`h-15`), hogy a változó pontos legyen.
- `src/components/AppShell.tsx`: alsó helyfoglalás `pb-[calc(var(--bottom-nav-h)+1.25rem)]` (iPhone home-sávval is kifér).
- `src/components/ui/Button.tsx`: `text-center` + `leading-tight` felirat, `lg` méretnél mobilon `px-4` – a két sorba
  törő felirat rendezetten fér ki.
- `src/components/ui/PageHeader.tsx`: a „Vissza” gomb 36 → 40 px, és hosszú cím mellett sem zsugorodik (`shrink-0`; a `/receptek`, `/koltsegek/gyors` fejlécében 27 px-esre nyomódott).

Oldalanként:

| Oldal | Javítás |
|---|---|
| `/teendok/uj`, `/teendok/[id]/szerkesztes` (`TaskForm`) | „Új lista” / „Új projekt” modál a body-ba, görgethető panel; színpöttyök és „Csatolás” / „Alteendő” / „Link” nagyobb érintési felülettel |
| `/teendok`, `/teendok/board`, `/teendok/listak/[id]`, `/ma` | feladat-pipa és board-áthelyező gombok `touch-hit`; státusz- és határidő-chip (`StatusControl`, `DueDateControl`) `touch-hit`; board kijelölés-sáv az alsó menü fölött |
| `/teendok/gyors`, `/koltsegek/gyors`, `/koltsegek/tabla`, `/bakancslista/gyors` | „mentés” sticky sáv az alsó menü fölött; sor-törlés gomb 28 → 36 px széles; „Új sor” / „Sor az előző adataival” `touch-hit` |
| `/koltsegek` | „Kép alapján” gomb: a zárójeles magyarázat 400 px alatt rejtve, hogy ne törjön két sorba |
| `/receptek/[id]/fozes` (`CookingView`) | „Megszakítás / Kész, értékelem” sáv az alsó menü fölött (eddig a menü takarta) |
| `/receptek/[id]` (`RecipeViewer`) | adag +/- gomb 28 → 32 px + `touch-hit` |
| `/etelek/uj` (`CookedMealForm`) | „Dátum” és „Értékelés” mobilon egymás alatt (fél szélességben a csillagok 24 px-re zsugorodtak), csillagok 40 px |
| `/utazasok/[id]/terv` (`TripPlanner`) | alsó mentés-sáv az alsó menü fölött; „Nap törlése” / sor-törlés 36 px; „Új nap” `touch-hit` |
| `/utazasok/[id]` | „Új lista” szöveges akció `touch-hit` |
| `/bakancslista` (`SavedListClient`) | kijelölés-sáv az alsó menü fölött |
| `/bakancslista/[id]` | „Kész” modál (`CompleteModal`), borítókép-nagyítás (`SavedCover`) és meglepetés-feloldó modál (`SurpriseUnlockModal`) a body-ba, görgethető |
| `/bakancslista/uj`, `/bakancslista/[id]/szerkesztes` (`SavedForm`, `useTypeCreator`) | „Új típus” modál a body-ba, görgethető panel; „Kép hozzáadása” / „Link” `touch-hit` |
| `/bakancslista/kep` (`OcrImport`) | alsó import-sáv az alsó menü fölött |
| `/koltsegek/uj`, `/koltsegek/[id]` (`useCategoryCreator`) | „Új kategória” modál a body-ba |
| `/koltsegek/attekintes` (`OverviewDashboard`) | részletező modál a body-ba; „Oszlop / Pie” váltó 28 → 36 px |
| `/katalogus/uj` (`BarcodeScanner`) | vonalkód-olvasó modál a body-ba, görgethető |
| `/beallitasok`, `/koltsegek/beallitasok`, `/bakancslista/beallitasok` (`EntityManager`) | törlés-megerősítő modál a body-ba |
| `/naplo/uj`, `/naplo/[id]/szerkesztes` (`JournalFields`) | „Csatolás” / „Kép” `touch-hit` |
| `/csalad`, oldalsáv (`ThemeSwitcher`, `ModeSwitcher`) | színpöttyök és mód-kapcsoló `touch-hit` |
| minden űrlap (`Input`, `Textarea`, `Select`, `TagInput`, `RichTextEditor`, nyers mezők) | mobilon 16 px betű – nincs iOS-zoom |
| `/belepes` | nem kellett hozzányúlni (a jelszó-szem gomb a közös `PasswordInput`-ban kapott `touch-hit`-et) |

## Tesztek

| AC | Teszt |
|---|---|
| AC1–AC6 | **kézi** (tisztán UI-változás, a user kérésére külön automata teszt nélkül): lokális mock Upstash + `next dev` + Playwright, mind a 75 oldal 360×640 / 375×667 / 390×844 méreten – screenshot, `scrollWidth`, kis érintési felületek és 16 px alatti mezők listája; modálok és alsó sávok külön screenshotja 360×640-en |

## Nyitott kérdések / kockázatok

- A `viewport` nincs `viewport-fit=cover`-re állítva, így az `env(safe-area-inset-bottom)` most 0 – ha később
  PWA / teljes képernyős mód jön, a `--bottom-nav-h` ezt már magától kezeli.
- Valódi iPhone-on (Safari) nem néztük meg, csak Chromium mobil-emulációban.
- Nem nézett állapotok: kamera (vonalkód-olvasó élőkép), fájl-feltöltés, OCR-eredmény (az `ExpenseOcrImport` másik
  munkában van, ahhoz nem nyúltunk), meghívós második felhasználó.
