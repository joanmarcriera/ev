// app.js — wires inputs ↔ model ↔ charts. Framework-free ES module.
import {
  cumulativeSeries, annualBreakdown, pencePerMile, runningPencePerMile,
  cumulativeCostAt, compare, divergenceReasons,
} from "./model.js";
import { TEMPLATES, DEFAULT_TEMPLATE, loadTemplate } from "./templates.js";
import {
  createLineChart, createBarChart, updateLineChart, updateBarChart, setBreakEvenMarker,
} from "./charts.js";
import { CARS, CAR_GROUPS, applyCarToScenario } from "./cars.js";
import { initOnboarding } from "./onboarding.js";
import { relevantLinks, nudgeLink } from "./links.js";

const SERIES_COLORS = ["#D9772B", "#16A571", "#2E6BE6"]; // baseline, switch, third
const MAX_SCENARIOS = 3;
const POWERTRAINS = ["ev", "petrol", "diesel", "hybrid"];
const gbp = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const ppm = (v) => v.toFixed(1) + "p";
const $ = (sel, root = document) => root.querySelector(sel);

// Escape any user-controlled string before it touches innerHTML. Scenario labels and
// powertrain arrive from editable fields AND from the shareable URL hash, so they are
// untrusted; this neutralises reflected-XSS via a crafted #c= link.
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const num = (v, fallback = 0) => (Number.isFinite(+v) ? +v : fallback);

let state = null;
let lineChart, barChart;

// ---------- state <-> URL (shareable, nothing stored server-side) ----------
function encodeState() {
  try {
    const json = JSON.stringify({ k: state.key, r: state.rates, s: state.scenarios });
    location.hash = "c=" + btoa(encodeURIComponent(json));
  } catch { /* hash is a convenience only */ }
}
function decodeState() {
  const m = location.hash.match(/c=([^&]+)/);
  if (!m) return null;
  try {
    const o = JSON.parse(decodeURIComponent(atob(m[1])));
    return sanitizeState({
      key: o.k, label: TEMPLATES[o.k]?.label ?? "Custom", blurb: TEMPLATES[o.k]?.blurb ?? "",
      rates: o.r, scenarios: o.s,
    });
  } catch { return null; }
}

// Coerce a decoded payload into the expected shape: numbers stay numbers, powertrain is
// constrained to the known set, label is kept as a (later HTML-escaped) string.
function sanitizeState(o) {
  if (!o || !Array.isArray(o.scenarios) || !o.scenarios.length) return null;
  const r = o.rates || {};
  const rates = {
    petrolPerLitre: num(r.petrolPerLitre, 1.4), dieselPerLitre: num(r.dieselPerLitre, 1.45),
    elecHomePerKwh: num(r.elecHomePerKwh, 0.27), elecPublicPerKwh: num(r.elecPublicPerKwh, 0.79),
    elecSolarPerKwh: num(r.elecSolarPerKwh, 0), years: Math.max(1, Math.min(15, num(r.years, 5))),
  };
  const numFields = ["annualMiles", "mpg", "milesPerKwh", "homePct", "publicPct", "solarPct",
    "purchasePrice", "currentValue", "tradeInValue", "depreciationPctPerYear",
    "insurancePerYear", "servicingPerYear", "repairsPerYear", "vedPerYear", "ageYears", "chargerInstall"];
  const scenarios = o.scenarios.slice(0, MAX_SCENARIOS).map((s, i) => {
    const clean = {
      id: (String(s.id ?? "opt" + i).replace(/[^a-z0-9_-]/gi, "") || "opt" + i).slice(0, 40),
      label: String(s.label ?? "Option").slice(0, 60),
      role: s.role === "baseline" ? "baseline" : (s.role === "compare" ? "compare" : "switch"),
      powertrain: POWERTRAINS.includes(s.powertrain) ? s.powertrain : "petrol",
      milesUnit: s.milesUnit === "week" ? "week" : "year",
    };
    for (const f of numFields) if (s[f] != null) clean[f] = num(s[f]);
    if (Array.isArray(s.bigRepairs)) {
      clean.bigRepairs = s.bigRepairs.slice(0, 20).map((b) => ({ year: num(b.year), amount: num(b.amount) }));
    }
    return clean;
  });
  return { key: o.key, label: o.label, blurb: o.blurb, rates, scenarios };
}

