# Story 10.5: Revolut és Erste a valódi OCR-kimenettel

**Epic:** 10 (Képfelismerés) · **Méret:** S · **Kockázat:** LOW (csak a parser)
**Állapot:** kész (2026-11-21)
**Forrás:** user, 2026-11-21 – „a revolut kép nem sikerült, iterálj rajta még”

A 10.4 kézzel begépelt szövegen volt tesztelve; a valódi képen a tesseract mást ad.
Most a user két képernyőképe fixture (`tests/fixtures/ocr/real-*`), és a `scripts/ocr` mérés
(0.9 / 1 / 1.1 nagyítással) erre fut.

Mért eltérések a valódi kimenetben:
- „Kč” → „KC”, „Kö”, „KÖ”, „Ké”; a „HUF → CZK” nyíl → „-” vagy „>”;
- a díj-alsor „19:08 · -16,48 Ft” → „19:08 - -16,48 Ft” (külön tételnek látszott);
- logó-zaj a név előtt: „o Bakeshop”, „Ww Havelska”, „4 . . Havelská”, „S Pub”;
- az állapotsor („21:48 … 71%”) → „2148 Om Hm Ro eR 71%m” / „… 7158”, és név lett az egyenleghez;
- Erste: évszám-hiba („5026.08. 05.”) miatt elveszett dátum.

## Elfogadási kritériumok

1. **AC1** — A valódi Revolut-képen pontosan az 5 tétel jön ki (Klášterní pivovar Strahov 21983, Bakeshop 1730, Havelská Koruna 4524, KFC 3315, McCarthy's Irish Pub 13260), hamis tétel nélkül: állapotsor, pénzváltás, korona-összeg és díj-alsor nem tétel; az ikon-zaj lekerül a névről.
2. **AC2** — „Alatta” módú (Erste) listában az olvashatatlan dátumú tétel a következő tétel napját kapja (nem a mait).
3. **AC3** — A korábbi mérés nem romlik: összesen 54→57/99 teljes tétel, a hamis tételek száma 20→3.

## Megvalósítás

- `src/lib/bank-ocr.ts`: bővebb `FOREIGN_AMOUNT_RE` (K[čcöoóeé0]), `NON_TX_RE` kötőjeles pénznem-párral, `FEE_LINE_RE`, állapotsor-sor eldobása és írásjel-arány / akku-% szűrés, ikon-zaj tokenek levágása a `cleanMerchant`-ban (a névfolytatásnál is), dátum-pótlás.
- `tests/fixtures/ocr/expected.json` + a két kép.

## Tesztek

| AC | Teszt |
|---|---|
| AC1–AC2 | `tests/lib/bank-ocr-real.test.ts` (valódi tesseract-szöveg, két nagyítás) |
| AC3 | `npx vitest run --config scripts/ocr/vitest.ocr.config.mts` (OCR_JITTER=0.9,1,1.1) – mérés, kézi |
