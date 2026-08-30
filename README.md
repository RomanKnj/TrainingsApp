# Training

90-Tage Fettabbau-System als installierbare Web-App (PWA): Trainingsplan
(Zuhause → Gym), Ernährungsrahmen ohne Extremdiät und eine tägliche
Checkliste zum Abhaken.

## Live

Nach Aktivierung von GitHub Pages (Settings → Pages) erreichbar unter:
`https://<dein-github-name>.github.io/TrainingsApp/`

## Auf dem Handy installieren

1. Link oben in Chrome (Android) öffnen
2. Menü (⋮) → **App installieren** / **Zum Startbildschirm hinzufügen**
3. Die App startet danach als eigenständiges Fenster ohne Adressleiste und
   funktioniert dank Service Worker auch offline

## Daten

Alles (Startdatum, tägliche Checkliste, Gewichts-/Umfang-Log, Reflexionen)
liegt ausschließlich in `localStorage` dieses Geräts — kein Server, kein
Sync zwischen Geräten.

## Struktur

- `index.html`, `style.css`, `app.js` — die App
- `manifest.json` — Name, Icons, Standalone-Darstellung
- `sw.js` — Service Worker (Offline-Cache der App-Shell)
- `icons/` — App-Icons (192px, 512px, 512px maskable)
