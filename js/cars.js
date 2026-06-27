// cars.js — representative UK cars to prefill a scenario. Figures are typical used-market
// starting points (price, efficiency, depreciation, insurance, servicing, road tax) — every
// value stays editable after you pick one. Not endorsements; just sensible defaults.

export const CARS = [
  // --- Electric ---
  { id: "eniro64", name: "Kia e-Niro 64 kWh", powertrain: "ev", milesPerKwh: 4.0, purchasePrice: 16000, depreciationPctPerYear: 0.11, insurancePerYear: 520, servicingPerYear: 150, vedPerYear: 0 },
  { id: "kona64", name: "Hyundai Kona Electric 64 kWh", powertrain: "ev", milesPerKwh: 4.2, purchasePrice: 15000, depreciationPctPerYear: 0.11, insurancePerYear: 520, servicingPerYear: 150, vedPerYear: 0 },
  { id: "kona39", name: "Hyundai Kona Electric 39 kWh", powertrain: "ev", milesPerKwh: 4.3, purchasePrice: 12000, depreciationPctPerYear: 0.11, insurancePerYear: 500, servicingPerYear: 150, vedPerYear: 0 },
  { id: "leaf40", name: "Nissan Leaf 40 kWh", powertrain: "ev", milesPerKwh: 3.8, purchasePrice: 11000, depreciationPctPerYear: 0.12, insurancePerYear: 480, servicingPerYear: 150, vedPerYear: 0 },
  { id: "model3", name: "Tesla Model 3 RWD", powertrain: "ev", milesPerKwh: 4.0, purchasePrice: 20000, depreciationPctPerYear: 0.12, insurancePerYear: 600, servicingPerYear: 180, vedPerYear: 195 },
  { id: "mg4", name: "MG4 51 kWh", powertrain: "ev", milesPerKwh: 3.9, purchasePrice: 15000, depreciationPctPerYear: 0.13, insurancePerYear: 500, servicingPerYear: 150, vedPerYear: 195 },
  { id: "zoe", name: "Renault Zoe 52 kWh", powertrain: "ev", milesPerKwh: 3.9, purchasePrice: 9000, depreciationPctPerYear: 0.14, insurancePerYear: 480, servicingPerYear: 150, vedPerYear: 0 },
  { id: "id3", name: "VW ID.3 58 kWh", powertrain: "ev", milesPerKwh: 4.0, purchasePrice: 17000, depreciationPctPerYear: 0.12, insurancePerYear: 540, servicingPerYear: 160, vedPerYear: 0 },
  { id: "ioniq5", name: "Hyundai Ioniq 5 73 kWh", powertrain: "ev", milesPerKwh: 3.7, purchasePrice: 22000, depreciationPctPerYear: 0.12, insurancePerYear: 580, servicingPerYear: 160, vedPerYear: 195 },
  { id: "ioniq28", name: "Hyundai Ioniq Electric 28 kWh", powertrain: "ev", milesPerKwh: 4.5, purchasePrice: 11000, depreciationPctPerYear: 0.12, insurancePerYear: 480, servicingPerYear: 150, vedPerYear: 0 },
  // Electric SUVs / crossovers — the affordable used-SUV segment (~£9–14k, 150+ mile range)
  { id: "mgzsev", name: "MG ZS EV Long Range", powertrain: "ev", milesPerKwh: 3.6, purchasePrice: 12000, depreciationPctPerYear: 0.13, insurancePerYear: 480, servicingPerYear: 150, vedPerYear: 0 },
  { id: "e2008", name: "Peugeot e-2008 50 kWh", powertrain: "ev", milesPerKwh: 3.8, purchasePrice: 13000, depreciationPctPerYear: 0.13, insurancePerYear: 500, servicingPerYear: 160, vedPerYear: 0 },
  { id: "mokkae", name: "Vauxhall Mokka-e 50 kWh", powertrain: "ev", milesPerKwh: 3.8, purchasePrice: 12500, depreciationPctPerYear: 0.13, insurancePerYear: 480, servicingPerYear: 160, vedPerYear: 0 },
  { id: "ec4", name: "Citroen e-C4 50 kWh", powertrain: "ev", milesPerKwh: 3.7, purchasePrice: 13000, depreciationPctPerYear: 0.13, insurancePerYear: 490, servicingPerYear: 160, vedPerYear: 0 },
  { id: "soulev", name: "Kia Soul EV 64 kWh", powertrain: "ev", milesPerKwh: 3.8, purchasePrice: 14000, depreciationPctPerYear: 0.12, insurancePerYear: 500, servicingPerYear: 150, vedPerYear: 0 },
  // Larger / newer electric SUVs (broader budget)
  { id: "id4", name: "VW ID.4 Pro 77 kWh", powertrain: "ev", milesPerKwh: 3.6, purchasePrice: 19000, depreciationPctPerYear: 0.12, insurancePerYear: 560, servicingPerYear: 170, vedPerYear: 195 },
  { id: "enyaq", name: "Skoda Enyaq 60", powertrain: "ev", milesPerKwh: 3.6, purchasePrice: 20000, depreciationPctPerYear: 0.12, insurancePerYear: 560, servicingPerYear: 170, vedPerYear: 195 },
  { id: "ariya", name: "Nissan Ariya 63 kWh", powertrain: "ev", milesPerKwh: 3.5, purchasePrice: 20000, depreciationPctPerYear: 0.13, insurancePerYear: 560, servicingPerYear: 160, vedPerYear: 195 },
  { id: "atto3", name: "BYD Atto 3 60 kWh", powertrain: "ev", milesPerKwh: 3.7, purchasePrice: 19000, depreciationPctPerYear: 0.13, insurancePerYear: 540, servicingPerYear: 150, vedPerYear: 195 },
  { id: "xc40", name: "Volvo XC40 Recharge", powertrain: "ev", milesPerKwh: 3.2, purchasePrice: 22000, depreciationPctPerYear: 0.12, insurancePerYear: 600, servicingPerYear: 180, vedPerYear: 195 },
  { id: "modely", name: "Tesla Model Y RWD", powertrain: "ev", milesPerKwh: 3.9, purchasePrice: 24000, depreciationPctPerYear: 0.12, insurancePerYear: 620, servicingPerYear: 180, vedPerYear: 195 },

  // --- Petrol ---
  { id: "fiesta", name: "Ford Fiesta 1.0", powertrain: "petrol", mpg: 50, purchasePrice: 8000, depreciationPctPerYear: 0.10, insurancePerYear: 380, servicingPerYear: 280, vedPerYear: 180 },
  { id: "golf-p", name: "VW Golf 1.5 TSI", powertrain: "petrol", mpg: 45, purchasePrice: 12000, depreciationPctPerYear: 0.10, insurancePerYear: 420, servicingPerYear: 320, vedPerYear: 180 },
  { id: "yaris", name: "Toyota Yaris 1.5", powertrain: "petrol", mpg: 55, purchasePrice: 11000, depreciationPctPerYear: 0.09, insurancePerYear: 360, servicingPerYear: 260, vedPerYear: 180 },
  { id: "corsa", name: "Vauxhall Corsa 1.2", powertrain: "petrol", mpg: 50, purchasePrice: 9000, depreciationPctPerYear: 0.10, insurancePerYear: 380, servicingPerYear: 280, vedPerYear: 180 },
  { id: "bmax", name: "Ford B-Max 1.4 (older)", powertrain: "petrol", mpg: 42, purchasePrice: 4000, depreciationPctPerYear: 0.10, insurancePerYear: 340, servicingPerYear: 320, vedPerYear: 180 },

  // --- Diesel ---
  { id: "focus-d", name: "Ford Focus 1.5 TDCi", powertrain: "diesel", mpg: 60, purchasePrice: 9000, depreciationPctPerYear: 0.11, insurancePerYear: 420, servicingPerYear: 320, vedPerYear: 180 },
  { id: "passat-d", name: "VW Passat 2.0 TDI", powertrain: "diesel", mpg: 55, purchasePrice: 12000, depreciationPctPerYear: 0.11, insurancePerYear: 460, servicingPerYear: 360, vedPerYear: 180 },
  { id: "320d", name: "BMW 320d", powertrain: "diesel", mpg: 58, purchasePrice: 14000, depreciationPctPerYear: 0.12, insurancePerYear: 520, servicingPerYear: 420, vedPerYear: 190 },

  // --- Hybrid ---
  { id: "corolla-h", name: "Toyota Corolla Hybrid", powertrain: "hybrid", mpg: 60, purchasePrice: 16000, depreciationPctPerYear: 0.10, insurancePerYear: 420, servicingPerYear: 300, vedPerYear: 180 },
  { id: "prius", name: "Toyota Prius", powertrain: "hybrid", mpg: 65, purchasePrice: 14000, depreciationPctPerYear: 0.10, insurancePerYear: 420, servicingPerYear: 300, vedPerYear: 180 },
  { id: "jazz-h", name: "Honda Jazz e:HEV", powertrain: "hybrid", mpg: 60, purchasePrice: 15000, depreciationPctPerYear: 0.10, insurancePerYear: 400, servicingPerYear: 280, vedPerYear: 180 },
  { id: "niro-h", name: "Kia Niro Hybrid", powertrain: "hybrid", mpg: 58, purchasePrice: 15000, depreciationPctPerYear: 0.10, insurancePerYear: 420, servicingPerYear: 300, vedPerYear: 180 },
];

