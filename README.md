# Beero – web app (PWA)

Webová verze Android aplikace Beero (repo `Ondra222/Beero`, složka `BeeroAppMap9`), kterou si nainstaluješ
na plochu telefonu jako normální aplikaci s ikonou.

## Instalace na telefon
1. Otevři adresu aplikace (GitHub Pages) v telefonu.
2. **Android (Chrome):** menu ⋮ → **Přidat na plochu / Nainstalovat aplikaci**.
   **iPhone (Safari):** tlačítko Sdílet → **Přidat na plochu**.
3. Na ploše se objeví ikona Beero; aplikace se otevírá na celou obrazovku a funguje i offline.
   Dlouhý stisk ikony (Android) nabídne zkratku **+1 beer**.

## Jak to funguje
- Obrazovky jsou stejné HTML stránky jako v Android aplikaci (`app/src/main/assets`):
  `index.html` (Today, dřív `beero3d.html`), `map.html`, `pubs.html`, `awards.html`, `stats.html`,
  `catalog.html`, `settings.html`, `welcome.html`, sdílené `ui.js` a `ui.css`.
- `android.js` nahrazuje Kotlin most `window.Android`: piva, katalog a nastavení ukládá do `localStorage`,
  polohu bere z prohlížeče, město zjišťuje přes Mapy.com (s klíčem) nebo OpenStreetMap,
  hospodu přes Mapy.com, upozornění (voda / zpomal / domů + Uber) jako webové notifikace.
- `sw.js` – service worker (offline, instalace, kliknutí na upozornění).
- `manifest.webmanifest` + `icons/` – název, ikona (z launcher ikony aplikace) a zkratky.

## Mapy.com
Klíč se do repa nedává. Zadej ho v aplikaci: **Nastavení → Mapy.com**. Bez klíče mapa jede na OpenStreetMap
a hospody se nevyhledávají. Na developer.mapy.com si u klíče můžeš omezit povolenou doménu.

## Rozdíly proti Android verzi
- **Widget na ploše** (hospodský lístek) web neumí – místo něj je zkratka **+1 beer** na ikoně.
- Data jsou jen v prohlížeči daného telefonu. Přenos z Android aplikace: v ní **Nastavení → Zálohovat**,
  tady **Nastavení → Obnovit** (formát zálohy je stejný, funguje to i opačně).
- Upozornění chodí, jen když je povolíš; na iPhonu až po přidání na plochu (iOS 16.4+).

## Úpravy
Po změně souborů zvyš `VERSION` v `sw.js`, ať se telefonům stáhne nová verze.
Lokální test: `python3 -m http.server` a otevřít http://localhost:8000.
