// templates.js — anonymised, fully-editable starting scenarios. No personal data.
// Each template provides global `rates` plus an ordered list of scenarios. The first
// scenario with role "baseline" is the thing you compare against (keep / current car);
// the first "switch" is the headline alternative. A third optional scenario can be added.
//
// All numbers are illustrative UK 2026 starting points — users change everything.

import { DEFAULT_RATES } from "./model.js";

export const TEMPLATES = {
  "keep-vs-used-ev-solar": {
    label: "Keep old car vs used EV + solar",
    blurb:
      "A paid-off petrol car with a regular weekly commute, versus a used 60-ish kWh EV " +
      "charged mostly from home solar. Shows whether near-free solar miles justify the switch.",
    rates: { ...DEFAULT_RATES, years: 7 },
    scenarios: [
      {
        id: "keep", role: "baseline", label: "Keep the petrol car", powertrain: "petrol",
        annualMiles: 9000, mpg: 42,
        currentValue: 4000, depreciationPctPerYear: 0.10,
        insurancePerYear: 350, servicingPerYear: 350, vedPerYear: 180,
        bigRepairs: [{ year: 3, amount: 800 }],
      },
      {
        id: "used-ev", role: "switch", label: "Used EV (solar charged)", powertrain: "ev",
        annualMiles: 9000, milesPerKwh: 3.6,
        homePct: 60, publicPct: 5, solarPct: 35,
        purchasePrice: 15000, tradeInValue: 4000, depreciationPctPerYear: 0.12,
        insurancePerYear: 500, servicingPerYear: 150, vedPerYear: 0,
      },
    ],
  },

  "mileage-jumped": {
    label: "Mileage jumped — now or wait?",
    blurb:
      "A commute that suddenly got longer, on a tight budget. The question is less 'is it " +
      "cheaper eventually' and more 'how soon does it pay back, and what cash do we need now?'",
    rates: { ...DEFAULT_RATES, years: 6 },
    scenarios: [
      {
        id: "keep", role: "baseline", label: "Keep current car", powertrain: "petrol",
        annualMiles: 18000, mpg: 40,
        currentValue: 5000, depreciationPctPerYear: 0.13,
        insurancePerYear: 450, servicingPerYear: 400, vedPerYear: 180,
      },
      {
        id: "switch-ev", role: "switch", label: "Switch to an EV now", powertrain: "ev",
        annualMiles: 18000, milesPerKwh: 3.8,
        homePct: 80, publicPct: 20, solarPct: 0,
        purchasePrice: 20000, tradeInValue: 5000, depreciationPctPerYear: 0.13,
        insurancePerYear: 600, servicingPerYear: 150, vedPerYear: 195,
      },
    ],
  },
};

export const DEFAULT_TEMPLATE = "keep-vs-used-ev-solar";

/** Deep clone a template so editing the live state never mutates the preset. */
export function loadTemplate(key) {
  const t = TEMPLATES[key] ?? TEMPLATES[DEFAULT_TEMPLATE];
  return {
    key,
    label: t.label,
    blurb: t.blurb,
    rates: { ...t.rates },
    scenarios: t.scenarios.map((s) => ({ ...s, bigRepairs: (s.bigRepairs ?? []).map((r) => ({ ...r })) })),
  };
}
