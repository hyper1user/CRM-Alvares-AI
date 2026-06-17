# ЕЖООС+ (АльваресAI) — Інструкції для Claude Code

> Desktop-додаток для обліку особового складу 12 ШР (4 ШБ, 92 ОШБр).
> Замінює Excel-файл ЕЖООС повноцінною CRM-системою.

---

## Стек

| Шар | Технологія |
|---|---|
| Runtime | Electron 33 |
| UI | React 19 + TypeScript 5.7 + Ant Design 5 + ProComponents + Tailwind CSS 4 |
| Білд | electron-vite + electron-builder |
| БД | better-sqlite3 + Drizzle ORM 0.39 |
| Валідація | Zod 3.24 |
| Стейт | Zustand 5 |
| Роутинг | React Router 7 |
| Дати | dayjs |
| Excel | SheetJS (xlsx) для імпорту, ExcelJS для експорту |
| Word | docxtemplater + pizzip |
| Графіки | Recharts |
| Оновлення | electron-updater + GitHub Releases |
| Пакетник | **pnpm** (НЕ npm, НЕ yarn) |

---

## Команди

```bash
pnpm install          # встановлення залежностей
pnpm dev              # запуск у dev-режимі з HMR
pnpm build            # збірка (без пакування)
pnpm start            # preview зібраного додатку
pnpm build:win        # збірка Windows .exe (NSIS installer)
pnpm db:generate      # згенерувати Drizzle міграцію зі schema.ts
pnpm db:migrate       # застосувати міграції
```

> ⚠️ `postinstall` запускає `electron-builder install-app-deps` + `build/fix-readable-stream.cjs`. Якщо native-модулі (`better-sqlite3`) не працюють після `pnpm install` — запустити `pnpm rebuild` або `pnpm install` ще раз.

---

## Структура проєкту

```
src/
├── main/                  # Electron main process (Node.js context)
│   ├── db/                # Drizzle schema, connection, seed, міграції
│   │   ├── schema.ts      # 28 таблиць (13 довідникових + 15 робочих)
│   │   ├── connection.ts  # better-sqlite3 інстанс
│   │   ├── seed.ts        # довідники при першому запуску
│   │   └── migrations/    # згенеровані Drizzle міграції
│   ├── ipc/               # IPC handlers (Zod validated)
│   ├── import/            # парсери: ЕЖООС.xlsx, Data.xlsx, Імпульс Toolkit
│   ├── export/            # експорт: ЕЖООС, CSV
│   └── documents/         # генерація Word через docxtemplater
├── renderer/              # React UI (browser-like context, sandboxed)
│   └── src/
│       ├── pages/         # сторінки модулів (роутинг)
│       ├── components/    # React-компоненти
│       ├── hooks/         # React hooks
│       └── store/         # Zustand stores
├── shared/                # спільні типи між main та renderer
│   ├── enums/             # довідники (звання, статуси, категорії)
│   ├── types/             # TypeScript типи
│   └── validators.ts      # Zod-схеми (використовуються в IPC)
└── preload/               # contextBridge (renderer ↔ main міст)
```

### Path aliases (TS + Vite)

- `@shared` → `src/shared`
- `@renderer` → `src/renderer/src`

Завжди використовуй аліаси замість відносних `../../../shared/...`.

---

## Модулі додатку

1. **Особовий склад** — CRUD, пошук, картка ОС з фото
2. **Штат та посади** — штатно-посадовий облік, орг. дерево, штатний розпис
3. **Переміщення** — wizard, ланцюжок переміщень, timeline
4. **Статуси** — Kanban, каскад, 21 тип статусу
5. **Табель та стройова записка** — помісячний табель, snapshot
6. **Документи** — генератор Word (накази, відпустки, поранення)
7. **Імпорт/Експорт** — ЕЖООС.xlsx, Data.xlsx, Імпульс Toolkit
8. **Дашборд та статистика** — зведена інформація, графіки

---

## Архітектура та правила безпеки

### 🚨 Залізні правила

1. **Renderer НІКОЛИ не має прямого доступу до БД.** Усі операції — через IPC.
2. **Вся комунікація renderer ↔ main валідується через Zod** на стороні main. Zod-схеми лежать у `src/shared/validators.ts` і використовуються обома сторонами.
3. **`sandbox: true`** у BrowserWindow. Не вимикати.
4. **Доступ до локальних файлів** — лише через кастомний протокол `safe-file://`. Не використовувати `file://` напряму.
5. **Native Node-модулі (`better-sqlite3`, `docxtemplater`)** — лише в `main`, ніколи в `renderer`.
6. **БД-файл:** `%APPDATA%/ejoos-plus/data/personnel.db` (Windows). Не хардкодити цей шлях — брати з `app.getPath('userData')`.

### IPC patterns

