// app.js — wires inputs ↔ model ↔ charts. Framework-free ES module.
import {
  cumulativeSeries, annualBreakdown, pencePerMile, runningPencePerMile,
  cumulativeCostAt, compare,
} from "./model.js";
import { TEMPLATES, DEFAULT_TEMPLATE, loadTemplate } from "./templates.js";
import {
  createLineChart, createBarChart, updateLineChart, updateBarChart,
} from "./charts.js";

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
    "insurancePerYear", "servicingPerYear", "vedPerYear"];
  const scenarios = o.scenarios.slice(0, MAX_SCENARIOS).map((s, i) => {
    const clean = {
      id: (String(s.id ?? "opt" + i).replace(/[^a-z0-9_-]/gi, "") || "opt" + i).slice(0, 40),
      label: String(s.label ?? "Option").slice(0, 60),
      role: s.role === "baseline" ? "baseline" : (s.role === "compare" ? "compare" : "switch"),
      powertrain: POWERTRAINS.includes(s.powertrain) ? s.powertrain : "petrol",
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
  { f: "annualMiles", label: "Miles / year", step: 500, min: 0 },
  { f: "insurancePerYear", label: "Insurance £/yr", step: 25, min: 0 },
  { f: "servicingPerYear", label: "Servicing £/yr", step: 25, min: 0 },
  { f: "vedPerYear", label: "Road tax £/yr", step: 5, min: 0 },
  { f: "depreciationPctPerYear", label: "Depreciation %/yr", step: 0.01, min: 0, max: 0.4, pct: true },
];

function valueField(s) {
  return s.role === "baseline"
    ? { f: "currentValue", label: "Current value £", step: 250, min: 0 }
    : { f: "purchasePrice", label: "Purchase price £", step: 250, min: 0 };
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
      <label class="row">
        <span>Powertrain</span>
        <select data-sid="${s.id}" data-field="powertrain">
          ${["ev", "petrol", "diesel", "hybrid"].map((p) => `<option value="${p}" ${s.powertrain === p ? "selected" : ""}>${p === "ev" ? "Electric" : p[0].toUpperCase() + p.slice(1)}</option>`).join("")}
        </select>
      </label>
      ${numberRow(s, valueField(s))}
      ${s.powertrain === "ev"
        ? numberRow(s, { f: "milesPerKwh", label: "Miles / kWh", step: 0.1, min: 0.5 }) + chargingSplit(s)
        : numberRow(s, { f: "mpg", label: "MPG", step: 1, min: 1 })}
      ${COMMON_FIELDS.map((cf) => numberRow(s, cf)).join("")}
    `;
    wrap.appendChild(card);
  });

  const addBtn = $("#add-scenario");
  addBtn.disabled = state.scenarios.length >= MAX_SCENARIOS;
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
  const split = [
    { f: "homePct", label: "Home %" },
    { f: "publicPct", label: "Public %" },
    { f: "solarPct", label: "Solar %" },
  ];
  return `<div class="charging" role="group" aria-label="EV charging mix">
    ${split.map((c) => `<label class="mini"><span>${c.label}</span>
      <input type="number" data-sid="${s.id}" data-field="${c.f}" value="${s[c.f] ?? 0}" min="0" max="100" step="5"></label>`).join("")}
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
  const datasets = state.scenarios.map((s, i) => ({
    label: s.label, color: SERIES_COLORS[i] ?? "#2E6BE6", series: cumulativeSeries(s, rates),
  }));
  updateLineChart(lineChart, { years: rates.years, datasets });
  updateBarChart(barChart, {
    labels: state.scenarios.map((s) => s.label),
    breakdowns: state.scenarios.map((s) => annualBreakdown(s, rates)),
  });
  renderGauges();
  renderVerdict();
  renderReportTable();
  encodeState();
}

function renderVerdict() {
  const baseline = state.scenarios.find((s) => s.role === "baseline") ?? state.scenarios[0];
  const sw = state.scenarios.find((s) => s.role !== "baseline") ?? state.scenarios[1];
  const box = $("#verdict");
  if (!baseline || !sw) { box.innerHTML = ""; return; }
  const { breakEvenYear, lifetimeSaving, upfrontCash } = compare(baseline, sw, state.rates);
  const better = lifetimeSaving >= 0;
  let headline;
  if (breakEvenYear === null) {
    headline = better
      ? `Cheaper overall, but doesn't break even within ${state.rates.years} years`
      : `Costs more — keeping wins over ${state.rates.years} years`;
  } else if (breakEvenYear === 0) {
    headline = `Cheaper from year one`;
  } else {
    headline = `Pays for itself in <strong>year ${breakEvenYear.toFixed(1)}</strong>`;
  }
  box.className = "verdict " + (better ? "good" : "bad");
  box.innerHTML = `
    <p class="verdict-head">${headline}</p>
    <p class="verdict-sub">
      Over ${state.rates.years} years, <em>${esc(sw.label)}</em> is
      <strong>${gbp(Math.abs(lifetimeSaving))} ${better ? "cheaper" : "dearer"}</strong>
      than <em>${esc(baseline.label)}</em>.
      Upfront cash needed now: <strong>${gbp(upfrontCash)}</strong>.
    </p>`;
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
  if (field === "label") { s.label = el.value; renderVerdict(); recompute(); return; }
  if (field === "powertrain") { s.powertrain = el.value; renderScenarioCards(); recompute(); return; }
  let v = parseFloat(el.value);
  if (Number.isNaN(v)) return;
  if (el.dataset.pct) v = v / 100;
  s[field] = v;
  recompute();
}

function bindEvents() {
  $("#scenario-cards").addEventListener("input", onInput);
  $("#scenario-cards").addEventListener("change", onInput);
  $("#scenario-cards").addEventListener("click", (e) => {
    const id = e.target.dataset?.remove;
    if (!id) return;
    state.scenarios = state.scenarios.filter((s) => s.id !== id);
    renderScenarioCards(); recompute();
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
  state = decodeState() ?? loadTemplate(DEFAULT_TEMPLATE);
  bindEvents();
  renderAll();
}

document.addEventListener("DOMContentLoaded", init);
