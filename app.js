const config = window.DASHBOARD_CONFIG || {};

const statuses = [
  { id: "idea", label: "Идея", weight: 0.1 },
  { id: "test", label: "На тесте", weight: 0.25 },
  { id: "build", label: "Внедряется", weight: 0.5 },
  { id: "live", label: "Работает", weight: 1 }
];

const statusById = Object.fromEntries(statuses.map((status) => [status.id, status]));

const departmentMeta = {
  ML: { icon: "🧠", color: "violet", accent: "#8b5cf6" },
  "Разработка": { icon: "💻", color: "blue", accent: "#4f7df3" },
  "Менеджмент": { icon: "📋", color: "orange", accent: "#f07b3f" },
  "Дизайн": { icon: "🎨", color: "pink", accent: "#e15b9f" },
  "Маркетинг": { icon: "📣", color: "green", accent: "#59c66d" },
  HR: { icon: "🧩", color: "blue", accent: "#4f7df3" },
  "Продажи": { icon: "📈", color: "green", accent: "#59c66d" },
  "Финансы": { icon: "💳", color: "orange", accent: "#f07b3f" },
  "Операции": { icon: "⚙️", color: "violet", accent: "#8b5cf6" },
  "Продукт": { icon: "🚀", color: "pink", accent: "#e15b9f" },
  "Поддержка": { icon: "🎧", color: "green", accent: "#59c66d" }
};

const fallbackMeta = [
  { icon: "⚡", color: "violet", accent: "#8b5cf6" },
  { icon: "🧪", color: "blue", accent: "#4f7df3" },
  { icon: "🛠", color: "orange", accent: "#f07b3f" },
  { icon: "✨", color: "pink", accent: "#e15b9f" },
  { icon: "📌", color: "green", accent: "#59c66d" }
];

const demoAutomations = [
  { title: "Авторазметка датасетов", department: "ML", status: "live", hours: 20, nextStep: "Работает" },
  { title: "Конвейер переобучения моделей", department: "ML", status: "build", hours: 16, nextStep: "Внедряется" },
  { title: "Детектор дрифта данных", department: "ML", status: "test", hours: 12, nextStep: "На тесте" },
  { title: "A/B-тесты моделей в проде", department: "ML", status: "idea", hours: 8, nextStep: "Идея" },
  { title: "Мониторинг latency и метрик", department: "ML", status: "live", hours: 14, nextStep: "Работает" },
  { title: "Автодеплой staging → prod", department: "Разработка", status: "live", hours: 26, nextStep: "Работает" },
  { title: "Генератор API-документации", department: "Разработка", status: "live", hours: 18, nextStep: "Работает" },
  { title: "Линтер + автофикс в pre-commit", department: "Разработка", status: "build", hours: 12, nextStep: "Внедряется" },
  { title: "Автотесты регресса API", department: "Разработка", status: "test", hours: 16, nextStep: "На тесте" },
  { title: "Дашборд алертов в Telegram", department: "Разработка", status: "live", hours: 20, nextStep: "Работает" },
  { title: "Автомиграции БД", department: "Разработка", status: "build", hours: 15, nextStep: "Внедряется" },
  { title: "Автосводка спринта в Slack", department: "Менеджмент", status: "live", hours: 22, nextStep: "Работает" },
  { title: "Шаблоны онбординга", department: "Менеджмент", status: "build", hours: 12, nextStep: "Внедряется" },
  { title: "Планировщик 1:1 встреч", department: "Менеджмент", status: "test", hours: 10, nextStep: "На тесте" },
  { title: "Скоринг задач по приоритету", department: "Менеджмент", status: "build", hours: 12, nextStep: "Внедряется" },
  { title: "Авторезюме встреч", department: "Менеджмент", status: "live", hours: 15, nextStep: "Работает" },
  { title: "Автоэкспорт Figma → токены", department: "Дизайн", status: "live", hours: 18, nextStep: "Работает" },
  { title: "Генератор UI-китов", department: "Дизайн", status: "build", hours: 12, nextStep: "Внедряется" },
  { title: "Проверка контрастности WCAG", department: "Дизайн", status: "test", hours: 8, nextStep: "На тесте" },
  { title: "Синк макетов с продуктами", department: "Дизайн", status: "build", hours: 10, nextStep: "Внедряется" },
  { title: "Генератор favicon + OG-image", department: "Дизайн", status: "idea", hours: 6, nextStep: "Идея" },
  { title: "Автогенератор креативов", department: "Маркетинг", status: "live", hours: 24, nextStep: "Работает" },
  { title: "Парсер трендов TikTok", department: "Маркетинг", status: "build", hours: 16, nextStep: "Внедряется" },
  { title: "Автопостинг в Telegram", department: "Маркетинг", status: "live", hours: 20, nextStep: "Работает" },
  { title: "Отчетность ROAS в дашборд", department: "Маркетинг", status: "live", hours: 22, nextStep: "Работает" },
  { title: "A/B тесты лендингов", department: "Маркетинг", status: "test", hours: 14, nextStep: "На тесте" },
  { title: "Ресайз баннеров под все сети", department: "Маркетинг", status: "build", hours: 18, nextStep: "Внедряется" }
];