// ---------- input field definitions ----------
const COMMON_FIELDS = [
  { f: "insurancePerYear", label: "Insurance £/yr", step: 25, min: 0 },
  { f: "servicingPerYear", label: "Servicing £/yr", step: 25, min: 0 },
  { f: "repairsPerYear", label: "Repairs £/yr", step: 25, min: 0 },
  { f: "vedPerYear", label: "Road tax £/yr", step: 5, min: 0 },
  { f: "depreciationPctPerYear", label: "Depreciation %/yr", step: 0.01, min: 0, max: 0.4, pct: true },
];
const CHARGE_FIELDS = ["homePct", "publicPct", "solarPct"];

// Keyed off which value the scenario actually holds (a kept car has currentValue; a bought car —
// including a bought baseline on the lost-car path — has purchasePrice), to match model.assetValue0.
function valueField(s) {
  return s.purchasePrice != null
    ? { f: "purchasePrice", label: "Purchase price £", step: 250, min: 0 }
    : { f: "currentValue", label: "Current value £", step: 250, min: 0 };
}

// ---------- render: scenario cards ----------
function renderScenarioCards() {
  const wrap = $("#scenario-cards");
  wrap.innerHTML = "";
  state.scenarios.forEach((s, i) => {
    const color = SERIES_COLORS[i] ?? "#2E6BE6";
    const card = document.createElement("div");
    card.className = "card scenario";
    card.style.setProperty("--accent", color);

    const removable = i >= 2;
    card.innerHTML = `
      <header class="scenario-head">
        <span class="dot" style="background:${color}"></span>
        <input class="scenario-name" data-sid="${s.id}" data-field="label" value="${esc(s.label)}" aria-label="Scenario name">
        ${removable ? `<button class="remove" data-remove="${s.id}" aria-label="Remove option">×</button>` : ""}
      </header>
      ${carPicker(s)}
      <label class="row">
        <span>Powertrain</span>
        <select data-sid="${s.id}" data-field="powertrain">
          ${["ev", "petrol", "diesel", "hybrid"].map((p) => `<option value="${p}" ${s.powertrain === p ? "selected" : ""}>${p === "ev" ? "Electric" : p[0].toUpperCase() + p.slice(1)}</option>`).join("")}
        </select>
      </label>
      ${numberRow(s, valueField(s))}
      ${s.powertrain === "ev"
        ? numberRow(s, { f: "milesPerKwh", label: "Miles / kWh", step: 0.1, min: 0.5 }) + chargingSplit(s)
          + numberRow(s, { f: "chargerInstall", label: "Charger install £", step: 50, min: 0 })
        : numberRow(s, { f: "mpg", label: "MPG", step: 1, min: 1 })}
      ${milesRow(s)}
      ${COMMON_FIELDS.map((cf) => numberRow(s, cf)).join("")}
      ${ageRow(s)}
    `;
    wrap.appendChild(card);
  });

  const addBtn = $("#add-scenario");
  addBtn.disabled = state.scenarios.length >= MAX_SCENARIOS;
}