export const CAR_GROUPS = [
  { label: "Electric", powertrain: "ev" },
  { label: "Petrol", powertrain: "petrol" },
  { label: "Diesel", powertrain: "diesel" },
  { label: "Hybrid", powertrain: "hybrid" },
];

/** Fields a chosen car contributes to a scenario (mileage & charging mix are left untouched).
 *  By default a baseline card represents a car you already OWN, so its current value is seeded from
 *  the price and purchasePrice is cleared. Pass { asPurchase: true } for a baseline that is a car
 *  you'd BUY (e.g. replacing a lost car) so it keeps purchasePrice and stays a "buy" shape. */
export function applyCarToScenario(scenario, car, opts = {}) {
  const fields = ["powertrain", "mpg", "milesPerKwh", "purchasePrice",
    "depreciationPctPerYear", "insurancePerYear", "servicingPerYear", "vedPerYear"];
  const next = { ...scenario, carId: car.id, label: car.name };
  for (const f of fields) if (car[f] != null) next[f] = car[f];
  if (scenario.role === "baseline" && !opts.asPurchase) {
    next.currentValue = car.purchasePrice; // a car you already own
    delete next.purchasePrice;             // keep it a "keep" shape for assetValue0/upfrontCash
  } else if (opts.asPurchase) {
    delete next.currentValue;              // a car you'd buy — keep it a "buy" shape
  }
  // Clear the efficiency field that doesn't apply to the new powertrain.
  if (car.powertrain === "ev") delete next.mpg; else delete next.milesPerKwh;
  return next;
}