const isDemoMode = Boolean(window.AUTOMATION_DASHBOARD_DEMO);
const isGoogleSheetMode = !isDemoMode && Boolean(config.googleSheetCsvUrl);

let automations = [];

const podiumList = document.querySelector("#podiumList");
const departmentBoard = document.querySelector("#departmentBoard");
const latestAutomation = document.querySelector("#latestAutomation");
const sheetLink = document.querySelector("#sheetLink");
const colaRecordDays = document.querySelector("#colaRecordDays");

async function loadAutomations() {
  if (isDemoMode) return demoAutomations;
  if (isGoogleSheetMode) return loadGoogleSheetAutomations();
  return [];
}

async function loadGoogleSheetAutomations() {
  try {
    if (config.googleSheetCsvUrl.includes("docs.google.com/spreadsheets")) {
      return loadGoogleVisualizationAutomations();
    }

    const response = await fetch(config.googleSheetCsvUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`Google Sheet returned ${response.status}`);
    return parseSheetRows(await response.text());
  } catch (error) {
    console.warn("Не удалось загрузить Google Таблицу", error);
    return [];
  }
}

function loadGoogleVisualizationAutomations() {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const previousGoogle = window.google;
    let didResolve = false;

    window.google = window.google || {};
    window.google.visualization = window.google.visualization || {};
    window.google.visualization.Query = window.google.visualization.Query || {};
    window.google.visualization.Query.setResponse = (response) => {
      didResolve = true;
      script.remove();
      window.google = previousGoogle;
      resolve(parseGoogleVisualizationRows(response));
    };

    script.onerror = () => {
      script.remove();
      window.google = previousGoogle;
      reject(new Error("Google Sheet script load failed"));
    };

    script.onload = () => {
      if (!didResolve) {
        script.remove();
        window.google = previousGoogle;
        reject(new Error("Google Sheet returned no data"));
      }
    };

    script.src = buildGoogleVisualizationUrl(config.googleSheetCsvUrl);
    document.head.appendChild(script);
  });
}

function buildGoogleVisualizationUrl(url) {
  const sheetUrl = new URL(url);
  sheetUrl.searchParams.set("tqx", "out:json");
  sheetUrl.searchParams.set("_", String(Date.now()));
  return sheetUrl.toString();
}

function parseGoogleVisualizationRows(response) {
  const table = response && response.table;
  if (!table || !Array.isArray(table.cols) || !Array.isArray(table.rows)) return [];

  const headers = table.cols.map((col) => normalizeHeader(col.label || col.id));
  return table.rows.map((row) => parseRecordFromValues(headers, row.c || [])).filter(isValidRecord);
}

function parseSheetRows(csvText) {
  const rows = parseCsv(csvText).filter((row) => row.some((cell) => String(cell).trim()));
  const [headerRow, ...dataRows] = rows;
  if (!headerRow) return [];

  const headers = headerRow.map(normalizeHeader);
  return dataRows.map((row) => parseRecordFromValues(headers, row)).filter(isValidRecord);
}

function parseRecordFromValues(headers, values) {
  const value = (names) => {
    const index = headers.findIndex((header) => names.includes(header));
    const cell = index >= 0 ? values[index] : null;
    if (cell && typeof cell === "object") return String(cell.f || cell.v || "").trim();
    return String(cell || "").trim();
  };

  return {
    title: value(["title", "name", "nazvanie", "avtomatizaciya"]),
    department: value(["department", "otdel"]),
    status: normalizeStatus(value(["status", "statusproekta"])),
    hours: Number(value(["hours", "hoursmonth", "chasovmes", "ekonomiyachasov"])) || 0,
    nextStep: value(["nextstep", "sleduyushchiyshag", "next"])
  };
}

function isValidRecord(item) {
  return item.title && item.department && item.hours > 0;
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function normalizeHeader(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^a-zа-я0-9]/g, "")
    .replace("название", "title")
    .replace("автоматизация", "avtomatizaciya")
    .replace("отдел", "otdel")
    .replace("статус", "status")
    .replace("часовмес", "chasovmes")
    .replace("следующийшаг", "sleduyushchiyshag");
}