function carPicker(s) {
  const groups = CAR_GROUPS.map((g) => {
    const opts = CARS.filter((c) => c.powertrain === g.powertrain)
      .map((c) => `<option value="${c.id}" ${s.carId === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("");
    return `<optgroup label="${g.label}">${opts}</optgroup>`;
  }).join("");
  return `<label class="row car-pick">
    <span>Pick a car</span>
    <select data-sid="${s.id}" data-field="carId" title="Prefill from a typical UK model — everything stays editable">
      <option value="">— custom —</option>${groups}
    </select>
  </label>`;
}

// Miles input with a year ⇄ week unit toggle. annualMiles is always the stored value.
function milesRow(s) {
  const unit = s.milesUnit === "week" ? "week" : "year";
  const annual = s.annualMiles ?? 0;
  const shown = unit === "week" ? Math.round(annual / 52) : Math.round(annual);
  return `<label class="row">
    <span>Miles / <button type="button" class="unit-toggle" data-sid="${s.id}" data-toggle="milesUnit" title="Switch between per-year and per-week">${unit}</button></span>
    <input type="number" inputmode="decimal" data-sid="${s.id}" data-field="annualMiles" data-unit="${unit}"
           value="${shown}" step="${unit === "week" ? 10 : 500}" min="0">
  </label>`;
}

function ageRow(s) {
  if (s.role !== "baseline") return "";
  const age = s.ageYears ?? 0;
  const endAge = age + (state.rates.years ?? 0);
  const note = (age >= 12 || endAge >= 18) && age > 0
    ? `<p class="card-note">At ~${age} yrs old this car would be ~${endAge} by the end of the comparison — it may not last. Reflect that in “Repairs £/yr” or shorten the horizon.</p>`
    : "";
  return numberRow(s, { f: "ageYears", label: "Age (yrs)", step: 1, min: 0 }) + note;
}

function numberRow(s, cf) {
  const raw = s[cf.f] ?? 0;
  const val = cf.pct ? Math.round(raw * 100) : raw;
  const maxAttr = cf.max != null ? `max="${cf.pct ? cf.max * 100 : cf.max}"` : "";
  return `<label class="row">
    <span>${cf.label}</span>
    <input type="number" inputmode="decimal" data-sid="${s.id}" data-field="${cf.f}" ${cf.pct ? 'data-pct="1"' : ""}
           value="${val}" step="${cf.pct ? 1 : cf.step}" min="${cf.pct ? 0 : cf.min}" ${maxAttr}>
  </label>`;
}

function chargingSplit(s) {
  const labels = { homePct: "Home %", publicPct: "Public %", solarPct: "Solar %" };
  const total = CHARGE_FIELDS.reduce((sum, f) => sum + (s[f] ?? 0), 0);
  return `<div class="charging" role="group" aria-label="EV charging mix">
    ${CHARGE_FIELDS.map((f) => `<label class="mini"><span>${labels[f]}</span>
      <input type="number" data-sid="${s.id}" data-field="${f}" value="${s[f] ?? 0}" min="0" max="100" step="5"></label>`).join("")}
    <p class="mix ${total === 100 ? "ok" : "bad"}" data-mix="${s.id}">Mix ${total}%${total === 100 ? " ✓" : " — aim for 100%"}</p>
  </div>`;
}

// ---------- render: global rate controls ----------
function renderGlobals() {
  $("#years").value = state.rates.years;
  $("#years-val").textContent = state.rates.years;
  const map = {
    "rate-petrol": "petrolPerLitre", "rate-diesel": "dieselPerLitre",
    "rate-home": "elecHomePerKwh", "rate-public": "elecPublicPerKwh", "rate-solar": "elecSolarPerKwh",
  };
  for (const [id, key] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.value = state.rates[key];
  }
  document.querySelectorAll("[data-template]").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.template === state.key);
  });
}

// ---------- the signature: SVG pence-per-mile gauges ----------
function renderGauges() {
  const wrap = $("#gauges");
  wrap.innerHTML = "";
  // Running p/mile (fuel/elec + insurance + servicing + tax, no depreciation) — this is where
  // the EV/solar advantage shows and it maps to the research's 2–20p bands. All-in p/mile,
  // which is dominated by depreciation, is in the detailed report table.
  const MAX_PPM = 30;
  state.scenarios.forEach((s, i) => {
    const value = Math.min(runningPencePerMile(s, state.rates), MAX_PPM);
    const color = SERIES_COLORS[i] ?? "#2E6BE6";
    wrap.insertAdjacentHTML("beforeend", gaugeSvg(s.label, value, MAX_PPM, color));
  });
}

function gaugeSvg(label, value, max, color) {
  const r = 46, cx = 60, cy = 56;
  const frac = Math.max(0, Math.min(1, value / max));
  const a0 = Math.PI, a1 = Math.PI * (1 - frac); // 180° → angle
  const arc = (a) => `${cx + r * Math.cos(a)},${cy - r * Math.sin(a)}`;
  // The fill sweeps clockwise from the left endpoint across at most a half-circle
  // (span = PI * frac ≤ PI), so it is always the minor arc → large-arc flag is 0.
  const track = `M ${arc(Math.PI)} A ${r} ${r} 0 1 1 ${arc(0)}`;
  const fill = `M ${arc(a0)} A ${r} ${r} 0 0 1 ${arc(a1)}`;
  return `<figure class="gauge">
    <svg viewBox="0 0 120 70" role="img" aria-label="${esc(label)}: ${value.toFixed(1)} pence per mile">
      <path d="${track}" class="gauge-track"/>
      <path d="${fill}" stroke="${color}" class="gauge-fill"/>
    </svg>
    <figcaption><strong style="color:${color}">${value.toFixed(1)}p</strong><span>${esc(label)}</span></figcaption>
  </figure>`;
}

// ---------- recompute everything ----------
function recompute() {
  const rates = state.rates;
  const baseline = state.scenarios.find((s) => s.role === "baseline") ?? state.scenarios[0];
  const sw = state.scenarios.find((s) => s.role !== "baseline") ?? state.scenarios[1];
  const cmp = baseline && sw ? compare(baseline, sw, rates) : null;

  const datasets = state.scenarios.map((s, i) => ({
    label: s.label, color: SERIES_COLORS[i] ?? "#2E6BE6", series: cumulativeSeries(s, rates),
  }));
  setBreakEvenMarker(lineChart, cmp && cmp.breakEvenYear ? cmp.breakEvenYear : null);
  updateLineChart(lineChart, { years: rates.years, datasets });
  updateBarChart(barChart, {
    labels: state.scenarios.map((s) => s.label),
    breakdowns: state.scenarios.map((s) => annualBreakdown(s, rates)),
  });
  renderGauges();
  renderVerdict(baseline, sw, cmp);
  renderDivergence(baseline, sw);
  renderReportTable();
  renderNextSteps(baseline, sw, cmp);
  encodeState();
}

// Affiliate "Next steps" links (report) + the single dashboard nudge. Outbound only.
function renderNextSteps(baseline, sw, cmp) {
  const anyEv = state.scenarios.some((s) => s.powertrain === "ev");
  const anySolar = state.scenarios.some((s) => (s.solarPct ?? 0) > 0);
  const winner = cmp ? (cmp.lifetimeSaving >= 0 ? sw : baseline) : null;
  const winnerIsEv = !!winner && winner.powertrain === "ev";
  const ctx = { anyEv, anySolar, winnerIsEv };

  const list = $("#next-steps-list");
  if (list) {
    list.innerHTML = relevantLinks(ctx).map((l) =>
      `<li><a href="${esc(l.href)}" target="_blank" rel="sponsored noopener">${esc(l.label)}</a>
        <span class="ns-blurb">${esc(l.blurb)}</span></li>`).join("");
  }
  const nudge = $("#ev-nudge");
  if (nudge) {
    const link = winnerIsEv ? nudgeLink() : null;
    nudge.innerHTML = link
      ? `<a href="${esc(link.href)}" target="_blank" rel="sponsored noopener">Getting a charger? Compare install quotes →</a>`
      : "";
  }
}

function renderVerdict(baseline, sw, cmp) {
  const box = $("#verdict");
  if (!baseline || !sw || !cmp) { box.innerHTML = ""; return; }
  const { headline, sub, better } = verdictCopy(baseline, sw, cmp, state.rates.years);
  box.className = "verdict " + (better ? "good" : "bad");
  box.innerHTML = `<p class="verdict-head">${headline}</p><p class="verdict-sub">${sub}</p>`;
}

// Plain-language verdict for both situations. A kept baseline (no purchasePrice) is a "keep vs
// switch" decision; a bought baseline (purchasePrice set) is a "buy vs buy" decision — e.g.
// replacing a lost car — where nothing is kept, so "pays for itself" is reframed and the cash line
// shows the GAP between the two purchases. All interpolated labels are HTML-escaped.
function verdictCopy(baseline, sw, cmp, years) {
  const { breakEvenYear, lifetimeSaving, upfrontCash, baselineUpfront = 0 } = cmp;
  const better = lifetimeSaving >= 0; // the switch/EV is cheaper to own over the horizon
  const isReplace = baseline.purchasePrice != null;
  const swL = `<em>${esc(sw.label)}</em>`;
  const baseL = `<em>${esc(baseline.label)}</em>`;

  let headline;
  if (isReplace) {
    if (breakEvenYear === 0) headline = `${swL} is cheaper — from year one`;
    else if (breakEvenYear !== null) headline = `${swL}'s higher price is repaid by <strong>year ${breakEvenYear.toFixed(1)}</strong>`;
    else if (better) headline = `${swL} works out cheaper, but only beyond ${years} years`;
    else headline = `${baseL} is the cheaper choice over ${years} years`;
  } else {
    if (breakEvenYear === 0) headline = `${swL} is cheaper than keeping — from year one`;
    else if (breakEvenYear !== null) headline = `${swL} pays for itself in <strong>year ${breakEvenYear.toFixed(1)}</strong>`;
    else if (better) headline = `Cheaper overall, but doesn't pay back within ${years} years`;
    else headline = `Keeping ${baseL} is cheapest over the next ${years} years`;
  }

  const own = `Over ${years} years, ${swL} is
    <strong>${gbp(Math.abs(lifetimeSaving))} ${better ? "cheaper" : "dearer"}</strong> to own than ${baseL}.`;
  let cash;
  if (isReplace) {
    const gap = upfrontCash - baselineUpfront;
    cash = Math.abs(gap) < 1
      ? `Both need about the same cash up front.`
      : `${swL} needs <strong>${gbp(Math.abs(gap))} ${gap > 0 ? "more" : "less"}</strong> cash up front.`;
  } else {
    cash = `Upfront cash needed now: <strong>${gbp(upfrontCash)}</strong>.`;
  }
  return { headline, sub: `${own} ${cash}`, better };
}

// "Why the lines diverge" — ranked cost factors that separate the two main scenarios.
function renderDivergence(baseline, sw) {
  const box = $("#divergence");
  if (!box) return;
  if (!baseline || !sw) { box.innerHTML = ""; return; }
  const reasons = divergenceReasons(baseline, sw, state.rates);
  if (!reasons.length) { box.innerHTML = `<p class="why-head">The two options cost almost exactly the same.</p>`; return; }
  const max = Math.max(...reasons.map((r) => Math.abs(r.amount)));
  const rows = reasons.map((r) => {
    const saves = r.amount >= 0; // baseline costs more on this factor → switch saves
    const pct = Math.round((Math.abs(r.amount) / max) * 100);
    const color = saves ? "var(--ev)" : "var(--ice)";
    return `<li class="why-row">
      <span class="why-label">${esc(r.label)}</span>
      <span class="why-bar"><span style="width:${pct}%;background:${color}"></span></span>
      <span class="why-amt" style="color:${color}">${saves ? "−" : "+"}${gbp(Math.abs(r.amount))}</span>
    </li>`;
  }).join("");
  box.innerHTML = `
    <p class="why-head">Why the lines separate <span class="why-key">(<span style="color:var(--ev)">green</span> = ${esc(sw.label)} saves · <span style="color:var(--ice)">amber</span> = costs more)</span></p>
    <ol class="why-list">${rows}</ol>`;
}

function renderReportTable() {
  const rates = state.rates;
  const rows = state.scenarios.map((s) => {
    const bd = annualBreakdown(s, rates);
    return `<tr>
      <td>${esc(s.label)}</td>
      <td>${s.powertrain === "ev" ? "Electric" : esc(s.powertrain)}</td>
      <td>${ppm(runningPencePerMile(s, rates))}</td>
      <td>${ppm(pencePerMile(s, rates))}</td>
      <td>${gbp(bd.energy)}</td>
      <td>${gbp(bd.depreciation)}</td>
      <td>${gbp(bd.insurance + bd.servicing + bd.ved)}</td>
      <td>${gbp(cumulativeCostAt(s, rates, rates.years))}</td>
    </tr>`;
  }).join("");
  $("#report-table tbody").innerHTML = rows;
}

// ---------- events ----------
function onInput(e) {
  const el = e.target;
  const sid = el.dataset.sid;
  if (!sid) return;
  const s = state.scenarios.find((x) => x.id === sid);
  if (!s) return;
  const field = el.dataset.field;
  if (field === "label") { s.label = el.value; recompute(); return; }
  if (field === "powertrain") { s.powertrain = el.value; delete s.carId; renderScenarioCards(); recompute(); return; }
  if (field === "carId") {
    const car = CARS.find((c) => c.id === el.value);
    if (car) {
      const idx = state.scenarios.indexOf(s);
      state.scenarios[idx] = applyCarToScenario(s, car);
    } else { s.carId = ""; }
    renderScenarioCards(); recompute(); return;
  }
  let v = parseFloat(el.value);
  if (Number.isNaN(v)) return;
  // Charging mix: clamp so the three never exceed 100%, and update the live indicator.
  if (CHARGE_FIELDS.includes(field)) {
    v = Math.max(0, Math.min(100, v));
    const others = CHARGE_FIELDS.filter((f) => f !== field).reduce((sum, f) => sum + (s[f] ?? 0), 0);
    if (v + others > 100) v = Math.max(0, 100 - others);
    if (String(v) !== el.value) el.value = v;
    s[field] = v;
    updateMixIndicator(el, s);
    recompute();
    return;
  }
  // Miles: input may be expressed per week; store the annual figure.
  if (field === "annualMiles" && el.dataset.unit === "week") v = v * 52;
  if (el.dataset.pct) v = v / 100;
  s[field] = v;
  recompute();
  // Refresh the age "may not last" note on blur (change), not per keystroke, to keep focus.
  if (field === "ageYears" && e.type === "change") renderScenarioCards();
}

function updateMixIndicator(el, s) {
  const card = el.closest(".scenario");
  const mix = card && card.querySelector(".mix");
  if (!mix) return;
  const total = CHARGE_FIELDS.reduce((sum, f) => sum + (s[f] ?? 0), 0);
  mix.textContent = `Mix ${total}%` + (total === 100 ? " ✓" : " — aim for 100%");
  mix.className = "mix " + (total === 100 ? "ok" : "bad");
}

function bindEvents() {
  $("#scenario-cards").addEventListener("input", onInput);
  $("#scenario-cards").addEventListener("change", onInput);
  $("#scenario-cards").addEventListener("click", (e) => {
    const ds = e.target.dataset || {};
    if (ds.remove) {
      state.scenarios = state.scenarios.filter((s) => s.id !== ds.remove);
      renderScenarioCards(); recompute(); return;
    }
    if (ds.toggle === "milesUnit") {
      const s = state.scenarios.find((x) => x.id === ds.sid);
      if (s) { s.milesUnit = s.milesUnit === "week" ? "year" : "week"; renderScenarioCards(); }
    }
  });

  $("#add-scenario").addEventListener("click", () => {
    if (state.scenarios.length >= MAX_SCENARIOS) return;
    const base = state.scenarios.find((s) => s.role !== "baseline") ?? state.scenarios[0];
    state.scenarios.push({ ...base, id: "opt" + Date.now(), role: "compare", label: "Another option" });
    renderScenarioCards(); recompute();
  });

  $("#years").addEventListener("input", (e) => {
    state.rates.years = parseInt(e.target.value, 10);
    $("#years-val").textContent = state.rates.years;
    recompute();
  });
  $("#years").addEventListener("change", () => renderScenarioCards()); // refresh age note on release

  const rateMap = {
    "rate-petrol": "petrolPerLitre", "rate-diesel": "dieselPerLitre",
    "rate-home": "elecHomePerKwh", "rate-public": "elecPublicPerKwh", "rate-solar": "elecSolarPerKwh",
  };
  for (const [id, key] of Object.entries(rateMap)) {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", () => {
      const v = parseFloat(el.value);
      if (!Number.isNaN(v)) { state.rates[key] = v; recompute(); }
    });
  }

  document.querySelectorAll("[data-template]").forEach((chip) => {
    chip.addEventListener("click", () => applyTemplate(chip.dataset.template));
  });

  $("#share").addEventListener("click", async () => {
    encodeState();
    try { await navigator.clipboard.writeText(location.href); flash($("#share"), "Link copied"); }
    catch { flash($("#share"), "Copy from address bar"); }
  });

  $("#restart-onboard").addEventListener("click", openOnboarding);

  $("#to-report").addEventListener("click", () =>
    $("#report").scrollIntoView({ behavior: "smooth" }));
}

