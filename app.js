const STORAGE_KEY = "automation-leaderboard-work-v1";
const COLA_FREE_START_DATE = "2026-05-01";
const config = window.DASHBOARD_CONFIG || {};

const departments = ["HR", "Продажи", "Маркетинг", "Финансы", "Операции", "Продукт", "Поддержка"];

const statuses = [
  { id: "all", label: "Все", weight: 1 },
  { id: "idea", label: "Идея", weight: 0.1 },
  { id: "test", label: "На тесте", weight: 0.25 },
  { id: "build", label: "Внедряется", weight: 0.5 },
  { id: "live", label: "Работает", weight: 1 }
];

const demoAutomations = [
  {
    title: "Сбор идей по автоматизациям",
    department: "HR",
    status: "live",
    hours: 18,
    nextStep: "Открыть форму для всех отделов"
  },
  {
    title: "Черновик анонсов для рабочего чата",
    department: "HR",
    status: "build",
    hours: 10,
    nextStep: "Согласовать формат еженедельного поста"
  },
  {
    title: "Проверка типовых вопросов кандидатов",
    department: "HR",
    status: "test",
    hours: 14,
    nextStep: "Протестировать на 20 реальных обращениях"
  },
  {
    title: "Автосводка лидов из чатов",
    department: "Продажи",
    status: "build",
    hours: 42,
    nextStep: "Сверить поля с CRM"
  },
  {
    title: "Классификация обращений клиентов",
    department: "Поддержка",
    status: "test",
    hours: 36,
    nextStep: "Проверить точность на выборке"
  },
  {
    title: "Еженедельный отчет по расходам",
    department: "Финансы",
    status: "idea",
    hours: 24,
    nextStep: "Описать источник данных"
  },
  {
    title: "Черновики постов по контент-плану",
    department: "Маркетинг",
    status: "live",
    hours: 30,
    nextStep: "Добавить проверку tone of voice"
  }
];

const isDemoMode = Boolean(window.AUTOMATION_DASHBOARD_DEMO);
const isGoogleSheetMode = !isDemoMode && Boolean(config.googleSheetCsvUrl);
const canSubmitToGoogleSheet = isGoogleSheetMode && Boolean(config.googleSheetSubmitUrl);
const seedAutomations = isDemoMode ? demoAutomations : [];

let automations = [];
let activeStatus = "all";
let activePeriod = "month";

const statusById = Object.fromEntries(statuses.map((status) => [status.id, status]));

const departmentsCount = document.querySelector("#departmentsCount");
const automationCount = document.querySelector("#automationCount");
const hoursSaved = document.querySelector("#hoursSaved");
const liveCount = document.querySelector("#liveCount");
const leaderboardList = document.querySelector("#leaderboardList");
const automationRows = document.querySelector("#automationRows");
const statusFilter = document.querySelector("#statusFilter");
const announceList = document.querySelector("#announceList");
const ideaForm = document.querySelector("#ideaForm");
const resetDataBtn = document.querySelector("#resetDataBtn");
const colaRecordDays = document.querySelector("#colaRecordDays");
const sheetLink = document.querySelector("#sheetLink");
const ideaPanelTitle = document.querySelector("#ideaPanelTitle");

async function loadAutomations() {
  if (isDemoMode) return seedAutomations;
  if (isGoogleSheetMode) return loadGoogleSheetAutomations();

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return seedAutomations;

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : seedAutomations;
  } catch {
    return seedAutomations;
  }
}

function saveAutomations() {
  if (isDemoMode || isGoogleSheetMode) return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(automations));
}

