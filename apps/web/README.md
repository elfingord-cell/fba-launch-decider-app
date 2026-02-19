# Launch-Entscheider React UI

Neue Frontend-Migration auf `Vite + React + Tailwind + Radix`.

## Start

```bash
npm --prefix apps/web install
npm --prefix apps/web run dev
```

App läuft standardmäßig auf `http://localhost:5174`.

## Architektur

- `apps/web/index.html` setzt `window.__FBA_BRIDGE_ONLY__ = true` und lädt den bestehenden Kernel aus `app.js`.
- `app.js` exportiert im Bridge-Mode `window.FbaKernelBridge` mit Snapshot + Actions.
- Rechenkern bleibt unverändert; React rendert nur UI.

## Build

```bash
npm --prefix apps/web run build
```
