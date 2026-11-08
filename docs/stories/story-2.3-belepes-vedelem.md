# Story 2.3: Belépés-védelem: próbálkozási limit, semleges hibaüzenet

**Epic:** 2 · **Méret:** S · **Kockázat:** MEDIUM (fiók-feltörés jelszópróbálgatással)
**Állapot:** kész (2026-11-08)
**Forrás:** Csanád, 2026-11-08 – biztonsági átnézés 3. pontja.

## Felhasználói történet

**Mint** felhasználó **szeretném**, hogy senki ne tudja végigpróbálgatni a jelszavamat, és az se derüljön ki, hogy
regisztráltam-e, **azért, hogy** a fiókom biztonságban legyen.

## Háttér

A belépésnek nem volt limitje, és a hibaüzenet megkülönböztette a „Nincs ilyen email”-t a „Hibás jelszó”-tól.

## Elfogadási kritériumok

1. **AC1** — 15 percen belül email-címenként 8, IP-nként 20 sikertelen próbálkozás után a belépés (helyes jelszóval
   is) „Túl sok próbálkozás” üzenetet ad, amíg az ablak le nem jár.
2. **AC2** — Rossz jelszó és nem létező email ugyanazt az üzenetet adja („Hibás email vagy jelszó.”), és nem létező
   emailnél is lefut egy bcrypt-összehasonlítás (válaszidő).
3. **AC3** — Sikeres belépés nullázza az email-számlálót, és a sessionbe a user `sessionVersion`-je kerül.

## Megvalósítás

- `src/lib/rate-limit.ts`: `hit` / `isLimited` / `resetLimit` (`rl:<bucket>`, INCR + EXPIRE), `LIMITS`.
- `src/lib/auth.ts`: `authenticate` (dummy hash), `src/app/belepes/actions.ts › login`.
- `src/lib/request.ts`: kliens IP (`x-forwarded-for`).

## Tesztek

| AC | Teszt |
|---|---|
| AC1 | `tests/auth/actions.test.ts › Story 2.3 – belépés › AC1`, `tests/auth/rate-limit.test.ts` |
| AC2 | `tests/auth/actions.test.ts › AC2`, `tests/auth/auth.test.ts › Story 2.3 – authenticate` |
| AC3 | `tests/auth/actions.test.ts › AC3`, `tests/auth/rate-limit.test.ts › AC3` |

## Nyitott kérdések / kockázatok

- A regisztráció még elárulja, ha egy email foglalt („Ez az email már regisztrált.”) – limittel elfogadható.
