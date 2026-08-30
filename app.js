/* ============================================================
   90-Tage Fettabbau-System — App-Logik
   Alles wird ausschließlich in localStorage dieses Browsers/Geräts gespeichert.
   ============================================================ */

const LS = {
  start: "ff_start_date",
  theme: "ff_theme",
  log: "ff_weekly_log",
  checklist: (dateStr) => "ff_checklist_" + dateStr,
  reflection: (weekKey) => "ff_reflection_" + weekKey,
};

const CHECKLIST = {
  morning: [
    { id: "m1", core: true, t: "Ein großes Glas Wasser direkt nach dem Aufwachen", d: "Vor dem ersten Kaffee" },
    { id: "m2", core: true, t: "Protein-reiches Frühstück", d: "z.B. Eier, Skyr/Quark, Haferflocken mit Milch" },
    { id: "m3", core: false, t: "Kurzer Blick auf den Tag", d: "Wann ist Training oder Spaziergang eingeplant?" },
    { id: "m4", core: false, t: "5 Minuten Mobility / Dehnen", d: "Optional, tut aber gut" },
  ],
  day: [
    { id: "d1", core: true, t: "Schritte-Ziel im Blick behalten", d: "Ziel je nach Phase — siehe Tabelle unten" },
    { id: "d2", core: true, t: "Wasserflasche griffbereit", d: "Ziel 2,5–3 Liter über den Tag verteilt" },
    { id: "d3", core: false, t: "Mahlzeiten in groben, festen Zeitfenstern", d: "Nicht auf die Minute, aber Routine hilft" },
    { id: "d4", core: false, t: "Vor dem Snacken: Hunger-Check", d: "Wirklich hungrig — oder gelangweilt/gestresst?" },
    { id: "d5", core: true, t: "Trainingseinheit, falls heute geplant", d: "Oder Ersatzoption laut Trainingsplan" },
  ],
  evening: [
    { id: "e1", core: false, t: "Letzte große Mahlzeit ca. 2–3h vor dem Schlafen", d: "Richtwert, kein hartes Verbot" },
    { id: "e2", core: true, t: "Feste Zubettgeh-Zeit (±30 Min.)", d: "Ziel: 7–9 Stunden Schlaf" },
    { id: "e3", core: false, t: "Kein Koffein nach ca. 14–15 Uhr", d: "Handy 30 Min. vor dem Schlafen weglegen" },
    { id: "e4", core: false, t: "Kurzer Tagesrückblick", d: "Was lief gut? Nicht über Fehler grübeln" },
  ],
};

const ALL_ITEMS = [...CHECKLIST.morning, ...CHECKLIST.day, ...CHECKLIST.evening];
const CORE_IDS = ALL_ITEMS.filter((i) => i.core).map((i) => i.id);

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function getChecklistState(dateStr) {
  try {
    return JSON.parse(localStorage.getItem(LS.checklist(dateStr))) || [];
  } catch {
    return [];
  }
}

function setChecklistState(dateStr, arr) {
  localStorage.setItem(LS.checklist(dateStr), JSON.stringify(arr));
}

/* ---------------- Navigation ---------------- */
function initNav() {
  const items = document.querySelectorAll(".nav-item");
  items.forEach((btn) => {
    btn.addEventListener("click", () => {
      items.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
      document.getElementById("view-" + btn.dataset.view).classList.add("active");
      window.scrollTo(0, 0);
    });
  });
}

/* ---------------- Theme ---------------- */
function initTheme() {
  const order = ["system", "light", "dark"];
  let current = localStorage.getItem(LS.theme) || "system";
  applyTheme(current);
  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      current = order[(order.indexOf(current) + 1) % order.length];
      localStorage.setItem(LS.theme, current);
      applyTheme(current);
    });
  });
}
function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
  document.querySelectorAll(".theme-toggle-label").forEach((el) => (el.textContent = "ANSICHT: " + mode.toUpperCase()));
  const icons = { system: "◐", light: "☀", dark: "☾" };
  document.querySelectorAll(".theme-toggle-icon").forEach((el) => (el.textContent = icons[mode]));
}

/* ---------------- Startdatum / Status-Leiste ---------------- */
function getStartDate() {
  return localStorage.getItem(LS.start);
}

function dayIndex(startStr) {
  const start = new Date(startStr + "T00:00:00");
  const now = new Date(todayStr() + "T00:00:00");
  const diff = Math.floor((now - start) / 86400000) + 1;
  return diff;
}

