# Story 2.1: Regisztráció, belépés, közös háztartás

**Epic:** 2 (Fiók, háztartás, biztonság) · **Állapot:** kész (2026-07-02) · **Visszamenőleges** (2026-11-08-án utólag leírva a kód és a git-előzmények alapján)

## Felhasználói történet

**Mint** felhasználó **szeretnék** fiókot, és a családommal közös háztartást **azért, hogy** együtt vezessük a recepteket, költségeket, teendőket.

## Elfogadási kritériumok (a mai működés)

1. **AC1** — Regisztrációkor saját háztartás jön létre, a regisztráló a tulajdonos.
2. **AC2** — A jelszó bcrypttel hashelve tárolódik; a session titkosított, httpOnly cookie (iron-session, 30 nap).
3. **AC3** — Egy email-cím (kis/nagybetűtől függetlenül) egyszer regisztrálható.
4. **AC4** — Meghívóval meglévő háztartáshoz lehet csatlakozni (2026-11-08 óta lejáró, egyszer használatos meghívóval – Story 2.2).
5. **AC5** — Minden adat-hozzáférés a sessionben lévő háztartásra szűr; kívülről háztartás-azonosító nem adható meg.

## Megvalósítás

- `src/lib/auth.ts`, `src/lib/session.ts`, `src/app/belepes/*`, `src/app/csalad/*`

## Tesztek

| AC | Teszt |
|---|---|
| AC1–AC4 | `tests/auth/auth.test.ts › Story 2.1 – fiók és háztartás` |
