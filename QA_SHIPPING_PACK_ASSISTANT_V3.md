# QA Shipping Pack Assistant V3 (4 Szenarien, 5-10 Minuten)

## Ziel
Dieses Skript prueft die neue V3-Transparenz im Shipping-Kartonisierungs-Assistenten:

1. Fixe Baseline mit Zeitstempel  
2. Hierarchie "Was bedingt was?" in 3 Ebenen  
3. Auto vs. Manual vs. Downshift nachvollziehbar  
4. Delta-Logik nur gegen Baseline

## Startbedingungen
- Produktseite offen (`index.html`)
- Ein Produkt ist ausgewaehlt
- Abschnitt `2) Produkt, Verpackung & Shipping Input` sichtbar
- Assistent ueber Button `Shipping-Kartonisierungs-Assistent` oeffnen

## Gemeinsame Schnellchecks (bei jedem Szenario)
1. Baseline-Karte zeigt:
- Zeitpunkt (`Baseline vom ...`)
- Modus
- Stueck je Umkarton
- Kartons, Shipment-CBM, W/M-CBM

2. Hierarchie-Sektion zeigt:
- Schritt 1: Quellen
- Schritt 2: Kartonisierungsauswahl + Badges/Source-Chips
- Schritt 3: Wirkungskette bis Kosten

3. Impact-Sektion zeigt:
- Hinweistext: "Diese Deltas sind gegen Baseline vom ... gerechnet."

---

## Szenario A: Auto ohne Downshift (optimiert)
### Schritte
1. In Shipping-Details (falls noetig) sicherstellen: `Manuelle Umkartonisierung` ist **aus**.
2. Assistent oeffnen.
3. In What-if eine kleine Aenderung machen (z. B. Produktlaenge +0,5 cm), aber nicht uebernehmen.

### Erwartung
- Hierarchie Schritt 2:
  - Status-Badge: `Auto exakt` (oder gleichwertig ohne Downshift)
  - `Downshift` = `0`
  - Quelle Umkartonmass = `auto`
- Baseline bleibt trotz What-if-Aenderung unveraendert.

---

## Szenario B: Auto mit Downshift
### Schritte
1. Manual Override bleibt **aus**.
2. Im Assistenten Produkt-/Umkartonwerte so variieren, bis in Schritt 2 `Downshift > 0` erscheint.
- Typisch: Produktmasse vergroessern oder Stueck je Umkarton erhoehen.

### Erwartung
- Hierarchie Schritt 2:
  - Status-Badge: `Auto mit Downshift`
  - `Downshift` > `0`
  - Auswahlgrund erklaert den geometrischen Fit (exaktes Raster nx x ny x nz)
- Cost Chain reagiert plausibel (Kartons/CBM/Kosten aendern sich).

---

## Szenario C: Manual vollstaendig (checked)
### Schritte
1. In Shipping-Details (Modal "Shipping zu 3PL") unter manueller Umkartonisierung setzen:
- Toggle **an**
- Stueck je Umkarton > 0
- Umkarton L/B/H > 0
- Umkarton-Bruttogewicht > 0
2. Speichern/Modal schliessen.
3. Assistent neu oeffnen.

### Erwartung
- Hierarchie Schritt 2:
  - Status-Badge: `Manueller Override (vollstaendig)`
  - Source-Chips fuer Umkartonmass und Gewicht: `manuell`
- Baseline-Karte Modus zeigt `manuell`.

---

## Szenario D: Manual teilweise (partial Fallback)
### Schritte
1. Manual Override bleibt **an**.
2. Umkarton-Bruttogewicht auf `0`/leer setzen (Masse bleiben manuell gesetzt).
3. Assistent neu oeffnen.

### Erwartung
- Hierarchie Schritt 2:
  - Status-Badge: `Manueller Override (teilweise geschaetzt)`
  - Quelle Gewicht zeigt `auto` oder `auto fuer manuelle Stueckzahl`
- Plausibilitaetshinweis bleibt sichtbar.

---

## Baseline-Buttons (Pflichttest)
### Test 1: What-if zuruecksetzen
1. Im Assistenten mehrere What-if-Werte aendern.
2. `What-if zuruecksetzen` klicken.

Erwartung:
- Draft/Sandbox springt auf Baseline.
- Deltas gehen auf Baseline-nahe Werte zurueck.
- Baseline-Zeitstempel bleibt gleich.

### Test 2: Baseline neu laden
1. Produkt ausserhalb des Assistenten veraendern und speichern (z. B. Produktmasse).
2. Im Assistenten `Baseline neu laden` klicken.

Erwartung:
- Neuer Baseline-Zeitstempel.
- Baseline-Kennzahlen aktualisiert.
- Deltas rechnen ab jetzt gegen die neue Baseline.

---

## Persistenz-Check (Pflicht)
1. Nur What-if-Werte aendern, Modal schliessen ohne Uebernahme.

Erwartung:
- Produktdaten bleiben unveraendert.

2. Im Assistenten Checkboxen setzen und `Auswahl uebernehmen`:
- Nur `Produktmasse uebernehmen`
- Nur `Umkarton-Override uebernehmen`

Erwartung:
- Nur die jeweils angehakten Bereiche werden persistiert.

---

## Kurzprotokoll (zum Abhaken)
- [ ] Szenario A bestanden
- [ ] Szenario B bestanden
- [ ] Szenario C bestanden
- [ ] Szenario D bestanden
- [ ] What-if zuruecksetzen korrekt
- [ ] Baseline neu laden korrekt
- [ ] Persistenz nur bei expliziter Uebernahme

