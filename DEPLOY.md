# Deploy: Vercel + Supabase (Shared Workspace)

## 1) Supabase vorbereiten
1. Neues Supabase Projekt (EU Region) erstellen.
2. SQL aus `supabase/schema.sql` im SQL Editor ausführen.
3. Auth aktivieren: Email/Password.
4. Einen Workspace und Members anlegen (SQL Beispiel):

```sql
insert into public.workspaces (id, name)
values ('11111111-1111-1111-1111-111111111111', 'Mahona Workspace');

-- user_id Werte kommen aus auth.users nach Registrierung
insert into public.workspace_members (workspace_id, user_id, role)
values
('11111111-1111-1111-1111-111111111111', 'USER_UUID_1', 'owner'),
('11111111-1111-1111-1111-111111111111', 'USER_UUID_2', 'editor');
```

## 2) Vercel deployen
1. Repo in Vercel importieren.
2. Environment Variables setzen:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Deploy starten.

## 3) Login & Erstimport
1. App öffnen.
2. Mit E-Mail/Passwort anmelden oder registrieren.
3. Wenn lokale Daten vorhanden sind und Remote leer ist:
   - Dialog bestätigen, um lokale Produkte/Settings einmalig in Supabase zu importieren.

## 4) Betrieb
- Storage-Anzeige im Header zeigt `gemeinsam` im Shared-Mode.
- Änderungen an Produkten/Settings werden in Supabase gespeichert (last-write-wins).
- Beide Nutzer sehen denselben Workspace-Datenstand nach Reload.
