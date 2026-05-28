import type { DgvCode } from '../types/dgv'

// v1.3.0: синхронізовано з ЕЖООС/Табель.xlsm (аркуш «База» → Позначки).
// До v1.3.0 кілька кодів мали невірні описи (вгадані без живого довідника):
//   ВПХ → було «Відрядження», стало «Відпустка по хворобі»
//   вд  → було «Відпустка додаткова», стало «Відрядження»
//   вп  → було «Відпустка після поранення», стало «Основна щорічна відпустка»
//   Бух → було «Бухгалтерія», стало «Задокументовано вживання алкоголю»
//   нар → було «Наряд», стало «Задокументовано вживання наркотичних речовин»
//   заг → перейменовано в «200» (узгоджено з status_types.code='200'='Загинув')
// Додано 5 нових: роп, ВПС, ВПП, ЛП, адп. `роп` → pay_100 (узгоджено
// з status_types.is_combat=true з v1.2.1).
export const DGV_CODES: DgvCode[] = [
  { code: '100', name: 'Участь у бойових діях (рішення командира)', category: 'pay_100', colorCode: '#52c41a', sortOrder: 1 },
  { code: 'роп', name: 'На позиціях (район оперативного призначення)', category: 'pay_100', colorCode: '#73d13d', sortOrder: 2 },
  { code: '30', name: 'Участь (30 тис.)', category: 'pay_30', colorCode: '#1677ff', sortOrder: 3 },
  { code: 'н/п', name: 'Не брав безпосередню участь у бойових діях', category: 'no_pay', colorCode: '#ff4d4f', sortOrder: 4 },
  { code: 'шп', name: 'Лікування (шпиталь)', category: 'absent', colorCode: '#faad14', sortOrder: 5 },
  { code: 'ЛП', name: 'Лікування (300)', category: 'absent', colorCode: '#ffa940', sortOrder: 6 },
  { code: 'ВПХ', name: 'Відпустка по хворобі', category: 'absent', colorCode: '#fa8c16', sortOrder: 7 },
  { code: 'ВПС', name: 'Відпустка за сімейними обставинами', category: 'absent', colorCode: '#d4380d', sortOrder: 8 },
  { code: 'ВПП', name: 'Відпустка для лікування після поранення', category: 'absent', colorCode: '#722ed1', sortOrder: 9 },
  { code: 'вп', name: 'Основна щорічна відпустка', category: 'absent', colorCode: '#9254de', sortOrder: 10 },
  { code: 'адп', name: 'Адаптація', category: 'absent', colorCode: '#eb2f96', sortOrder: 11 },
  { code: 'СЗЧ', name: 'Самовільне залишення військової частини', category: 'no_pay', colorCode: '#f5222d', sortOrder: 12 },
  { code: 'вд', name: 'Відрядження', category: 'absent', colorCode: '#13c2c2', sortOrder: 13 },
  { code: 'ВЛК', name: 'Проходження військово-лікарської комісії', category: 'absent', colorCode: '#08979c', sortOrder: 14 },
  { code: 'ЗБ', name: 'Зниклий безвісті', category: 'no_pay', colorCode: '#8c8c8c', sortOrder: 15 },
  { code: '200', name: 'Загинув', category: 'no_pay', colorCode: '#434343', sortOrder: 16 },
  { code: 'Бух', name: 'Задокументовано вживання алкоголю', category: 'no_pay', colorCode: '#ad4e00', sortOrder: 17 },
  { code: 'нар', name: 'Задокументовано вживання наркотичних речовин', category: 'no_pay', colorCode: '#874d00', sortOrder: 18 },
  { code: 'п.сзч', name: 'Повернувся після самовільного залишення військової частини', category: 'other', colorCode: '#ff7a45', sortOrder: 19 },
  // v1.4.2: додано АР і ПОЛОН — обидва йдуть у секцію 6 рапорту.
  // ПОЛОН тимчасово в п.6 «не виплачувати» (за рішенням юзера —
  // після службового розслідування на нього робиться окремий рапорт).
  { code: 'АР', name: 'Арешт (адміністративне затримання)', category: 'no_pay', colorCode: '#5b8c00', sortOrder: 20 },
  { code: 'ПОЛОН', name: 'Перебування у полоні', category: 'no_pay', colorCode: '#262626', sortOrder: 21 }
]

export const DGV_CODE_MAP = new Map(DGV_CODES.map((c) => [c.code, c]))

// Group labels for UI selects
export const DGV_CATEGORY_LABELS: Record<string, string> = {
  pay_100: 'Виплата 100 тис.',
  pay_30: 'Виплата 30 тис.',
  no_pay: 'Без виплати',
  absent: 'Відсутність',
  other: 'Інше'
}

// v1.3.0: коди категорії pay_100 — використовується у dgv-report-builder
// для збору section1 (всі особи, що мають хоча б один день з 100К-кодом)
// та для об'єднання періодів `100`+`роп` як єдиного списку «100 тис.».
export const PAY_100_CODES = DGV_CODES.filter((c) => c.category === 'pay_100').map((c) => c.code)
