# Amazon FBA Launch Decider App

Web-App zur schnellen Kalkulation von Amazon-FBA Produkten (Quick-Check, Validation, Deep-Dive) mit gemeinsamem Workspace für mehrere Nutzer.

## Features

- Produktkalkulation für Amazon FBA (Marge, DB1, ROI, Payback etc.)
- Shipping- und 3PL-Kostenlogik
- Stage-Flow: Quick-Check / Validation / Deep-Dive
- Gemeinsame Datennutzung über Supabase (Auth + Postgres + RLS)
- Deployment über Vercel

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Hosting: Vercel
- Backend/DB/Auth: Supabase

## Projektstruktur

- `index.html` – Produktseite
- `settings.html` – globale Settings
- `app.js` – gesamte App-Logik
- `styles.css` – Styling
- `modules/domain/shipping.js` – Shipping-Domain-Helfer (Rechenbrücke D2D + Import-Aufschläge)
- `modules/ui/shipping-dashboard.js` – UI-Helfer für Shipping-Dashboard-Modelle
- `modules/ui/setup-wizard.js` – Geführter Setup-Assistent (Schritte, Status, Sprunglogik)
- `modules/ui/tooltips.js` – zentralisierte Tooltip-/Terminologie-Helfer
- `api/config.js` – Vercel API Endpoint für Runtime Config
- `supabase/schema.sql` – Tabellen + RLS Policies
- `DEPLOY.md` – Deploy-Schritte
- `QA_BASELINE.md` – Referenzszenarien + Release-Checkliste

## Lokale Entwicklung

1. Repository klonen
2. Dateien lokal öffnen (z. B. mit VS Code)
3. Optional: lokalen Static Server starten (z. B. Live Server)

> Hinweis: Für Shared-Daten braucht die App Supabase + Vercel-Umgebungsvariablen.

## Deployment (Vercel)

1. Repo in Vercel importieren
2. Environment Variables setzen:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Deploy / Redeploy ausführen

## Supabase Setup

1. In Supabase ein neues Projekt erstellen
2. `supabase/schema.sql` im SQL Editor ausführen
3. Zwei Nutzerkonten anlegen (du + Kollege)
4. Einen gemeinsamen Workspace erstellen
5. Beide Nutzer in `workspace_members` dem Workspace zuordnen

## Sicherheit

- Zugriff auf Daten nur über Workspace-Mitgliedschaft (RLS)
- Kein `service_role` Key im Frontend

## Roadmap (optional)

- Realtime Updates ohne Reload
- Audit Log für Änderungen
- CSV/Excel Export

## Produkt-Flow & Wizard

Die Produktseite ist in drei Arbeitszonen gegliedert:

- Ergebnis: KPI-Entscheidungsblock (Decision-Bar)
- Validierung/Erklärung: QuickCheck- und Validation-Workflow
- Eingabe: Pflichtfelder für Markt, Produkt/Shipping, Amazon/Launch

Zusätzlich gibt es einen geführten Setup-Assistenten mit 5 Schritten:

1. Markt/Absatz
2. Produktmaße/Gewicht
3. Shipping/Kartonisierung
4. Amazon/Launch
5. Ergebnischeck

Der Wizard speichert nur UI-Zustand (`state.ui.setupWizard`) und ändert keine Persistenzfelder.

## Lizenz

Private/internal use.
