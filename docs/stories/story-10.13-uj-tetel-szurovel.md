# Story 10.13 – „Új tétel” szűrt tétel-táblában

**Állapot:** kész (2026-11-22)

## Hiba
A /koltsegek/tabla oldalon fizetési módra (Raiffeisen) szűrve az „Új tétel” gomb „nem működött”: az új sor
létrejött, de üres fizetési móddal, így a szűrő azonnal elrejtette.

## Elfogadási feltételek
- AC1: Az új, még nem mentett sor bármilyen szűrő mellett látszik.
- AC2: Ha egy szűrőben pontosan egy érték van kiválasztva (fizetési mód, kategória, ki, projekt, csoport, típus,
  jelleg, tervezett, felülvizsgálandó), az új sor ezt az értéket kapja.

## Tesztek
| Teszt | Típus |
|---|---|
| AC1–AC2 | kézi (tisztán UI) |
