# Story 1.4: Tesztinfrastruktúra és story-folyamat

**Epic:** 1 (Alapok és üzemeltetés) · **Méret:** S · **Kockázat:** LOW · **Állapot:** kész (2026-11-08)
**Forrás:** Csanád, 2026-11-08: „legyenek ezentúl epicek, storyk és tesztek és akár visszamenőlegesen is írd meg ezeket … ne legyen túlbonyolítva”.

## Felhasználói történet

**Mint** fejlesztő **szeretném**, hogy minden változásnak legyen leírása és tesztje **azért, hogy** a fontos adatokat kezelő app ne törjön el észrevétlenül.

## Háttér

Korábban nem volt sem teszt, sem story-dokumentáció. Minta: a zsuzsi-platform `docs/epics.md` + `docs/stories/` felépítése, kisebb méretben.

## Elfogadási kritériumok

1. **AC1** — `npm test` Vitesttel fut, külső szolgáltatás nélkül (memóriás Redis: `tests/support/fake-redis.ts`).
2. **AC2** — `docs/epics.md` index + `docs/stories/_template.md`; a tesztek a story/AC számára hivatkoznak.
3. **AC3** — A már kész funkciókhoz visszamenőleges storyk (Epic 1–7), a tiszta függvényekhez tesztek.
4. **AC4** — `AGENTS.md` rögzíti a szabályt: változás → story + teszt.

## Megvalósítás

- `vitest.config.mts`, `tests/support/*`, `package.json` (`test`, `test:watch`, `typecheck`), `docs/`, `AGENTS.md`

## Tesztek

| AC | Teszt |
|---|---|
| AC1 | `npm test` zöld |
| AC3 | `tests/lib/*.test.ts` |
