# ev-decision-tool — EV vs traditional car total-cost-of-ownership (TCO) calculator

## What it is

An interactive, browser-only UK calculator that answers **"should we switch to an EV?"** by comparing the
*lifetime cost* of keeping the current car against buying an EV, petrol, diesel or hybrid — with charts,
break-even-year projections, pence-per-mile gauges, and a detailed report. Live at **https://ev.riera.co.uk**.

No backend, no analytics, no accounts. Everything runs in-browser; the **Share** button packs inputs into the
URL for offline distribution. MIT licensed.

## How to run and test

```bash
npm test                  # node --test — runs model.test.mjs and cars.test.mjs
npm run serve             # python3 -m http.server 8000 → http://localhost:8000
```

Tests cover the pure TCO maths in `model.js` and the car presets in `cars.js`. No CI/build step; HTML/CSS/JS
are served as-is. GitHub Pages auto-deploys from repo root on push to `main`.

## Layout

- `index.html` — single-viewport dashboard (fits a 22" screen without scroll), reports section below
- `css/styles.css` — responsive, light/dark mode aware
- `js/` — ES modules:
  - `model.js` — pure TCO formulas (no DOM); cumulative cost, fuel costs, depreciation, repairs, break-even
  - `app.js` — wires inputs ↔ model ↔ charts, renders gauges, URL sync (state → URL → restore on reload)
  - `onboarding.js` — guided **Start here** form (plain-language questions for non-car-people)
  - `charts.js` — cumulative-cost crossover line chart + cost-breakdown bar (Chart.js)
  - `templates.js` — anonymised starting scenarios + editable UK 2026 default rates (fuel prices, kWh costs, etc.)
  - `cars.js` — car presets (make/model/year, MPG, EV range, depreciation); all can be overridden in the UI
  - `links.js` — affiliate/referral link mappings (charger installers, energy tariffs, solar, lease companies)
- `vendor/` — Chart.js vendored (no CDN runtime deps; GitHub Pages serves static assets)
- `test/` — `model.test.mjs`, `cars.test.mjs` (Node.js native test runner)

Affiliate monetisation: discreet **Next steps** links in the report section. See **[AFFILIATE-SETUP.md](AFFILIATE-SETUP.md)**
for how to configure them (requires partner API keys).

## Conventions

- **Pure module exports**: `model.js` is pure maths (no globals, no side effects) so it can be imported by both
  browser and test runner.
- **Constants frozen**: `DEFAULT_RATES` (in `model.js`) is `Object.freeze()`'d to catch accidental mutation; other exported constants like `CARS` are plain arrays/objects.
- **Naming**: ICE = internal combustion engine (petrol/diesel); EV = battery electric. Powertrain values are
  strings: `"ev"`, `"petrol"`, `"diesel"`, `"hybrid"`.
- **Numbers**: UK gallons (4.546L), pence, kWh. Depreciation modelled as reducing-balance so **buying a car is
  wealth-conversion, not an instant loss** — this is what makes keep-vs-switch economically fair.
- **Tests**: `*.test.mjs` files; no external test libraries, just Node.js `assert`. Run with `npm test`.

## Gotchas and context

- **GitHub Pages + CNAME**: Repo has a CNAME (`ev.riera.co.uk`) pointing to GitHub Pages. Don't delete it; the
  `gh-pages` branch serves the site. Push to `main` auto-deploys.
- **REFERRALS-TODO.md is private**: It's in `.gitignore` and holds internal setup checklist (API keys, partner
  links). Never commit secrets; `links.js` is the public config.
- **No build step**: Everything is plain JS/ES modules; Chart.js is vendored because GitHub Pages doesn't do npm
  install on deploy. All imports must be explicit (no `node_modules/` at runtime).
- **URL state sync**: `app.js` encodes/decodes the full calculator state into the URL hash on every input change.
  Reload and the state restores — this is how Share works. Test with different scenarios and reload.
- **Colour scheme**: Respects OS dark mode; styles use CSS custom properties for theme switching.
- **Solar charging**: A first-class input (not an afterthought) — can drop EV running cost to ~2p/mile.
- **Charger install cost**: Factored into EV upfront cash (home charger fitting = one-off capex depreciation).

## Key research assumptions

Default rates (in `templates.js`) are illustrative 2026 UK values from surveyed calculators — fuel prices,
grid electricity, insurance risk, depreciation. Every field is override-able in the UI; users should plug their
own quotes in. Road tax, servicing costs, and major repairs are included in the model.

See the comments in `js/model.js` and the research notes in the repo for the full TCO methodology.
