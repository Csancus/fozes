# Story 2.5: Nyitott regisztráció védelme

**Epic:** 2 · **Méret:** S · **Kockázat:** MEDIUM (botok elhasználhatják az Upstash Free keretet)
**Állapot:** kész (2026-11-08)
**Forrás:** Csanád, 2026-11-08: „csináljuk meg úgy, hogy rendesen tudja bárki használni. majd később fizetőssé teszem
a platformot, egyelőre csak én fogom használni és max testvérem”.

## Felhasználói történet

**Mint** az app gazdája **szeretném**, hogy bárki regisztrálhasson, de botok és tömeges regisztráció ne tegye tönkre
az ingyenes kereteket, **azért, hogy** később nyugodtan megnyithassam a platformot.

## Elfogadási kritériumok

1. **AC1** — Új jelszó legalább 8 karakter (a meglévő jelszavak maradnak); név legfeljebb 60 karakter.
2. **AC2** — Rejtett csapda-mező (`website`): ha ki van töltve, nem jön létre fiók.
3. **AC3** — IP-nként óránként legfeljebb 5 regisztráció; az egész appra napi plafon (`REGISTRATION_DAILY_CAP`,
   alapból 30).
4. **AC4** — Minden új user saját, elkülönített háztartást kap (más adatát nem látja) – lásd Story 2.1.

## Megvalósítás

- `src/app/belepes/actions.ts › register`, `src/lib/rate-limit.ts`, `src/app/belepes/page.tsx` (csapda-mező).

## Tesztek

| AC | Teszt |
|---|---|
| AC1–AC3 | `tests/auth/actions.test.ts › Story 2.5 – nyitott regisztráció védelme` |
| AC3 | `tests/auth/rate-limit.test.ts › Story 2.5 AC3` |
| AC4 | `tests/auth/auth.test.ts › Story 2.1 › AC1` |

## Nyitott kérdések / kockázatok

- Nyilvános megnyitás előtt: Upstash Pay as you go (vagy háztartásonkénti tárhely-plafon), email-megerősítés
  regisztrációkor, privát csatolmányok (Story 2.6).
