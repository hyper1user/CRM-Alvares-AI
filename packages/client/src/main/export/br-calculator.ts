/**
 * BR (Бойові Розпорядження) calculator
 *
 * v1.5.0: TS-port з Alvares-AI/br_calculator.py.
 *
 * Формула: №(день_року_від_1_січня) від (день_виконання - 1).
 * Базується на тому, що бойовий розпорядок видається ввечері за наступний
 * день. Тобто наказ №91 від 31.03.2026 → завдання виконується 01.04.2026
 * (91-й день року 2026).
 *
 * Перевірено на реальному рапорті за квітень 2026 — сошлось до останнього
 * номера.
 *
 * Не залежить від dayjs/date-fns — суто Date manipulation, бо це main-process
 * код, а dayjs у нас тільки для renderer.
 */

/**
 * День року 1..365/366. 1 січня = 1.
 *
 * UTC-обчислення обов'язкове: переход зимового→літнього часу (29 березня
 * в Україні) забирає годину з local-time різниці, і Math.floor віддає
 * на 1 менше для дат після переходу. UTC pin'ить обидві дати в один
 * offset → діф рівно ділиться на 86400000.
 */
function getDayOfYear(date: Date): number {
  const startUtc = Date.UTC(date.getFullYear(), 0, 1)
  const dateUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((dateUtc - startUtc) / 86400000) + 1
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function formatDdMmYyyy(date: Date): string {
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`
}

/**
 * Повертає номер БР для заданого дня виконання.
 * Приклад: 01.04.2026 → "№91 від 31.03.2026"
 */
export function getBrNumber(executionDate: Date): string {
  const doy = getDayOfYear(executionDate)
  const prevDate = new Date(executionDate.getFullYear(), executionDate.getMonth(), executionDate.getDate() - 1)
  return `№${doy} від ${formatDdMmYyyy(prevDate)}`
}

/**
 * Список БР для періоду виконання [startDate..endDate] включно,
 * відформатований через кому. Якщо період порожній — порожній рядок.
 *
 * Використовуємо setDate(+1) замість додавання 86400000 ms — DST-safe
 * (24-годинний день не завжди = 86400 сек у local-time).
 */
export function getBrListForPeriod(startDate: Date, endDate: Date): string {
  if (endDate.getTime() < startDate.getTime()) return ''
  const items: string[] = []
  const cur = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  while (cur.getTime() <= end.getTime()) {
    items.push(getBrNumber(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return items.join(', ')
}

/**
 * Парсить дату формату 'DD.MM.YYYY' (так зберігаємо у DgvPeriod.dateFrom/dateTo).
 */
export function parseDdMmYyyy(s: string): Date {
  const [d, m, y] = s.split('.').map((x) => parseInt(x, 10))
  return new Date(y, m - 1, d)
}
