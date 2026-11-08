# Story 1.5: Visszatöltés mentésből

**Epic:** 1 (Alapok és üzemeltetés) · **Méret:** S · **Kockázat:** MEDIUM · **Állapot:** backlog

## Felhasználói történet

**Mint** az app gazdája **szeretném** egy heti mentésből vissza tudni tölteni az adatokat **azért, hogy** a mentés tényleg használható legyen.

## Háttér

A mentés formátuma (`{ type, value }` kulcsonként, nyers értékek) úgy készült, hogy hűen visszatölthető legyen, de a szkript még nincs meg és nem volt próba.

## Elfogadási kritériumok

1. **AC1** — Szkript: egy `backups/*.json` fájlból egy (üres) Redis adatbázisba tölt, típushelyesen (string/set/list/hash/zset).
2. **AC2** — Próba: egy friss mentés visszatöltése egy teszt-adatbázisba, kulcsszám egyezik.

## Megvalósítás

- `scripts/restore-backup.ts` (terv)

## Tesztek

| AC | Teszt |
|---|---|
| AC1 | unit: memóriás Redisbe töltés |
| AC2 | kézi próba |
