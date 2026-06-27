# Charger-install cost + passive "cover-the-costs" monetisation — design

## Context

`ev.riera.co.uk` is a free, no-backend EV-vs-ICE total-cost-of-ownership tool. Two gaps prompted
this work:

1. **A missing cost.** The model omits the **home charger installation** — a real one-off that
   currently makes EV scenarios look cheaper upfront than they are.
2. **Paying for itself.** The owner wants the site to cover its (small) running cost — roughly a
   domain a year — without changing its clean, private, static nature.

Decisions taken in brainstorming:
- **Ambition: "just cover its costs"** — passive, near-zero upkeep. No display ads, no directory to
  build/maintain, no sales effort. The limiter on income is traffic, not the mechanism, so we add the
  cheapest mechanism (contextual affiliate/referral links) and revisit a local-installer directory
  only if traffic and click-through justify it.
- **Placement: report-only + one nudge** — affiliate links live in a "Next steps" block in the
  detailed report (below the fold); plus ONE small contextual line in the dashboard, shown only when
  an EV is the cheaper option.

The charger-install cost and the monetisation reinforce each other: the cost makes the comparison
honest, and it's the natural anchor for "getting a charger? compare install quotes →".

## Goals / non-goals

- **Goal:** model the charger-install one-off correctly; add discreet, privacy-preserving outbound
  affiliate links that earn the moment a real URL is in place; change nothing about the no-backend,
  no-tracking, no-PII setup.
- **Non-goal (explicitly deferred):** local-installer search/directory, paid/featured listings, any
  lead-gen sales. Revisit when traffic exists. Display advertising is rejected outright.

## Part 1 — Charger-install cost (model)

New optional per-scenario field **`chargerInstall`** (£, one-off at year 0). Only meaningful for EV
powertrains; default `0` for ICE/hybrid. Editable everywhere.

- **`js/model.js`**
  - `cumulativeCostAt(s, rates, t)` adds `(s.chargerInstall ?? 0)` as a constant for all `t ≥ 0`
    (cash spent on day one, present at every horizon point). This shifts the EV line up by the
    install cost — break-even and `compare()` diffs keep working because it's a constant per scenario.
  - `upfrontCash(s)` adds `(s.chargerInstall ?? 0)` (it's cash needed now).
  - `divergenceReasons()` gains a **"Charger install"** factor =
    `(baseline.chargerInstall ?? 0) − (switch.chargerInstall ?? 0)`. Because the constant is in
    `cumulativeCostAt`, the reasons still sum exactly to `lifetimeSaving` — extend the existing
    sum-invariant test to cover it.
- **`js/app.js`**
  - Render a **"Charger install £"** row in the scenario card **only when `powertrain === "ev"`**
    (next to the charging mix).
  - Add `chargerInstall` to `sanitizeState` numeric fields.
- **`js/templates.js` / `js/onboarding.js`**
  - Default `chargerInstall: 1000` for EV scenarios that charge at home/solar; `0` when the answer is
    "mostly public chargers / can't charge at home". Tooltip notes the £350 OZEV grant now only
    applies to flats/renters.

## Part 2 — "Next steps" affiliate block + one nudge

- **`js/links.js`** (new) — a small config array of outbound links:
  `{ key, label, blurb, href, rel, when }` where `when` is a predicate over the current comparison
  (e.g. `always`, `evIsCheaper`, `usesSolar`). `href` ships as a **clearly-labelled placeholder**
  the owner swaps for real referral URLs as they sign up. Suggested entries: home-charger install
  quotes, EV energy tariff (Octopus referral), solar & battery quotes, find/lease the car.
- **Report block** — a "Next steps" section renders the entries whose `when` is true, as a tidy list,
  with a one-line **affiliate disclosure** ("some links may earn a small commission, at no cost to
  you").
- **Dashboard nudge** — ONE discreet line under the verdict, shown **only when the cheaper option is
  an EV**: e.g. *"Getting a charger? Compare install quotes →"*, linking to the charger entry.
- **All links:** `target="_blank" rel="sponsored noopener"`, no tracking scripts, no backend.

## Privacy / honesty (unchanged stance)

Outbound links only; `rel="sponsored noopener"`; no analytics; disclosure present. No personal data,
no backend — identical to today.

## Testing / verification

- **Unit (`node --test`):** `chargerInstall` flows into `cumulativeCostAt` and `upfrontCash`;
  `divergenceReasons` still sums to `compare().lifetimeSaving` with a charger cost present.
- **Browser:** an EV scenario shows the charger field; setting it raises upfront cash and adds a
  "Charger install" bar in "Why the lines separate"; the report shows "Next steps" with a disclosure;
  the dashboard nudge appears only when an EV wins; links carry `rel="sponsored"`.
- **No-regression:** ICE-only and existing shared `#c=` links behave exactly as before
  (`chargerInstall` defaults to 0 / absent).

## Rollout

Feature branch `feat/monetisation` → verify → PR → merge (auto-deploys). Owner swaps placeholder
affiliate URLs for real ones as accounts are approved; links earn from the moment a real URL lands.
