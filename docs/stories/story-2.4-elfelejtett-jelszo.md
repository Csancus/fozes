# Story 2.4: Elfelejtett jelszó: tulajdonosi link + email (Resend)

**Epic:** 2 · **Méret:** M · **Kockázat:** MEDIUM (fiók-átvétel rossz tokenkezelésnél)
**Állapot:** kód kész (2026-11-08); az email-ág élesítéséhez `RESEND_API_KEY` (+ saját domain) kell
**Forrás:** Csanád, 2026-11-08 – „Mindkettő” (tulajdonosi link és email).

## Felhasználói történet

**Mint** felhasználó, aki elfelejtette a jelszavát, **szeretnék** új jelszót beállítani, **azért, hogy** ne zárjam ki
magam az adataimból.

## Elfogadási kritériumok

1. **AC1** — „Elfelejtetted a jelszavad?” → email megadása; létező és nem létező címre ugyanaz a válasz.
   IP-nként 5, email-címenként 3 kérés / óra.
2. **AC2** — A visszaállító link 1 óráig érvényes.
3. **AC3** — A link egyszer használható.
4. **AC4** — Ha nincs `RESEND_API_KEY`, nem próbál emailt küldeni; az oldal azt írja, hogy a tulajdonostól kérjen
   linket. Kulccsal a Resend API-n megy ki a levél.
5. **AC5** — A `/jelszo-csere` oldalon új jelszó (min. 8 karakter, kétszer) állítható be; utána a régi jelszó és
   minden korábbi session érvénytelen.
6. **AC6** — A tulajdonos a Család oldalon bármelyik tagnak (magának is) generálhat linket, amit pl. Messengeren küld el.

## Megvalósítás

- `src/lib/password-reset.ts`: `pwreset:<token>` (TTL 1 óra), `GETDEL`.
- `src/lib/mail.ts`: Resend HTTP API (`RESEND_API_KEY`, `MAIL_FROM`), levélsablon escape-eléssel.
- `src/lib/auth.ts › setUserPassword`: új hash + `sessionVersion + 1`.
- `src/app/belepes` (`mode=forgot`), `src/app/jelszo-csere/*`, `src/app/csalad/MemberActions.tsx`.

## Tesztek

| AC | Teszt |
|---|---|
| AC1 | `tests/auth/actions.test.ts › Story 2.4 – elfelejtett jelszó › AC1` |
| AC2, AC3 | `tests/auth/password-reset.test.ts › Story 2.4 – reset token` |
| AC4 | `tests/auth/password-reset.test.ts › Story 2.4 – email (Resend)` |
| AC5 | `tests/auth/actions.test.ts › AC5`, `tests/auth/auth.test.ts › Story 2.4 – setUserPassword` |
| AC6 | kézi: Család oldal → „Jelszó-visszaállító link” |

## Élesítés (email)

1. resend.com fiók → API key → Vercel env `RESEND_API_KEY`.
2. Saját domain ellenőrzése a Resendben, majd `MAIL_FROM="Főzés <noreply@domain.hu>"`. Domain nélkül a Resend csak a
   fiók saját címére küld.
