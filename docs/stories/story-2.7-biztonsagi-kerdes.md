# Story 2.7: Biztonsági kérdés (összeadás) a belépés-űrlapokon

**Epic:** 2 (Fiók, háztartás, biztonság) · **Méret:** S · **Kockázat:** LOW (új kötelező mező a belépésnél)
**Állapot:** kész (2026-11-20)
**Forrás:** tulajdonos, 2026-11-20: „kellene még egy biztonsági mező, 1 db 1 jegyű és egy 2 jegyű szám összeadása. kezd tele lenni személyes adattal és meg kéne akadályozni a botok vagy más feltörést”

## Felhasználói történet

**Mint** tulajdonos **szeretném**, hogy a belépés, a regisztráció és az elfelejtett jelszó űrlapon legyen egy egyszerű biztonsági kérdés **azért, hogy** a gépi próbálkozások ne jussanak el a jelszó-ellenőrzésig.

## Elfogadási kritériumok

1. **AC1** — Az űrlapon „Biztonsági kérdés”: egy 1 jegyű (1–9) és egy 2 jegyű (10–99) szám összege.
2. **AC2** — A feladatot a szerver HMAC-kal aláírja (`CAPTCHA_SECRET`, ennek hiányában `SESSION_PASSWORD`), a számok nem írhatók át.
3. **AC3** — Egy feladat egyszer használható (Redis `captcha:used:<nonce>`, SET NX), és 30 perc után lejár.
4. **AC4** — Hibás vagy hiányzó válasznál a server action el sem jut a jelszó-ellenőrzésig / fiók-létrehozásig; az email megmarad az űrlapon.
5. **AC5** — A jelszómezőnek van placeholdere (belépés: „A jelszavad”, regisztráció: „Legalább N karakter”).

## Megvalósítás

- `src/lib/captcha.ts`: `createCaptcha`, `verifyCaptcha`, `captchaError`
- `src/app/belepes/actions.ts`: `checkCaptcha` a login / register / requestPasswordReset elején
- `src/app/belepes/page.tsx`: `CaptchaField`, jelszó-placeholder

## Tesztek

| AC | Teszt |
|---|---|
| AC1–AC4 | `tests/auth/captcha.test.ts › Story 2.7 – biztonsági kérdés (összeadás)` |
| AC1, AC5 | kézi: böngészőben 2026-11-20 |

## Nyitott kérdések / kockázatok

- Egy célzottan erre írt bot az összeadást könnyen megoldja. A valódi védelmet a meglévő próbálkozási limitek (Story 2.3, 2.5) és a bcrypt adják; ez a kérdés a tömeges, általános botokat szűri.
