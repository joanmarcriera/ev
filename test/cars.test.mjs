// Run with:  node --test
// Covers the powertrain-switch reconciliation that backs the car picker and the powertrain
// dropdown — the source of the "charger install / solar cost didn't update when I changed car"
// bug and the NaN-on-powertrain-flip bug.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CARS, applyCarToScenario, normalizeForPowertrain } from "../js/cars.js";
import { annualEnergyCost, cumulativeCostAt, DEFAULT_RATES } from "../js/model.js";

const rates = { ...DEFAULT_RATES, years: 5 };
const petrolCar = CARS.find((c) => c.powertrain === "petrol");
const evCarA = CARS.find((c) => c.powertrain === "ev");
const evCarB = CARS.filter((c) => c.powertrain === "ev").at(-1); // a different EV

test("normalizeForPowertrain on an EV seeds miles/kWh + a charging split and strips mpg", () => {
  const out = normalizeForPowertrain({ powertrain: "ev", mpg: 45 });
  assert.equal(out.mpg, undefined, "mpg should be stripped from an EV");
  assert.ok(out.milesPerKwh > 0, "milesPerKwh should be seeded");
  assert.equal(out.homePct, 100);
  assert.equal(out.publicPct, 0);
  assert.equal(out.solarPct, 0);
});

test("normalizeForPowertrain on an EV preserves an existing efficiency and charging mix", () => {
  const out = normalizeForPowertrain({ powertrain: "ev", milesPerKwh: 3.6, homePct: 60, publicPct: 5, solarPct: 35 });
  assert.equal(out.milesPerKwh, 3.6);
  assert.deepEqual([out.homePct, out.publicPct, out.solarPct], [60, 5, 35]);
});

test("normalizeForPowertrain on an ICE car strips every EV-only field and seeds mpg", () => {
  const out = normalizeForPowertrain({
    powertrain: "petrol", milesPerKwh: 3.6, chargerInstall: 1000, homePct: 60, publicPct: 5, solarPct: 35,
  });
  for (const f of ["milesPerKwh", "chargerInstall", "homePct", "publicPct", "solarPct"]) {
    assert.equal(out[f], undefined, `${f} should be stripped from an ICE car`);
  }
  assert.ok(out.mpg > 0, "mpg should be seeded");
});

test("normalizeForPowertrain is idempotent", () => {
  const once = normalizeForPowertrain({ powertrain: "ev", mpg: 45 });
  assert.deepEqual(normalizeForPowertrain(once), once);
});

test("switching an EV scenario to a petrol car drops the charger install and solar from the cost", () => {
  // The reported bug: a used-EV scenario with a £1,000 home charger and a solar mix, re-picked as a
  // petrol car, must shed both — otherwise the petrol option keeps a phantom charger-install cost.
  const evScenario = {
    id: "opt", role: "switch", powertrain: "ev", annualMiles: 9000, milesPerKwh: 3.6,
    homePct: 60, publicPct: 5, solarPct: 35, chargerInstall: 1000,
    purchasePrice: 15000, depreciationPctPerYear: 0.12,
  };
  const switched = applyCarToScenario(evScenario, petrolCar, { asPurchase: true });
  assert.equal(switched.powertrain, "petrol");
  assert.equal(switched.chargerInstall, undefined, "charger install must not survive onto a petrol car");
  assert.equal(switched.solarPct, undefined, "solar mix must not survive onto a petrol car");
  assert.equal(switched.milesPerKwh, undefined);
  assert.ok(switched.mpg > 0, "petrol car contributes an mpg");
  // The phantom £1,000 is gone: the cost is finite and carries no chargerInstall key.
  assert.ok(Number.isFinite(cumulativeCostAt(switched, rates, 5)));
  assert.ok(!Object.prototype.hasOwnProperty.call(switched, "chargerInstall"));
});

test("switching between two EVs keeps the charger install and charging mix", () => {
  const evScenario = {
    id: "opt", role: "switch", powertrain: "ev", annualMiles: 9000, milesPerKwh: 3.6,
    homePct: 60, publicPct: 5, solarPct: 35, chargerInstall: 1000,
    purchasePrice: 15000, depreciationPctPerYear: 0.12,
  };
  const switched = applyCarToScenario(evScenario, evCarB, { asPurchase: true });
  assert.equal(switched.powertrain, "ev");
  assert.equal(switched.chargerInstall, 1000, "still an EV — the charger install is still relevant");
  assert.deepEqual([switched.homePct, switched.publicPct, switched.solarPct], [60, 5, 35]);
  assert.equal(switched.milesPerKwh, evCarB.milesPerKwh, "efficiency comes from the new EV");
});

test("switching a petrol scenario to an EV car yields a finite energy cost (no NaN)", () => {
  const petrolScenario = {
    id: "opt", role: "switch", powertrain: "petrol", annualMiles: 9000, mpg: 45,
    purchasePrice: 9000, depreciationPctPerYear: 0.10,
  };
  const switched = applyCarToScenario(petrolScenario, evCarA, { asPurchase: true });
  assert.equal(switched.powertrain, "ev");
  assert.ok(switched.milesPerKwh > 0);
  assert.equal(switched.mpg, undefined);
  const cost = annualEnergyCost(switched, rates);
  assert.ok(Number.isFinite(cost) && cost > 0, `expected a finite energy cost, got ${cost}`);
});

test("a manual powertrain flip to EV with no efficiency yet still costs out finitely", () => {
  // Mirrors the dropdown path: powertrain changes, no car chosen, milesPerKwh absent.
  const flipped = normalizeForPowertrain({ powertrain: "ev", annualMiles: 9000, mpg: 42 });
  assert.ok(Number.isFinite(annualEnergyCost(flipped, rates)));
  assert.equal(flipped.mpg, undefined);
});
