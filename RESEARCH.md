# FBA Margenrechner - Kostenstruktur & Modell

Stand: 9. Februar 2026

## 1) Kostenbloecke, die im Rechner enthalten sind

### Umsatz & Verkaufsbasis
- Verkaufspreis brutto (inkl. USt.)
- Umsatzsteuer-Satz
- Absatz pro Monat (Stueck)
- Netto-Umsatz nach Retoureneffekt

### Amazon-Gebuehren
- Empfehlungsgebuehr (%) inkl. Mindestgebuehr pro Einheit
- FBA Fulfillment Fee pro Einheit
  - automatisch aus Paketdimensionen + Gewicht (DE 2026 Tiers)
  - optionaler manueller Override
- Lagerkosten
  - automatisch aus Volumen (m3), Lagerkostenrate und durchschnittlicher Lagerdauer
  - optionaler manueller Override

### Wareneinsatz & Import
- Produktkosten je Einheit
- Inbound Shipping je Einheit
- Zollsatz (%)
- Einfuhrumsatzsteuer (%) optional als Kosten
- Prep/Labeling je Einheit
- sonstige variable Kosten je Einheit

### Marketing & Launch
- PPC als TACOS (% vom Umsatz)
- Promo/Coupon (% vom Umsatz)
- Amazon Vine (gesamt, auf Monate verteilt)
- Launch-Kosten (z. B. Bilder, A+ Content, Services; gesamt, auf Monate verteilt)
- Fixkosten pro Monat

### Retouren
- Retourenquote (%)
- Rueckgewinnungswert der Retouren (%)
- Interne Kosten je Retoure
- Amazon Ruecksendebearbeitungsgebuehr bei hoher Retourenquote
  - Auto-Modell auf Basis Paket-Tier (DE 2026)
  - oder manuell
- Anteil der Retouren mit belasteter Amazon-Gebuehr (%)

## 2) KPI, die berechnet werden
- Nettoumsatz pro Monat
- Bruttogewinn und Bruttomarge
- Nettogewinn und Nettomarge
- ROI auf Wareneinsatz
- Gewinn pro Einheit
- Break-even TACOS
- Break-even Stueckzahl
- Break-even Verkaufspreis (brutto)
- Kostenstruktur nach Kostenblock

## 3) Modellannahmen (transparent)
- FBA Auto-Tiers sind auf DE-Gebuehrenschema (ab 01.02.2026) ausgelegt.
- Bei nicht passendem Tier (z. B. bestimmte Uebergroessen/Faelle) wird auf manuellen Fallback umgestellt.
- TACOS wird als Werbekosten in Prozent des Umsatzes modelliert.
- Retourenwert wird ueber einen Rueckgewinnungswert (% vom Nettoverkaufspreis) abgebildet.
- Break-even Preis wird numerisch (Binaersuche) aus der Gesamtmodellgleichung geloest.

## 4) Primarquellen
- Amazon FBA Preise DE: https://sell.amazon.de/versand-durch-amazon/preise
- Amazon FBA Rate Card DE (ab 01.02.2026, inkl. Fulfillment-, Lager- und Retourengebuehren): https://m.media-amazon.com/images/G/03/AGSV/DE_FBA_Rate_Card_DE_0226.pdf
- Amazon Verkaeufergebuehren / Empfehlungsgebuehr-Kontext: https://sell.amazon.com/pricing
- Amazon Ads ACOS-Definition (Basis fuer TACOS-Logik): https://advertising.amazon.com/de-de/library/guides/acos-advertising-cost-of-sales
- Deutscher Zoll (Zoelle): https://www.zoll.de/DE/Fachthemen/Zoelle/zoelle_node.html
- Deutscher Zoll (Einfuhrumsatzsteuer): https://www.zoll.de/DE/Fachthemen/Steuern/Einfuhrumsatzsteuer/einfuhrumsatzsteuer_node.html
- USD/EUR Laufzeitkurs in der App: https://api.frankfurter.app/latest?from=USD&to=EUR (ECB-basierte Referenz)
