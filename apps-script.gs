const SHEET_NAME = "Лист1";
const HEADERS = ["Название", "Отдел", "Статус", "Часов/мес", "Следующий шаг"];

function doPost(event) {
  const sheet = getSheet();
  ensureHeaders(sheet);

  const data = event.parameter || {};
  sheet.appendRow([
    data.title || "",
    data.department || "",
    normalizeStatus(data.status || "Идея"),
    Number(data.hours || 0),
    data.nextStep || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  const sheet = getSheet();
  ensureHeaders(sheet);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, headers: HEADERS }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.getSheets()[0];
}

function ensureHeaders(sheet) {
  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = currentHeaders.some((value) => String(value).trim());

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function normalizeStatus(status) {
  const normalized = String(status).trim().toLowerCase();
  if (normalized === "live" || normalized === "работает") return "Работает";
  if (normalized === "build" || normalized === "внедряется") return "Внедряется";
  if (normalized === "test" || normalized === "на тесте") return "На тесте";
  return "Идея";
}
