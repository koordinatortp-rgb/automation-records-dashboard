# Таблица рекордов автоматизаций

Статический дашборд для GitHub Pages.

## Страницы

- `index.html` - рабочая версия с чистой доской.
- `demo.html` - демо-версия с примерными записями.

## Данные

Рабочая версия сохраняет записи в `localStorage` браузера под ключом `automation-leaderboard-work-v1`.
Это значит, что данные сохраняются при перезагрузке страницы и при перезапуске локального сервера.

Важно: `localStorage` хранится отдельно в браузере каждого пользователя. Для общей таблицы, где все видят одни и те же записи, нужен общий источник данных: Google Sheets, Supabase, Airtable или небольшой backend.

## Google Sheets как общий источник

1. Создайте Google Таблицу.
2. Импортируйте файл `automation-records-template.csv` или создайте первый лист с колонками:
   - `Название`
   - `Отдел`
   - `Статус`
   - `Часов/мес`
   - `Следующий шаг`
3. В Google Sheets откройте `File` -> `Share` -> `Publish to web`.
4. Выберите первый лист и формат `Comma-separated values (.csv)`.
5. Скопируйте опубликованную CSV-ссылку.
6. Вставьте ссылки в `config.js`:

```js
window.DASHBOARD_CONFIG = {
  googleSheetCsvUrl: "CSV_LINK_FROM_PUBLISH_TO_WEB",
  googleSheetEditUrl: "GOOGLE_SHEET_EDIT_LINK"
};
```

После этого GitHub Pages будет читать записи из Google Таблицы. Кнопка добавления на сайте будет открывать саму таблицу, чтобы все записи жили в одном месте.

## GitHub Pages

После публикации репозитория в GitHub включите Pages:

1. Repository `Settings`.
2. `Pages`.
3. Source: `Deploy from a branch`.
4. Branch: `main`, folder: `/root`.
