// model.js — pure total-cost-of-ownership maths. No DOM, no globals.
// Imported by the browser (app.js) and by the Node test runner (test/model.test.mjs).
//
// Formulas follow the UK TCO framework in the repo research note:
//   ICE fuel/yr   = (miles / mpg) * 4.54609 * pricePerLitre   (UK gallon)
//   EV energy/yr  = (miles / milesPerKwh) * blended £/kWh
// Cumulative cost uses a wealth model so the crossover is economically fair:
//   cost(t) = Σ running(1..t) + assetValue0 * (1 - (1-dep)^t) + bigRepairs up to t
// i.e. buying a car is not an instant loss — it converts cash to an asset that
// then loses value via depreciation. This is what makes "keep vs switch" comparable.

export const LITRES_PER_UK_GALLON = 4.54609;

/** Sensible, editable UK 2026 default rates (every field is overridable in the UI). */
export const DEFAULT_RATES = Object.freeze({
  petrolPerLitre: 1.40,
  dieselPerLitre: 1.45,
  elecHomePerKwh: 0.27,   // standard home tariff
  elecPublicPerKwh: 0.79, // typical rapid public charger
  elecSolarPerKwh: 0.0,   // marginal cost of self-generated solar
  years: 5,               // ownership / comparison horizon
});

const isEv = (s) => s.powertrain === "ev";

/** Fuel price for an ICE/hybrid scenario based on its powertrain. */
function fuelPriceFor(scenario, rates) {
  return scenario.powertrain === "diesel" ? rates.dieselPerLitre : rates.petrolPerLitre;
}

/** Blended £/kWh from the EV's home / public / solar charging split. Normalised by the actual
 *  total so the result is sane for any split (the UI also clamps the total to 100%). */
export function blendedKwhPrice(scenario, rates) {
  const home = Math.max(0, scenario.homePct ?? 100);
  const pub = Math.max(0, scenario.publicPct ?? 0);
  const solar = Math.max(0, scenario.solarPct ?? 0);
  const total = home + pub + solar;
  if (total <= 0) return rates.elecHomePerKwh; // no mix given → assume home charging
  return (home * rates.elecHomePerKwh + pub * rates.elecPublicPerKwh + solar * rates.elecSolarPerKwh) / total;
}

/** Annual energy (fuel or electricity) cost in £. */
export function annualEnergyCost(scenario, rates) {
  if (isEv(scenario)) {
    return (scenario.annualMiles / scenario.milesPerKwh) * blendedKwhPrice(scenario, rates);
  }
  return (scenario.annualMiles / scenario.mpg) * LITRES_PER_UK_GALLON * fuelPriceFor(scenario, rates);
}

/** Fixed yearly running costs (excludes depreciation and one-off repairs). Includes an optional
 *  repairs/wear allowance — how an older car's higher upkeep enters the comparison. */
export function annualRunningCost(scenario, rates) {
  return (
    annualEnergyCost(scenario, rates) +
    (scenario.insurancePerYear ?? 0) +
    (scenario.servicingPerYear ?? 0) +
    (scenario.repairsPerYear ?? 0) +
    (scenario.vedPerYear ?? 0)
  );
}

/** Component breakdown for the stacked bar (per year, energy is year-1 representative). */
export function annualBreakdown(scenario, rates) {
  return {
    energy: annualEnergyCost(scenario, rates),
    insurance: scenario.insurancePerYear ?? 0,
    servicing: (scenario.servicingPerYear ?? 0) + (scenario.repairsPerYear ?? 0),
    ved: scenario.vedPerYear ?? 0,
    depreciation: assetValue0(scenario) * (scenario.depreciationPctPerYear ?? 0),
  };
}

/** The capital tied up in this car today: current resale value if kept, purchase price if bought. */
export function assetValue0(scenario) {
  return scenario.role === "baseline" ? (scenario.currentValue ?? 0) : (scenario.purchasePrice ?? 0);
}

/** Depreciation lost by end of year t (reducing-balance). */
function depreciationLoss(scenario, t) {
  const dep = scenario.depreciationPctPerYear ?? 0;
  return assetValue0(scenario) * (1 - Math.pow(1 - dep, t));
}

/** One-off repairs incurred up to and including year t. */
function repairsUpTo(scenario, t) {
  return (scenario.bigRepairs ?? []).filter((r) => r.year <= t).reduce((sum, r) => sum + r.amount, 0);
}