function refreshStatusStrip() {
  const start = getStartDate();
  const dayEl = document.getElementById("stat-day");
  const phaseEl = document.getElementById("stat-phase");
  const weekEl = document.getElementById("stat-week");
  const streakEl = document.getElementById("stat-streak");

  if (!start) {
    dayEl.innerHTML = '–<span class="unit">/ 90</span>';
    phaseEl.textContent = "–";
    weekEl.textContent = "–";
  } else {
    let day = dayIndex(start);
    const dayClamped = Math.max(1, Math.min(90, day));
    dayEl.innerHTML = dayClamped + '<span class="unit">/ 90</span>';
    const phase = day <= 30 ? 1 : day <= 60 ? 2 : 3;
    phaseEl.textContent = phase + " / 3";
    const week = Math.max(1, Math.min(13, Math.ceil(dayClamped / 7)));
    weekEl.textContent = "W" + week;
    updateTimeline(day);
  }
  streakEl.innerHTML = computeStreak() + '<span class="unit">Tage</span>';
}

function updateTimeline(day) {
  const ranges = { 1: [1, 30], 2: [31, 60], 3: [61, 90] };
  document.querySelectorAll(".phase-row").forEach((row) => {
    const phase = Number(row.dataset.phase);
    const [start, end] = ranges[phase];
    const span = end - start + 1;
    let pct;
    if (day < start) pct = 0;
    else if (day > end) pct = 100;
    else pct = Math.round(((day - start + 1) / span) * 100);
    row.querySelector(".phase-bar > span").style.width = pct + "%";
    row.classList.toggle("current", day >= start && day <= end);
  });
}

function computeStreak() {
  let streak = 0;
  const todayState = getChecklistState(todayStr());
  const todayDone = CORE_IDS.every((id) => todayState.includes(id));
  let i = todayDone ? 0 : -1;
  while (true) {
    const state = getChecklistState(todayStr(i));
    if (CORE_IDS.length > 0 && CORE_IDS.every((id) => state.includes(id))) {
      streak++;
      i--;
    } else {
      break;
    }
    if (streak > 90) break;
  }
  return streak;
}

function initStartDate() {
  const input = document.getElementById("start-date");
  const stored = getStartDate();
  if (stored) input.value = stored;
  else input.value = todayStr();

  document.getElementById("set-start").addEventListener("click", () => {
    if (!input.value) return;
    localStorage.setItem(LS.start, input.value);
    refreshStatusStrip();
  });

  document.getElementById("reset-all").addEventListener("click", () => {
    if (confirm("Wirklich alle gespeicherten Daten (Startdatum, Checklisten, Log, Reflexionen) löschen?")) {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("ff_"));
      keys.forEach((k) => localStorage.removeItem(k));
      location.reload();
    }
  });
}

/* ---------------- Checkliste ---------------- */
function renderChecklist() {
  const state = new Set(getChecklistState(todayStr()));
  const mounts = { morning: "check-morning", day: "check-day", evening: "check-evening" };

  Object.entries(CHECKLIST).forEach(([group, items]) => {
    const mount = document.getElementById(mounts[group]);
    mount.innerHTML = "";
    items.forEach((item) => {
      const label = document.createElement("label");
      label.className = "check-item" + (item.core ? " core" : "");
      label.innerHTML = `
        <input type="checkbox" data-id="${item.id}" ${state.has(item.id) ? "checked" : ""}>
        <span class="txt"><span class="t">${item.t}</span><span class="d">${item.d}</span></span>
      `;
      mount.appendChild(label);
    });
  });

  mount_listeners();
  updateTodayProgress();

  const label = document.getElementById("today-label");
  const d = new Date();
  label.textContent = "Heute · " + d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit" });
}

function mount_listeners() {
  document.querySelectorAll('#view-system input[type="checkbox"]').forEach((box) => {
    box.addEventListener("change", () => {
      const state = new Set(getChecklistState(todayStr()));
      if (box.checked) state.add(box.dataset.id);
      else state.delete(box.dataset.id);
      setChecklistState(todayStr(), Array.from(state));
      updateTodayProgress();
      refreshStatusStrip();
    });
  });
}

function updateTodayProgress() {
  const state = getChecklistState(todayStr());
  const pct = Math.round((state.length / ALL_ITEMS.length) * 100);
  document.getElementById("today-progress-bar").style.width = pct + "%";
  document.getElementById("stat-today").innerHTML = pct + '<span class="unit">%</span>';
}

/* ---------------- Accordion (Training) ---------------- */
function initAccordion() {
  document.querySelectorAll("[data-acc]").forEach((acc) => {
    acc.querySelector(".acc-head").addEventListener("click", () => {
      acc.classList.toggle("open");
    });
  });
}

