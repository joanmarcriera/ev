# EV or not? — should you switch to electric, or buy petrol/diesel/hybrid?

A small, fast, **no-backend** web tool that answers a real money question:

> Keep the car we've got, or replace it? And if we replace it — EV, petrol, diesel or hybrid;
> new or used? When does the change actually pay for itself?

It models **total cost of ownership** (fuel/electricity, depreciation, insurance, servicing,
road tax, one-off repairs) and shows, live, the **break-even year**, the **lifetime cost**, the
**upfront cash** needed, and **pence-per-mile** — with charts that update as you change the
numbers. It has a first-class **home-solar** input, because charging from your own panels can
take EV running cost down to a couple of pence a mile.

Live: **https://ev.riera.co.uk**

## Why this exists

Most "EV vs petrol" calculators stop at fuel. The decision that actually matters to a household
is the *whole* cost over the years you'll keep the car, including keeping what you already own.
This tool puts keep-vs-switch on a fair footing and lets two people with different instincts
("let's get an EV" / "let's wait, money's tight") look at the same honest numbers.

## Privacy

No accounts, no analytics, no server. Everything runs in your browser. The **Share** button
simply packs your current inputs into the URL so you can send a comparison to someone — nothing
is stored anywhere. The built-in templates contain **no personal data**; they're illustrative
starting points you edit.

## How it works

- `js/model.js` — the pure total-cost-of-ownership maths (no DOM); the formulas live here.
- `js/onboarding.js` — the guided **Start here** front door: a few plain-language questions that
  build a sensible comparison, so you need no car knowledge to begin (skippable; power users go
  straight to the dashboard).
- `js/templates.js` — anonymised starting scenarios + editable UK default rates.
- `js/charts.js` — the cumulative-cost (crossover) line chart and the cost-breakdown bar.
- `js/app.js` — wires inputs ↔ model ↔ charts, renders the pence-per-mile gauges, syncs the URL.
- `index.html` / `css/styles.css` — a single-viewport dashboard with a detailed report below.
- `vendor/chart.umd.min.js` — Chart.js, vendored (no CDN/runtime third-party dependency).

It's plain HTML/CSS/ES-modules — **no build step**. GitHub Pages serves the repo as-is.

## Develop

```bash
npm test          # node --test — runs the model unit tests
npm run serve     # python3 -m http.server 8000  → open http://localhost:8000
```

## Method, in one paragraph

Fuel = (miles ÷ MPG) × 4.546 × £/litre (UK gallon). Electricity = (miles ÷ miles-per-kWh) ×
a blended £/kWh from your home/public/solar mix. Cumulative cost = running costs +
reducing-balance depreciation + one-off repairs; buying a car is treated as converting cash to a
depreciating asset (not an instant loss), which is what makes keep-vs-switch comparable.
Break-even is the year the switch's cumulative cost drops below keeping your current car. Default
rates are illustrative UK 2026 values from the calculators surveyed in the project research note —
replace them with your own quotes.

Guidance only — not financial advice.

## Support

If this helped you make a decision, you can [buy me a coffee](https://marcriera.lemonsqueezy.com/checkout/buy/828ef1c2-2aa1-4c0c-8828-8b388ada3b25) ☕ — entirely optional, and there's a discreet link in the page footer too.

The "Next steps" links in the report are affiliate/referral links. To make them earn (and for the owner setup steps), see **[AFFILIATE-SETUP.md](AFFILIATE-SETUP.md)**.

## Licence

MIT — see [LICENSE](LICENSE).
