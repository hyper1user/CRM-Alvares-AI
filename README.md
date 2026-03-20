# АльваресAI — Облік особового складу

Desktop-додаток для обліку особового складу підрозділу. Замінює Excel-файл ЕЖООС повноцінною CRM-системою з довідниками, генерацією документів, табелем та статистикою.

## Стек

- **Electron 33** + **React 19** + **TypeScript 5.6**
- **electron-vite** — збірка та HMR
- **Ant Design 5** + **ProComponents** + **Tailwind CSS 4** — UI
- **better-sqlite3** + **Drizzle ORM** — локальна БД
- **Zod** — валідація IPC
- **SheetJS** (імпорт) + **ExcelJS** (експорт) + **docxtemplater** (Word-документи)
- **Zustand** — стейт-менеджмент
- **Recharts** — графіки та статистика

## Модулі

1. **Особовий склад** — CRUD, пошук, картка ОС з фото
2. **Штат та посади** — штатно-посадовий облік, орг. дерево, штатний розпис для друку
3. **Переміщення** — wizard, ланцюжок переміщень, timeline
4. **Статуси** — Kanban, каскад, 21 тип статусу
5. **Табель та стройова записка** — помісячний табель, snapshot
6. **Документи** — генератор документів (Word), накази, відпустки, поранення
7. **Імпорт/Експорт** — ЕЖООС.xlsx, Data.xlsx, Імпульс Toolkit
8. **Дашборд та статистика** — зведена інформація, графіки

## Структура проєкту

```
src/
├── main/           # Electron main process (БД, IPC handlers, сервіси)
│   ├── db/         # Schema, connection, seed, міграції
│   ├── ipc/        # IPC handlers (Zod validated)
│   ├── import/     # Парсери імпорту (ЕЖООС, Data, Імпульс)
│   ├── export/     # Експорт (ЕЖООС, CSV)
│   └── documents/  # Генерація документів (docxtemplater)
├── renderer/       # React UI
│   └── src/
│       ├── pages/        # Сторінки модулів
│       ├── components/   # Компоненти
│       ├── hooks/        # React hooks
│       └── store/        # Zustand stores
├── shared/         # Спільні типи, enum, валідатори
│   ├── enums/      # Довідники (звання, статуси, категорії)
│   ├── types/      # TypeScript типи
│   └── validators.ts
└── preload/        # contextBridge (renderer ↔ main)
```

## БД

28 таблиць SQLite (15 довідникових + 15 робочих). Файл: `%APPDATA%/ejoos-plus/data/personnel.db`

## Встановлення та запуск

```bash
# Встановлення залежностей
pnpm install

# Dev-режим з HMR
pnpm dev

# Збірка Windows .exe (NSIS installer)
pnpm build:win
```

## Архітектура

- Вся комунікація renderer ↔ main через **IPC** з валідацією через **Zod**
- Renderer **не має** прямого доступу до БД
- **sandbox: true** + кастомний протокол `safe-file://` для безпечного доступу до локальних файлів
- Автооновлення через **electron-updater** + GitHub Releases
- Мова інтерфейсу: українська

## Ліцензія

Приватний проєкт.