async function loadGoogleSheetAutomations() {
  try {
    if (config.googleSheetCsvUrl.includes("docs.google.com/spreadsheets")) {
      return loadGoogleVisualizationAutomations();
    }

    const response = await fetch(config.googleSheetCsvUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`Google Sheet returned ${response.status}`);
    const csvText = await response.text();
    return parseSheetRows(csvText);
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

  return table.rows
    .map((row) => {
      const cells = row.c || [];
      const value = (names) => {
        const index = headers.findIndex((header) => names.includes(header));
        const cell = index >= 0 ? cells[index] : null;
        return String((cell && (cell.f || cell.v)) || "").trim();
      };

      return {
        title: value(["title", "name", "nazvanie", "avtomatizaciya"]),
        department: value(["department", "otdel"]),
        status: normalizeStatus(value(["status", "statusproekta"])),
        hours: Number(value(["hours", "hoursmonth", "chasovmes", "ekonomiyachasov"])) || 0,
        nextStep: value(["nextstep", "sleduyushchiyshag", "next"])
      };
    })
    .filter((item) => item.title && item.department && item.hours > 0);
}

function parseSheetRows(csvText) {
  const rows = parseCsv(csvText).filter((row) => row.some((cell) => String(cell).trim()));
  const [headerRow, ...dataRows] = rows;
  if (!headerRow) return [];

  const headers = headerRow.map(normalizeHeader);

  return dataRows
    .map((row) => {
      const value = (names) => {
        const index = headers.findIndex((header) => names.includes(header));
        return index >= 0 ? String(row[index] || "").trim() : "";
      };

      return {
        title: value(["title", "name", "nazvanie", "avtomatizaciya"]),
        department: value(["department", "otdel"]),
        status: normalizeStatus(value(["status", "statusproekta"])),
        hours: Number(value(["hours", "hoursmonth", "chasovmes", "ekonomiyachasov"])) || 0,
        nextStep: value(["nextstep", "sleduyushchiyshag", "next"])
      };
    })
    .filter((item) => item.title && item.department && item.hours > 0);
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

function scoreAutomation(item) {
  const status = statusById[item.status] || statusById.idea;
  return Math.round(Number(item.hours) * status.weight);
}

function periodMultiplier() {
  if (activePeriod === "quarter") return 3;
  if (activePeriod === "all") return 6;
  return 1;
}

function getFilteredAutomations() {
  if (activeStatus === "all") return automations;
  return automations.filter((item) => item.status === activeStatus);
}

function buildDepartmentStats() {
  const multiplier = periodMultiplier();
  const map = new Map();

  automations.forEach((item) => {
    if (!map.has(item.department)) {
      map.set(item.department, {
        department: item.department,
        count: 0,
        live: 0,
        idea: 0,
        test: 0,
        build: 0,
        hours: 0,
        score: 0
      });
    }

    const stat = map.get(item.department);
    stat.count += 1;
    stat[item.status] += 1;
    stat.hours += Number(item.hours) * multiplier;
    stat.score += scoreAutomation(item) * multiplier;
  });

  map.forEach((stat) => {
    stat.progress = Math.round(((stat.test * 25) + (stat.build * 50) + (stat.live * 100)) / Math.max(stat.count, 1));
  });

  return [...map.values()].sort((a, b) => b.score - a.score || b.live - a.live);
}

function renderMetrics() {
  const activeDepartments = new Set(automations.map((item) => item.department));
  const multiplier = periodMultiplier();
  const totalHours = automations
    .filter((item) => item.status === "live")
    .reduce((sum, item) => sum + Number(item.hours) * multiplier, 0);

  departmentsCount.textContent = activeDepartments.size;
  automationCount.textContent = automations.length;
  hoursSaved.textContent = `${totalHours} ч`;
  liveCount.textContent = automations.filter((item) => item.status === "live").length;
}

function renderLeaderboard() {
  const stats = buildDepartmentStats();
  if (!stats.length) {
    leaderboardList.innerHTML = `
      <div class="empty-state">
        <strong>Лидерборд готов к запуску</strong>
        <p>Добавьте первые реальные автоматизации через форму. Рейтинг отделов появится автоматически.</p>
      </div>
    `;
    return;
  }

  const maxScore = Math.max(...stats.map((item) => item.score), 1);

  leaderboardList.innerHTML = stats
    .map((item, index) => {
      const width = Math.max(8, Math.round((item.score / maxScore) * 100));
      const progressSegments = ["idea", "test", "build", "live"]
        .map((status) => {
          const count = item[status];
          const segmentWidth = item.count ? (count / item.count) * 100 : 0;
          return `<span class="progress-segment ${status}" style="width: ${segmentWidth}%" title="${statusById[status].label}: ${count}"></span>`;
        })
        .join("");

      return `
        <article class="leader-row">
          <div class="rank">${index + 1}</div>
          <div class="leader-meta">
            <div class="leader-title">
              <span>${escapeHtml(item.department)}</span>
              <span>${item.score} очк.</span>
            </div>
            <div class="bar-track" aria-hidden="true">
              <div class="bar-fill" style="width: ${width}%"></div>
            </div>
            <div class="project-progress" aria-label="Прогресс проектов">
              <div class="progress-track">${progressSegments}</div>
              <div class="progress-labels">
                <span class="progress-pill idea">Идей ${item.idea}</span>
                <span class="progress-pill test">Тест ${item.test}</span>
                <span class="progress-pill build">Внедр. ${item.build}</span>
                <span class="progress-pill live">Работает ${item.live}</span>
              </div>
            </div>
          </div>
          <div class="leader-stats">${item.count} ${pluralProject(item.count)}<br>${item.progress}% прогресс</div>
        </article>
      `;
    })
    .join("");
}

function pluralProject(count) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "проектов";
  if (last === 1) return "проект";
  if (last >= 2 && last <= 4) return "проекта";
  return "проектов";
}

function renderFilters() {
  statusFilter.innerHTML = statuses
    .map((status) => `
      <button class="filter-btn ${status.id === activeStatus ? "active" : ""}" type="button" data-status="${status.id}">
        ${status.label}
      </button>
    `)
    .join("");
}

function renderRows() {
  const multiplier = periodMultiplier();
  const filteredAutomations = getFilteredAutomations();

  if (!filteredAutomations.length) {
    automationRows.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state table-empty">
            <strong>Пока нет рабочих записей</strong>
            <p>Занесите идею, тест или уже работающую автоматизацию, чтобы она попала в пайплайн.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  automationRows.innerHTML = filteredAutomations
    .map((item) => {
      const status = statusById[item.status] || statusById.idea;
      return `
        <tr>
          <td>
            <div class="automation-title">
              <span>${escapeHtml(item.title)}</span>
              <small>${escapeHtml(item.nextStep || "Следующий шаг не указан")}</small>
            </div>
          </td>
          <td>${escapeHtml(item.department)}</td>
          <td><span class="badge ${item.status}">${status.label}</span></td>
          <td>${Number(item.hours) * multiplier} ч/мес</td>
          <td><strong>${scoreAutomation(item) * multiplier}</strong></td>
        </tr>
      `;
    })
    .join("");
}

function renderAnnouncements() {
  const announcements = [...automations]
    .sort((a, b) => scoreAutomation(b) - scoreAutomation(a))
    .slice(0, 4);

  if (!announcements.length) {
    announceList.innerHTML = `
      <div class="empty-state compact">
        <strong>Анонсы появятся после первых записей</strong>
        <p>Здесь будет короткий текст для рабочего чата по новым и запущенным автоматизациям.</p>
      </div>
    `;
    return;
  }

  announceList.innerHTML = announcements
    .map((item) => {
      const status = statusById[item.status] || statusById.idea;
      return `
        <article class="announce-card">
          <strong>${escapeHtml(item.department)}: ${escapeHtml(item.title)}</strong>
          <p>Статус: "${status.label}". Потенциал экономии: ${item.hours} ч/мес.</p>
        </article>
      `;
    })
    .join("");
}

function renderFormOptions() {
  const departmentSelect = ideaForm.elements.department;
  const statusSelect = ideaForm.elements.status;

  departmentSelect.innerHTML = departments
    .map((department) => `<option value="${department}">${department}</option>`)
    .join("");

  statusSelect.innerHTML = statuses
    .filter((status) => status.id !== "all")
    .map((status) => `<option value="${status.id}">${status.label}</option>`)
    .join("");
}

function renderAll() {
  renderColaRecord();
  renderDataSourceState();
  renderMetrics();
  renderLeaderboard();
  renderFilters();
  renderRows();
  renderAnnouncements();
}

function renderColaRecord() {
  if (!colaRecordDays) return;

  const start = new Date(`${COLA_FREE_START_DATE}T00:00:00`);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const days = Math.max(0, Math.floor((today - start) / 86400000));
  colaRecordDays.textContent = `${days} ${pluralDay(days)}`;
}

function pluralDay(count) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "дней";
  if (last === 1) return "день";
  if (last >= 2 && last <= 4) return "дня";
  return "дней";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderDataSourceState() {
  if (!sheetLink || !ideaPanelTitle) return;

  if (isGoogleSheetMode && config.googleSheetEditUrl) {
    sheetLink.href = config.googleSheetEditUrl;
    sheetLink.classList.remove("hidden");
    ideaPanelTitle.textContent = canSubmitToGoogleSheet ? "Добавить запись" : "Добавить в Google Таблицу";
    ideaForm.querySelector(".primary-btn span:last-child").textContent = canSubmitToGoogleSheet ? "Добавить запись" : "Открыть таблицу";
    return;
  }

  sheetLink.classList.add("hidden");
  ideaPanelTitle.textContent = "Добавить идею";
  ideaForm.querySelector(".primary-btn span:last-child").textContent = "Добавить в таблицу";
}

statusFilter.addEventListener("click", (event) => {
  const button = event.target.closest("[data-status]");
  if (!button) return;
  activeStatus = button.dataset.status;
  renderAll();
});

document.querySelectorAll("[data-period]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-period]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activePeriod = button.dataset.period;
    renderAll();
  });
});

ideaForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isGoogleSheetMode) {
    if (canSubmitToGoogleSheet) {
      submitGoogleSheetForm();
      return;
    }

    if (config.googleSheetEditUrl) {
      window.open(config.googleSheetEditUrl, "_blank", "noopener,noreferrer");
    }
    return;
  }

  const formData = new FormData(ideaForm);
  const nextItem = {
    title: formData.get("title").trim(),
    department: formData.get("department"),
    status: formData.get("status"),
    hours: Number(formData.get("hours")),
    nextStep: formData.get("nextStep").trim()
  };

  automations = [nextItem, ...automations];
  saveAutomations();
  ideaForm.reset();
  ideaForm.elements.hours.value = 8;
  renderAll();
});

async function submitGoogleSheetForm() {
  const button = ideaForm.querySelector(".primary-btn");
  const buttonText = button.querySelector("span:last-child");
  const formData = new FormData(ideaForm);
  const nextItem = {
    title: formData.get("title").trim(),
    department: formData.get("department"),
    status: formData.get("status"),
    hours: Number(formData.get("hours")),
    nextStep: formData.get("nextStep").trim()
  };

  button.disabled = true;
  buttonText.textContent = "Отправляем...";

  try {
    const payload = new URLSearchParams();
    payload.set("title", nextItem.title);
    payload.set("department", nextItem.department);
    payload.set("status", statusById[nextItem.status].label);
    payload.set("hours", String(nextItem.hours));
    payload.set("nextStep", nextItem.nextStep);

    await fetch(config.googleSheetSubmitUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: payload.toString()
    });

    automations = [nextItem, ...automations];
    ideaForm.reset();
    ideaForm.elements.hours.value = 8;
    renderAll();
  } catch (error) {
    console.warn("Не удалось отправить запись в Google Таблицу", error);
    if (config.googleSheetEditUrl) {
      window.open(config.googleSheetEditUrl, "_blank", "noopener,noreferrer");
    }
  } finally {
    button.disabled = false;
    buttonText.textContent = "Добавить запись";
  }
}

resetDataBtn.addEventListener("click", async () => {
  if (isGoogleSheetMode) {
    automations = await loadGoogleSheetAutomations();
    activeStatus = "all";
    renderAll();
    return;
  }

  automations = isDemoMode ? seedAutomations : [];
  activeStatus = "all";
  saveAutomations();
  renderAll();
});

async function init() {
  renderFormOptions();
  automations = await loadAutomations();
  renderAll();
}

init();