function flash(btn, msg) {
  const old = btn.textContent;
  btn.textContent = msg;
  setTimeout(() => (btn.textContent = old), 1600);
}

function applyTemplate(key) {
  state = loadTemplate(key);
  renderAll();
}

// Open the guided "Start here" front door. onComplete swaps in the built state and renders the
// dashboard; onSkip just closes the overlay onto whatever is already there.
function openOnboarding() {
  const overlay = $("#onboard");
  overlay.hidden = false;
  initOnboarding({
    onComplete: (s) => { state = s; renderAll(); overlay.hidden = true; },
    onSkip: () => { overlay.hidden = true; },
  });
}

function renderAll() {
  renderGlobals();
  renderScenarioCards();
  recompute();
}

// ---------- boot ----------
function init() {
  const lineCtx = $("#line-chart").getContext("2d");
  const barCtx = $("#bar-chart").getContext("2d");
  lineChart = createLineChart(lineCtx);
  barChart = createBarChart(barCtx);
  // decodeState() is non-null only when the URL carries a shared #c= comparison; in that case skip
  // the guided start and show exactly what was shared. A clean first visit opens the front door.
  const shared = decodeState();
  state = shared ?? loadTemplate(DEFAULT_TEMPLATE);
  bindEvents();
  renderAll();
  if (!shared) openOnboarding();
}

document.addEventListener("DOMContentLoaded", init);