function normalizeStatus(value) {
  const normalized = String(value).trim().toLowerCase().replaceAll("ё", "е");
  if (["работает", "live", "done", "готово"].includes(normalized)) return "live";
  if (["внедряется", "build", "inprogress", "в работе"].includes(normalized)) return "build";
  if (["на тесте", "тест", "test", "testing"].includes(normalized)) return "test";
  return "idea";
}

function buildDepartmentStats() {
  const map = new Map();

  automations.forEach((item) => {
    if (!map.has(item.department)) {
      map.set(item.department, {
        department: item.department,
        count: 0,
        score: 0,
        live: 0,
        items: []
      });
    }

    const stat = map.get(item.department);
    stat.count += 1;
    stat.score += scoreAutomation(item);
    stat.live += item.status === "live" ? 1 : 0;
    stat.items.push(item);
  });

  return [...map.values()].sort((a, b) => b.count - a.count || b.score - a.score || b.live - a.live);
}

function scoreAutomation(item) {
  const status = statusById[item.status] || statusById.idea;
  return Math.round(Number(item.hours) * status.weight);
}

function renderAll() {
  renderColaRecord();
  renderSheetLink();
  renderPodium();
  renderDepartmentBoard();
  renderLatestAutomation();
}

function renderColaRecord() {
  if (colaRecordDays) colaRecordDays.textContent = "1 день";
}

function renderSheetLink() {
  if (!sheetLink) return;
  sheetLink.href = config.googleSheetEditUrl || "#";
}

function renderPodium() {
  const stats = buildDepartmentStats().slice(0, 3);
  const order = [1, 0, 2];

  if (!stats.length) {
    podiumList.innerHTML = `
      <article class="empty-board">
        <strong>Рейтинг готов к запуску</strong>
        <span>Добавьте первые автоматизации в Google Таблицу.</span>
      </article>
    `;
    return;
  }

  podiumList.innerHTML = order
    .filter((index) => stats[index])
    .map((index) => renderPodiumCard(stats[index], index + 1))
    .join("");
}

function renderPodiumCard(stat, rank) {
  const meta = getDepartmentMeta(stat.department);
  return `
    <article class="podium-card rank-${rank} ${meta.color}">
      <div class="medal" aria-hidden="true">${rank}</div>
      <strong>${escapeHtml(stat.department)}</strong>
      <b>${stat.count}</b>
      <span>${stat.count} ${pluralProject(stat.count)}</span>
    </article>
  `;
}

function renderDepartmentBoard() {
  const stats = buildDepartmentStats();
  if (!stats.length) {
    departmentBoard.innerHTML = "";
    return;
  }

  departmentBoard.innerHTML = stats
    .map((stat, index) => renderDepartmentCard(stat, index))
    .join("");
}

function renderDepartmentCard(stat, index) {
  const meta = getDepartmentMeta(stat.department, index);
  const maxCount = Math.max(...buildDepartmentStats().map((item) => item.count), 1);
  const progress = Math.max(8, Math.round((stat.count / maxCount) * 100));
  const items = stat.items
    .slice(0, 6)
    .map((item) => renderAutomationChip(item, meta))
    .join("");

  return `
    <article class="department-card ${meta.color}" style="--accent: ${meta.accent}">
      <header class="department-head">
        <div>
          <span class="department-icon" aria-hidden="true">${meta.icon}</span>
          <h2>${escapeHtml(stat.department)}</h2>
        </div>
        <b>${stat.count}</b>
      </header>
      <div class="score-line" aria-hidden="true"><span style="width: ${progress}%"></span></div>
      <p class="department-subline">${stat.live} работает · ${stat.score} очк.</p>
      <div class="automation-list">${items}</div>
    </article>
  `;
}

function renderAutomationChip(item, meta) {
  const status = statusById[item.status] || statusById.idea;
  return `
    <div class="automation-chip">
      <span class="task-dot" style="background: ${meta.accent}" aria-hidden="true"></span>
      <strong>${escapeHtml(item.title)}</strong>
      <em>${status.label}</em>
    </div>
  `;
}

function renderLatestAutomation() {
  if (!latestAutomation) return;
  const latest = automations[automations.length - 1] || automations[0];
  const action = latestAutomation.querySelector(".latest-action");

  if (action) {
    action.href = config.googleSheetEditUrl || "#";
  }

  if (!latest) return;

  const title = latestAutomation.querySelector("h2");
  const meta = latestAutomation.querySelector("span");
  if (title) title.textContent = latest.title;
  if (meta) meta.textContent = `${latest.department} · ${statusById[latest.status].label}`;
}

function getDepartmentMeta(department, index = 0) {
  return departmentMeta[department] || fallbackMeta[index % fallbackMeta.length];
}

function pluralProject(count) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "проектов";
  if (last === 1) return "проект";
  if (last >= 2 && last <= 4) return "проекта";
  return "проектов";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function init() {
  automations = await loadAutomations();
  renderAll();
}

init();
