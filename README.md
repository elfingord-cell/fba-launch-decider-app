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
- `api/config.js` – Vercel API Endpoint für Runtime Config
- `supabase/schema.sql` – Tabellen + RLS Policies
- `DEPLOY.md` – Deploy-Schritte

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

## Lizenz

Private/internal use.
