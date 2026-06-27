// onboarding.js — the guided "Start here" front door. A small step machine that asks a few
// plain-language questions and builds a sensible comparison for someone with no car knowledge.
//
// There are NO free-text inputs here: every answer is a fixed button or a <select> of our own car
// list, so only known strings/numbers ever reach innerHTML. The result is a state object in the
// SAME shape loadTemplate() returns ({ key, label, blurb, rates, scenarios }); app.js owns rendering.

import { DEFAULT_RATES } from "./model.js";
import { loadTemplate } from "./templates.js";
import { CARS, CAR_GROUPS, applyCarToScenario } from "./cars.js";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- answer → number/split maps ----------
const SITUATIONS = [
  { key: "keep", title: "Keep my car, or switch to electric?", sub: "You've got a running car and wonder if an EV would actually save money." },
  { key: "replace", title: "I've lost my car — what should I replace it with?", sub: "Written off, scrapped or stolen. Compare a used EV, petrol and diesel." },
  { key: "buy", title: "I'm buying my next car — is an EV right for me?", sub: "Thinking of buying. See an EV against a petrol on the way you drive." },
  { key: "compare", title: "Compare two specific cars", sub: "Pick any two and see which is cheaper to own over the years." },
];

const MILES_BANDS = [
  { title: "Not much", sub: "~5,000 miles a year — mostly local trips", miles: 5000 },
  { title: "Average", sub: "~9,000 miles a year — the UK average", miles: 9000 },
  { title: "A fair bit", sub: "~15,000 miles a year — a real commute", miles: 15000 },
  { title: "A lot", sub: "~25,000 miles a year — high mileage", miles: 25000 },
];

const CHARGING_BANDS = [
  { title: "At home", sub: "Driveway or garage, off a normal charger", split: { homePct: 90, publicPct: 10, solarPct: 0 } },
  { title: "I have solar panels", sub: "Charge partly from your own roof — near-free miles", split: { homePct: 55, publicPct: 5, solarPct: 40 } },
  { title: "Mostly public chargers", sub: "No off-street parking", split: { homePct: 20, publicPct: 80, solarPct: 0 } },
  { title: "Not sure / can't charge at home", sub: "We'll assume public charging", split: { homePct: 0, publicPct: 100, solarPct: 0 } },
];

const BUDGET_BANDS = [
  { title: "Tight", sub: "Around £8,000", budget: 8000 },
  { title: "Middle of the road", sub: "Around £13,000", budget: 13000 },
  { title: "A bit more", sub: "Around £20,000", budget: 20000 },
];

// Per-situation ordered list of follow-up steps. The situation choice itself is the implicit step -1.
const FLOWS = {
  keep: ["miles", "charging"],
  replace: ["miles", "charging", "budget"],
  buy: ["miles", "charging", "budget"],
  compare: ["carA", "carB", "miles", "charging"],
};

const STEP_CHOICES = { miles: MILES_BANDS, charging: CHARGING_BANDS, budget: BUDGET_BANDS };
const STEP_QUESTION = {
  miles: "Roughly how far do you drive?",
  charging: "Where would you charge an electric car?",
  budget: "Roughly what could you spend?",
};

/** Nearest-priced car of a given powertrain to a budget. */
const pickCar = (powertrain, budget) =>
  CARS.filter((c) => c.powertrain === powertrain)
    .reduce((best, c) => (Math.abs(c.purchasePrice - budget) < Math.abs(best.purchasePrice - budget) ? c : best));

// ---------- build a state object from the collected answers ----------
function applyDriving(st, answers) {
  const miles = answers.miles?.miles ?? 9000;
  const split = answers.charging?.split ?? { homePct: 80, publicPct: 20, solarPct: 0 };
  const canChargeAtHome = (split.homePct + split.solarPct) > 0;
  st.scenarios.forEach((sc) => {
    sc.annualMiles = miles;
    sc.milesUnit = "year";
    if (sc.powertrain === "ev") {
      sc.homePct = split.homePct; sc.publicPct = split.publicPct; sc.solarPct = split.solarPct;
      // A home charge point is a one-off cost only if they can actually charge at home.
      sc.chargerInstall = canChargeAtHome ? 1000 : 0;
    }
  });
  return st;
}

function buildReplace(answers, { evOnly } = {}) {
  const st = loadTemplate("replace-lost-car");
  const budget = answers.budget?.budget ?? 13000;
  st.scenarios = st.scenarios.map((sc) => {
    const car = pickCar(sc.powertrain, budget);
    return car ? applyCarToScenario(sc, car, { asPurchase: true }) : sc;
  });
  if (evOnly) {
    st.scenarios = st.scenarios.filter((sc) => sc.role !== "compare"); // keep petrol baseline + EV
    st.key = "buy-next";
    st.label = "Buying next: EV vs petrol";
    st.blurb = "Thinking of buying your next car — a used EV against a used petrol, on the way you drive.";
  }
  return applyDriving(st, answers);
}

