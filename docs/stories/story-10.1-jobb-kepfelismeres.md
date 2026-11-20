# Story 10.1: Jobb képfelismerés (bank-kép, blokk, bakancslista, jegyzet)

**Epic:** 10 (Képfelismerés) · **Méret:** L · **Kockázat:** MEDIUM (heurisztika + külső API opcionálisan; a régi út tartalékként megmarad)
**Állapot:** kész (2026-11-20, lásd a commitot)
**Forrás:** user, 2026-11-20: „A képfeltöltésen kellene még iterálni mert nem tud jól szöveget, számot adatokat olvasni képről. iterálj ezen 3x hogy ez sokkal jobb legyen. a gyors rögzítésre vagy a jegyzetek, bakancslistára gondolok”

## Felhasználói történet

**Mint** háztartás-tag **szeretném**, ha a bank-app képernyőképéből, a blokk fotójából, egy Instagram-/térkép-képből
vagy egy jegyzetfotóból pontosan kiolvasná az app a szöveget, összegeket, dátumokat és neveket, **azért, hogy**
ne kelljen kézzel átgépelnem és javítgatnom.

## Háttér

Eddig mindenhol nyers `tesseract.recognize(file, "hun+eng")` futott, előfeldolgozás nélkül, minden képnél új
workerrel. A bank-parser az időt (16:33) az összegbe olvasztotta („333 299 Ft”), az alcímet („Kártyás vásárlás ·
14:26”) vette boltnévnek, blokkra egyetlen tételt sem adott. A bakancslistán a leghosszabb sor lett a cím (a leíró
mondat), és csak `http(s)://`-es linket ismert fel. A jegyzetnél nem volt képből-szöveg.

## Elfogadási kritériumok

1. **AC1** — Közös előfeldolgozás (`src/lib/ocr/preprocess.ts`, tiszta pixel-függvények): EXIF-forgatás betöltéskor,
   felskálázás kis képeknél (képernyőkép ~800 px szélesre, fotó a hosszabb oldal szerint), szürkeárnyalat, sötét
   mód felismerése és invertálása, kontraszt-széthúzás háttér-olvasztással (ikon-körök, vonalas lap), fotón adaptív
   (Sauvola) binarizálás, képernyőkép/fotó automatikus felismerése.
2. **AC2** — Tesseract: egyetlen, újrahasznált worker; mért PSM (képernyőkép 6, fotó 4), `preserve_interword_spaces`;
   bizonytalan eredménynél második menet más nagyítással, a jobbat (tartalmi pontszám, majd megbízhatóság) tartjuk meg.
3. **AC3** — Utófeldolgozás (`src/lib/ocr/postprocess.ts`): O/e/@/l/S → számjegy pénzösszegekben, „F+/Et/FT” → Ft,
   unicode mínuszok, szemétsorok kiszűrése; összegek („12 345 Ft”, „-4 990,00 Ft”, „1 990 HUF”), dátumok
   („2026. 11. 15.”, „2026,11.18”, „nov. 17.”, „16 Nov 2026”, Ma/Tegnap, év nélkül a múltba).
4. **AC4** — Bank-parser: az idő nem olvad az összegbe; az alcím (típus + idő) nem boltnév, ilyenkor a fölötte lévő név
   az; egyenleg (címke alatti összeg) kimarad; dátum-fejléc nélkül is olvas; boltnév-zaj takarítása.
5. **AC5** — Blokk-mód: végösszeg-sor + nyugta-jelölő esetén egyetlen kiadás a végösszeggel (a tételek összege és a
   kártyás fizetés sora megerősíti), a cégnévvel és a blokk dátumával.
6. **AC6** — Bakancslista-heurisztika (`src/lib/ocr/saved-guess.ts`): cím a név (Instagram-képaláírás eleje, térkép-
   kártya címe), nem mondat / lájk-szám / értékelés; hely irányítószámos cím „Cím:” címke nélkül; csupasz domain is
   link; ékezet nélküli kulcsszavak.
7. **AC7** — Opcionális Claude-os út (`src/lib/ocr/vision.ts`, `vision-action.ts`): ha van `ANTHROPIC_API_KEY`, a
   kicsinyített képet a belépett felhasználó nevében a Claude API-nak küldjük strukturált JSON-kimenettel
   (kiadás-sorok / bakancslista-mezők / jegyzet-szöveg). Méret- és típuskorlát, rate-limit Redisben (40/óra/fő,
   200/nap/háztartás). Kulcs nélkül, hibánál vagy elutasításnál a javított tesseract fut.
8. **AC8** — Bekötés: Gyors rögzítés képről (`/koltsegek/kep`), Kép a listára (`/bakancslista/kep`), új „Szöveg képről”
   gomb a jegyzet-űrlapon (a jegyzet végére írja a szöveget, a képet nem tárolja), és a vásárlás/blokk-csatolás is a
   közös modult használja. (kézi)
9. **AC9** — Mérés: `tests/fixtures/ocr/` tesztképek a várt értékekkel, `scripts/ocr/ocr.bench.ts` mérő; 3 iteráció
   mérése (lent).

## Megvalósítás

- `src/lib/ocr/preprocess.ts`, `params.ts`, `postprocess.ts`, `pipeline.ts` (motorfüggetlen folyamat),
  `client.ts` (canvas + worker + Claude-tartalék), `saved-guess.ts`, `vision.ts`, `vision-action.ts`
- `src/lib/bank-ocr.ts`: átírva a közös utófeldolgozásra, blokk-mód
- `src/lib/rate-limit.ts`: `ocrVisionUser`, `ocrVisionHouseholdDay`
- `src/app/koltsegek/kep/ExpenseOcrImport.tsx`, `src/app/bakancslista/kep/OcrImport.tsx`,
  `src/app/jegyzetek/NoteForm.tsx` + `ImageTextButton.tsx`, `src/app/vasarlas/uj/NewPurchaseForm.tsx`,
  `src/app/bevasarlas/[id]/szamla/AttachReceiptForm.tsx`
