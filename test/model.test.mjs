// Run with:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_RATES,
  LITRES_PER_UK_GALLON,
  blendedKwhPrice,
  annualEnergyCost,
  annualRunningCost,
  cumulativeCostAt,
  cumulativeSeries,
  pencePerMile,
  upfrontCash,
  compare,
  divergenceReasons,
} from "../js/model.js";

const approx = (actual, expected, tol = 0.5) =>
  assert.ok(Math.abs(actual - expected) <= tol, `expected ~${expected}, got ${actual}`);

const rates = { ...DEFAULT_RATES, years: 5 };

test("petrol annual fuel cost matches the UK-gallon formula", () => {
  const car = { powertrain: "petrol", annualMiles: 12000, mpg: 45 };
  const expected = (12000 / 45) * LITRES_PER_UK_GALLON * rates.petrolPerLitre;
  approx(annualEnergyCost(car, rates), expected, 0.01);
  approx(expected, 1697.21, 0.5); // sanity: ~£1,697/yr
});

test("diesel uses the diesel price, not petrol", () => {
  const d = { powertrain: "diesel", annualMiles: 12000, mpg: 55 };
  const expected = (12000 / 55) * LITRES_PER_UK_GALLON * rates.dieselPerLitre;
  approx(annualEnergyCost(d, rates), expected, 0.01);
});

test("EV home-only energy cost", () => {
  const ev = { powertrain: "ev", annualMiles: 12000, milesPerKwh: 3.6, homePct: 100 };
  approx(annualEnergyCost(ev, rates), (12000 / 3.6) * 0.27, 0.5); // £900
});

test("solar charging blends the kWh price down", () => {
  const ev = { powertrain: "ev", annualMiles: 12000, milesPerKwh: 3.6, homePct: 50, solarPct: 50 };
  approx(blendedKwhPrice(ev, rates), 0.135, 0.001);
  approx(annualEnergyCost(ev, rates), (12000 / 3.6) * 0.135, 0.5); // £450
});

test("blendedKwhPrice normalises by the actual split, even if it doesn't sum to 100", () => {
  // 50/50 home/solar that sums to 100 → midpoint.
  approx(blendedKwhPrice({ homePct: 50, solarPct: 50 }, rates), 0.135, 0.001);
  // Same ratio but written as 30/30 (sums to 60) → must still normalise to the midpoint,
  // never inflate the price by treating the denominator as a fixed 100.
  approx(blendedKwhPrice({ homePct: 30, solarPct: 30 }, rates), 0.135, 0.001);
  // Empty mix falls back to the home rate rather than dividing by zero.
  approx(blendedKwhPrice({ homePct: 0, publicPct: 0, solarPct: 0 }, rates), rates.elecHomePerKwh, 0.001);
});

test("divergenceReasons sum exactly to the lifetime saving", () => {
  const keep = {
    role: "baseline", powertrain: "petrol", annualMiles: 15000, mpg: 40,
    currentValue: 4000, depreciationPctPerYear: 0.15,
    insurancePerYear: 350, servicingPerYear: 400, vedPerYear: 180,
    bigRepairs: [{ year: 2, amount: 700 }],
  };
  const ev = {
    role: "switch", powertrain: "ev", annualMiles: 15000, milesPerKwh: 3.6,
    homePct: 80, publicPct: 20, purchasePrice: 16000, tradeInValue: 4000,
    depreciationPctPerYear: 0.12, insurancePerYear: 500, servicingPerYear: 150, vedPerYear: 0,
  };
  const r = { ...rates, years: 7 };
  const reasons = divergenceReasons(keep, ev, r);
  const summed = reasons.reduce((s, x) => s + x.amount, 0);
  const { lifetimeSaving } = compare(keep, ev, r);
  approx(summed, lifetimeSaving, 0.5);
  // ranked by magnitude
  for (let i = 1; i < reasons.length; i++) {
    assert.ok(Math.abs(reasons[i - 1].amount) >= Math.abs(reasons[i].amount));
  }
});

test("EV per-mile is cheaper than petrol per-mile (research sanity band)", () => {
  const ev = { powertrain: "ev", annualMiles: 12000, milesPerKwh: 3.6, homePct: 100 };
  const ice = { powertrain: "petrol", annualMiles: 12000, mpg: 45 };
  const evPpm = (annualEnergyCost(ev, rates) / 12000) * 100;
  const icePpm = (annualEnergyCost(ice, rates) / 12000) * 100;
  assert.ok(evPpm < icePpm, "EV should be cheaper per mile to fuel");
  assert.ok(evPpm < 8 && icePpm > 12, `ppm out of band: ev=${evPpm}, ice=${icePpm}`);
});

