# Story 2.2: Lejáró, visszavonható meghívók és tag eltávolítása

**Epic:** 2 (Fiók, háztartás, biztonság) · **Méret:** M · **Kockázat:** HIGH (hozzáférés a közös pénzügyi adatokhoz)
**Állapot:** kész (2026-11-08)
**Forrás:** Csanád, 2026-11-08 – biztonsági átnézés 1. pontja („1,3,4,6 pontokat csináld meg”).

## Felhasználói történet

**Mint** háztartás-tulajdonos **szeretném**, hogy a meghívó link lejárjon, egyszer legyen használható és vissza tudjam
vonni, és el tudjak távolítani tagot, **azért, hogy** egy rossz kézbe került link ne adjon örök hozzáférést az adataimhoz.

## Háttér

Korábban a meghívó a háztartás azonosítója volt (`/belepes?mode=reg&hh=<householdId>`): soha nem járt le, nem lehetett
visszavonni, és bárki, akinél megvolt, bármikor csatlakozhatott. Tagot eltávolítani nem lehetett, és a session a
kijelentkezésig (30 nap) a cookie-ban lévő háztartást használta, Redis-ellenőrzés nélkül.

## Elfogadási kritériumok

1. **AC1** — A meghívó token véletlen, ≥ 32 karakter, és nem a háztartás azonosítója.
2. **AC2** — A meghívó 7 nap után lejár.
3. **AC3** — A meghívó egyszer használható; lejárt/felhasznált meghívóval nem jön létre fiók, érthető hibával.
4. **AC4** — A tulajdonos visszavonhatja; más háztartás meghívóját nem.
5. **AC5** — A Család oldalon a tulajdonos látja az aktív meghívókat lejárati idővel.
6. **AC6** — A tulajdonos eltávolíthat egy tagot: a tag új, üres háztartást kap, és minden sessionje azonnal érvénytelen.
7. **AC7** — Nem tulajdonos nem távolíthat el senkit; a tulajdonos önmagát és más háztartás tagját sem.
8. **AC8** — A régi `?hh=` linkek már nem csatlakoztatnak.
9. **AC9** — Meghívót létrehozni, visszavonni csak a tulajdonos tud (szerveroldalon ellenőrizve).

## Megvalósítás

- `src/lib/invites.ts`: `invite:<token>` (TTL) + `household:<id>:invites` set; create/list/revoke/consume (`GETDEL`).
- `src/lib/auth.ts`: `removeMember`, `isSessionValid` (user létezik, háztartás egyezik, `sessionVersion` egyezik);
  `requireUser`/`currentUser` kérésenként egyszer olvassa a usert (`react` `cache`).
- `src/app/csalad/*`: `InvitesPanel`, `MemberActions`, server actionök tulajdonos-ellenőrzéssel.
- `src/app/belepes/*`: `inv` paraméter; a meghívó csak sikeres validáció után használódik fel.

## Tesztek

| AC | Teszt |
|---|---|
| AC1–AC5 | `tests/auth/invites.test.ts › Story 2.2 – meghívók` |
| AC3, AC8 | `tests/auth/actions.test.ts › Story 2.2 – regisztráció meghívóval` |
| AC6, AC7 | `tests/auth/auth.test.ts › Story 2.2 – tag eltávolítása` |
| AC9 | kézi: nem tulajdonosként a Család oldalon nincs meghívó-panel; az action `requireOwner`-rel dob |

## Nyitott kérdések / kockázatok

- A tulajdonos nem tud kilépni / tulajdonjogot átadni – ha kell, külön story.
- Az eltávolított tag a meglévő (közös) adatokból semmit nem visz magával – ez szándékos.
