// charts.js — thin wrappers over the vendored Chart.js (global `Chart`).
// Two charts: the cumulative-cost "crossover" line, and the annual cost breakdown bar.

const FONT = "'Inter', system-ui, sans-serif";
const INK = "#1B2A2E";
const GRID = "#C9D2D0";

const gbp = (v) => "£" + Math.round(v).toLocaleString("en-GB");

const reduceMotion = () =>
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

Chart.defaults.font.family = FONT;
Chart.defaults.color = INK;

/** Cumulative net cost over the holding period — the hero. One line per scenario. */
export function createLineChart(ctx) {
  return new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: reduceMotion() ? false : { duration: 350 },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "top", labels: { boxWidth: 12, usePointStyle: true } },
        tooltip: {
          callbacks: {
            title: (items) => `Year ${items[0].label}`,
            label: (item) => `${item.dataset.label}: ${gbp(item.raw)}`,
          },
        },
      },
      scales: {
        x: { title: { display: true, text: "Years of ownership" }, grid: { color: GRID } },
        y: {
          title: { display: true, text: "Cumulative cost" },
          grid: { color: GRID },
          ticks: { callback: (v) => gbp(v) },
        },
      },
    },
  });
}

/** Stacked annual cost breakdown — one stacked bar per scenario. */
export function createBarChart(ctx) {
  return new Chart(ctx, {
    type: "bar",
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: reduceMotion() ? false : { duration: 350 },
      plugins: {
        legend: { position: "top", labels: { boxWidth: 12, usePointStyle: true } },
        tooltip: { callbacks: { label: (i) => `${i.dataset.label}: ${gbp(i.raw)}/yr` } },
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, grid: { color: GRID }, ticks: { callback: (v) => gbp(v) } },
      },
    },
  });
}

export function updateLineChart(chart, { years, datasets }) {
  chart.data.labels = Array.from({ length: years + 1 }, (_, i) => i);
  chart.data.datasets = datasets.map((d) => ({
    label: d.label,
    data: d.series,
    borderColor: d.color,
    backgroundColor: d.color + "22",
    borderWidth: 2.5,
    pointRadius: 0,
    pointHoverRadius: 4,
    tension: 0.15,
    fill: false,
  }));
  chart.update();
}

const BREAKDOWN_KEYS = [
  { key: "energy", label: "Fuel / electricity", color: "#2E6BE6" },
  { key: "depreciation", label: "Depreciation", color: "#8A6FB0" },
  { key: "servicing", label: "Servicing", color: "#16A571" },
  { key: "insurance", label: "Insurance", color: "#D9772B" },
  { key: "ved", label: "Road tax", color: "#9AA7A3" },
];

export function updateBarChart(chart, { labels, breakdowns }) {
  chart.data.labels = labels;
  chart.data.datasets = BREAKDOWN_KEYS.map((b) => ({
    label: b.label,
    data: breakdowns.map((bd) => Math.round(bd[b.key])),
    backgroundColor: b.color,
    borderWidth: 0,
  }));
  chart.update();
}
