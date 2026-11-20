# Story 10.2: Erste-képernyőkép a gyors rögzítéshez

**Epic:** 10 (Képfelismerés) · **Méret:** S · **Kockázat:** LOW (csak a parser)
**Állapot:** kész (2026-11-20)
**Forrás:** user, 2026-11-20 – Erste-app képernyőkép: „ebből kéne kivenni adatokat a gyors rögzítéshez. GoBuda Mozi 4900 Ft, Lidl 25333 Ft és így tovább”

## Felhasználói történet

**Mint** Erste-ügyfél **szeretném**, ha a banki app képernyőképéből jó dátummal, egységes boltnévvel és kategóriával jönnének a tételek, **azért, hogy** a gyors rögzítésben ne kelljen kézzel javítgatni.

## Elfogadási kritériumok

1. **AC1** — Ha a dátum a tétel ALATT van (Erste: név + összeg, alatta dátum, típus, kategória), minden tétel a saját dátumát kapja. Az ismert láncok neve egységes („3LIDL Igazan megeri 17” → Lidl, „McDonalds 34800006” → McDonald's), a végéről lekerül a terminál-azonosító.
2. **AC2** — A bank kategória-címkéje (Élelmiszer, Szórakozás, Éttermek és kávézók…) a háztartás saját kategóriájára párosul (név és szinonimák alapján, ékezet nélkül), ha a boltnévhez még nincs megjegyzett kategória.
3. **AC3** — A fejléc-dátumos bankoknál (K&H, OTP, Revolut: dátum vagy „Ma” a tételek felett) a régi működés marad.
4. **AC4** — Androidon a galériából / Google Fotókból választott kép is működik: a fájlt a kiválasztás után azonnal memóriába olvassuk (előtte a választó ürítése után „tört” lett az előnézet és 0 tétel jött). Ha mégsem olvasható, érthető hibaüzenet jelenik meg (költség-, bakancslista-kép, jegyzet).

## Megvalósítás

- `src/lib/bank-ocr.ts`: `detectDateAfter`, `normalizeMerchant`, `bankCategoryOf`, `matchCategory`.
- `src/app/koltsegek/kep/ExpenseOcrImport.tsx`: kategória-javaslat a bank címkéjéből.

## Tesztek

| AC | Teszt |
|---|---|
| AC1–AC3 | `tests/lib/bank-ocr-erste.test.ts` |
| AC4 | `tests/lib/ocr-read-files.test.ts` |
| AC1, AC3 | `tests/lib/bank-ocr.test.ts` (frissített elvárások: egységes boltnevek) |
