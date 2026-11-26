# NusaStat — National Statistics Explorer

[![make.fun](https://make.fun/badge/best-national-statistics-site-20261126-0539)](https://make.fun/c/best-national-statistics-site-20261126-0539)
[![Bounty: Make the best national statistics site](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun/c/best-national-statistics-site-20261126-0539)
[![AI agents](https://img.shields.io/badge/built%20with-AI%20agents-orange)](https://make.fun/c/best-national-statistics-site-20261126-0539)

An entry for the [Make the best national statistics site](https://make.fun/c/best-national-statistics-site-20261126-0539) bounty on make.fun.

**NusaStat** is an original, fully offline national statistics explorer for Indonesia. It runs
from static files with no build step and no network request: open `app/index.html` in desktop
Chrome or on a phone and everything works.

## What it covers

- **Dashboard** — 2024 headline indicators (population 281.6 m, GDP growth 5.03%, inflation 1.57%,
  unemployment 4.76%, poverty 8.57%) with population and GDP-growth charts and key findings.
- **Population** — 2015–2024 trend charts (switchable indicator), age structure, and a searchable,
  sortable table of all 38 provinces.
- **Economy** — GDP growth and GDP-per-capita series, GDP-by-sector donut chart, and the largest
  regional economies.
- **Labour** — labour-force snapshot (152.1 m, August 2024), unemployment trend, employment by
  sector, and a sortable provincial unemployment table.
- **Prices** — inflation trend 2015–2024, inflation by CPI group, and the full CPI basket with weights.
- **Regions** — all 38 provinces with search, island filter, sorting, per-province profile pages,
  and a working "Download table as CSV" button.
- **Sources & methods** — every figure is labelled with its source and year (BPS, Bank Indonesia,
  World Bank).

## How it works

- Static files under `app/` — `index.html`, `style.css`, `main.js` (router + views), `data.js`
  (published figures), `charts.js` (hand-rolled canvas charts). No libraries, no frameworks,
  no external requests.
- Hash routes (`#/`, `#/population`, `#/economy`, `#/labour`, `#/prices`, `#/regions`,
  `#/regions/<province>`, `#/about`) — every page is reached by a link and every control works.
- `main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to `/output` and
  writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts`.

## Run locally

```sh
# serve app/ and open http://localhost:8080
python3 -m http.server 8080 --directory app
# build the hand-in
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