function buildCompare(answers) {
  const carA = CARS.find((c) => c.id === answers.carA) ?? CARS[0];
  const carB = CARS.find((c) => c.id === answers.carB) ?? CARS.find((c) => c.powertrain === "petrol") ?? CARS[1];
  const mk = (id, role, car) => applyCarToScenario(
    { id, role, powertrain: car.powertrain, annualMiles: 9000, milesUnit: "year", homePct: 80, publicPct: 20, solarPct: 0 },
    car, { asPurchase: true },
  );
  const st = {
    key: "compare", label: "Compare two cars",
    blurb: "Two cars you picked, costed on the same mileage — which is cheaper to own over the years.",
    rates: { ...DEFAULT_RATES, years: 7 },
    scenarios: [mk("car-a", "baseline", carA), mk("car-b", "switch", carB)],
  };
  return applyDriving(st, answers);
}

function buildState(answers) {
  switch (answers.situation) {
    case "keep": return applyDriving(loadTemplate("keep-vs-used-ev-solar"), answers);
    case "replace": return buildReplace(answers, { evOnly: false });
    case "buy": return buildReplace(answers, { evOnly: true });
    case "compare": return buildCompare(answers);
    default: return loadTemplate("keep-vs-used-ev-solar");
  }
}

// ---------- the step machine ----------
export function initOnboarding({ onComplete, onSkip }) {
  const body = document.getElementById("onboard-body");
  const skipBtn = document.querySelector("#onboard .onboard-skip");
  const answers = {};
  let flow = [];
  let cursor = -1;       // -1 = the situation question; 0..flow.length-1 = a follow-up step
  let choices = [];      // the choice array backing the currently rendered index-based step

  const onKey = (e) => { if (e.key === "Escape") doSkip(); };

  function cleanup() { document.removeEventListener("keydown", onKey); }
  function doSkip() { cleanup(); onSkip(); }
  function finish() { cleanup(); onComplete(buildState(answers)); }

  const choiceHtml = (items) =>
    `<div class="onboard-choices">${items.map((c, i) =>
      `<button class="onboard-choice" data-pick="${i}"><strong>${esc(c.title)}</strong>${c.sub ? `<span>${esc(c.sub)}</span>` : ""}</button>`,
    ).join("")}</div>`;

  const backHtml = () => `<button class="onboard-back" data-back="1">← Back</button>`;

  function renderSituation() {
    choices = SITUATIONS;
    body.innerHTML = `<p class="onboard-q">What's your situation?</p>${choiceHtml(SITUATIONS)}`;
  }

  function renderStep(type) {
    if (type === "carA" || type === "carB") return renderCarPick(type);
    choices = STEP_CHOICES[type];
    body.innerHTML = `<p class="onboard-q">${esc(STEP_QUESTION[type])}</p>${choiceHtml(choices)}${backHtml()}`;
  }

  function renderCarPick(which) {
    const groups = CAR_GROUPS.map((g) => {
      const opts = CARS.filter((c) => c.powertrain === g.powertrain)
        .map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
      return `<optgroup label="${esc(g.label)}">${opts}</optgroup>`;
    }).join("");
    body.innerHTML = `<p class="onboard-q">Pick the ${which === "carA" ? "first" : "second"} car</p>
      <select class="onboard-select" id="onboard-car" aria-label="Choose a car">${groups}</select>
      <div class="onboard-actions"><button class="onboard-next" data-next="1">Continue →</button></div>${backHtml()}`;
  }

  // Each step replaces body.innerHTML, which drops focus to <body>. Move it to the first control of
  // the new step so keyboard users stay oriented (app.js handles the focus trap and restore).
  function focusFirst() {
    const el = body.querySelector(".onboard-choice, .onboard-select, .onboard-next, .onboard-back");
    if (el) el.focus();
  }

  function render() {
    if (cursor < 0) renderSituation();
    else renderStep(flow[cursor]);
    focusFirst();
  }

  function advance() {
    cursor += 1;
    if (cursor >= flow.length) finish();
    else render();
  }

  body.onclick = (e) => {
    const t = e.target.closest("[data-pick],[data-back],[data-next]");
    if (!t) return;
    if (t.dataset.back != null) { cursor -= 1; render(); return; }
    if (t.dataset.next != null) {
      const sel = document.getElementById("onboard-car");
      answers[flow[cursor]] = sel ? sel.value : CARS[0].id; // flow[cursor] is "carA" or "carB"
      advance();
      return;
    }
    const idx = +t.dataset.pick;
    if (cursor < 0) {
      answers.situation = SITUATIONS[idx].key;
      flow = FLOWS[answers.situation] ?? [];
      cursor = 0;
      render();
    } else {
      answers[flow[cursor]] = choices[idx];
      advance();
    }
  };

  if (skipBtn) skipBtn.onclick = doSkip;
  document.addEventListener("keydown", onKey);
  renderSituation();
}