```ts
// 1. У shared/validators.ts — схема
export const PersonCreateSchema = z.object({ ... });
export type PersonCreate = z.infer<typeof PersonCreateSchema>;

// 2. У main/ipc/persons.ts — handler
ipcMain.handle('person:create', async (_, raw) => {
  const dto = PersonCreateSchema.parse(raw);  // ОБОВ'ЯЗКОВО parse
  return await personsService.create(dto);
});

// 3. У preload/index.ts — експортується безпечно
contextBridge.exposeInMainWorld('api', {
  personCreate: (dto) => ipcRenderer.invoke('person:create', dto),
});

// 4. У renderer — виклик
const person = await window.api.personCreate(formValues);
```

**Конвенція імен каналів:** `<entity>:<action>` — `person:create`, `staff:list`, `document:generate`.

---

## БД та міграції

- Schema: `src/main/db/schema.ts` — джерело істини.
- **Після будь-яких змін у schema.ts** запускати:
  ```bash
  pnpm db:generate    # створить новий .sql у migrations/
  ```
  і **закомітити** згенерований файл міграції разом зі змінами schema.
- **НЕ редагувати** вручну вже згенеровані міграції — створювати нову.
- При production-білді міграції застосовуються автоматично при старті додатку.

**13 довідникових таблиць** (rank, position, status_type, …) сідяться через `seed.ts` при першому запуску.

---

## UI-конвенції

- **Мова інтерфейсу** — українська.
- **Мова коду та коментарів** — англійська (назви змінних, функцій, файлів).
- **Мова UI-рядків** — українська. Тримати або в JSX напряму, або (краще) в окремих `*.strings.ts` файлах модуля.
- **Іконки** — `@ant-design/icons`.
- **Layout** — ProLayout/ProTable/ProForm для CRUD-сторінок.
- **Tailwind** для тонкого тюнінгу, AntD-токени мають пріоритет.
- **Форми** — `Form.Item` + Zod-схеми з `@shared/validators` (через `zodResolver`-патерн або ручний onFinish).
- **Дати** — лише `dayjs`. Не змішувати з `Date` або іншими бібліотеками.
- **Стейт сторінки** — локальний (`useState`/`useReducer`). **Глобальний — лише Zustand**, і лише для того, що справді шериться між сторінками (поточний користувач, налаштування, активні фільтри).

---

## Що НЕ робити

- ❌ Не додавати залежність без узгодження зі стеком (ми вже маємо повний набір; новий пакет = новий ризик для Electron-білда).
- ❌ Не використовувати `nodeIntegration: true`, `contextIsolation: false`, `webSecurity: false`.
- ❌ Не робити raw SQL — лише через Drizzle query builder. Виняток — складна аналітика на дашборді, тоді з коментарем чому.
- ❌ Не імпортувати `better-sqlite3`, `fs`, `path`, `electron` у `src/renderer/**` — це зламає білд.
- ❌ Не комітити `personnel.db`, `node_modules`, `out/`, `dist/`, releases.

---

## Робочий процес змін

При фічах, що зачіпають БД + IPC + UI, дотримуйся порядку:
1. **Schema** (`src/main/db/schema.ts`) → `pnpm db:generate`
2. **Zod-валідатори** (`src/shared/validators.ts`) та типи
3. **Сервіс у main** (`src/main/<module>/`)
4. **IPC handler** (`src/main/ipc/`)
5. **Preload** (`src/preload/index.ts`)
6. **UI** (`src/renderer/src/pages/...`)
7. Перевірка `pnpm dev` → ручний тест → коміт

---

## Корисні точки входу

- Точка старту main: `src/main/index.ts`
- Створення вікна: `src/main/index.ts` (BrowserWindow)
- Реєстрація IPC: `src/main/ipc/index.ts`
- Роутер React: `src/renderer/src/App.tsx` або `src/renderer/src/router.tsx`
- Drizzle config: `drizzle.config.ts`
- Electron-builder: `electron-builder.yml`

---

## Доступні субагенти (`.claude/agents/`)

- **db-architect** — зміни Drizzle schema, міграції, нові таблиці/поля, оптимізація запитів.
- **ipc-bridge** — нові IPC-канали з повним стеком Zod + preload + типи.
- **ui-feature-builder** — нові сторінки/модулі під патерн AntD + ProComponents + Tailwind.
- **document-generator** — модуль «Документи»: docxtemplater-генератори Word (накази, відпустки, поранення), нові шаблони, плейсхолдери, цикли по особах.
- **import-export-master** — модуль «Імпорт/Експорт»: парсери ЕЖООС.xlsx / Data.xlsx / Імпульс через SheetJS, експорт через ExcelJS, нормалізація, валідація даних.
- **code-reviewer** — рев'ю змін перед комітом/PR з фокусом на безпеку Electron, IPC, БД.

Викликати явно: `use the db-architect subagent to add a new "trainings" table` — або просто описуй задачу, Claude сам делегує.