/* ---------------- Wochenreview: Log ---------------- */
function getLog() {
  try {
    return JSON.parse(localStorage.getItem(LS.log)) || [];
  } catch {
    return [];
  }
}
function setLog(arr) {
  localStorage.setItem(LS.log, JSON.stringify(arr));
}

function initLog() {
  document.getElementById("log-date").value = todayStr();

  document.getElementById("log-save").addEventListener("click", () => {
    const date = document.getElementById("log-date").value;
    const weight = document.getElementById("log-weight").value;
    if (!date || !weight) {
      alert("Bitte mindestens Datum und Gewicht angeben.");
      return;
    }
    const entry = {
      date,
      weight: parseFloat(weight),
      waist: document.getElementById("log-waist").value ? parseFloat(document.getElementById("log-waist").value) : null,
      chest: document.getElementById("log-chest").value ? parseFloat(document.getElementById("log-chest").value) : null,
      energy: document.getElementById("log-energy").value || null,
      note: document.getElementById("log-note").value.trim(),
    };
    const log = getLog().filter((e) => e.date !== date);
    log.push(entry);
    log.sort((a, b) => a.date.localeCompare(b.date));
    setLog(log);
    document.getElementById("log-weight").value = "";
    document.getElementById("log-waist").value = "";
    document.getElementById("log-chest").value = "";
    document.getElementById("log-energy").value = "";
    document.getElementById("log-note").value = "";
    renderLog();
  });

  renderLog();
}

function renderLog() {
  const log = getLog();
  const tbody = document.getElementById("log-tbody");
  tbody.innerHTML = "";
  [...log].reverse().forEach((e) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.date}</td>
      <td class="ex">${e.weight} kg</td>
      <td>${e.waist ? e.waist + " cm" : "–"}</td>
      <td>${e.chest ? e.chest + " cm" : "–"}</td>
      <td>${e.energy || "–"}</td>
      <td>${e.note ? escapeHtml(e.note) : "–"}</td>
      <td><button class="btn ghost small" data-del="${e.date}">löschen</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setLog(getLog().filter((e) => e.date !== btn.dataset.del));
      renderLog();
    });
  });
  drawSparkline(log);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function drawSparkline(log) {
  const canvas = document.getElementById("weight-spark");
  const empty = document.getElementById("spark-empty");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (log.length < 2) {
    canvas.style.display = "none";
    empty.style.display = "block";
    return;
  }
  canvas.style.display = "block";
  empty.style.display = "none";

  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue("--accent").trim() || "#3f5d45";
  const grid = styles.getPropertyValue("--border").trim() || "#ddd";

  const pad = 14;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;
  const weights = log.map((e) => e.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 2; i++) {
    const y = pad + (h / 2) * i;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(canvas.width - pad, y);
    ctx.stroke();
  }

  ctx.beginPath();
  log.forEach((e, i) => {
    const x = pad + (i / (log.length - 1)) * w;
    const y = pad + h - ((e.weight - min) / range) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.stroke();

  const last = log[log.length - 1];
  const lastX = pad + w;
  const lastY = pad + h - ((last.weight - min) / range) * h;
  ctx.beginPath();
  ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
}

/* ---------------- Reflexion ---------------- */
function isoWeekKey(d = new Date()) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return date.getFullYear() + "-W" + String(weekNum).padStart(2, "0");
}

function initReflection() {
  const key = isoWeekKey();
  const stored = JSON.parse(localStorage.getItem(LS.reflection(key)) || "{}");
  document.getElementById("refl-good").value = stored.good || "";
  document.getElementById("refl-hard").value = stored.hard || "";
  document.getElementById("refl-adjust").value = stored.adjust || "";

  document.getElementById("refl-save").addEventListener("click", () => {
    const data = {
      good: document.getElementById("refl-good").value,
      hard: document.getElementById("refl-hard").value,
      adjust: document.getElementById("refl-adjust").value,
    };
    localStorage.setItem(LS.reflection(key), JSON.stringify(data));
    const note = document.getElementById("refl-saved");
    note.textContent = "Gespeichert (Woche " + key + ")";
    setTimeout(() => (note.textContent = ""), 2500);
  });
}

/* ---------------- Service Worker (Offline-Betrieb, Installierbarkeit) ---------------- */
function initServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
}

/* ---------------- Init ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  initServiceWorker();
  initNav();
  initTheme();
  initStartDate();
  refreshStatusStrip();
  renderChecklist();
  initAccordion();
  initLog();
  initReflection();

  document.getElementById("reset-today").addEventListener("click", () => {
    setChecklistState(todayStr(), []);
    renderChecklist();
    refreshStatusStrip();
  });
});
