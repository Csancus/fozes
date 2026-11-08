# Story 2.6: Privát csatolmányok

**Epic:** 2 (Fiók, háztartás, biztonság) · **Méret:** M · **Kockázat:** MEDIUM · **Állapot:** backlog
**Forrás:** biztonsági átnézés 2026-11-08, 2. pont (akkor nem választott).

## Felhasználói történet

**Mint** felhasználó **szeretném**, hogy a feltöltött képeim, PDF-jeim csak belépve legyenek elérhetők **azért, hogy**
személyes dokumentumot is fel merjek tölteni.

## Háttér

A csatolmányok a publikus `eletapp` bucketbe mennek; aki megkapja az URL-t, belépés nélkül megnyithatja.

## Elfogadási kritériumok

1. **AC1** — Új feltöltések privát bucketbe kerülnek; megjelenítés rövid ideig érvényes aláírt URL-lel, csak a saját
   háztartásnak.
2. **AC2** — A meglévő fájlok sorsa (átköltöztetés vagy maradnak) – döntés kell.

## Megvalósítás

- `src/lib/r2.ts` (aláírt URL-ek) – terv.

## Tesztek

| AC | Teszt |
|---|---|
| AC1 | unit: aláírt URL csak a saját háztartásnak (terv) |
