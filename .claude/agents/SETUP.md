# Встановлення налаштувань Claude Code для ЕЖООС+

## Що в цьому пакеті

```
CRM-Alvares-AI/
├── CLAUDE.md                          # головний файл інструкцій (заміна існуючому)
└── .claude/
    └── agents/
        ├── db-architect.md            # експерт з Drizzle/SQLite
        ├── ipc-bridge.md              # IPC + Zod валідація
        ├── ui-feature-builder.md      # React + AntD + ProComponents
        └── code-reviewer.md           # код-рев'ю перед PR
```

## Як встановити (Windows, PowerShell)

1. **Зайди в папку проєкту:**
   ```powershell
   cd D:\Project_CRM
   ```

2. **Зроби резервну копію існуючого `CLAUDE.md`:**
   ```powershell
   Move-Item CLAUDE.md CLAUDE.old.md
   ```

3. **Скопіюй нові файли** з папки `CRM-Alvares-AI/` (яку завантажиш) у `D:\Project_CRM\`:
   - `CLAUDE.md` → `D:\Project_CRM\CLAUDE.md`
   - папку `.claude/` → `D:\Project_CRM\.claude\`

4. **Переконайся, що структура така:**
   ```
   D:\Project_CRM\
   ├── CLAUDE.md
   ├── .claude\
   │   └── agents\
   │       ├── db-architect.md
   │       ├── ipc-bridge.md
   │       ├── ui-feature-builder.md
   │       └── code-reviewer.md
   ├── src\
   ├── package.json
   └── ...
   ```

5. **Закомітити у git** (CLAUDE.md уже був у репо, тож команді теж буде корисно):
   ```powershell
   git add CLAUDE.md .claude/
   git commit -m "chore: expand CLAUDE.md and add project subagents"
   ```

## Як перевірити, що працює

1. У `D:\Project_CRM` запусти Claude Code:
   ```powershell
   claude
   ```

2. Перевір субагенти:
   ```
   /agents
   ```
   Маєш побачити 4 субагенти у вкладці **Library** під розділом «project».

3. Тестовий виклик:
   ```
   use the code-reviewer subagent to look at my last commit
   ```
   Або просто:
   ```
   зроби рев'ю останніх змін
   ```
   — Claude має сам делегувати до `code-reviewer`.

## Як ними користуватися щодня

### Явний виклик
```
use the db-architect subagent to add a "trainings" table with date, description, and FK to persons
```

```
use the ipc-bridge subagent to add an endpoint for marking a person as wounded
```

```
use the ui-feature-builder subagent to create a page for the trainings module
```

### Автоматичне делегування
Просто описуй задачу — Claude сам обере правильного субагента за `description`:

- «Додай нову таблицю для тренувань» → **db-architect**
- «Зроби форму редагування статусу» → **ui-feature-builder**
- «Перевір, чи готовий код до коміту» → **code-reviewer**

### Комбінований workflow для нової фічі

Типовий «вертикальний зріз» від БД до UI:

```
1. use db-architect to add the trainings table
2. use ipc-bridge to add IPC for training CRUD
3. use ui-feature-builder to add a trainings page
4. use code-reviewer to review everything before commit
```

## Як редагувати під себе

- `CLAUDE.md` — додавай туди речі, які знов і знов пояснюєш Claude вручну. Це і є ознака, що там цьому місце.
- Субагент під твою постійну задачу — створюй через `/agents` → «Create new». Або скопіюй один з існуючих і поправ.

## Корисні поради

- Якщо субагент щось робить «не так» — додай у його system prompt конкретне правило. Це швидко.
- Якщо часто перемикаєшся між модулями — створи `CLAUDE.md` усередині `src/main/` або `src/renderer/`. Claude підтягне їх додатково до кореневого.
- Для повторюваних задач (генерувати міграцію + рев'ю + push) — глянь у бік custom slash-команд: `.claude/commands/<name>.md`.

---

Готово 🚀 Якщо щось у субагентах хочеться змінити — кажи, доточимо.