- Mérés: `tests/fixtures/ocr/` (HTML-forrásból Chrome headless-szel renderelt képek: `node scripts/ocr/render-fixtures.mjs`),
  `scripts/ocr/ocr.bench.ts`, `scripts/ocr/sweep.sh`, `scripts/ocr/baseline/` (a régi parserek a baseline-hoz)
- Új függőség: `@anthropic-ai/sdk`; `.env.example`: `ANTHROPIC_API_KEY`, `OCR_VISION_MODEL`

## Mérés (8 tesztkép, tesseract-út)

Tesztképek: bank-app világos (390 px), sötét (780 px JPEG), sötét továbbküldött (390 px JPEG 60), blokk-fotó dőléssel
és zajjal, ugyanez kisebben, Instagram-szerű poszt (sötét), térkép-kártya, kézírás-szerű jegyzet vonalas lapon.
„Tétel” = összeg + dátum + bolt + irány mind jó (23 várt tétel).

Iterációnként (egy futás, eredeti méret):

| Mérőszám | Előtte | 1. iteráció (előfeldolgozás + PSM) | 2. iteráció (utófeldolgozás + új parserek) | 3. iteráció (hangolás: skála 800, PSM 6/4, háttér-olvasztás, 2. menet) |
|---|---|---|---|---|
| Karakterpontosság | 86,1% | 83,4% | 87,2% | 95,5% |
| Teljes tétel | 6/23 (26%) | 7/23 (30%) | 15/23 (65%) | 21/23 (91%) |
| Összeg | 14/23 (61%) | 16/23 (70%) | 22/23 (96%) | 22/23 (96%) |
| Dátum | 14/23 (61%) | 16/23 (70%) | 22/23 (96%) | 22/23 (96%) |
| Bolt | 6/23 (26%) | 7/23 (30%) | 16/23 (70%) | 21/23 (91%) |
| Hamis tétel | 2 | 3 | 0 | 1 |
| Bakancslista-mező (cím/hely/link/típus) | 3/8 | 3/8 | 7/8 | 8/8 |
| Jegyzet-kulcsszó | 6/10 | 7/10 | 8/10 | 6/10 |

Robusztus mérés (minden kép 0,9× / 1× / 1,1× méretben, mert a tesseract érzékeny a betűméretre):

| Mérőszám | Előtte | Utána |
|---|---|---|
| Karakterpontosság | 84,9% | 94,4% |
| Teljes tétel | 15/69 (22%) | 61/69 (88%) |
| Összeg | 38/69 (55%) | 64/69 (93%) |
| Dátum | 38/69 (55%) | 63/69 (91%) |
| Bolt | 15/69 (22%) | 62/69 (90%) |
| Hamis tétel | 8 | 3 |
| Bakancslista-mező | 10/24 (42%) | 24/24 (100%) |
| Jegyzet-kulcsszó | 22/30 (73%) | 18/30 (60%) |
| Idő / kép (node) | ~0,5 s | ~0,7 s |

Megjegyzés: a kézírás-szerű jegyzetnél a karakterpontosság javult (≈94→96%), de a szigorú kulcsszó-mérés (pl.
„18 450 Ft”, „06 30 123 4567”) számjegy-tévesztések miatt ingadozik – ide a Claude-os út a valódi megoldás.
Futtatás: `npx vitest run --config scripts/ocr/vitest.ocr.config.mts` (alap: új út), `OCR_STAGE=baseline …` (régi),
összesítő: `bash scripts/ocr/sweep.sh OCR_JITTER=0.9,1,1.1`.

## Tesztek

| AC | Teszt |
|---|---|
| AC1 | `tests/lib/ocr-preprocess.test.ts › Story 10.1 – kép-előfeldolgozás › AC1: …` (5 teszt) |
| AC2 | `tests/lib/ocr-preprocess.test.ts › AC2: tesseract-paraméterek…`, `› AC2: második menet…` |
| AC3 | `tests/lib/ocr-postprocess.test.ts › Story 10.1 – OCR utófeldolgozás › AC3: …` (6 teszt) |
| AC4 | `tests/lib/bank-ocr.test.ts › Story 10.1 – bank-ocr parser › AC4: …` (6 teszt) |
| AC5 | `tests/lib/bank-ocr.test.ts › AC5: blokk …` (2 teszt) |
| AC6 | `tests/lib/ocr-saved-guess.test.ts › Story 10.1 – bakancslista-heurisztika › AC6: …` (5 teszt) |
| AC7 | `tests/lib/ocr-vision.test.ts › Story 10.1 – Claude-os képfelismerés (server action)` + `› Claude-válasz feldolgozása` (9 teszt) |
| AC8 | kézi (böngészőben: képfeltöltés a három oldalon) |
| AC9 | `scripts/ocr/ocr.bench.ts` (nem része az `npm test`-nek: valódi tesseractot futtat, nyelvi adatot tölt le) |

## Nyitott kérdések / kockázatok

- A Claude-os út csak `ANTHROPIC_API_KEY` beállítása után él (Vercel env). Alapmodell: `claude-haiku-5-5`
  (olcsó, képet jól olvas; `OCR_VISION_MODEL`-lel cserélhető). Valódi API-hívással nem teszteltük (nincs kulcs).
- A tesztképek szintetikusak (HTML-ből renderelve); valódi telefonos képekkel érdemes még egy kört mérni.
- A böngészős út (canvas + worker) logikája ugyanaz a `pipeline.ts`, de valódi böngészőben kézzel kell kipróbálni.
