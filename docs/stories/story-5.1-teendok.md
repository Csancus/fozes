# Story 5.1: Teendők

**Epic:** 5 (Teendők és napi áttekintő) · **Állapot:** kész (2026-07-25 – 2026-08) · **Visszamenőleges** (2026-11-08-án utólag leírva a kód és a git-előzmények alapján)

## Felhasználói történet

**Mint** felhasználó **szeretném** a teendőimet határidőkkel, listákban kezelni **azért, hogy** semmi ne csússzon el.

## Elfogadási kritériumok (a mai működés)

1. **AC1** — Teendők határidővel, alteendőkkel, képpel/fájllal; listák, projektek, címkék (átnevezés, összevonás).
2. **AC2** — Kanban kézi sorrenddel és előzményekkel (ki mit állított át); mobilon fogható kártyák.
3. **AC3** — Ismétlődő teendők: készre állításkor jön a következő; havi léptetés a hónap végére vág; régen elmaradtnál a következő esedékesség a jövőben van (nincs sorozat).
4. **AC4** — Napi áttekintő (`/ma`).

## Megvalósítás

- `src/app/teendok/*`, `src/app/ma/*`, `src/lib/task-repeat.ts`, `src/lib/task-visuals.ts`

## Tesztek

| AC | Teszt |
|---|---|
| AC3 | `tests/lib/task-repeat.test.ts › Story 5.1 – ismétlődés` |