test("cumulative cost at t=0 is just incurred repairs (no depreciation yet)", () => {
  const car = {
    role: "switch", powertrain: "ev", annualMiles: 12000, milesPerKwh: 3.6, homePct: 100,
    purchasePrice: 20000, depreciationPctPerYear: 0.12,
  };
  assert.equal(cumulativeCostAt(car, rates, 0), 0);
});

test("cumulative series has years+1 points and is monotonic increasing", () => {
  const car = {
    role: "switch", powertrain: "petrol", annualMiles: 12000, mpg: 45,
    purchasePrice: 15000, depreciationPctPerYear: 0.1, insurancePerYear: 400, servicingPerYear: 300,
  };
  const s = cumulativeSeries(car, rates);
  assert.equal(s.length, rates.years + 1);
  for (let i = 1; i < s.length; i++) assert.ok(s[i] > s[i - 1]);
});

test("upfront cash is purchase minus trade-in, never negative; zero when keeping", () => {
  assert.equal(upfrontCash({ role: "baseline", currentValue: 4000 }), 0);
  assert.equal(upfrontCash({ role: "switch", purchasePrice: 15000, tradeInValue: 4000 }), 11000);
  assert.equal(upfrontCash({ role: "switch", purchasePrice: 3000, tradeInValue: 5000 }), 0);
});

test("compare() finds a break-even year and lifetime saving for a sensible switch", () => {
  const keep = {
    role: "baseline", powertrain: "petrol", annualMiles: 15000, mpg: 40,
    currentValue: 4000, depreciationPctPerYear: 0.15,
    insurancePerYear: 350, servicingPerYear: 400, vedPerYear: 180,
  };
  const ev = {
    role: "switch", powertrain: "ev", annualMiles: 15000, milesPerKwh: 3.6,
    homePct: 80, publicPct: 20, purchasePrice: 16000, tradeInValue: 4000,
    depreciationPctPerYear: 0.12, insurancePerYear: 500, servicingPerYear: 150, vedPerYear: 0,
  };
  const r = compare(keep, ev, { ...rates, years: 8 });
  assert.ok(r.breakEvenYear > 0 && r.breakEvenYear < 8, `breakEven=${r.breakEvenYear}`);
  assert.ok(r.lifetimeSaving > 0, `saving=${r.lifetimeSaving}`);
  assert.equal(r.upfrontCash, 12000);
});

test("compare() reports break-even 0 when the switch is cheaper from year one", () => {
  // A cheaper, less-depreciating switch beats keeping a fast-depreciating dearer car immediately.
  const keep = {
    role: "baseline", powertrain: "petrol", annualMiles: 15000, mpg: 30,
    currentValue: 12000, depreciationPctPerYear: 0.25,
    insurancePerYear: 700, servicingPerYear: 600, vedPerYear: 195,
  };
  const ev = {
    role: "switch", powertrain: "ev", annualMiles: 15000, milesPerKwh: 4.0,
    homePct: 100, purchasePrice: 6000, tradeInValue: 12000,
    depreciationPctPerYear: 0.08, insurancePerYear: 400, servicingPerYear: 150, vedPerYear: 0,
  };
  const r = compare(keep, ev, { ...rates, years: 5 });
  assert.equal(r.breakEvenYear, 0);
  assert.ok(r.lifetimeSaving > 0);
});

test("compare() reports no break-even when the switch never pays back", () => {
  const cheapKeep = {
    role: "baseline", powertrain: "petrol", annualMiles: 3000, mpg: 50,
    currentValue: 1500, depreciationPctPerYear: 0.1, insurancePerYear: 250, servicingPerYear: 150,
  };
  const dearEv = {
    role: "switch", powertrain: "ev", annualMiles: 3000, milesPerKwh: 3.0,
    homePct: 0, publicPct: 100, purchasePrice: 40000, tradeInValue: 1500,
    depreciationPctPerYear: 0.18, insurancePerYear: 700, servicingPerYear: 200, vedPerYear: 195,
  };
  const r = compare(cheapKeep, dearEv, { ...rates, years: 5 });
  assert.equal(r.breakEvenYear, null);
  assert.ok(r.lifetimeSaving < 0);
});