/** Cumulative cost at integer year t (t may be 0..years). */
export function cumulativeCostAt(scenario, rates, t) {
  return annualRunningCost(scenario, rates) * t + depreciationLoss(scenario, t) + repairsUpTo(scenario, t);
}

/** Cumulative cost series [t=0 .. t=years] for charting. */
export function cumulativeSeries(scenario, rates) {
  const out = [];
  for (let t = 0; t <= rates.years; t++) out.push(cumulativeCostAt(scenario, rates, t));
  return out;
}

/** Upfront cash needed to take this option today (0 for keeping the current car). */
export function upfrontCash(scenario) {
  if (scenario.role === "baseline") return 0;
  return Math.max(0, (scenario.purchasePrice ?? 0) - (scenario.tradeInValue ?? 0));
}

/** All-in pence per mile over the full horizon. */
export function pencePerMile(scenario, rates) {
  const miles = scenario.annualMiles * rates.years;
  if (miles <= 0) return 0;
  return (cumulativeCostAt(scenario, rates, rates.years) / miles) * 100;
}

/** Running-only pence per mile (energy + insurance + servicing + tax; no depreciation). */
export function runningPencePerMile(scenario, rates) {
  if (scenario.annualMiles <= 0) return 0;
  return (annualRunningCost(scenario, rates) / scenario.annualMiles) * 100;
}

/**
 * Compare a "switch" scenario against a "baseline".
 * Returns the break-even year (fractional, interpolated), lifetime saving at the
 * horizon, and the upfront cash gap. breakEvenYear is null if it never pays back
 * within the horizon.
 */
export function compare(baseline, switchTo, rates) {
  // breakEvenYear: null = never within horizon; 0 = cheaper from year one; >0 = the
  // interpolated crossover year. (At t=0 both costs are 0, so we sample from t=1.)
  let breakEvenYear = null;
  let prevDiff = null;
  for (let t = 1; t <= rates.years; t++) {
    const diff = cumulativeCostAt(switchTo, rates, t) - cumulativeCostAt(baseline, rates, t);
    if (prevDiff === null) {
      if (diff <= 0) { breakEvenYear = 0; break; } // cheaper from the first year
    } else if (prevDiff > 0 && diff <= 0) {
      // Linear interpolation between (t-1, prevDiff) and (t, diff) for a smooth year.
      breakEvenYear = t - 1 + prevDiff / (prevDiff - diff);
      break;
    }
    prevDiff = diff;
  }
  const lifetimeSaving =
    cumulativeCostAt(baseline, rates, rates.years) - cumulativeCostAt(switchTo, rates, rates.years);
  return { breakEvenYear, lifetimeSaving, upfrontCash: upfrontCash(switchTo) };
}

/**
 * Why two scenarios' cumulative-cost lines separate, broken into the cost factors that differ,
 * ranked by size over the horizon. A positive `amount` means the switch SAVES on that factor;
 * negative means it COSTS more. The amounts sum exactly to compare().lifetimeSaving, because
 * they are the same terms as cumulativeCostAt (running×years + reducing-balance depreciation +
 * one-off repairs), differenced between the two scenarios.
 */
export function divergenceReasons(baseline, switchTo, rates) {
  const y = rates.years;
  const annual = (s, field) => (s[field] ?? 0) * y;
  const reasons = [
    { key: "energy", label: "Fuel vs electricity", amount: (annualEnergyCost(baseline, rates) - annualEnergyCost(switchTo, rates)) * y },
    { key: "depreciation", label: "Depreciation", amount: depreciationLoss(baseline, y) - depreciationLoss(switchTo, y) },
    { key: "servicing", label: "Servicing & repairs", amount: (annual(baseline, "servicingPerYear") + annual(baseline, "repairsPerYear")) - (annual(switchTo, "servicingPerYear") + annual(switchTo, "repairsPerYear")) },
    { key: "insurance", label: "Insurance", amount: annual(baseline, "insurancePerYear") - annual(switchTo, "insurancePerYear") },
    { key: "ved", label: "Road tax (VED)", amount: annual(baseline, "vedPerYear") - annual(switchTo, "vedPerYear") },
    { key: "repairs", label: "One-off repairs", amount: repairsUpTo(baseline, y) - repairsUpTo(switchTo, y) },
  ].filter((r) => Math.abs(r.amount) >= 1);
  reasons.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  return reasons;
}
