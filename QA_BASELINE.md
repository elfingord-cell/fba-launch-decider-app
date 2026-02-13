# QA Baseline and Release Checklist

## Zweck
Dieses Dokument friert die Referenzszenarien fuer das grosse Release ein und dient als Pflicht-Checkliste vor Freigabe.

## Referenzszenarien (8)

| ID | Szenario | Transport | Manuelle Kartonisierung | shippingPerUnit (Soll) | unitsPerCartonAuto (Soll) | shipmentCbm (Soll) | chargeableCbm (Soll) | quickBlockShippingTo3plPerUnit (Soll) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | Leicht, kompakt | rail | nein | TBD | TBD | TBD | TBD | TBD |
| R2 | Leicht, kompakt | sea_lcl | nein | TBD | TBD | TBD | TBD | TBD |
| R3 | Mittel, Standardkarton | rail | nein | TBD | TBD | TBD | TBD | TBD |
| R4 | Mittel, Standardkarton | sea_lcl | nein | TBD | TBD | TBD | TBD | TBD |
| R5 | Sperrig, nahe Hard-Cap | rail | nein | TBD | TBD | TBD | TBD | TBD |
| R6 | Sperrig, nahe Hard-Cap | sea_lcl | nein | TBD | TBD | TBD | TBD | TBD |
| R7 | Manuelle Packing-List mit realen Kartonmassen | rail | ja | TBD | TBD | TBD | TBD | TBD |
| R8 | Downshift-Fall (z. B. 5 -> 4 wegen Raster) | rail | nein | TBD | TBD | TBD | TBD | TBD |

Hinweis: Sollwerte werden einmalig am Baseline-Commit aus der App uebernommen und danach fuer Regression verwendet.

## Pflichtchecks vor Release

1. Rechen-Regression: Alle 8 Szenarien gegen Sollwerte pruefen.
- Toleranz Unit-Kosten: max. `0,01 EUR`
- Toleranz CBM-Werte: max. `0,001`

2. Wizard-Funktion
- Schrittstatus korrekt (`vollstaendig` nur bei erfuellten Pflichtfeldern).
- Sprunglinks fokussieren das richtige Feld.

3. Shipping-Transparenz
- Begriffe und Tooltips fuer `Sendungsvolumen` und `Abrechnungsvolumen (W/M)` sind konsistent.
- Rechenbruecke sichtbar und konsistent (`Shipping zu 3PL = D2D + Zoll + Order-Fix`).

4. Downshift-Erklaerung
- Bei `unitsPerCartonDownshift > 0` wird die Raster-Geometrie (`nx x ny x nz`) klar erklaert.

5. Validation-Usability
- Offene Bloecke erscheinen priorisiert nach Kosteneffekt.
- Pro Block genau eine Primaeraktion sichtbar.

6. Responsive
- Produktseite, Wizard, Shipping-Modal und Settings ohne abgeschnittene Inhalte auf Desktop und Mobile.

7. Technische Smoke-Checks
- `node --check app.js`
- `node --check modules/domain/shipping.js`
- `node --check modules/ui/tooltips.js`
- `node --check modules/ui/shipping-dashboard.js`
- `node --check modules/ui/setup-wizard.js`

## Freigabevermerk
- Baseline-Commit: `__________`
- QA-Durchlauf am: `__________`
- Freigegeben von: `__________`
