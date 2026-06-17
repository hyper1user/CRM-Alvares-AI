# ЕЖООС+ (АльваресAI)

> Desktop-додаток для обліку особового складу **12 ШР (4 ШБ, 92 ОШБр)**.
> Замінює Excel-файл ЕЖООС повноцінною CRM-системою.

---

## Можливості

| # | Модуль | Призначення |
|---|--------|-------------|
| 1 | **Особовий склад** | CRUD, пошук, картка ОС з фото |
| 2 | **Штат та посади** | Штатно-посадовий облік, орг. дерево, штатний розпис |
| 3 | **Переміщення** | Wizard, ланцюжок переміщень, timeline |
| 4 | **Статуси** | Kanban, каскад, 21 тип статусу |
| 5 | **Табель та стройова записка** | Помісячний табель, snapshot |
| 6 | **Документи** | Генератор Word (накази, відпустки, поранення) |
| 7 | **Імпорт / Експорт** | ЕЖООС.xlsx, Data.xlsx, Імпульс Toolkit |
| 8 | **Дашборд та статистика** | Зведена інформація, графіки |

---

## Стек

| Шар | Технологія |
|-----|-----------|
| Runtime | Electron 33 |
| UI | React 19 · TypeScript 5.7 · Ant Design 5 · ProComponents · Tailwind CSS 4 |
| Білд | electron-vite · electron-builder |
| БД | better-sqlite3 · Drizzle ORM 0.39 |
| Валідація | Zod 3.24 |
| Стейт | Zustand 5 |
| Роутинг | React Router 7 |
| Дати | dayjs |
| Excel | SheetJS (імпорт) · ExcelJS (експорт) |
| Word | docxtemplater · pizzip |
| Графіки | Recharts |
| Оновлення | electron-updater · GitHub Releases |
| Пакетник | **pnpm** |

---

## Швидкий старт

> Потрібен **Node.js 20+** та **pnpm**.

```bash
pnpm install          # встановлення залежностей
pnpm dev              # запуск у dev-режимі з HMR
```

### Усі команди

```bash
pnpm build            # збірка (без пакування)
pnpm start            # preview зібраного додатку
pnpm build:win        # збірка Windows .exe (NSIS installer)
pnpm db:generate      # згенерувати Drizzle міграцію зі schema.ts
pnpm db:migrate       # застосувати міграції
```

> ⚠️ `postinstall` запускає `electron-builder install-app-deps` + `build/fix-readable-stream.cjs`.
> Якщо native-модулі (`better-sqlite3`) не працюють після `pnpm install` — запустіть `pnpm rebuild`.

---

## Структура проєкту

```
src/
├── main/        # Electron main process (Node.js)
│   ├── db/      # Drizzle schema, connection, seed, міграції
│   ├── ipc/     # IPC handlers (Zod validated)
│   ├── import/  # парсери: ЕЖООС.xlsx, Data.xlsx, Імпульс Toolkit
│   ├── export/  # експорт: ЕЖООС, CSV
│   └── documents/ # генерація Word через docxtemplater
├── renderer/    # React UI (sandboxed)
│   └── src/     # pages · components · hooks · store
├── shared/      # спільні типи main ↔ renderer
│   ├── enums/   # довідники (звання, статуси, категорії)
│   ├── types/
│   └── validators.ts  # Zod-схеми для IPC
└── preload/     # contextBridge (renderer ↔ main міст)
```

**Path aliases:** `@shared` → `src/shared`, `@renderer` → `src/renderer/src`.

---

## Архітектура та безпека

🚨 **Залізні правила:**

1. Renderer **ніколи** не має прямого доступу до БД — лише через IPC.
2. Уся комунікація renderer ↔ main валідується через **Zod** на стороні main.
3. `sandbox: true` у BrowserWindow — не вимикати.
4. Доступ до локальних файлів — лише через кастомний протокол `safe-file://`.
5. Native Node-модулі (`better-sqlite3`, `docxtemplater`) — лише в `main`.
6. БД-файл: `%APPDATA%/ejoos-plus/data/personnel.db` (через `app.getPath('userData')`).

**Конвенція IPC-каналів:** `<entity>:<action>` — `person:create`, `staff:list`, `document:generate`.

---

## База даних

- Джерело істини — `src/main/db/schema.ts` (**28 таблиць**: 13 довідникових + 15 робочих).
- Після змін у schema → `pnpm db:generate` і **закомітити** згенеровану міграцію.
- Згенеровані міграції **не редагувати** вручну — створювати нову.
- У production міграції застосовуються автоматично при старті.

---

## Конвенції

- **Мова інтерфейсу** — українська.
- **Мова коду та коментарів** — англійська.
- **Іконки** — `@ant-design/icons`.
- **Layout** — ProLayout / ProTable / ProForm для CRUD.
- **Дати** — лише `dayjs`.
- **Глобальний стейт** — лише Zustand, і лише для того, що справді шериться між сторінками.

---

## Ліцензія

Внутрішній проєкт. Усі права застережено.
